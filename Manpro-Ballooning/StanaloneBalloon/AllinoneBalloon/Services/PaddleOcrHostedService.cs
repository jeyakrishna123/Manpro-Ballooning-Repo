using AllinoneBalloon.Common;
using AllinoneBalloon.Models.Configuration;
using Microsoft.Extensions.Options;
using System.Diagnostics;

namespace AllinoneBalloon.Services
{
    /// <summary>
    /// Background service that auto-starts the PaddleOCR Python process
    /// when the .NET backend starts, and stops it on shutdown.
    /// This ensures PaddleOCR is always available without manual startup.
    /// </summary>
    public class PaddleOcrHostedService : IHostedService, IDisposable
    {
        private readonly AppSettings _appSettings;
        private readonly ILogger<PaddleOcrHostedService> _logger;
        private readonly ErrorLog _errorLog;
        private Process _paddleProcess;
        private readonly string _paddleServicePath;
        private Timer _healthCheckTimer;
        private int _restartCount;
        private const int MAX_RESTARTS = 5;

        public PaddleOcrHostedService(IOptions<AppSettings> appSettings, ILogger<PaddleOcrHostedService> logger)
        {
            _appSettings = appSettings.Value;
            _logger = logger;
            _errorLog = new ErrorLog();
            _restartCount = 0;

            // Resolve the paddleocr-service path relative to the project
            var baseDir = AppDomain.CurrentDomain.BaseDirectory;
            // Navigate from bin/Debug/net6.0/ to project root, then to paddleocr-service
            var projectRoot = Path.GetFullPath(Path.Combine(baseDir, "..", "..", ".."));
            var solutionRoot = Path.GetFullPath(Path.Combine(projectRoot, "..", ".."));
            _paddleServicePath = Path.Combine(solutionRoot, "paddleocr-service");

            // Fallback: check common locations
            if (!Directory.Exists(_paddleServicePath))
            {
                _paddleServicePath = Path.Combine(projectRoot, "..", "paddleocr-service");
            }
            if (!Directory.Exists(_paddleServicePath))
            {
                // Try relative to content root
                var contentRoot = Directory.GetCurrentDirectory();
                _paddleServicePath = Path.Combine(contentRoot, "..", "paddleocr-service");
            }
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            if (_appSettings.OcrEngine != "PaddleOCR")
            {
                _logger.LogInformation("PaddleOCR engine not configured, skipping auto-start");
                return;
            }

            // Check if PaddleOCR is already running
            if (await IsPaddleOcrRunningAsync())
            {
                _logger.LogInformation("PaddleOCR is already running on {Url}", _appSettings.PaddleOcrServiceUrl);
                StartHealthCheck();
                return;
            }

            await StartPaddleOcrProcessAsync();
            StartHealthCheck();
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _healthCheckTimer?.Change(Timeout.Infinite, 0);
            StopPaddleOcrProcess();
            return Task.CompletedTask;
        }

        private async Task StartPaddleOcrProcessAsync()
        {
            var serviceDir = Path.GetFullPath(_paddleServicePath);
            if (!Directory.Exists(serviceDir))
            {
                _logger.LogError("PaddleOCR service directory not found: {Path}", serviceDir);
                _errorLog.WriteErrorLog($"PaddleOCR auto-start FAILED: directory not found: {serviceDir}");
                return;
            }

            // Find the Python executable in the venv
            var pythonPath = Path.Combine(serviceDir, "venv", "Scripts", "python.exe");
            if (!File.Exists(pythonPath))
            {
                // Try Linux/Mac path
                pythonPath = Path.Combine(serviceDir, "venv", "bin", "python");
            }
            if (!File.Exists(pythonPath))
            {
                _logger.LogError("Python venv not found at: {Path}", pythonPath);
                _errorLog.WriteErrorLog($"PaddleOCR auto-start FAILED: python not found at {pythonPath}");
                return;
            }

            var mainPy = Path.Combine(serviceDir, "main.py");
            if (!File.Exists(mainPy))
            {
                _logger.LogError("PaddleOCR main.py not found at: {Path}", mainPy);
                return;
            }

            try
            {
                _paddleProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = pythonPath,
                        Arguments = "main.py",
                        WorkingDirectory = serviceDir,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                    },
                    EnableRaisingEvents = true
                };

                _paddleProcess.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                        _logger.LogDebug("[PaddleOCR] {Data}", e.Data);
                };
                _paddleProcess.ErrorDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                        _logger.LogDebug("[PaddleOCR] {Data}", e.Data);
                };

                _paddleProcess.Start();
                _paddleProcess.BeginOutputReadLine();
                _paddleProcess.BeginErrorReadLine();

                _logger.LogInformation("PaddleOCR process started (PID: {Pid})", _paddleProcess.Id);
                _errorLog.WriteErrorLog($"PaddleOCR auto-started (PID: {_paddleProcess.Id})");

                // Wait for it to become healthy (up to 60 seconds)
                for (int i = 0; i < 60; i++)
                {
                    await Task.Delay(1000);
                    if (await IsPaddleOcrRunningAsync())
                    {
                        _logger.LogInformation("PaddleOCR is healthy after {Seconds}s", i + 1);
                        return;
                    }
                }

                _logger.LogWarning("PaddleOCR started but health check not responding after 60s");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start PaddleOCR process");
                _errorLog.WriteErrorLog($"PaddleOCR auto-start FAILED: {ex.Message}");
            }
        }

        private void StopPaddleOcrProcess()
        {
            if (_paddleProcess != null && !_paddleProcess.HasExited)
            {
                try
                {
                    _logger.LogInformation("Stopping PaddleOCR process (PID: {Pid})", _paddleProcess.Id);
                    _paddleProcess.Kill(entireProcessTree: true);
                    _paddleProcess.WaitForExit(5000);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error stopping PaddleOCR process");
                }
            }
        }

        private async Task<bool> IsPaddleOcrRunningAsync()
        {
            try
            {
                using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
                var response = await client.GetAsync($"{_appSettings.PaddleOcrServiceUrl}/health");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        private void StartHealthCheck()
        {
            // Check health every 30 seconds, restart if down
            _healthCheckTimer = new Timer(async _ =>
            {
                if (!await IsPaddleOcrRunningAsync())
                {
                    if (_restartCount < MAX_RESTARTS)
                    {
                        _restartCount++;
                        _logger.LogWarning("PaddleOCR health check failed, restarting (attempt {Count}/{Max})",
                            _restartCount, MAX_RESTARTS);
                        _errorLog.WriteErrorLog($"PaddleOCR auto-restart attempt {_restartCount}/{MAX_RESTARTS}");
                        StopPaddleOcrProcess();
                        await StartPaddleOcrProcessAsync();
                    }
                    else
                    {
                        _logger.LogError("PaddleOCR exceeded max restart attempts ({Max}), giving up", MAX_RESTARTS);
                    }
                }
                else
                {
                    // Reset restart counter on successful health check
                    _restartCount = 0;
                }
            }, null, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(30));
        }

        public void Dispose()
        {
            _healthCheckTimer?.Dispose();
            StopPaddleOcrProcess();
            _paddleProcess?.Dispose();
        }
    }
}

using AllinoneBalloon.Common;
using AllinoneBalloon.Models.Configuration;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System.Text.RegularExpressions;

namespace AllinoneBalloon.Services
{
    public class PaddleOcrService : IOcrService
    {
        private readonly HttpClient _httpClient;
        private readonly string _serviceUrl;
        private readonly ErrorLog _errorLog;
        private const int MAX_OCR_DIMENSION = 1600; // Max dimension to send to OCR (sweet spot: high enough for small text detection, low enough to avoid crashes)
        private const int MAX_OCR_DIMENSION_FAST = 1280; // Balanced dimension for fast mode
        private const float MIN_CONFIDENCE = 0.45f; // Minimum confidence to accept a word

        public string EngineName => "PaddleOCR";

        public PaddleOcrService(HttpClient httpClient, IOptions<AppSettings> appSettings)
        {
            _httpClient = httpClient;
            _serviceUrl = appSettings.Value.PaddleOcrServiceUrl;
            _httpClient.Timeout = TimeSpan.FromSeconds(appSettings.Value.PaddleOcrTimeoutSeconds);
            _errorLog = new ErrorLog();
        }

        public async Task<bool> IsAvailableAsync()
        {
            try
            {
                // Short timeout for health check - don't block ballooning for 2 minutes
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                var response = await _httpClient.GetAsync($"{_serviceUrl}/health", cts.Token);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<OcrWordResult>> RecognizeWordsAsync(string imagePath)
        {
            // Progressive retry: if primary size fails/crashes, wait for service then try smaller
            int[] sizeLadder = { MAX_OCR_DIMENSION, 1200, 960 };
            List<OcrWordResult> results = null;
            for (int i = 0; i < sizeLadder.Length; i++)
            {
                results = await ProcessImageAsync(imagePath, sizeLadder[i], $"{_serviceUrl}/ocr", $"PaddleOCR@{sizeLadder[i]}");
                if (results != null && results.Count >= 10)
                {
                    return results;
                }
                if (results == null || results.Count < 5)
                {
                    _errorLog.WriteErrorLog($"PaddleOCR: {sizeLadder[i]}px returned {results?.Count ?? 0} words, waiting for service to recover");
                    // Wait for PaddleOCR auto-restart + verify health before next attempt
                    await WaitForPaddleOcrHealthAsync(TimeSpan.FromSeconds(15));
                    continue;
                }
                return results;
            }
            return results ?? new List<OcrWordResult>();
        }

        private async Task WaitForPaddleOcrHealthAsync(TimeSpan maxWait)
        {
            var deadline = DateTime.UtcNow.Add(maxWait);
            while (DateTime.UtcNow < deadline)
            {
                try
                {
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                    var response = await _httpClient.GetAsync($"{_serviceUrl}/health", cts.Token);
                    if (response.IsSuccessStatusCode) return;
                }
                catch { /* service still restarting */ }
                await Task.Delay(1000);
            }
        }

        public async Task<List<OcrWordResult>> RecognizeWordsFastAsync(string imagePath)
        {
            return await ProcessImageAsync(imagePath, MAX_OCR_DIMENSION_FAST, $"{_serviceUrl}/ocr/fast", "PaddleOCR FAST");
        }

        private async Task<List<OcrWordResult>> ProcessImageAsync(string imagePath, int maxDimension, string endpoint, string logPrefix)
        {
            var results = new List<OcrWordResult>();
            string sendPath = imagePath;
            string tempPath = null;
            float scaleBackX = 1f, scaleBackY = 1f;

            try
            {
                // Validate image file exists
                if (!File.Exists(imagePath))
                {
                    _errorLog.WriteErrorLog($"{logPrefix} ERROR: Image file not found: {imagePath}");
                    return results;
                }

                // Read dimensions without fully decoding pixel data
                int origW, origH;
                try
                {
                    var imageInfo = SixLabors.ImageSharp.Image.Identify(imagePath);
                    origW = imageInfo.Width;
                    origH = imageInfo.Height;
                }
                catch (Exception ex)
                {
                    _errorLog.WriteErrorLog($"{logPrefix} ERROR reading image dimensions: {ex.Message}");
                    return results;
                }

                // Validate dimensions
                if (origW <= 0 || origH <= 0)
                {
                    _errorLog.WriteErrorLog($"{logPrefix} ERROR: Invalid image dimensions {origW}x{origH}");
                    return results;
                }

                bool needsResize = origW > maxDimension || origH > maxDimension;
                string ext = Path.GetExtension(imagePath).ToLowerInvariant();
                bool needsConvert = ext != ".png" && ext != ".jpg" && ext != ".jpeg";

                if (needsResize || needsConvert)
                {
                    string targetExt = needsConvert ? ".png" : ext;
                    tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + targetExt);

                    using (var image = SixLabors.ImageSharp.Image.Load<SixLabors.ImageSharp.PixelFormats.Rgba32>(imagePath))
                    {
                        if (needsResize)
                        {
                            float ratio = Math.Min((float)maxDimension / origW, (float)maxDimension / origH);
                            int newW = Math.Max(1, (int)(origW * ratio));
                            int newH = Math.Max(1, (int)(origH * ratio));
                            scaleBackX = (float)origW / newW;
                            scaleBackY = (float)origH / newH;

                            image.Mutate(x => x.Resize(new SixLabors.ImageSharp.Processing.ResizeOptions
                            {
                                Size = new SixLabors.ImageSharp.Size(newW, newH),
                                Sampler = SixLabors.ImageSharp.Processing.KnownResamplers.Bicubic,
                                Mode = SixLabors.ImageSharp.Processing.ResizeMode.Stretch
                            }));
                        }

                        using (var fs = new FileStream(tempPath, FileMode.Create))
                        {
                            if (targetExt == ".jpg" || targetExt == ".jpeg")
                                image.Save(fs, new SixLabors.ImageSharp.Formats.Jpeg.JpegEncoder());
                            else
                                image.Save(fs, new SixLabors.ImageSharp.Formats.Png.PngEncoder());
                        }
                    }
                    sendPath = tempPath;
                }

                // Send file bytes directly - avoid loading Bitmap again
                using var content = new MultipartFormDataContent();
                var fileBytes = await File.ReadAllBytesAsync(sendPath);
                var fileContent = new ByteArrayContent(fileBytes);
                string mimeType = sendPath.EndsWith(".png") ? "image/png" : "image/jpeg";
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mimeType);
                content.Add(fileContent, "file", Path.GetFileName(sendPath));

                _errorLog.WriteErrorLog($"{logPrefix} sending: {sendPath} ({fileBytes.Length} bytes, {origW}x{origH}, scale={scaleBackX:F2})");

                HttpResponseMessage response;
                try
                {
                    response = await _httpClient.PostAsync(endpoint, content);
                    response.EnsureSuccessStatusCode();
                }
                catch (TaskCanceledException)
                {
                    _errorLog.WriteErrorLog($"{logPrefix} ERROR: Request timed out for {imagePath}");
                    return results;
                }
                catch (HttpRequestException ex)
                {
                    _errorLog.WriteErrorLog($"{logPrefix} ERROR: HTTP request failed: {ex.Message}");
                    return results;
                }

                var json = await response.Content.ReadAsStringAsync();
                _errorLog.WriteErrorLog($"{logPrefix} response: {json.Length} chars");

                PaddleOcrResponse ocrResponse;
                try
                {
                    ocrResponse = JsonConvert.DeserializeObject<PaddleOcrResponse>(json);
                }
                catch (JsonException ex)
                {
                    _errorLog.WriteErrorLog($"{logPrefix} ERROR: Failed to parse OCR response: {ex.Message}");
                    return results;
                }

                if (ocrResponse != null && ocrResponse.success && ocrResponse.words != null)
                {
                    int skippedLowConf = 0, skippedGarbage = 0;
                    foreach (var word in ocrResponse.words)
                    {
                        string cleanText = word.text?.Trim();
                        if (string.IsNullOrWhiteSpace(cleanText) || cleanText.Length == 0)
                            continue;

                        // ── Confidence gate (primary filter) ──
                        if (word.confidence < MIN_CONFIDENCE)
                        {
                            skippedLowConf++;
                            continue;
                        }

                        // ── Single character filter ──
                        if (cleanText.Length == 1)
                        {
                            // Allow datum references (A-Z) with very high confidence
                            if (char.IsUpper(cleanText[0]) && word.confidence >= 0.75f)
                            { /* allow datum refs */ }
                            else if (char.IsDigit(cleanText[0]) && word.confidence >= 0.80f)
                            { /* allow digits */ }
                            else if (cleanText == "Ø" || cleanText == "±" || cleanText == "°" || cleanText == "×")
                            { /* allow engineering symbols */ }
                            else
                            {
                                skippedGarbage++;
                                continue;
                            }
                        }

                        // ── Garbage text detection ──
                        if (IsGarbageText(cleanText, word.confidence))
                        {
                            skippedGarbage++;
                            continue;
                        }

                        // ── Short text with low-moderate confidence ──
                        if (cleanText.Length <= 3 && word.confidence < 0.55f)
                        {
                            // Exception: known engineering symbols
                            if (!Regex.IsMatch(cleanText, @"^[ØR±°]\d|^\d+[°]|^\.\d|^[A-Z]{1,2}$"))
                            {
                                skippedLowConf++;
                                continue;
                            }
                        }

                        // Scale coordinates back to original image size (use rounding to prevent off-by-one)
                        results.Add(new OcrWordResult
                        {
                            Text = cleanText,
                            X = (int)Math.Round(word.x * scaleBackX),
                            Y = (int)Math.Round(word.y * scaleBackY),
                            Width = Math.Max(1, (int)Math.Round(word.width * scaleBackX)),
                            Height = Math.Max(1, (int)Math.Round(word.height * scaleBackY)),
                            Confidence = word.confidence
                        });
                    }
                    _errorLog.WriteErrorLog($"{logPrefix} result: {results.Count} words after filtering (skipped: {skippedLowConf} low-conf, {skippedGarbage} garbage)");
                }
                else if (ocrResponse != null && !ocrResponse.success)
                {
                    _errorLog.WriteErrorLog($"{logPrefix} ERROR: PaddleOCR processing failed: {ocrResponse.error_message}");
                }
                else
                {
                    _errorLog.WriteErrorLog($"{logPrefix} WARNING: Empty or null response from PaddleOCR");
                }
            }
            catch (Exception ex)
            {
                _errorLog.WriteErrorLog($"{logPrefix} ERROR: Unexpected error processing {imagePath}: {ex.Message}");
            }
            finally
            {
                if (tempPath != null && File.Exists(tempPath))
                {
                    try { File.Delete(tempPath); } catch { }
                }
            }

            return results;
        }

        /// <summary>
        /// Detects OCR garbage text: garbled characters, GD&T frame misreads,
        /// repeated characters, and non-engineering noise.
        /// </summary>
        private static bool IsGarbageText(string text, float confidence)
        {
            if (string.IsNullOrWhiteSpace(text))
                return true;

            // Replacement characters — garbled encoding
            if (text.Contains('\uFFFD') || text.Contains('�'))
                return true;

            // Repeated identical characters (3+): "eeeee", "nnnn"
            if (Regex.IsMatch(text, @"(.)\1{2,}"))
            {
                if (!Regex.IsMatch(text, @"^[\d.±+\-/xX°ØR]+$"))
                    return true;
            }

            // Lone punctuation/symbol groups
            if (Regex.IsMatch(text, @"^[&@#%^~`\\|.,:;!?(){}\[\]<>]+$"))
                return true;

            // Bracket noise: "U< >Y", "V<>W"
            if (Regex.IsMatch(text, @"[<>\[\]{}]"))
                return true;

            // "Q" as Ø misread
            if (text == "Q")
                return true;

            // Short mixed alpha+digit noise (2-5 chars): "6E", "A0", "(68E", "8-S9z"
            if (text.Length >= 2 && text.Length <= 5)
            {
                bool hasDigit = text.Any(char.IsDigit);
                bool hasAlpha = text.Any(char.IsLetter);
                if (hasDigit && hasAlpha)
                {
                    // Allow known patterns
                    if (Regex.IsMatch(text, @"^\d+[xX]$")) { } // 4X, 8X
                    else if (Regex.IsMatch(text, @"^[RØMø]\d")) { } // R0.8, M6
                    else if (Regex.IsMatch(text, @"^\d+[°]$")) { } // 45°
                    else if (Regex.IsMatch(text, @"^\d+/\d+")) { } // 1/4
                    else return true; // Everything else: garbage
                }
            }

            // Garbled GD&T: dimension followed by random uppercase letters
            // "Ø0.13OBAO", "P 1.52MAM)"
            if (Regex.IsMatch(text, @"\d[A-Z]{2,}[)]*$"))
            {
                var suffixMatch = Regex.Match(text, @"[A-Z]{2,}[)]*$");
                if (suffixMatch.Success)
                {
                    string suffix = suffixMatch.Value.TrimEnd(')');
                    var allowedSuffixes = new[] { "MAX", "MIN", "TYP", "REF", "NOM", "THRU", "UNC", "UNF", "UNS", "BA", "RA" };
                    if (!allowedSuffixes.Contains(suffix))
                        return true;
                }
            }

            // Leading lowercase letter before dimension: "g 6.38-6.45"
            if (Regex.IsMatch(text, @"^[a-z]\s+\d"))
                return true;

            // Trailing lowercase noise after count prefix: "4X p"
            if (Regex.IsMatch(text, @"^\d+[xX]\s+[a-z]$"))
                return true;

            // Mostly non-alphanumeric: less than 40% useful characters
            int alphaNum = text.Count(c => char.IsLetterOrDigit(c) || c == 'Ø' || c == '°' || c == '±' || c == '×' || c == '.');
            if (text.Length >= 2 && (float)alphaNum / text.Length < 0.40f)
                return true;

            return false;
        }

        private class PaddleOcrResponse
        {
            public List<PaddleOcrWord> words { get; set; }
            public int image_width { get; set; }
            public int image_height { get; set; }
            public string engine { get; set; }
            public bool success { get; set; }
            public string error_message { get; set; }
        }

        private class PaddleOcrWord
        {
            public string text { get; set; }
            public int x { get; set; }
            public int y { get; set; }
            public int width { get; set; }
            public int height { get; set; }
            public float confidence { get; set; }
        }
    }
}

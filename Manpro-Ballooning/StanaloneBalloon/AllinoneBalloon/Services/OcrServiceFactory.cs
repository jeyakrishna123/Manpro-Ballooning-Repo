using AllinoneBalloon.Common;
using AllinoneBalloon.Models.Configuration;
using Microsoft.Extensions.Options;

namespace AllinoneBalloon.Services
{
    public interface IOcrServiceFactory
    {
        Task<IOcrService> GetOcrServiceAsync();
    }

    public class OcrServiceFactory : IOcrServiceFactory
    {
        private readonly AppSettings _appSettings;
        private readonly PaddleOcrService _paddleOcrService;
        private readonly ErrorLog _errorLog;

        public OcrServiceFactory(
            IOptions<AppSettings> appSettings,
            PaddleOcrService paddleOcrService)
        {
            _appSettings = appSettings.Value;
            _paddleOcrService = paddleOcrService;
            _errorLog = new ErrorLog();
        }

        public async Task<IOcrService> GetOcrServiceAsync()
        {
            if (_appSettings.OcrEngine == "PaddleOCR")
            {
                if (await _paddleOcrService.IsAvailableAsync())
                {
                    return _paddleOcrService;
                }

                if (_appSettings.OcrFallbackToTesseract)
                {
                    _errorLog.WriteErrorLog("PaddleOCR service unavailable, falling back to Tesseract");
                    return null; // null signals controller to use existing inline Tesseract code
                }

                throw new InvalidOperationException("PaddleOCR service is unavailable and fallback is disabled");
            }

            return null; // null = use existing Tesseract code path
        }
    }
}

using DocumentFormat.OpenXml.Bibliography;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Hosting;
using System;

namespace AllinoneBalloon.Models.Configuration
{

    public class MailSettings
    {
        public string Server { get; set; }
        public int Port { get; set; }
        public string SenderName { get; set; }
        public string SenderEmail { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
    }
    public class AppSettings
    {
        public AppSettings()
        {
            ENVIRONMENT = "development";
            MySqlConnStr = "";
            MPMConnStr = "";
            Secret = "";
            Issuer = "";
            IsCrypto = "No";
            SessionTimeout = 10;
            ExtractImageFilePath = "";
            GetDrawingServiceUrlList = "";
            OcrEngine = "Tesseract";
            PaddleOcrServiceUrl = "http://localhost:5100";
            PaddleOcrTimeoutSeconds = 60;
            OcrFallbackToTesseract = true;
        }

        public string ENVIRONMENT { get; set; }
        public string MySqlConnStr { get; set; }
        public string Secret { get; set; }
        public string Issuer { get; set; }
        public string MPMConnStr { get; set; }
        public string IsCrypto { get; set; }
        public int SessionTimeout { get; set; } = 10;
        public string ExtractImageFilePath { get; set; }
        public string GetDrawingServiceUrlList { get; set; }
        public string OcrEngine { get; set; }
        public string PaddleOcrServiceUrl { get; set; }
        public int PaddleOcrTimeoutSeconds { get; set; }
        public bool OcrFallbackToTesseract { get; set; }

        /// <summary>
        /// Keywords that trigger exclusion zones for balloon detection.
        /// Any OCR text block containing these keywords (and nearby text) will be excluded.
        /// Comma-separated list. Default: "CONFIDENTIAL,CONTROLLED COPY,PROPRIETARY"
        /// </summary>
        public string BalloonExclusionKeywords { get; set; } = "CONFIDENTIAL,CONTROLLED COPY,PROPRIETARY";
    }

    [AttributeUsage(AttributeTargets.Assembly, Inherited = false, AllowMultiple = false)]
    sealed class SpaRootAttribute : Attribute
    {
        public string SpaRoot { get; }
        public string Company { get; }
        public SpaRootAttribute(string SpaRoot, string company)
        {
            this.SpaRoot = SpaRoot;
            this.Company = company;
        }
    }

}

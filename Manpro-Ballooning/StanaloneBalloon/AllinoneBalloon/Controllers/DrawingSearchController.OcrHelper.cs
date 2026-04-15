using AllinoneBalloon.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static AllinoneBalloon.Entities.Common;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        /// <summary>
        /// Check if PaddleOCR engine is configured and the service is available.
        /// Returns true if PaddleOCR should be used, false to use existing Tesseract code.
        /// </summary>
        private async Task<bool> ShouldUsePaddleOcrAsync()
        {
            if (_appSettings.OcrEngine != "PaddleOCR")
                return false;

            try
            {
                var service = await _ocrServiceFactory.GetOcrServiceAsync();
                return service != null;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Health check endpoint for OCR engine status.
        /// Frontend calls this to warn user if PaddleOCR is down.
        /// </summary>
        [HttpGet("OcrHealth")]
        public async Task<IActionResult> OcrHealth()
        {
            string configuredEngine = _appSettings.OcrEngine ?? "Tesseract";
            bool paddleAvailable = false;

            if (configuredEngine == "PaddleOCR")
            {
                try
                {
                    var service = await _ocrServiceFactory.GetOcrServiceAsync();
                    paddleAvailable = service != null;
                }
                catch { }
            }

            return StatusCode(StatusCodes.Status200OK, new
            {
                configuredEngine = configuredEngine,
                paddleOcrAvailable = paddleAvailable,
                fallbackToTesseract = _appSettings.OcrFallbackToTesseract,
                usingEngine = paddleAvailable ? "PaddleOCR" : "Tesseract"
            });
        }

        #region Balloon Exclusion Zones

        /// <summary>
        /// Represents a rectangular area where balloons should not be generated.
        /// </summary>
        private class ExclusionZone
        {
            public int X { get; set; }
            public int Y { get; set; }
            public int Width { get; set; }
            public int Height { get; set; }
            public string Keyword { get; set; }
        }

        /// <summary>
        /// Detects exclusion zones from OCR results based on configured keywords.
        /// When a keyword is found, the zone expands to include all nearby text
        /// (within proximity threshold) that forms part of the same text block.
        /// </summary>
        private List<ExclusionZone> DetectExclusionZones(List<OcrWordResult> words, int imageWidth, int imageHeight)
        {
            var zones = new List<ExclusionZone>();
            string keywordsConfig = _appSettings.BalloonExclusionKeywords ?? "";
            if (string.IsNullOrWhiteSpace(keywordsConfig))
                return zones;

            var keywords = keywordsConfig.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (keywords.Length == 0)
                return zones;

            // Find anchor words that match exclusion keywords
            var anchorWords = new List<OcrWordResult>();
            foreach (var word in words)
            {
                string text = word.Text?.ToUpperInvariant() ?? "";
                foreach (var keyword in keywords)
                {
                    if (text.Contains(keyword.ToUpperInvariant()))
                    {
                        anchorWords.Add(word);
                        break;
                    }
                }
            }

            if (anchorWords.Count == 0)
                return zones;

            // For each anchor, expand to include all nearby text in the same block
            var usedWords = new HashSet<int>(); // track indices to avoid duplicate zones

            foreach (var anchor in anchorWords)
            {
                // Start with the anchor bounding box
                int zoneLeft = anchor.X;
                int zoneTop = anchor.Y;
                int zoneRight = anchor.X + anchor.Width;
                int zoneBottom = anchor.Y + anchor.Height;

                // Detect if anchor is inside a paragraph (wide text block like CONFIDENTIAL notice)
                // Paragraphs have many words within the same horizontal band
                int wordsNearAnchor = words.Count(w =>
                    w != anchor &&
                    Math.Abs((w.Y + w.Height / 2) - (anchor.Y + anchor.Height / 2)) < anchor.Height * 2 &&
                    w.X > anchor.X && w.X < anchor.X + imageWidth / 3);
                bool isParagraph = wordsNearAnchor >= 5;  // 5+ nearby words = paragraph context

                // Paragraph: allow wider+taller zone to cover multi-line legal notices
                // Non-paragraph: tight zone to avoid swallowing dimensions
                int proximityY = isParagraph ? anchor.Height * 2 : anchor.Height;
                int proximityX = isParagraph ? 100 : 30;
                int maxZoneWidth = isParagraph ? imageWidth : Math.Max(anchor.Width * 3, imageWidth / 3);
                int maxZoneHeight = isParagraph ? Math.Max(anchor.Height * 8, 400) : Math.Max(anchor.Height * 3, 120);

                // Expand zone to include nearby words (with size limit)
                bool expanded = true;
                while (expanded)
                {
                    expanded = false;
                    // Stop expanding if zone already exceeds max size
                    if ((zoneRight - zoneLeft) > maxZoneWidth || (zoneBottom - zoneTop) > maxZoneHeight)
                        break;

                    foreach (var word in words)
                    {
                        int wordCenterX = word.X + word.Width / 2;
                        int wordCenterY = word.Y + word.Height / 2;

                        // Check if word is within proximity of current zone
                        bool withinX = wordCenterX >= (zoneLeft - proximityX) && wordCenterX <= (zoneRight + proximityX);
                        bool withinY = wordCenterY >= (zoneTop - proximityY) && wordCenterY <= (zoneBottom + proximityY);

                        if (withinX && withinY)
                        {
                            int newLeft = Math.Min(zoneLeft, word.X);
                            int newTop = Math.Min(zoneTop, word.Y);
                            int newRight = Math.Max(zoneRight, word.X + word.Width);
                            int newBottom = Math.Max(zoneBottom, word.Y + word.Height);

                            if (newLeft < zoneLeft || newTop < zoneTop || newRight > zoneRight || newBottom > zoneBottom)
                            {
                                zoneLeft = newLeft;
                                zoneTop = newTop;
                                zoneRight = newRight;
                                zoneBottom = newBottom;
                                expanded = true;
                            }
                        }
                    }
                }

                // Add padding around the zone
                int padding = 20;
                zones.Add(new ExclusionZone
                {
                    X = Math.Max(0, zoneLeft - padding),
                    Y = Math.Max(0, zoneTop - padding),
                    Width = Math.Min(imageWidth, zoneRight + padding) - Math.Max(0, zoneLeft - padding),
                    Height = Math.Min(imageHeight, zoneBottom + padding) - Math.Max(0, zoneTop - padding),
                    Keyword = anchor.Text
                });
            }

            return zones;
        }

        /// <summary>
        /// Checks if a point/rect falls inside any exclusion zone.
        /// </summary>
        private bool IsInExclusionZone(int x, int y, int w, int h, List<ExclusionZone> zones)
        {
            if (zones == null || zones.Count == 0)
                return false;

            int centerX = x + w / 2;
            int centerY = y + h / 2;

            foreach (var zone in zones)
            {
                if (centerX >= zone.X && centerX <= zone.X + zone.Width &&
                    centerY >= zone.Y && centerY <= zone.Y + zone.Height)
                {
                    return true;
                }
            }
            return false;
        }

        /// <summary>
        /// Filters OCR word results, removing any that fall inside exclusion zones
        /// and applying additional quality filters to eliminate noise balloons.
        /// </summary>
        private List<OcrWordResult> FilterExclusionZones(List<OcrWordResult> words, int imageWidth, int imageHeight)
        {
            var zones = DetectExclusionZones(words, imageWidth, imageHeight);

            var filtered = new List<OcrWordResult>();
            foreach (var word in words)
            {
                // Skip words in exclusion zones
                if (zones.Count > 0 && IsInExclusionZone(word.X, word.Y, word.Width, word.Height, zones))
                    continue;

                // Skip very low confidence words
                if (word.Confidence < 0.45f)
                    continue;

                string text = word.Text?.Trim() ?? "";
                if (string.IsNullOrWhiteSpace(text))
                    continue;

                // Skip single non-datum characters with moderate confidence
                if (text.Length == 1)
                {
                    bool isDatum = char.IsUpper(text[0]) && word.Confidence >= 0.75f;
                    bool isDigit = char.IsDigit(text[0]) && word.Confidence >= 0.80f;
                    bool isSymbol = text == "Ø" || text == "±" || text == "°" || text == "×";
                    if (!isDatum && !isDigit && !isSymbol)
                        continue;
                }

                // Skip lone "&" — almost always GD&T frame border misread
                if (text == "&")
                    continue;

                // Skip "Q" — Ø symbol misread
                if (text == "Q")
                    continue;

                // Skip short mixed alpha+digit noise: "6E", "A0", "(68E"
                if (text.Length >= 2 && text.Length <= 5
                    && text.Any(char.IsDigit) && text.Any(char.IsLetter))
                {
                    if (!System.Text.RegularExpressions.Regex.IsMatch(text, @"^\d+[xX]$")    // 4X, 8X
                        && !System.Text.RegularExpressions.Regex.IsMatch(text, @"^[RØMø]\d") // R0.8, M6
                        && !System.Text.RegularExpressions.Regex.IsMatch(text, @"^\d+[°]$")  // 45°
                        && !System.Text.RegularExpressions.Regex.IsMatch(text, @"^\d+/\d+")) // 1/4
                        continue;
                }

                // Skip garbled GD&T: dimension + random uppercase: "Ø0.13OBAO", "P 1.52MAM)"
                if (System.Text.RegularExpressions.Regex.IsMatch(text, @"\d[A-Z]{2,}[)]*$"))
                {
                    var suffixMatch = System.Text.RegularExpressions.Regex.Match(text, @"[A-Z]{2,}[)]*$");
                    string suffix = suffixMatch.Value.TrimEnd(')');
                    if (suffix != "MAX" && suffix != "MIN" && suffix != "TYP" && suffix != "REF"
                        && suffix != "THRU" && suffix != "UNC" && suffix != "UNF" && suffix != "BA")
                        continue;
                }

                // Skip leading lowercase + dimension: "g 6.38-6.45..."
                if (System.Text.RegularExpressions.Regex.IsMatch(text, @"^[a-z]\s+\d"))
                    continue;

                // Skip trailing lowercase after count: "4X p"
                if (System.Text.RegularExpressions.Regex.IsMatch(text, @"^\d+[xX]\s+[a-z]$"))
                    continue;

                // Skip paragraph-length text (legal notices, descriptions) — dimensions are short
                // Engineering dimensions rarely exceed 20 chars (e.g., "Ø0.08 B A(M)" = 12)
                // Multi-word sentences (40+ chars) are almost always paragraph content
                if (text.Length > 30 && text.Count(c => c == ' ') >= 3)
                    continue;

                // Skip part labels that contain only letters (no digits/engineering symbols)
                // e.g., "VALVE PLUG", "CAGE", "DETAIL E" - these are labels, not dimensions
                string upperText = text.ToUpperInvariant();
                string[] labelWords = { "VALVE", "CAGE", "PLUG", "DETAIL", "SECTION", "VIEW",
                                        "PLATE", "COVER", "HOUSING", "SHAFT", "BEARING",
                                        "GASKET", "SEAL", "O-RING", "BOLT", "NUT", "SCREW",
                                        "WASHER", "PIN", "KEY", "RING", "BUSHING", "SPACER",
                                        "BRACKET", "FLANGE", "FITTING", "CONNECTOR" };
                if (!text.Any(char.IsDigit) && !text.Contains("Ø") && !text.Contains("R")
                    && !text.Contains("±") && !text.Contains("°"))
                {
                    if (labelWords.Any(lw => upperText.Contains(lw)))
                        continue;
                }

                filtered.Add(word);
            }
            return filtered;
        }

        #endregion

        /// <summary>
        /// Performs OCR using PaddleOCR and returns results as AG_OCR list,
        /// matching the format the existing grouping pipeline expects.
        /// </summary>
        private async Task<List<AG_OCR>> PerformPaddleOcrAsync(
            string imagePath,
            int tileOffsetX = 0,
            float widthScale = 1f,
            float heightScale = 1f,
            int startGroupId = 0)
        {
            var ag_results = new List<AG_OCR>();

            try
            {
                var ocrService = await _ocrServiceFactory.GetOcrServiceAsync();
                if (ocrService == null)
                {
                    objerr.WriteErrorLog("PerformPaddleOcrAsync: OCR service unavailable (null)");
                    return ag_results;
                }

                var words = await ocrService.RecognizeWordsAsync(imagePath);
                if (words == null || words.Count == 0)
                {
                    objerr.WriteErrorLog($"PerformPaddleOcrAsync: No words returned for {imagePath}");
                    return ag_results;
                }

                // Apply exclusion zone filtering (removes CONFIDENTIAL text blocks etc.)
                try
                {
                    var imgInfo = SixLabors.ImageSharp.Image.Identify(imagePath);
                    words = FilterExclusionZones(words, imgInfo.Width, imgInfo.Height);
                }
                catch (Exception ex)
                {
                    objerr.WriteErrorLog($"PerformPaddleOcrAsync: Exclusion zone filtering failed: {ex.Message}");
                    // Continue with unfiltered words
                }

                int agocr = startGroupId;

                foreach (var word in words)
                {
                    if (string.IsNullOrWhiteSpace(word.Text))
                        continue;

                    int cx = (int)Math.Round((tileOffsetX + word.X) * widthScale);
                    int xx = cx;
                    int nx = cx;
                    int cy = (int)Math.Round(word.Y * heightScale);
                    int yy = cy;
                    int ww = Math.Max(1, (int)Math.Round(word.Width * widthScale));
                    int hh = Math.Max(1, (int)Math.Round(word.Height * heightScale));

                    int cont = ag_results.Count;
                    if (cont == 0)
                    {
                        ag_results.Add(new AG_OCR
                        {
                            GroupID = agocr, cx = cx, nx = nx, cy = cy,
                            x = xx, y = yy, w = ww, h = hh, text = word.Text
                        });
                    }
                    else
                    {
                        var last = ag_results.Last();
                        var gapX = xx - (last.x + last.w);
                        // Y-center alignment: items must be on the same text line
                        int pLastCenterY = last.y + last.h / 2;
                        int pCurrCenterY = yy + hh / 2;
                        int pMaxH = Math.Max(hh, last.h);
                        bool pSameLine = Math.Abs(pCurrCenterY - pLastCenterY) < pMaxH;
                        if (pSameLine && Math.Sign(gapX) != -1 && last.x + last.w < xx && last.x < xx && gapX < 70)
                        {
                            ag_results.Add(new AG_OCR
                            {
                                GroupID = agocr, cx = cx, nx = nx, cy = cy,
                                x = xx, y = yy, w = ww, h = hh, text = word.Text
                            });
                        }
                        else
                        {
                            agocr++;
                            ag_results.Add(new AG_OCR
                            {
                                GroupID = agocr, cx = cx, nx = nx, cy = cy,
                                x = xx, y = yy, w = ww, h = hh, text = word.Text
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                objerr.WriteErrorLog($"PerformPaddleOcrAsync ERROR: {ex.Message}");
            }

            return ag_results;
        }

        /// <summary>
        /// Performs OCR using PaddleOCR and returns results as Rect list,
        /// for use with the SplBalloon processing pipeline.
        /// </summary>
        private async Task<List<AllinoneBalloon.Entities.Common.Rect>> PerformPaddleOcrAsRectsAsync(string imagePath)
        {
            try
            {
                var ocrService = await _ocrServiceFactory.GetOcrServiceAsync();
                if (ocrService == null)
                {
                    objerr.WriteErrorLog("PerformPaddleOcrAsRectsAsync: OCR service unavailable (null)");
                    return new List<AllinoneBalloon.Entities.Common.Rect>();
                }

                var words = await ocrService.RecognizeWordsAsync(imagePath);
                if (words == null || words.Count == 0)
                {
                    objerr.WriteErrorLog($"PerformPaddleOcrAsRectsAsync: No words returned for {imagePath}");
                    return new List<AllinoneBalloon.Entities.Common.Rect>();
                }

                // Apply exclusion zone filtering
                try
                {
                    var imgInfo = SixLabors.ImageSharp.Image.Identify(imagePath);
                    words = FilterExclusionZones(words, imgInfo.Width, imgInfo.Height);
                }
                catch (Exception ex)
                {
                    objerr.WriteErrorLog($"PerformPaddleOcrAsRectsAsync: Exclusion zone filtering failed: {ex.Message}");
                }

                return words
                    .Where(w => !string.IsNullOrWhiteSpace(w.Text))
                    .Select(w => new AllinoneBalloon.Entities.Common.Rect
                    {
                        Text = w.Text,
                        X = w.X,
                        Y = w.Y,
                        Width = w.Width,
                        Height = w.Height
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                objerr.WriteErrorLog($"PerformPaddleOcrAsRectsAsync ERROR: {ex.Message}");
                return new List<AllinoneBalloon.Entities.Common.Rect>();
            }
        }

        /// <summary>
        /// Performs OCR using PaddleOCR and returns results as AutoBalloon_OCR list.
        /// </summary>
        private async Task<List<AutoBalloon_OCR>> PerformPaddleOcrAsAutoBalloonAsync(string imagePath)
        {
            try
            {
                var ocrService = await _ocrServiceFactory.GetOcrServiceAsync();
                if (ocrService == null)
                {
                    objerr.WriteErrorLog("PerformPaddleOcrAsAutoBalloonAsync: OCR service unavailable (null)");
                    return new List<AutoBalloon_OCR>();
                }

                var words = await ocrService.RecognizeWordsAsync(imagePath);
                if (words == null || words.Count == 0)
                {
                    objerr.WriteErrorLog($"PerformPaddleOcrAsAutoBalloonAsync: No words returned for {imagePath}");
                    return new List<AutoBalloon_OCR>();
                }

                // Apply exclusion zone filtering
                try
                {
                    var imgInfo = SixLabors.ImageSharp.Image.Identify(imagePath);
                    words = FilterExclusionZones(words, imgInfo.Width, imgInfo.Height);
                }
                catch (Exception ex)
                {
                    objerr.WriteErrorLog($"PerformPaddleOcrAsAutoBalloonAsync: Exclusion zone filtering failed: {ex.Message}");
                }

                int kk = 1;
                return words
                    .Where(w => !string.IsNullOrWhiteSpace(w.Text))
                    .Select(w => new AutoBalloon_OCR
                    {
                        Ocr_Text = w.Text,
                        X_Axis = w.X,
                        Y_Axis = w.Y,
                        Width = w.Width,
                        Height = w.Height,
                        Qty = 1,
                        No = kk++
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                objerr.WriteErrorLog($"PerformPaddleOcrAsAutoBalloonAsync ERROR: {ex.Message}");
                return new List<AutoBalloon_OCR>();
            }
        }
    }
}

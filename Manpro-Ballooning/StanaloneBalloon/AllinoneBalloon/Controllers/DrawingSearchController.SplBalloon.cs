using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Services;
using Emgu.CV;
using Emgu.CV.CvEnum;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenCvSharp;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Png;
using System.Text;
using System.Text.RegularExpressions;
using Tesseract;
using static AllinoneBalloon.Entities.Common;
using static Emgu.CV.OCR.Tesseract;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        #region Manual Balloon
        [Authorize]
        [HttpPost("SplBalloon")]
        public async Task<ActionResult<AutoBalloon>> SplBalloon(AllinoneBalloon.Entities.Common.AutoBalloon searchForm)
        {
            IEnumerable<object> returnObject = new List<object>();
            BalloonController balcon = new BalloonController(_dbcontext);
            CreateBalloon objbaldet = new CreateBalloon();
            using var context = _dbcontext.CreateDbContext();
            if (context.TblConfigurations == null)
            {
                return NotFound();
            }
            else
            {
                Helper helper = new AllinoneBalloon.Common.Helper(_dbcontext);
                User user = await helper.GetLoggedUser(HttpContext);
                if (user != null && searchForm.selectedRegion == "Spl")
                {
                    username = user.Name;
                }
                else
                {
                    return await Task.Run(() =>
                    {
                        return Unauthorized("You are not authorized to access this resource.");
                    });
                }
                long groupId = context.UserGroups.FirstOrDefault(a => a.UserId == user.Id).GroupId;
                List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults = searchForm.originalRegions.Where(x1 => x1.isballooned == true).ToList();
                List<AllinoneBalloon.Entities.Common.OCRResults> previous = searchForm.originalRegions.Where(x1 => x1.isballooned == true).ToList();
                try
                {
                    decimal s_x = 0, s_y = 0, s_w = 0, s_h = 0;
                    string dtFiles = searchForm.drawingDetails;
                    FileInfo fi = new FileInfo(dtFiles);
                    string desFile = fi.Name;
                    string OrgPath = dtFiles;
                    string env = _appSettings.ENVIRONMENT;
                    string SelImageFile = Path.Combine(Path.GetTempPath(), "SelImageFile_" + Guid.NewGuid().ToString() + desFile);
                    string Fname = fi.Name;
                    temp = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + $"{Fname}");
                    System.IO.File.Copy(OrgPath, temp, true);
                    //RemoveOpaqueColormapFrom1BPP(OrgPath);
                    if (searchForm.bgImgRotation != 0)
                    {
                        await helper.RotateImagefile(temp, searchForm.bgImgRotation);
                    }
                    System.IO.File.Copy(temp, SelImageFile, true);

                    List<AllinoneBalloon.Entities.Common.OCRResults> request = searchForm.originalRegions.Where(x1 => x1.isballooned == false).ToList();
                    foreach (var obj in request)
                    {
                        s_x = obj.x;
                        s_y = obj.y;
                        s_w = obj.width;
                        s_h = obj.height;

                        SixLabors.ImageSharp.RectangleF rectElipse = new SixLabors.ImageSharp.RectangleF(obj.x, obj.y, obj.width, obj.height);
                        lstCircle.Add(new AllinoneBalloon.Entities.Common.Circle_AutoBalloon { Bounds = rectElipse });
                        string OriginalImage = OrgPath;
                        var cropRect = new SixLabors.ImageSharp.Rectangle(obj.x, obj.y, obj.width, obj.height);
                        using var originalImage = SixLabors.ImageSharp.Image.Load<Rgba32>(SelImageFile);
                        using var croppedImage = originalImage.Clone(x => x.Crop(cropRect));
                        croppedImage.Metadata.HorizontalResolution = 300;
                        croppedImage.Metadata.VerticalResolution = 300;
                        FileInfo cfi = new FileInfo(SelImageFile);
                        string cropname = Path.Combine(Path.GetTempPath(), "cropname_" + Guid.NewGuid().ToString() + cfi.Extension);
                        croppedImage.Save(cropname, new PngEncoder());
                        temp = cropname;

                        string customLanguagePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tessdata");
                        //_ocr = new Emgu.CV.OCR.Tesseract(customLanguagePath, "IMSsym1", Emgu.CV.OCR.OcrEngineMode.Default);
                        string ocrtext = string.Empty;
                        bool usedPaddleOcr = false;
                        Emgu.CV.OCR.Tesseract.Character[] characters = Array.Empty<Character>();
                        RectSize croppedSize = new RectSize() { x = (int)s_x, y = (int)s_y, w = (int)s_w, h = (int)s_h };
                        List<AllinoneBalloon.Entities.Common.Rect> rects = new List<AllinoneBalloon.Entities.Common.Rect>();
                        List<AllinoneBalloon.Entities.Common.AG_OCR> groupedByX = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
                        // Load the image and perform OCR
                        bool paddleOcrAvailable = await ShouldUsePaddleOcrAsync();
                        IOcrService ocrServiceForSpl = null;
                        if (paddleOcrAvailable)
                        {
                            ocrServiceForSpl = await _ocrServiceFactory.GetOcrServiceAsync();
                            if (ocrServiceForSpl == null)
                            {
                                objerr.WriteErrorLog("SplBalloon: PaddleOCR service became unavailable, falling back to Tesseract");
                                paddleOcrAvailable = false;
                            }
                        }
                        if (paddleOcrAvailable && ocrServiceForSpl != null)
                        {
                            usedPaddleOcr = true;
                            // PaddleOCR path
                            var paddleWords = await ocrServiceForSpl.RecognizeWordsAsync(temp);
                            Emgu.CV.Mat source = new Emgu.CV.Mat(temp);
                            foreach (var pw in paddleWords)
                            {
                                if (string.IsNullOrWhiteSpace(pw.Text)) continue;
                                RectSize TextSize = new RectSize() { x = pw.X, y = pw.Y, w = pw.Width, h = pw.Height };
                                AllinoneBalloon.Entities.Common.Rect rect = helper.GenerateRectangles(source, temp, lstCircle, croppedSize, pw.Text, TextSize, rects);
                                rects.Add(rect);
                            }
                            // Raw concatenation as fallback only - will be replaced by groupedByX below
                            ocrtext = string.Join("\n", paddleWords.Where(w => !string.IsNullOrWhiteSpace(w.Text)).Select(w => w.Text));
                            objerr.WriteErrorLog("SplBalloon (PaddleOCR): " + paddleWords.Count + " words, raw ocrtext=" + ocrtext.Replace("\n", " | "));
                        }
                        else
                        {
                        // Original Emgu.CV Tesseract code
                        using (Emgu.CV.OCR.Tesseract ocr = new Emgu.CV.OCR.Tesseract(customLanguagePath, "IMSsym1", Emgu.CV.OCR.OcrEngineMode.Default))
                        {
                            // Preprocess image (optional)
                            Emgu.CV.Mat source = new Emgu.CV.Mat(temp);
                            Emgu.CV.Mat grayImage = new Emgu.CV.Mat();
                            CvInvoke.CvtColor(source, grayImage, ColorConversion.Bgr2Gray);
                            // Process the image
                            ocr.SetImage(grayImage);
                            ocr.Recognize();
                            // Get the characters
                            characters = ocr.GetCharacters();
                            foreach (Emgu.CV.OCR.Tesseract.Character character in characters)
                            {
                                // Retrieve text
                                string regionText = character.Text;
                                // Retrieve position (bounding box)
                                var textLineBox = character.Region;
                                RectSize TextSize = new RectSize() { x = textLineBox.X, y = textLineBox.Y, w = textLineBox.Width, h = textLineBox.Height };
                                AllinoneBalloon.Entities.Common.Rect rect = helper.GenerateRectangles(source, temp, lstCircle, croppedSize, regionText, TextSize, rects);
                                rects.Add(rect);
                            }
                            ocrtext = ocr.GetUTF8Text();
                        }
                        if (characters.Length == 0)
                        {
                            var source = new OpenCvSharp.Mat(temp, OpenCvSharp.ImreadModes.Color);
                            using (var grayImage = new OpenCvSharp.Mat())
                            using (var engine = new TesseractEngine(customLanguagePath, "IMSsym1", EngineMode.Default))
                            {
                                Cv2.CvtColor(source, grayImage, ColorConversionCodes.BGR2GRAY);
                                Cv2.Threshold(grayImage, grayImage, 0, 255, ThresholdTypes.Binary | ThresholdTypes.Otsu);
                                // Perform OCR on the text block
                                using (var blockPage = engine.Process(Pix.LoadFromFile(temp), PageSegMode.Auto))
                                {
                                    using (var iter = blockPage.GetIterator())
                                    {
                                        iter.Begin();
                                        StringBuilder Words = new StringBuilder();
                                        #region iterate small/ selected region
                                        do
                                        {
                                            if (iter.TryGetBoundingBox(PageIteratorLevel.Word, out var textLineBox))
                                            {
                                                // Create a Rect object using OpenCvSharp 's bounding box coordinates
                                                OpenCvSharp.Rect textRegionRect = new OpenCvSharp.Rect(textLineBox.X1, textLineBox.Y1, textLineBox.X2 - textLineBox.X1, textLineBox.Y2 - textLineBox.Y1);
                                                string word = iter.GetText(PageIteratorLevel.Word);
                                                string regionText = word;
                                                if (string.IsNullOrWhiteSpace(regionText) || regionText == "" || regionText == null || regionText == " ")
                                                {
                                                    continue;
                                                }
                                                if (word == "³-³-" || word == "++³")
                                                {
                                                    continue;
                                                }
                                                RectSize TextSize = new RectSize() { x = textLineBox.X1, y = textLineBox.Y1, w = textLineBox.X2 - textLineBox.X1, h = textLineBox.Y2 - textLineBox.Y1 };
                                                AllinoneBalloon.Entities.Common.Rect rect = helper.GenerateRectangles(source, temp, lstCircle, croppedSize, regionText, TextSize, rects);
                                                rects.Add(rect);
                                            }
                                        } while (iter.Next(PageIteratorLevel.Word));
                                        #endregion
                                    }
                                }
                            }
                            helper.PrintListAsLog(rects, objerr, "SPL ");
                        }
                        } // end else (Tesseract)
                        if (rects.Count > 0)
                        {
                            groupedByX = helper.SmallImageRectProcess(rects);
                        }

                        // FIX: For PaddleOCR, rebuild ocrtext from spatially-grouped words
                        // PaddleOCR detects each word separately (e.g., "Ø", "548.41", ")", "P")
                        // SmallImageRectProcess merges spatially-close words into proper specs
                        // Without this, raw \n-joined words get corrupted by linesArray[0] logic
                        if (usedPaddleOcr && groupedByX.Count > 0)
                        {
                            // Build ocrtext from grouped results ordered by position (top-to-bottom, left-to-right)
                            var groupedTexts = groupedByX
                                .OrderBy(g => g.y)
                                .ThenBy(g => g.x)
                                .Select(g => g.text?.Trim())
                                .Where(t => !string.IsNullOrWhiteSpace(t))
                                .ToList();
                            if (groupedTexts.Count > 0)
                            {
                                ocrtext = string.Join("\n", groupedTexts);
                                objerr.WriteErrorLog("SplBalloon (PaddleOCR) grouped ocrtext: " + ocrtext.Replace("\n", " | "));
                            }
                        }

                        objerr.WriteErrorLog(" Words " + ocrtext);
                        objerr.WriteErrorLog(" cropped " + temp);
                        bool isplmin = false;
                        string isplmin_spec = "";
                        string isplmin_pltol = "";
                        string isplmin_mintol = "";
                        string[] linesArray = ocrtext.Split(new string[] { "\n", Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
                        linesArray = linesArray.Where(o => o != "ë ." && o != "/ ." && o != "Z-J:" && o != "-." && o != "ë" && o != "û" && o != "Z ë :").ToArray();

                        // Filter out non-dimension text (labels, notes, drawing annotations)
                        string[] splSkipWords = { "DETAIL", "VIEW", "SECTION", "DRAWING", "FRAME", "SHEET",
                            "ACCEPTANCE", "CRITERIA", "ESTIMATED", "WEIGHT", "FLOW AREA",
                            "SURFACES", "REQUIRE", "PLATING", "UNLESS", "OTHERWISE", "SPECIFIED",
                            "TOLERANCE", "INTERPRET", "FINISH", "MATERIAL", "SCALE", "NOTE",
                            "INCREASED", "DECREASED", "ANGLE ALLOWED", "INCREMENTS", "CHORD LENGTH",
                            "DO NOT", "DIMENSIONS ARE", "CONFIDENTIAL", "PROPRIETARY", "COPYRIGHT" };
                        linesArray = linesArray.Where(line =>
                        {
                            string trimmed = line.Trim().ToUpper();
                            // Skip lines that are purely alphabetic with no digits (e.g., "OL E", "DETAIL D")
                            if (!string.IsNullOrEmpty(trimmed) && !trimmed.Any(c => char.IsDigit(c)) && !trimmed.Contains("¡") && !trimmed.Contains("±"))
                                return false;
                            // Skip lines containing known non-dimension keywords
                            if (splSkipWords.Any(sw => trimmed.Contains(sw)))
                                return false;
                            // Skip single/double letter lines (datum refs like "N", "S", "OL")
                            string lettersOnly = new string(trimmed.Where(c => char.IsLetter(c)).ToArray());
                            if (lettersOnly.Length > 0 && !trimmed.Any(c => char.IsDigit(c) || c == '¡' || c == '±' || c == '°'))
                                return false;
                            return true;
                        }).ToArray();
                        // Rebuild ocrtext from filtered lines so downstream logic uses clean data
                        if (linesArray.Length > 0)
                        {
                            ocrtext = string.Join("\n", linesArray);
                            objerr.WriteErrorLog("SplBalloon filtered ocrtext: " + ocrtext.Replace("\n", " | "));
                        }
                        if (linesArray.Length > 1)
                        {
                            if (linesArray[0].Length == 1 && Regex.IsMatch(linesArray[0], @"^[$A-Za-z]+$"))
                            {
                                linesArray = linesArray.Where(item => item != linesArray[0]).ToArray();
                            }
                            string[] resultArray = linesArray.Select(s => Regex.Replace(s, "³", string.Empty)).ToArray();
                            linesArray = resultArray;
                        }
                        for (int i = 0; i < linesArray.Length; i++)
                        {
                            if (linesArray[i].Contains(")("))
                                linesArray[i] = linesArray[i].Replace(")(", "X");
                            if (linesArray[i].StartsWith("#"))
                                linesArray[i] = linesArray[i].Substring(1);
                        }
                        if (linesArray.Length > 1)
                        {
                            if (linesArray[0].Contains("X"))
                            {
                                string[] hastext = linesArray[0].Split("X");
                                if (hastext[0].Length > 1)
                                {
                                    hastext[0] = Regex.Replace(hastext[0], @"[^\d.]", "");
                                    hastext[1] = Regex.Replace(hastext[1], @"^[a-zA-Z]", "");
                                    linesArray[0] = hastext[0] + "X" + hastext[1];
                                }
                                if (hastext[0].Trim().Length > 0 && hastext[1].Trim().Length > 0 && Regex.IsMatch(linesArray[0], @"^((\d+(\.\d+))|(\d+)|(\.\d+))X((?:\s|)(\d+))$"))
                                {
                                    var deg = hastext[1].Trim();
                                    if (hastext[1].Trim().Length == 3 && hastext[1].Trim().EndsWith("0"))
                                    {
                                        hastext[1] = string.Concat(hastext[1].AsSpan(0, hastext[1].Length - 1), "°");
                                    }
                                    linesArray[0] = hastext[0] + "X" + hastext[1];
                                }
                            }
                        }
                        for (int i = 0; i < linesArray.Length; i++)
                        {
                            if (linesArray[i].Contains(")("))
                                linesArray[i] = linesArray[i].Replace(")(", "X");
                            if (linesArray[i].Contains(":") && linesArray[i].Contains("±"))
                                linesArray[i] = linesArray[i].Replace(":", ".");
                            linesArray[i] = Regex.Replace(linesArray[i], @"\r\n?|\n", "");

                            if (!usedPaddleOcr)
                            {
                                // Tesseract-specific character replacements (Latin symbols → digits)
                                // PaddleOCR returns clean text; these transforms would corrupt it
                                linesArray[i] = linesArray[i]
                                    .Replace("î", "0").Replace("ï", "1").Replace("ð", "2")
                                    .Replace("ñ", "3").Replace("ò", "4").Replace("ó", "5")
                                    .Replace("ô", "6").Replace("õ", "7").Replace("ö", "8")
                                    .Replace("÷", "9");
                                if (linesArray[i].Contains("»") && linesArray[i].Length > 2)
                                    linesArray[i] = linesArray[i].Replace("»", "¨");
                                if (linesArray[i].StartsWith("L"))
                                    linesArray[i] = linesArray[i].Substring(1);
                                if (linesArray[i].StartsWith("I"))
                                    linesArray[i] = linesArray[i].Replace("I", "");
                                if (linesArray[i].StartsWith("X"))
                                    linesArray[i] = linesArray[i].Substring(1);
                                if (linesArray[i].Contains("#"))
                                    linesArray[i] = "";
                                if (Regex.IsMatch(linesArray[i], @"^((:?═)+(\d+\.\d+|\.\d+))$"))
                                    linesArray[i] = Regex.Replace(linesArray[i], @"^═", "");
                                linesArray[i] = linesArray[i]
                                    .Replace("î", "0").Replace("ï", "1").Replace("ð", "2")
                                    .Replace("ñ", "3").Replace("ò", "4").Replace("ó", "5")
                                    .Replace("ô", "6").Replace("õ", "7").Replace("ö", "8")
                                    .Replace("÷", "9");
                            }
                        }
                        linesArray = linesArray.Where(o => o != "").ToArray();

                        if (ocrtext.Contains(")("))
                            ocrtext = ocrtext.Replace(")(", "X");

                        if (ocrtext != "" && ocrtext != null)
                        {
                            if (linesArray.Length > 1)
                            {
                                if (linesArray[0].Length > 1)
                                {
                                    if (linesArray[0].Contains(".") || linesArray[0].Contains("X") || linesArray[0].Any(c => char.IsDigit(c)) || linesArray[0].Contains("°"))
                                    {
                                        ocrtext = linesArray[0].TrimEnd('.');
                                    }
                                }
                                else if (linesArray[1].Length > 1)
                                {
                                    if (linesArray[1].Contains(".") || linesArray[1].Contains("X") || linesArray[1].Any(c => char.IsDigit(c)) || linesArray[1].Contains("°"))
                                    {
                                        ocrtext = linesArray[1].TrimEnd('.');
                                    }
                                }
                                if (linesArray[0].Length > 0 && linesArray[1].Length > 0)
                                {
                                    if (linesArray[0].Contains("X") && (linesArray[1].Any(c => char.IsDigit(c)) || linesArray[1].Contains(".") || linesArray[1].Contains("°") || linesArray[1].Contains("±")))
                                    {
                                        if (linesArray[1].Contains("±") && linesArray[1].Contains("°"))
                                        {
                                            string[] spstr = linesArray[1].Split("±");
                                            if (spstr[1].Length > 0)
                                            {
                                                if (spstr[1].Contains("°"))
                                                {
                                                    string newvall = spstr[0].Remove(spstr[0].LastIndexOf("0"));
                                                    ocrtext = linesArray[0].TrimEnd('.') + newvall.TrimEnd('.') + "°" + "±" + spstr[1].TrimEnd('.');
                                                }
                                            }
                                        }
                                        else
                                        {
                                            ocrtext = linesArray[0].TrimEnd('.') + linesArray[1].TrimEnd('.');
                                        }
                                    }
                                }
                                if (linesArray[0].Contains("+"))
                                {
                                    isplmin = true;
                                    string substr = linesArray[0].Substring(ocrtext.IndexOf("+") + 1).Replace(" ", "");
                                    isplmin_pltol = substr.Replace("+", "").Replace("═", "").Replace("-", "").Replace("O10", "010").TrimEnd('.');
                                }
                                if (linesArray[1].Contains("..") || linesArray[1].Contains("-"))
                                {
                                    if (linesArray[1].Contains(".."))
                                    {
                                        isplmin_spec = linesArray[1].Split("..")[0].Replace("(/)", "¡").Replace("(2)", "¡").Replace("à", "¡").TrimEnd('.');
                                        ocrtext = isplmin_spec.TrimEnd('.');
                                        isplmin_mintol = linesArray[1].Split("..")[1].Replace("Oîî", "000").TrimEnd('.');
                                        if (!isplmin_mintol.Contains("."))
                                        {
                                            isplmin_mintol = "." + isplmin_mintol.Replace("I", "").Replace("Oîï", "001").Replace("Oîó", "005").Replace("îîó", "005").Trim().TrimEnd('.');
                                        }
                                        if (isplmin_spec.Contains("X"))
                                        {
                                            ocrtext = isplmin_spec.TrimEnd('.');
                                        }
                                    }
                                    if (linesArray[1].Contains("-"))
                                    {
                                        int count = Regex.Matches(linesArray[1], "-").Count;
                                        if (count > 1)
                                        {
                                            int index = linesArray[1].IndexOf("-", StringComparison.OrdinalIgnoreCase);

                                            if (index != -1)
                                            {
                                                linesArray[1] = string.Concat(linesArray[1].AsSpan(0, index), ".", linesArray[1].AsSpan(index + 1));
                                            }
                                        }
                                        isplmin_spec = linesArray[1].Split("-")[0].TrimEnd('.').Replace("ë", "").Replace("P", "0");
                                        if (Regex.IsMatch(isplmin_spec, @"[^$a-zA-Z.]+$"))
                                        {
                                            isplmin_spec = Regex.Replace(isplmin_spec, @"^[$a-zA-Z.]+$", "");
                                        }
                                        ocrtext = isplmin_spec.TrimEnd('.').Replace("ë", "");
                                        if (isplmin_spec.Contains("X"))
                                        {
                                            ocrtext = isplmin_spec.TrimEnd('.');
                                            isplmin_spec = isplmin_spec.Split("X")[1].TrimEnd('.');
                                        }
                                        isplmin_mintol = linesArray[1].Split("-")[1].TrimEnd('.');
                                        if (Regex.IsMatch(isplmin_mintol, @"[^$0-9.]+$"))
                                        {
                                            isplmin_mintol = Regex.Replace(isplmin_mintol, @"^[$0-9.]+$", "");
                                        }
                                    }
                                }
                            }
                            string mainItem = string.Empty;
                            mainItem = linesArray.FirstOrDefault(s => s.Contains("¡"));
                            if (mainItem != null && linesArray.Length > 1 && !ocrtext.Contains("¡"))
                            {
                                var result = linesArray.Select((s, i) => new { Item = s, IsMain = s.Contains("¡"), index = i }).ToArray();
                                if (result.Length > 0)
                                {
                                    var mainFound = result.FirstOrDefault(s => s.IsMain);
                                    var subFound = result.FirstOrDefault(s => !s.IsMain);
                                    if (mainFound != null)
                                    {
                                        linesArray[1] = mainFound.Item;
                                        linesArray[0] = subFound.Item;
                                        if (linesArray[0].Contains("-"))
                                        {
                                            isplmin = true;
                                            string substr = linesArray[0].Substring(ocrtext.IndexOf("-") + 1).Replace(" ", "");
                                            isplmin_mintol = substr.Replace("-", "").Replace("═", "").Replace("+", "").Replace("O10", "010").TrimEnd('.');
                                        }
                                        if (linesArray[1].Contains("+"))
                                        {
                                            isplmin = true;
                                            isplmin_spec = linesArray[1].Split("+")[0];
                                            ocrtext = isplmin_spec.TrimEnd('.').Replace("ë", "");
                                            isplmin_pltol = linesArray[1].Split("+")[1].Replace("Oîî", "000").Replace("Oîï", "001").Replace("Oîó", "005").Replace("îîó", "005").Trim().TrimEnd('.');
                                            if (Regex.IsMatch(isplmin_pltol, @"[^$0-9.]+$"))
                                            {
                                                isplmin_pltol = Regex.Replace(isplmin_pltol, @"^[$0-9.]+$", "");
                                            }
                                            if (!isplmin_pltol.Contains("."))
                                            {
                                                isplmin_pltol = "." + isplmin_pltol.Replace("I", "").Replace("Oîï", "001").Replace("Oîó", "005").Replace("îîó", "005").Trim().TrimEnd('.');
                                            }
                                        }
                                    }
                                }
                            }
                            if (Regex.IsMatch(isplmin_pltol, @"[^$0-9.]+$"))
                            {
                                isplmin_pltol = Regex.Replace(isplmin_pltol, @"^[$0-9.]+$", "");
                            }
                            if (Regex.IsMatch(isplmin_mintol, @"[^$0-9.]+$"))
                            {
                                isplmin_mintol = Regex.Replace(isplmin_mintol, @"^[$0-9.]+$", "");
                            }
                            if (Regex.IsMatch(isplmin_spec, @"[^$0-9.]+$"))
                            {
                                isplmin_spec = Regex.Replace(isplmin_spec, @"^[$0-9.]+$", "");
                            }
                            ocrtext = Regex.Replace(ocrtext, @"\r\n?|\n", "");
                            // ocrtext = Regex.Replace(ocrtext, @"(\(\/\)|\([0-9]{1}\))", "");
                            // string brackets = @"[\(\)]";
                            // ocrtext = Regex.Replace(ocrtext, brackets, "");
                            if (ocrtext != "")
                            {
                            }
                            if (!usedPaddleOcr)
                            {
                                // Tesseract-specific symbol replacements — PaddleOCR returns clean text
                                Dictionary<string, string> replacements = new Dictionary<string, string>{
                                    { "î.", "O" }, { "çç", "" }, { "═", "" }, { "EB", "─" },
                                    {"XX",""}, {"##","" }, {"..","" }, {":","" }, {"«ç","" },
                                    {"─",""}, {"çë","ç" }, {"±F","OF" }, {"°F","OF" },
                                    {"-³",""}, {".³",""}, {"³-",""}, {".ë",""}, {"|","" }
                                };
                                foreach (var replacement in replacements)
                                {
                                    ocrtext = ocrtext.Replace(replacement.Key, replacement.Value).TrimEnd('.');
                                }
                                if (Regex.IsMatch(ocrtext, @"^((?:\s|:?[/\\;:'"",.]|:?«|:?»|)(\d+)(?:\s|:?[/\\;:'"",.]|:?«|:?»|))$") && !ocrtext.Contains("±"))
                                {
                                    ocrtext = ocrtext.Replace("«", "").Replace("»", "").Replace("/", "")
                                                        .Replace(";", "").Replace(":", "").Replace("'", "")
                                                        .Replace("\"", "").Replace(",", "").Replace("\\", "");
                                }
                                if (Regex.IsMatch(ocrtext, @"^((?:\s|)(?:([A-Z])|[/\\;:'"",.]|)(\d+)?°(?:\s|)(?:([A-Z])|[/\\;:'"",.]|))$") && !ocrtext.Contains("±"))
                                {
                                    ocrtext = ocrtext.Replace("/", "").Replace(";", "").Replace(":", "")
                                                        .Replace("'", "").Replace("\"", "").Replace(",", "").Replace("\\", "");
                                    string numericString = new string(ocrtext.Where(char.IsDigit).ToArray());
                                    ocrtext = numericString + "°";
                                }
                                // Tesseract-specific hardcoded value corrections
                                string regionText = ocrtext;
                                if (regionText == "2180°") regionText = "2X180°";
                                if (regionText == "00") regionText = "30°";
                                if (regionText == "çë") regionText = "ç";
                                if (regionText == "63" || regionText == "ç63") regionText = "»";
                                if (regionText == "X5°" || regionText == "45°(" || regionText == "45Z" || regionText == "45" || regionText == "45O" || regionText == "450" || regionText == "42") regionText = "45°";
                                if (regionText == "32") regionText = "´";
                                if (regionText == "38" || regionText == "30ç" || regionText == "ç30" || regionText == "30" || regionText == "396" || regionText == "390" || regionText == "300" || regionText == "3905" || regionText == "398" || regionText == "30O") regionText = "30°";
                                if (regionText == "150" || regionText == "15") regionText = "15°";
                                if (regionText == "600" || regionText == "60") regionText = "60°";
                                if (regionText == "100" || regionText == "10") regionText = "10°";
                                if (regionText == "250") regionText = "25°";
                                if (regionText == "200") regionText = "20°";
                                if (regionText == "900") regionText = "90°";
                                if (regionText == "70") regionText = "7°";
                                if (regionText == "û") regionText = "";
                                if (regionText == "Rù6") regionText = "R.6";
                                if (regionText == "R.î3" || regionText == "R.îñ") regionText = "R.03";
                                if (regionText == ".îîóë") regionText = ".005";
                                if (regionText == "125" || regionText == "ç125") regionText = "«";
                                ocrtext = regionText;
                            }
                            if (!usedPaddleOcr && (ocrtext.Contains("X") || ocrtext.Contains("R")))
                            {
                                // Tesseract-specific: "îñ" → "03", strip stray "I"
                                ocrtext = ocrtext.Replace("îñ", "03").Replace("I", "").TrimEnd('.');
                            }

                            if (ocrtext.Contains(")("))
                                ocrtext = ocrtext.Replace(")(", "X");

                            if (ocrtext.Contains("±"))
                            {
                                string[] hastext = ocrtext.Split("±");
                                if (ocrtext.Contains('O'))
                                {
                                    ocrtext = ocrtext.Replace("O", "0");
                                }

                                if (hastext[0].Trim().Length > 0 && hastext[1].Trim().Length > 0 && Regex.IsMatch(ocrtext, @"^((\d+)(?:\s|))±((?:\s|)(\d+)?°)$"))
                                {
                                    var deg = hastext[0].Trim();
                                    if (hastext[0].Trim().Length == 3 && hastext[0].Trim().EndsWith("0"))
                                    {
                                        hastext[0] = string.Concat(hastext[0].AsSpan(0, hastext[0].Length - 1), "°");
                                    }
                                    ocrtext = hastext[0] + "±" + hastext[1];

                                }
                                hastext = ocrtext.Split("±");
                                if (hastext[0].Trim().Length > 0 && hastext[1].Trim().Length > 0 && Regex.IsMatch(ocrtext, @"^((\d+)?°±((?:\s|)(\d+)))$"))
                                {
                                    var deg = hastext[1].Trim();
                                    if (hastext[1].Trim().Length == 3 && hastext[1].Trim().EndsWith("0"))
                                    {
                                        hastext[1] = string.Concat(hastext[1].AsSpan(0, hastext[1].Length - 1), "°");
                                    }
                                    ocrtext = hastext[0] + "±" + hastext[1];

                                }
                                hastext = ocrtext.Split("±");
                                if (hastext[0].Length > 0 && hastext[1].Length > 0 && Regex.IsMatch(ocrtext, @"^((\d+|(?:\.d+)|)(?:\.\d+))±((\d+|(?:\.d+)|)(?:\.\d+))$"))
                                {
                                    ocrtext = hastext[0] + "±" + hastext[1];
                                }
                            }
                            if (!usedPaddleOcr)
                            {
                                // Tesseract-specific Latin symbol to digit replacements
                                ocrtext = ocrtext
                                    .Replace("î", "0").Replace("ï", "1").Replace("ð", "2")
                                    .Replace("ñ", "3").Replace("ò", "4").Replace("ó", "5")
                                    .Replace("ô", "6").Replace("õ", "7").Replace("ö", "8")
                                    .Replace("÷", "9").Replace("(2)", "¡").Replace("(Z)", "¡")
                                    .Replace("(:0", "¡").Replace("à", "¡");
                            }
                            objerr.WriteErrorLog("SplBalloon final ocrtext: '" + ocrtext + "' usedPaddle=" + usedPaddleOcr);
                            var hdrnew = context.TblBaloonDrawingHeaders.Where(w => w.DrawingNumber == searchForm.CdrawingNo.ToString() && w.Revision == searchForm.CrevNo.ToString()).FirstOrDefault();
                            string Min, Max, Nominal, Type, SubType, Unit, ToleranceType, PlusTolerance, MinusTolerance;
                            AllinoneBalloon.Common.CommonMethods cmt = new AllinoneBalloon.Common.CommonMethods(context, hdrnew);
                            cmt.GetMinMaxValues(ocrtext.Trim(), out Min, out Max, out Nominal, out Type, out SubType, out Unit, out ToleranceType, out PlusTolerance, out MinusTolerance);
                            string qty = "1";
                            long Num_Qty = 1;
                            int beforeqty = 1;
                            bool isDigitPresent = ocrtext.Any(c => char.IsDigit(c));
                            if (ocrtext.Contains("X") && (isDigitPresent || ocrtext.Contains("°")))
                            {
                                if (ocrtext.Length > 2)
                                {
                                    int count = Regex.Matches(ocrtext, "X").Count;
                                    if (count > 1)
                                    {
                                        string[] result4 = ocrtext.Split('X');
                                        if (char.IsNumber(result4[0], 0))
                                        {
                                            qty = result4[0];
                                        }
                                        else if (char.IsNumber(result4[1], 0))
                                        {
                                            qty = result4[1];
                                        }
                                    }
                                    else
                                    {
                                        qty = ocrtext.Substring(0, ocrtext.IndexOf("X")).Replace(" ", "");
                                        if (qty.Contains("."))
                                        {
                                            qty = "1";
                                            beforeqty = 1;
                                            if (ocrtext.Contains("450"))
                                            {
                                                ocrtext = ocrtext.Replace("450", "45°");
                                            }
                                        }
                                        else
                                        {
                                            ocrtext = ocrtext.Replace(qty + "X", "");
                                        }
                                        cmt.GetMinMaxValues(ocrtext.Trim(), out Min, out Max, out Nominal, out Type, out SubType, out Unit, out ToleranceType, out PlusTolerance, out MinusTolerance);
                                        if (isplmin_spec.Contains("X"))
                                        {
                                            isplmin_spec = isplmin_spec.Replace(qty + "X", "");
                                        }
                                    }
                                }
                                else
                                {
                                    qty = ocrtext.Substring(0, ocrtext.IndexOf("X")).Replace(" ", "");
                                }
                                int value;
                                if (int.TryParse(qty, out value))
                                    Num_Qty = Convert.ToInt64(qty);
                                beforeqty = value;
                            }
                            if (qty.Contains("."))
                            {
                                qty = "1";
                                beforeqty = 1;
                            }

                            if (Regex.IsMatch(isplmin_pltol, @"[^$0-9.]+$"))
                            {
                                isplmin_pltol = Regex.Replace(isplmin_pltol, @"^[$0-9.]+$", "");
                            }
                            if (Regex.IsMatch(isplmin_mintol, @"[^$0-9.]+$"))
                            {
                                isplmin_mintol = Regex.Replace(isplmin_mintol, @"^[$0-9.]+$", "");
                            }
                            if (Regex.IsMatch(isplmin_spec, @"[^$0-9.]+$"))
                            {
                                isplmin_spec = Regex.Replace(isplmin_spec, @"^[$0-9.]+$", "");
                            }
                            long balincid = 1;
                            for (int k = 1; k <= beforeqty; k++)
                            {
                                if (lstoCRResults.Count > 0 && k == 1)
                                {
                                    var validBalloons = lstoCRResults
                                        .Where(r => !string.IsNullOrWhiteSpace(r.Balloon))
                                        .Select(r =>
                                        {
                                            string numPart = r.Balloon.Contains('.')
                                                ? r.Balloon.Substring(0, r.Balloon.IndexOf('.'))
                                                : r.Balloon;
                                            long val;
                                            return long.TryParse(numPart, out val) ? val : 0;
                                        })
                                        .Where(v => v > 0);
                                    if (validBalloons.Any())
                                    {
                                        balincid = validBalloons.Max() + 1;
                                    }
                                }
                                AllinoneBalloon.Entities.Common.OCRResults oCRResults1 = new AllinoneBalloon.Entities.Common.OCRResults();
                                string cnt = k.ToString();
                                oCRResults1.BaloonDrwID = 0;
                                oCRResults1.DrawingNumber = searchForm.CdrawingNo;
                                oCRResults1.Revision = searchForm.CrevNo.ToUpper();
                                oCRResults1.Page_No = searchForm.pageNo;
                                oCRResults1.BaloonDrwFileID = desFile;
                                oCRResults1.ProductionOrderNumber = searchForm.routingNo.ToString();
                                oCRResults1.Part_Revision = "N/A";
                                if (beforeqty > 1)
                                {
                                    oCRResults1.Balloon = Convert.ToString(string.Join(".", Convert.ToInt16(balincid), cnt));
                                }
                                else
                                {
                                    oCRResults1.Balloon = Convert.ToString(balincid);
                                }
                                oCRResults1.Spec = ocrtext.Trim().TrimEnd('.').ToString();
                                oCRResults1.Nominal = Nominal;
                                oCRResults1.Minimum = Min;
                                oCRResults1.Maximum = Max;
                                oCRResults1.MeasuredBy = username;
                                oCRResults1.MeasuredOn = DateTime.Now;
                                oCRResults1.Measure_X_Axis = (int)s_x;
                                oCRResults1.Measure_Y_Axis = (int)s_y;
                                oCRResults1.Crop_X_Axis = (int)s_x;
                                oCRResults1.Crop_Y_Axis = (int)s_y;
                                oCRResults1.Crop_Width = (int)s_w;
                                oCRResults1.Crop_Height = (int)s_h;
                                oCRResults1.Circle_X_Axis = (int)s_x;
                                oCRResults1.Circle_Y_Axis = (int)s_y;
                                oCRResults1.Circle_Width = 28;
                                oCRResults1.Circle_Height = 28;
                                oCRResults1.Type = Type;
                                oCRResults1.SubType = SubType;
                                oCRResults1.Unit = Unit;
                                oCRResults1.Quantity = beforeqty;
                                if (Min != "" && Max != "")
                                {
                                    oCRResults1.ToleranceType = ToleranceType;
                                }
                                else
                                {
                                    oCRResults1.ToleranceType = "Default";
                                }
                                if (ocrtext.Contains("R."))
                                {
                                    oCRResults1.ToleranceType = "Linear";
                                }
                                if (PlusTolerance != "")
                                {
                                    oCRResults1.PlusTolerance = "+" + PlusTolerance;
                                }
                                else
                                {
                                    oCRResults1.PlusTolerance = "0";
                                }
                                if (MinusTolerance != "")
                                {
                                    oCRResults1.MinusTolerance = "-" + MinusTolerance;
                                }
                                else
                                {
                                    oCRResults1.MinusTolerance = "0";
                                }
                                oCRResults1.MaxTolerance = "";
                                oCRResults1.MinTolerance = "";
                                oCRResults1.CreatedBy = username;
                                oCRResults1.CreatedDate = DateTime.Now;
                                oCRResults1.ModifiedBy = "";
                                oCRResults1.ModifiedDate = DateTime.Now;
                                oCRResults1.x = (int)s_x;
                                oCRResults1.y = (int)s_y;
                                oCRResults1.width = (int)s_w;
                                oCRResults1.height = (int)s_h;
                                oCRResults1.id = "";
                                oCRResults1.selectedRegion = "Spl";
                                oCRResults1.isballooned = true;
                                if (isplmin && isplmin_mintol != "" && isplmin_pltol != "" && isplmin_spec != "")
                                {
                                    oCRResults1.Spec = isplmin_spec;
                                    oCRResults1.Nominal = isplmin_spec;
                                    try
                                    {
                                        oCRResults1.Minimum = Convert.ToString(Convert.ToDecimal(isplmin_spec.Replace("¡", "")) - Convert.ToDecimal(isplmin_mintol));
                                        oCRResults1.Maximum = Convert.ToString(Convert.ToDecimal(isplmin_spec.Replace("¡", "")) + Convert.ToDecimal(isplmin_pltol));
                                        oCRResults1.MinusTolerance = "-" + Convert.ToString(isplmin_mintol).TrimEnd('.');
                                        oCRResults1.PlusTolerance = "+" + Convert.ToString(isplmin_pltol).TrimEnd('.');
                                    }
                                    catch (Exception ex)
                                    {
                                        objerr.WriteErrorToText(ex);
                                        objerr.WriteErrorLog("isplmin_spec-->" + isplmin_spec + "-->isplmin_mintol-->" + isplmin_mintol + "-->isplmin_pltol-->" + isplmin_pltol);
                                    }
                                    oCRResults1.ToleranceType = "Linear";
                                    oCRResults1.Type = "Dimension";
                                    oCRResults1.Unit = "INCHES";
                                    oCRResults1.SubType = "Circularity";
                                }
                                if (ocrtext.Contains("X") && ocrtext.Contains("°"))
                                {
                                    oCRResults1.Minimum = "";
                                    oCRResults1.Maximum = "";
                                    oCRResults1.MinusTolerance = "0";
                                    oCRResults1.PlusTolerance = "0";
                                    oCRResults1.ToleranceType = "Linear";
                                    oCRResults1.Type = "";
                                    oCRResults1.Unit = "";
                                    oCRResults1.SubType = "";
                                }
                                oCRResults1.Characteristics = "";
                                if (ocrtext.Contains("UN") || ocrtext.Contains("HIF") || ocrtext.Contains("UNF") || ocrtext.Contains("UNS") || ocrtext.Contains("STUB ACME") || ocrtext.Contains("HST-DS") || ocrtext.Contains("HST") || ocrtext.Contains("VAM") || ocrtext.Contains("TOP") || ocrtext.Contains("SPCL"))
                                {
                                    oCRResults1.Characteristics = "THREAD";
                                    oCRResults1.Unit = "THREAD GAUGE";
                                }

                                if (Regex.IsMatch(ocrtext, @"^(?:[(?:¡)(\d+)(\d+\.\d+)]+)±([(\d+)(\d+\.\d+)]+)$"))
                                {
                                    oCRResults1.Characteristics = "DISTANCE";
                                    oCRResults1.Unit = "D.H.G";
                                }
                                if (Regex.IsMatch(ocrtext, @"^(?:[(\d+\.\d+)(\s+)]+)X([(\d+)(\s+)(?:°)]+)$"))
                                {
                                    oCRResults1.Characteristics = "DISTANCE";
                                    oCRResults1.Unit = "D.H.G";
                                }
                                if (Regex.IsMatch(ocrtext, @"^(?:[(?:¡)(\d+\.\d+)(\s+)]+)$"))
                                {
                                    oCRResults1.Characteristics = "DISTANCE";
                                    oCRResults1.Unit = "D.H.G";
                                }
                                if (Regex.IsMatch(ocrtext, @"^(?:[(?:°)(\d+)(\d+\.\d+)]+)±([(?:°)(\d+)(\d+\.\d+)]+)$"))
                                {
                                    oCRResults1.Characteristics = "DISTANCE";
                                    oCRResults1.Unit = "D.H.G";
                                }
                                if (Regex.IsMatch(ocrtext, @"^(?:R[(\d+)(\d+\.\d+)]+)$"))
                                {
                                    oCRResults1.Characteristics = "RADIUS";
                                    oCRResults1.Unit = "CMM";
                                }
                                if (Regex.IsMatch(ocrtext, @"^(?:[(\d+)]+(?:°))$"))
                                {
                                    oCRResults1.Characteristics = "DIMENTION";
                                    oCRResults1.Unit = "Degree";
                                }
                                if (Num_Qty > 1)
                                {
                                    oCRResults1.Characteristics = "Counter Sink";
                                    oCRResults1.Unit = "CMM";
                                }
                                if (Regex.IsMatch(ocrtext, @"^(?:[(\d+)(\d+\.\d+)]+)$"))
                                {
                                    oCRResults1.Characteristics = "TOTAL LENGTH";
                                    oCRResults1.Unit = "D.H.G";
                                }
                                oCRResults1.isSaved = false;
                                oCRResults1.BalloonColor = "";
                                oCRResults1.Actual = "";
                                oCRResults1.Decision = "";
                                Dictionary<string, object> conv = await helper.ConvertSpec(ocrtext);

                                bool convert = (bool)conv.Where(key => key.Key == "convert").FirstOrDefault().Value;
                                string converted = (string)conv.Where(key => key.Key == "converted").FirstOrDefault().Value;
                                oCRResults1.convert = convert;
                                oCRResults1.converted = converted;
                                oCRResults1.BalloonShape = searchForm.Settings.BalloonShape;
                                // Create the list
                                var list = new List<Dictionary<string, Dictionary<string, string>>>();

                                // Add the first dictionary to the list
                                list.Add(new Dictionary<string, Dictionary<string, string>>
                                {
                                    { "OP", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
                                    { "LI", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
                                    { "Final", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
                                });

                                oCRResults1.ActualDecision = list;
                                oCRResults1.Serial_No = string.Empty;

                                lstoCRResults.Add(oCRResults1);
                            }
                        }
                    }
                    returnObject = lstoCRResults;
                    var precount = previous.Count();
                    var nxtcount = lstoCRResults.Count();
                    objerr.WriteErrorLog($"SplBalloon result: precount={precount}, nxtcount={nxtcount}, newBalloons={nxtcount - precount}");
                    if (precount == nxtcount)
                    {
                        objerr.WriteErrorLog("SplBalloon: No new balloon added, creating dummy balloon as fallback");
                        returnObject = helper.CreateDummyBalloon(lstoCRResults, searchForm, desFile, username);
                        return await Task.Run(() =>
                        {
                            return StatusCode(StatusCodes.Status201Created, returnObject);
                        });
                    }
                    return await Task.Run(() =>
                    {
                        return StatusCode(StatusCodes.Status201Created, returnObject);
                    });
                }
                catch (Exception ex)
                {
                    objerr.WriteErrorToText(ex);
                    returnObject = balcon.get(searchForm.CdrawingNo, searchForm.CrevNo, searchForm.routingNo, groupId);
                }
                return await Task.Run(() =>
                {
                    return StatusCode(StatusCodes.Status201Created, returnObject);
                });
            }
        }
        #endregion
    }
}

#region Library Imports
using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenCvSharp;
using System.Drawing;
using System.Text;
using System.Text.RegularExpressions;
using Tesseract;
using static AllinoneBalloon.Entities.Common;
#endregion

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        [Authorize]
        [HttpPost("AutoBalloon")]
        public async Task<ActionResult<AllinoneBalloon.Entities.Common.AutoBalloon>> AutoBalloon(AllinoneBalloon.Entities.Common.AutoBalloon searchForm)
        {
            using var context = _dbcontext.CreateDbContext();
            if (context.TblConfigurations == null)
            {
                return await Task.Run(() =>
                {
                    objerr.WriteErrorLog(context.TblConfigurations.ToQueryString());
                    return NotFound();
                });
            }
            else
            {
                BalloonController balcon = new BalloonController(_dbcontext);
                AllinoneBalloon.Entities.Common.CreateBalloon objbaldet = new AllinoneBalloon.Entities.Common.CreateBalloon();
                IEnumerable<object> returnObject = new List<object>();
                try
                {
                    var _sw = System.Diagnostics.Stopwatch.StartNew();
                    objerr.WriteErrorLog($"AutoBalloon called - accurateGDT: {searchForm.accurateGDT}");
                    Helper helper = new AllinoneBalloon.Common.Helper(_dbcontext);
                    User user = await helper.GetLoggedUser(HttpContext);
                    if (user != null)
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

                    #region Auto balloon pre-process logic
                    var hdrnew = context.TblBaloonDrawingHeaders.Where(w => w.ProductionOrderNumber == searchForm.routingNo.ToString() && w.DrawingNumber == searchForm.CdrawingNo.ToString() && w.Revision == searchForm.CrevNo.ToString()).FirstOrDefault();

                    if (hdrnew == null)
                    {
                        CreateHeader ch = new CreateHeader();
                        ch.DrawingNo = searchForm.CdrawingNo; ch.RevisionNo = searchForm.routingNo.ToString(); ch.Routerno = searchForm.routingNo.ToString(); ch.Quantity = searchForm.Quantity.ToString();
                        ch.Total = searchForm.totalPage; ch.rotate = searchForm.rotate; ch.UserName = username;
                        await helper.CreateHeader(context, ch);
                    }
                    else
                    {
                        long hdrid = hdrnew.BaloonDrwID;
                        AllinoneBalloon.Models.Settings settings = searchForm.Settings;
                        var snew = context.TblBaloonDrawingSettings.Where(w => w.BaloonDrwId == hdrid).FirstOrDefault();
                        if (snew == null)
                        {
                            await helper.CreateSettings(context, settings, hdrid);
                        }
                        else
                        {
                            await helper.UpdateSettings(context, settings, snew, hdrid);
                        }
                    }
                    string[] skipwords = { "DRAWING", "Nî.", "FRAME", "SHEET", "REVISIîN", "SECTION", "D-D", "C-C", "B-B", "A-A", "DETAII.", "LINE", "WITH", "WIDTH", "SLOT", "SLOTS", "LEAD", "HAND", "I.EFT", "RIGHT", "SEE", "LINEWITH", "IN", "E-", "(COAT", "PER", "BOM", "FLATS", "CONFIGURATION", "FLAT", "EB", searchForm.CdrawingNo.ToLower(), searchForm.CdrawingNo.ToUpper(), searchForm.CdrawingNo, searchForm.CrevNo, searchForm.CrevNo.ToLower(), searchForm.CrevNo.ToUpper() };
                    string drawingNo = searchForm.CdrawingNo;
                    string revNo = searchForm.CrevNo;
                    string routingNo = searchForm.routingNo;
                    string dtFiles = searchForm.drawingDetails;
                    double _aspectRatio = searchForm.aspectRatio;
                    double bgImgW = searchForm.bgImgW;
                    double bgImgH = searchForm.bgImgH;
                    string selectedRegion = searchForm.selectedRegion;
                    int bgImgRotation = searchForm.bgImgRotation;
                    int pageNo = searchForm.pageNo;
                    int totalPage = searchForm.totalPage;
                    string env = _appSettings.ENVIRONMENT;
                    string finame = string.Empty;
                    FileInfo fi = new FileInfo(dtFiles);
                    finame = dtFiles;
                    string desFile = fi.Name;
                    string OrgPath = dtFiles;
                    if (env != "development")
                    {
                    
                    }
                    int ItemView = searchForm.ItemView;
                    List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults = new List<AllinoneBalloon.Entities.Common.OCRResults>();
                    string Fname = fi.Name;
                    temp = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + $"{Fname}");
                    System.IO.File.Copy(OrgPath, temp, true);
                    // RemoveOpaqueColormapFrom1BPP(OrgPath);
                    if (bgImgRotation != 0)
                    {
                        await helper.RotateImagefile(temp, bgImgRotation);
                    }
                    string ImageFile = Path.Combine(Path.GetTempPath(), "ImageFile_" + Guid.NewGuid().ToString() + desFile);
                    string SelImageFile = Path.Combine(Path.GetTempPath(), "SelImageFile_" + Guid.NewGuid().ToString() + desFile);
                    string processImageFile = Path.Combine(Path.GetTempPath(), "processImageFile_" + Guid.NewGuid().ToString() + desFile);
                    // Only copy files that are needed for the selected region mode
                    if (searchForm.selectedRegion == "Selected Region")
                    {
                        await Task.WhenAll(
                            Task.Run(() => System.IO.File.Copy(temp, ImageFile, true)),
                            Task.Run(() => System.IO.File.Copy(temp, SelImageFile, true)),
                            Task.Run(() => System.IO.File.Copy(temp, processImageFile, true))
                        );
                    }
                    else
                    {
                        // Full Image / Unselected: only need ImageFile for dimensions
                        System.IO.File.Copy(temp, ImageFile, true);
                        processImageFile = temp; // reuse temp for processing
                    }
                    objerr.WriteErrorLog($"TIMING: file_copy={_sw.ElapsedMilliseconds}ms");
                    decimal s_x = 0;
                    decimal s_y = 0;
                    decimal s_w = 0;
                    decimal s_h = 0;
                    string croppedname = string.Empty;
                    int imagewidth = 0;
                    int imageheight = 0;
                    if (searchForm.selectedRegion == "Selected Region")
                    {
                        System.IO.File.Delete(temp);
                        List<AllinoneBalloon.Entities.Common.OCRResults> request = searchForm.originalRegions.Where(x1 => x1.isballooned == false).ToList();
                        foreach (var obj in request)
                        {
                            s_x = obj.x;
                            s_y = obj.y;
                            s_w = obj.width;
                            s_h = obj.height;
                            System.Drawing.RectangleF rectElipse = new System.Drawing.RectangleF(obj.x, obj.y, obj.width, obj.height);
                            lstCircle.Add(new Circle_AutoBalloon { Bounds = rectElipse });
                            string OriginalImage = OrgPath;
                            System.Drawing.Rectangle rectElipse1 = new System.Drawing.Rectangle(obj.x, obj.y, obj.width, obj.height);
                            Bitmap originalImage = new Bitmap(SelImageFile);
                            Bitmap croppedImage = helper.CropImage(originalImage, rectElipse1);
                            // Bitmap newImage = ChangeResolution(croppedImage, 200.0f);
                            FileInfo cfi = new FileInfo(SelImageFile);
                            string cropname = Path.Combine(Path.GetTempPath(), "cropname_" + Guid.NewGuid().ToString() + cfi.Extension);
                            // Save or use the new image
                            croppedImage.Save(cropname);
                            temp = cropname;
                        }
                    }
                    else if (searchForm.selectedRegion == "Unselected Region")
                    {
                        List<AllinoneBalloon.Entities.Common.OCRResults> request = searchForm.originalRegions.Where(x1 => x1.isballooned == false).ToList();
                        foreach (var obj in request)
                        {
                            System.Drawing.RectangleF rectElipse = new System.Drawing.RectangleF(obj.x, obj.y, obj.width, obj.height);
                            lstCircle.Add(new Circle_AutoBalloon { Bounds = rectElipse });
                        }
                    }
                    // Read image dimensions without full OpenCV decode (saves ~800ms)
                    OpenCvSharp.Mat image = null;
                    if (searchForm.selectedRegion == "Full Image" || searchForm.selectedRegion == "Selected Region" || searchForm.selectedRegion == "Unselected Region")
                    {
                        using (var dimImg = System.Drawing.Image.FromFile(ImageFile))
                        {
                            imagewidth = dimImg.Width;
                            imageheight = dimImg.Height;
                        }
                    }
                    // image Mat will be loaded on-demand only if Tesseract fallback is needed
                    if (searchForm.selectedRegion != "Unselected Region")
                    {
                        List<AllinoneBalloon.Entities.Common.OCRResults> request1 = searchForm.originalRegions.Where(x1 => x1.isballooned == true).ToList();
                        lstoCRResults = request1;
                    }
                    else
                    {
                        List<AllinoneBalloon.Entities.Common.OCRResults> request1 = searchForm.originalRegions.Where(x1 => x1.isballooned == true && x1.Page_No != pageNo).ToList();
                        lstoCRResults = request1;
                    }
                    #endregion

                    objerr.WriteErrorLog($"TIMING: image_load={_sw.ElapsedMilliseconds}ms (w={imagewidth},h={imageheight})");
                    StringBuilder FWords = new StringBuilder();
                    List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR> auto_ocrresults_largeimage = new List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR>();
                    List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR> auto_ocrresults = new List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR>();

                    var originposition = searchForm.origin;
                    var origin = originposition.First();
                    List<AllinoneBalloon.Entities.Common.AG_OCR> ag_ocrresults = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
                    List<AllinoneBalloon.Entities.Common.Rect> rects = new List<AllinoneBalloon.Entities.Common.Rect>();
                    int agocr = 0;
                    string customLanguagePath = new DirectoryInfo(Environment.CurrentDirectory).FullName + @"\tessdata";
                    int maximum = 32767;

                    if ((origin.scale < 1 || origin.scale == 1 && imagewidth > maximum) && (imagewidth > maximum || imageheight > maximum) && searchForm.selectedRegion == "Full Image")
                    {
                        #region Large Image Process
                        float padding = 200;
                        float originalHeight = origin.fullHeight;
                        float originalWidth = origin.fullWidth;
                        float scale = 0;
                        float widthScale = 0;
                        float heightScale = 0;
                        if (imageheight < imagewidth)
                        {
                            float sacledratio = imagewidth / imageheight;
                            widthScale = imagewidth / originalWidth;
                            heightScale = imageheight / originalHeight;
                            scale = Math.Min(widthScale, heightScale);
                            padding *= scale;
                        }

                        OpenCvSharp.Mat largeImage = Cv2.ImRead(temp, OpenCvSharp.ImreadModes.Color);
                        int gg = 0;

                        if (largeImage != null && !largeImage.Empty())
                        {
                            double divisor = 10000;
                            double dividend = originalWidth;
                            double quotient = dividend / divisor;
                            if (dividend % divisor != 0)
                            {
                                quotient = Math.Ceiling(quotient);
                            }
                            int roundedQuotient = (int)Math.Round(quotient);
                            int tileWidth = largeImage.Width / roundedQuotient; // Define the width of each tile
                            int tileHeight = largeImage.Height; // Define the height of each tile
                            StringBuilder Words_large = new StringBuilder();

                            #region Large image Slice and Iterate
                            if (await ShouldUsePaddleOcrAsync())
                            {
                                // PaddleOCR path: process tiles in parallel for speed
                                var tileTasks = new List<Task<(int tileIndex, List<AG_OCR> results)>>();
                                int tileIndex = 0;
                                for (int x = 0; x < largeImage.Cols; x += tileWidth)
                                {
                                    int width = Math.Min(tileWidth, largeImage.Cols - x);
                                    int height = tileHeight;
                                    tileIndex++;
                                    OpenCvSharp.Rect rect = new OpenCvSharp.Rect(x, 0, width, height);
                                    OpenCvSharp.Mat tile = new OpenCvSharp.Mat(largeImage, rect);
                                    Bitmap bitmap = OpenCvSharp.Extensions.BitmapConverter.ToBitmap(tile);
                                    FileInfo tfi = new FileInfo(temp);
                                    string tempFile = Path.Combine(Path.GetTempPath(), "largeimage_" + Guid.NewGuid().ToString() + ".png");
                                    bitmap.Save(tempFile, System.Drawing.Imaging.ImageFormat.Png);

                                    int tileOffsetX = (tileIndex == 1) ? 0 : x;
                                    int capturedIndex = tileIndex;
                                    int startGroup = agocr + (capturedIndex * 1000); // Avoid GroupID collision
                                    tileTasks.Add(Task.Run(async () =>
                                    {
                                        var tileResults = await PerformPaddleOcrAsync(tempFile, tileOffsetX, widthScale, heightScale, startGroup);
                                        try { System.IO.File.Delete(tempFile); } catch { }
                                        return (capturedIndex, tileResults);
                                    }));
                                }
                                // Wait for all tiles to complete
                                var allTileResults = await Task.WhenAll(tileTasks);
                                foreach (var (idx, tileResults) in allTileResults.OrderBy(t => t.tileIndex))
                                {
                                    ag_ocrresults.AddRange(tileResults);
                                    gg++;
                                }
                                if (ag_ocrresults.Count > 0)
                                    agocr = ag_ocrresults.Max(r => r.GroupID) + 1;
                                objerr.WriteErrorLog("large image Words (PaddleOCR): processed " + gg + " tiles in parallel");

                                // GD&T post-processing: merge horizontally adjacent AG_OCR items
                                if (searchForm.accurateGDT && ag_ocrresults.Count > 0)
                                {
                                    ag_ocrresults = helper.MergeAdjacentGdtAgOcr(ag_ocrresults);
                                    objerr.WriteErrorLog($"AccurateGDT (large): Post-merge count={ag_ocrresults.Count}");
                                }
                            }
                            else
                            {
                            // Original Tesseract code
                            using (var engine = new TesseractEngine(customLanguagePath, "IMSsym1", EngineMode.Default))
                            {
                                for (int x = 0; x < largeImage.Cols; x += tileWidth)
                                {
                                    int width = Math.Min(tileWidth, largeImage.Cols - x);
                                    //int height = Math.Min(tileHeight, largeImage.Rows - y);
                                    int height = tileHeight;
                                    gg++;
                                    agocr++;
                                    OpenCvSharp.Rect rect = new OpenCvSharp.Rect(x, 0, width, height);
                                    // y += tileHeight;
                                    OpenCvSharp.Mat tile = new OpenCvSharp.Mat(largeImage, rect);
                                    // Convert Mat to Bitmap
                                    Bitmap bitmap = OpenCvSharp.Extensions.BitmapConverter.ToBitmap(tile);
                                    FileInfo tfi = new FileInfo(temp);
                                    // Save the Bitmap as a temporary file
                                    string tempFile = Path.Combine(Path.GetTempPath(), "largeimage_" + Guid.NewGuid().ToString() + tfi.Extension);

                                    bitmap.Save(tempFile, System.Drawing.Imaging.ImageFormat.Png);

                                    using (var imgnew = Pix.LoadFromFile(tempFile)) // Preprocess the tile for OCR
                                    {
                                        using (var page = engine.Process(imgnew, PageSegMode.Auto))
                                        {
                                            using (var iter = page.GetIterator())
                                            {
                                                iter.Begin();
                                                int kk = 1;
                                                do
                                                {
                                                    if (iter.TryGetBoundingBox(PageIteratorLevel.Word, out var textLineBox))
                                                    {
                                                        OpenCvSharp.Rect textRegionRect = new OpenCvSharp.Rect(textLineBox.X1, textLineBox.Y1, textLineBox.X2 - textLineBox.X1, textLineBox.Y2 - textLineBox.Y1);
                                                        string word = iter.GetText(PageIteratorLevel.Word);
                                                        string regionText = word;
                                                        if (string.IsNullOrWhiteSpace(word) || word == "  " || word == " " || word == null)
                                                        {
                                                            continue;
                                                        }
                                                        if (regionText != "" || regionText != null)
                                                        {
                                                            if (gg == 1)
                                                            {
                                                                Words_large.AppendLine(regionText + "-->rect-->" + Convert.ToString(textRegionRect.X) + "," + Convert.ToString(textRegionRect.Y) + "," + Convert.ToString(textRegionRect.Width) + "," + Convert.ToString(textRegionRect.Height));
                                                                kk++;
                                                            }
                                                            else
                                                            {
                                                                Words_large.AppendLine(regionText + "-->rect-->" + Convert.ToString(tileWidth + textRegionRect.X) + "," + Convert.ToString(textRegionRect.Y) + "," + Convert.ToString(textRegionRect.Width) + "," + Convert.ToString(textRegionRect.Height));
                                                                kk++;
                                                            }

                                                            int cont = 0, cx = 0, cy = 0, xx = 0, yy = 0, ww = 0, hh = 0, nx = 0;
                                                            if (gg == 1)
                                                            {
                                                                cx = (int)(textLineBox.X1 * widthScale);
                                                                xx = (int)(textLineBox.X1 * widthScale);
                                                                nx = (int)(textLineBox.X1 * widthScale);
                                                            }
                                                            else
                                                            {
                                                                cx = (int)((x + textLineBox.X1) * widthScale);
                                                                xx = (int)((x + textLineBox.X1) * widthScale);
                                                                nx = (int)((x + textLineBox.X1) * widthScale);
                                                            }
                                                            cont = ag_ocrresults.Count();
                                                            cy = (int)(textLineBox.Y1 * heightScale);
                                                            yy = (int)(textLineBox.Y1 * heightScale);
                                                            ww = (int)((textLineBox.X2 - textLineBox.X1) * widthScale);
                                                            hh = (int)((textLineBox.Y2 - textLineBox.Y1) * heightScale);
                                                            if (searchForm.selectedRegion == "Selected Region")
                                                            {
                                                                var croppedRegion = lstCircle.Last();
                                                                var simage = new OpenCvSharp.Mat(ImageFile, OpenCvSharp.ImreadModes.Color);
                                                                float cry = croppedRegion.Bounds.Y;
                                                                float crx = croppedRegion.Bounds.X;
                                                                float crw = croppedRegion.Bounds.Width;
                                                                float crh = croppedRegion.Bounds.Height;
                                                                decimal wsf = (decimal)crw / simage.Width;
                                                                decimal hsf = (decimal)crh / simage.Height;

                                                                var cx1 = (int)(textLineBox.X1 * wsf);
                                                                var cy1 = (int)(textLineBox.Y1 * hsf);

                                                                cx = textLineBox.X1 + (int)s_x + cx1;
                                                                xx = textLineBox.X1 + (int)s_x + cx1;
                                                                nx = textLineBox.X1 + (int)s_x + cx1;
                                                                cy = textLineBox.Y1 + (int)s_y + cy1;
                                                                yy = textLineBox.Y1 + (int)s_y + cy1;
                                                            }

                                                            // Resolution-aware grouping for large images
                                                            int lgGapX = Math.Max(70, imagewidth / 60);
                                                            if (cont == 0)
                                                            {
                                                                ag_ocrresults.Add(new AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                                            }
                                                            if (cont > 0)
                                                            {
                                                                var last = ag_ocrresults.Last();
                                                                var checky = xx - (last.x + last.w);
                                                                // Check Y-center alignment: items must be on the same text line
                                                                int lgLastCenterY = last.y + last.h / 2;
                                                                int lgCurrCenterY = yy + hh / 2;
                                                                int lgMaxH = Math.Max(hh, last.h);
                                                                bool lgSameLine = Math.Abs(lgCurrCenterY - lgLastCenterY) < lgMaxH;
                                                                if (lgSameLine && Math.Sign(checky) != -1 && last.x + last.w < xx && last.x < xx && checky < lgGapX)
                                                                {
                                                                    ag_ocrresults.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                                                }
                                                                else
                                                                {
                                                                    agocr++;
                                                                    ag_ocrresults.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                while (iter.Next(PageIteratorLevel.Word));
                                            }
                                        }
                                    }
                                }
                                objerr.WriteErrorLog("large image Words: " + Words_large);
                            }
                            } // end else (Tesseract)
                            #endregion
                        }
                        else
                        {
                            objerr.WriteErrorLog("Image not found or unable to read.");
                        }
                        #region Large image X axis based group the nearest text 
                        List<AllinoneBalloon.Entities.Common.AG_OCR> groupedByX = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
                        List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR> auto_group_ocrresults_largeimage = new List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR>();
                        var grouped_ocrresults = ag_ocrresults.GroupBy(i => i.GroupID).ToList();
                        foreach (var group in grouped_ocrresults)
                        {

                            int cx, cy, nx = 0; int xx, yy, ww, hh = 0;
                            string text = string.Empty;
                            int i = 1;
                            foreach (var g in group)
                            {
                                text += " " + g.text;
                                if (group.Count() == i)
                                {
                                    var first = group.First();
                                    cx = first.x;
                                    cy = first.y;
                                    var last = group.Last();
                                    xx = first.x;
                                    yy = first.y;
                                    ww = last.x + last.w - first.x;
                                    hh = last.h;
                                    nx = first.nx;
                                    text = text.Trim();
                                    text = Regex.Replace(text, @"\r\n|\n", "");
                                    text = text.Trim();
                                    // Skip aggressive symbol replacement when accurateGDT is enabled
                                    if (!searchForm.accurateGDT)
                                    {
                                    text = text.Replace("═1-°°", "-1.00").Replace("\r\n", "");
                                    text = text
                                        .Replace("î", "0")
                                        .Replace("ï", "1")
                                        .Replace("ð", "2")
                                        .Replace("ñ", "3")
                                        .Replace("ò", "4")
                                        .Replace("ó", "5")
                                        .Replace("ô", "6")
                                        .Replace("õ", "7")
                                        .Replace("ö", "8")
                                        .Replace("÷", "9")
                                        .Replace("(2)", "¡")
                                        .Replace("(Z)", "¡")
                                        ;
                                    }
                                    if (text.StartsWith("I"))
                                    {
                                        text = text.Substring(1);
                                    }
                                    if (Regex.IsMatch(text, @"[A-Z][0-9]{1}$"))
                                    {
                                        continue;
                                    }
                                    if (text.Contains("X"))
                                    {
                                        string[] hastext = text.Split("X");
                                        if (hastext[0].Trim().Length > 0 && hastext[1].Trim().Length > 0 && Regex.IsMatch(text, @"^((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s|))X((?:\s|)(\d+))$"))
                                        {
                                            var deg = hastext[1].Trim();
                                            if (hastext[1].Trim().Length == 3 && hastext[1].Trim().EndsWith("0"))
                                            {
                                                hastext[1] = string.Concat(hastext[1].AsSpan(0, hastext[1].Length - 1), "°");
                                            }
                                            text = hastext[0] + "X" + hastext[1];
                                        }
                                    }
                                    if (text.Contains("RëGHT") || text.Contains("RIGHT") || text.Contains("LEFT"))
                                    {
                                        string[] hastext = text.Split("RëGHT");
                                        if (hastext[0].Trim().Length > 0)
                                        {
                                            text = hastext[0];
                                        }
                                        hastext = text.Split("RIGHT");
                                        if (hastext[0].Trim().Length > 0)
                                        {
                                            text = hastext[0];
                                        }
                                        hastext = text.Split("LEFT");
                                        if (hastext[0].Trim().Length > 0)
                                        {
                                            text = hastext[0];
                                        }
                                    }
                                    if (text.StartsWith("(") && !text.EndsWith(")"))
                                    {
                                        text += ")";
                                    }
                                    if (!text.StartsWith("(") && text.EndsWith(")"))
                                    {
                                        text = "(" + text;
                                    }
                                    if (text.Contains("SEAT") && Regex.IsMatch(text.Trim(), @"^(((\d+(?:°))(?:±)(?:\d+(?:°))(?:\s))|(?:\d+(?:°))(?:\s))(?:SEAT)$"))
                                    {
                                        string[] hastext = text.Split("SEAT");
                                        if (hastext[0].Trim().Length > 0)
                                        {
                                            text = hastext[0].Trim();
                                        }
                                    }

                                    Dictionary<string, string> replacements = new Dictionary<string, string>{
                                        {".³","" },
                                        {"³-","" },
                                        {".ë","" },
                                        {"-³ ",""},
                                        { "-═ ",""},
                                        { "-----",""},
                                        { "ð","2"},
                                        { " ±","±"},
                                        { "à","¡"},
                                        { "±-","±."},
                                        { "ó","6"},
                                        { "-X",""},
                                        { "APART",""}
                                      };
                                    foreach (var replacement in replacements)
                                    {
                                        text = text.Replace(replacement.Key, replacement.Value);
                                    }
                                    if (string.IsNullOrWhiteSpace(text) || text == "" || text == "  " || text == " " || text == null)
                                    {
                                        continue;
                                    }
                                    if (text.Contains(".."))
                                    {
                                        string[] spltxt = text.Split("..");
                                        text = spltxt[0] + " -" + spltxt[1];
                                    }
                                    if (text.StartsWith(","))
                                    {
                                        text = text.Substring(1);
                                    }
                                    if (text.StartsWith("³"))
                                    {
                                        text = text.Substring(1);
                                    }
                                    if (text.EndsWith("³"))
                                    {
                                        text = text.Substring(0, text.Length - 1);
                                    }
                                    if (text.EndsWith("."))
                                    {
                                        text = text.Substring(0, text.Length - 1);
                                    }
                                    if (text.Contains("+"))
                                    {
                                        if (Regex.IsMatch(text, @"^\d+\s\d+(\.\d+)?(\+\.\d+)?$"))
                                        {
                                            text = text.Replace(" ", ".");
                                        }
                                    }
                                    if (text.Contains("-"))
                                    {
                                        if (Regex.IsMatch(text, @"^\d+\s\d+(\.\d+)?(\-\.\d+)?$"))
                                        {
                                            text = text.Replace(" ", ".");
                                        }
                                    }
                                    if (text.StartsWith("R") && (text != "ROWS" || text != "ROW"))
                                    {
                                        text = text.Replace(",", ".").Replace(" ", ".")
                                                   .Replace("î", "0")
                                                   .Replace("ï", "1")
                                                   .Replace("ð", "2")
                                                   .Replace("ñ", "3")
                                                   .Replace("ò", "4")
                                                   .Replace("ó", "5")
                                                   .Replace("ô", "6")
                                                   .Replace("õ", "7")
                                                   .Replace("ö", "8")
                                                   .Replace("÷", "9");
                                    }

                                    bool containsBracket = text.Contains("(") && text.Contains(")");
                                    if (containsBracket)
                                        continue;
                                    text = text.Trim();
                                    text = Regex.Replace(text, @"\r\n?|\n", "");
                                    text = text.Trim();
                                    if (text.Trim().Length < 2)
                                        continue;
                                    groupedByX.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = g.GroupID, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = text });
                                }
                                i++;
                            }
                        }
                        #endregion

                        #region Large Image join the PluseMinus 
                        List<AllinoneBalloon.Entities.Common.AG_OCR> sortByPluseMinuse = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
                        List<AllinoneBalloon.Entities.Common.AG_OCR> sortByY = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
                        List<int> snewList = new List<int>();
                        int scount = 1;
                        foreach (var i in groupedByX)
                        {
                            if (i.text.Contains("+"))
                            {
                                sortByPluseMinuse.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = scount, cx = i.cx, cy = i.cy, x = i.x, y = i.y, w = i.w, h = i.h, text = i.text });
                                snewList.Add(i.GroupID);

                                var last = sortByPluseMinuse.Last();
                                var neartext = groupedByX
                                           .Where(item => !snewList.Contains(item.GroupID))
                                           .Where(item =>
                                                item.text.Length > 2 && item.y - last.y < 70 && Math.Sign(item.y - last.y) != -1 && Math.Sign(item.x + item.w - (last.x + last.w)) != -1 && item.x + item.w - (last.x + last.w) < last.h + 30)
                                           .ToList();

                                if (neartext.Count() == 0)
                                {
                                    if (sortByPluseMinuse.Any())
                                    {
                                        sortByPluseMinuse.RemoveAt(sortByPluseMinuse.Count - 1);
                                    }
                                    if (snewList.Any())
                                    {
                                        snewList.RemoveAt(snewList.Count - 1);
                                    }
                                }
                                foreach (var ni in neartext)
                                {
                                    sortByPluseMinuse.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = scount, cx = ni.cx, cy = ni.cy, x = ni.x, y = ni.y, w = ni.w, h = ni.h, text = ni.text });
                                    snewList.Add(ni.GroupID);
                                }
                                if (neartext.Count() == 0)
                                {
                                    scount++;
                                }
                            }
                        }

                        StringBuilder FiWords = new StringBuilder();
                        groupedByX.RemoveAll(item => snewList.Contains(item.GroupID));
                        if (groupedByX.Count() > 0)
                        {
                            int newId = 1;
                            foreach (var i in groupedByX)
                            {
                                i.GroupID = newId++;
                                OpenCvSharp.Rect textRegionRect = new OpenCvSharp.Rect(i.x, i.y, i.w, i.h);
                                FiWords.AppendLine(i.text.ToString() + " <=> " + i.GroupID.ToString() + " <=> " + textRegionRect.ToString());
                            }
                        }
                        if (sortByPluseMinuse.Count() > 0)
                        {
                            var grouped_Y_ocrresults = sortByPluseMinuse.GroupBy(i => i.GroupID).ToList();

                            foreach (var group in grouped_Y_ocrresults)
                            {
                                var last_Gx = groupedByX.Last();
                                var last_GroupID = last_Gx.GroupID;
                                int cx, cy, nx = 0; int xx, yy, ww, hh = 0;
                                string text = string.Empty;
                                int i = 1;
                                foreach (var g in group)
                                {
                                    if (g.text.Contains("+"))
                                    {
                                        if (Regex.IsMatch(g.text, @"^\d+\s\d+(\.\d+)?(\+\.\d+)?$"))
                                        {
                                            g.text = g.text.Replace(" ", ".");
                                        }
                                    }
                                    if (g.text.Contains("-"))
                                    {
                                        if (Regex.IsMatch(g.text, @"^\d+\s\d+(\.\d+)?(\-\.\d+)?$"))
                                        {
                                            g.text = g.text.Replace(" ", ".");
                                        }
                                    }

                                    text += " " + g.text;
                                    if (group.Count() == i)
                                    {
                                        var first = group.First();
                                        cx = first.x;
                                        cy = first.y;

                                        var last = group.Last();
                                        xx = first.x;
                                        yy = first.y;
                                        ww = last.x + last.w - first.x;
                                        hh = last.h;
                                        nx = first.nx;
                                        text = text.Trim();
                                        last_GroupID++;
                                        OpenCvSharp.Rect textRegionRect = new OpenCvSharp.Rect(xx, yy, ww, hh);
                                        FiWords.AppendLine(text.ToString() + " <=> " + last_GroupID.ToString() + " <=> " + textRegionRect.ToString());
                                        groupedByX.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = last_GroupID, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = text });
                                    }
                                    i++;
                                }
                            }
                        }
                        #endregion

                        #region Large Image List the Initial items

                        List<AllinoneBalloon.Entities.Common.Item> items = new List<AllinoneBalloon.Entities.Common.Item>();
                        foreach (var i in groupedByX)
                        {
                            auto_group_ocrresults_largeimage.Add(new AllinoneBalloon.Entities.Common.AutoBalloon_OCR
                            {
                                Ocr_Text = i.text,
                                X_Axis = i.x,
                                Y_Axis = i.y,
                                Width = i.w,
                                Height = i.h,
                                Qty = 1,
                                No = i.GroupID
                            });
                            items.Add(new AllinoneBalloon.Entities.Common.Item { X = i.x, Y = i.y, W = i.w, H = i.h, Text = i.text, isBallooned = false });
                        }
                        #endregion

                        #region Large Image get Exclude boundary
                        StringBuilder FWordsSelected = new StringBuilder();
                        // int aftheight = 320;
                        int finalyaxis = 0;
                        int finalxaxis = 0;
                        int paddingy = 220;
                        int paddingx = 320;
                        var infoBox = items.Where((s) => s.Text.Contains("PRODUCTS AND TECHNOLOGY")).Select((c, i) => { return c; }).ToList();

                        if (infoBox.Count > 0)
                        {
                            var iBox = infoBox.First();
                            finalyaxis = iBox.Y + 100;
                            finalxaxis = iBox.X + 100;
                        }
                        #endregion

                        // Specify the threshold for grouping based on X coordinate
                        int thresholdX = 50;
                        // Group items based on their X coordinates
                        List<List<AllinoneBalloon.Entities.Common.Item>> groupedItems = helper.GroupItemsByX(items, thresholdX);

                        #region Large Image Filter posible balloon 
                        List<List<AllinoneBalloon.Entities.Common.Item>> currentGroup = new List<List<AllinoneBalloon.Entities.Common.Item>>();
                        foreach (var g in groupedItems)
                        {
                            foreach (var i in g)
                            {
                                if (searchForm.selectedRegion != "Selected Region" && paddingx < i.X && i.X < imagewidth - paddingx && paddingy < i.Y && i.Y < imageheight - paddingy)
                                {
                                    string txtval = helper.OcrTextOptimization(i.Text, i.X, i.Y, i.W, i.H, imagewidth, imageheight, searchForm);
                                    if (txtval != "")
                                    {
                                        if (finalyaxis > 0 && finalxaxis > 0 && i.Y > finalyaxis && i.X > finalxaxis)
                                        {
                                            continue;
                                        }
                                        // Exclude title block area: bottom 5% full width + bottom 15% right 40%
                                        {
                                            int btmStrip = Math.Max(100, (int)(imageheight * 0.05));
                                            int titleH = Math.Max(350, (int)(imageheight * 0.15));
                                            int titleX = (int)(imagewidth * 0.60);
                                            bool inBtmStrip = i.Y > imageheight - btmStrip;
                                            bool inTitleBlk = i.Y > imageheight - titleH && i.X > titleX;
                                            if (inBtmStrip || inTitleBlk)
                                            {
                                                continue;
                                            }
                                        }
                                        if (searchForm.selectedRegion == "Unselected Region")
                                        {
                                            var eBox = lstCircle.Last();
                                            float eY1axis = eBox.Bounds.Y;
                                            float eX1axis = eBox.Bounds.X;
                                            float eX2axis = eBox.Bounds.Width;
                                            float eY2axis = eBox.Bounds.Height;
                                        }
                                        i.isBallooned = true;
                                        i.Text = txtval;
                                    }
                                }
                                if (searchForm.selectedRegion == "Selected Region")
                                {
                                    string txtval = helper.OcrTextOptimization(i.Text, i.X, i.Y, i.W, i.H, imagewidth, imageheight, searchForm);
                                    if (txtval != "")
                                    {
                                        i.isBallooned = true;
                                        i.Text = txtval;
                                    }
                                }
                                // Console.WriteLine("X:  "+ i.X+" , Y:  "+i.Y+" , Text:   "+i.Text + " , isBallooned "+ i.isBallooned);
                            }
                            if (g.Any(i => i.isBallooned == true && i.Text != ""))
                            {
                                currentGroup.Add(g);
                            }
                        }
                        #endregion

                        #region Large Get active items  
                        List<AllinoneBalloon.Entities.Common.ActiveItems> activeItems = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                        int ai = 1;
                        foreach (var g in currentGroup)
                        {
                            int nh = 0;
                            int count = 1;
                            foreach (var i in g)
                            {
                                if (i.isBallooned == true)
                                {
                                    var citem = activeItems.Where(a => a.GroupID == ai).ToList();
                                    if (activeItems.Count > 0 && citem.Count() > 0)
                                    {
                                        var last = citem.Last();
                                        last.NH = nh;
                                    }
                                    nh = i.H;
                                    activeItems.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = i.X, Y = i.Y, W = i.W, H = i.H, NH = nh, Text = i.Text, isBallooned = true, GroupID = ai });
                                }
                                else
                                {
                                    nh += i.H;
                                    if (g.Count() == count)
                                    {
                                        var citem = activeItems.Where(a => a.GroupID == ai).ToList();
                                        if (activeItems.Count > 0 && citem.Count() > 0)
                                        {
                                            var last = citem.Last();
                                            last.NH = nh;
                                        }
                                    }
                                }
                                count++;
                            }
                            ai++;
                        }
                        #endregion

                        #region Large Image Sort all item Y axis based
                        var sortedItems = activeItems.OrderBy(item => item.Y).ThenBy(item => item.X).ToList();
                        #endregion

                        #region Large Image N-X items Get Filtered
                        int aId = 1;
                        List<int> NxList = new List<int>();
                        List<AllinoneBalloon.Entities.Common.ActiveItems> NxactiveItems = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                        foreach (var i in sortedItems)
                        {
                            if (i.Text.Contains("X") && Regex.IsMatch(i.Text, @"^((\d+)(?:\s|))X$"))
                            {
                                NxList.Add(i.GroupID);
                                var neartext = sortedItems
                                           .Where(item => !NxList.Contains(item.GroupID))
                                           .Where(a =>
                                                    Math.Abs(a.Y - i.Y) < 50 && Math.Abs(a.X - i.X) < 100
                                                )
                                           .ToList();
                                foreach (var ni in neartext)
                                {
                                    var maxwidth = Math.Max(ni.W, i.W);
                                    NxList.Add(ni.GroupID);
                                    NxactiveItems.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = ni.X, Y = ni.Y - i.H, W = maxwidth, H = ni.H + i.H, NH = ni.H + i.H, Text = i.Text + " " + ni.Text, isBallooned = true, GroupID = ni.GroupID });
                                }
                            }
                        }
                        if (NxactiveItems.Count() > 0)
                        {
                            sortedItems.RemoveAll(item => NxList.Contains(item.GroupID));
                            foreach (var i in NxactiveItems)
                            {
                                sortedItems.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = i.X, Y = i.Y, W = i.W, H = i.H, NH = i.NH, Text = i.Text, isBallooned = true, GroupID = i.GroupID });
                            }
                        }
                        sortedItems = sortedItems.OrderBy(item => item.Y).ThenBy(item => item.X).ToList();
                        foreach (var i in sortedItems)
                        {
                            i.GroupID = aId++;
                        }
                        #endregion

                        #region Large Image Find the parent to create sub balloon

                        List<AllinoneBalloon.Entities.Common.AGF_OCR> sortByParent = new List<AllinoneBalloon.Entities.Common.AGF_OCR>();
                        List<int> pnewList = new List<int>();
                        int gcount = 1;
                        foreach (var i in sortedItems)
                        {
                            if (!pnewList.Contains(i.GroupID))
                            {
                                sortByParent.Add(new AllinoneBalloon.Entities.Common.AGF_OCR { GroupID = gcount, parentID = 0, x = i.X, y = i.Y, w = i.W, h = i.NH, text = i.Text });
                                pnewList.Add(i.GroupID);
                            }
                            foreach (var ii in sortedItems)
                            {
                                var last = sortByParent.Last();
                                List<AllinoneBalloon.Entities.Common.ActiveItems> sortsParent = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                                sortsParent.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = ii.X, Y = ii.Y, W = ii.W, H = ii.H, NH = ii.NH, Text = ii.Text, isBallooned = true, GroupID = ii.GroupID });
                                var neartext = sortsParent
                                       .Where(item => !pnewList.Contains(item.GroupID))
                                       .Where(a =>

                                                    Math.Abs(a.Y - last.y) < 50 && Math.Abs(a.X - last.x) < 100 && Regex.IsMatch(last.text, @"^([0-9]+(:?X))+.*$")
                                                    ||
                                                    Math.Abs(a.Y - (last.y + last.h)) < 50 && last.x + last.w >= a.X && Math.Abs(last.x + last.w - (a.X + a.W)) < 100
                                            )
                                       .ToList();
                                foreach (var ni in neartext)
                                {
                                    pnewList.Add(ni.GroupID);
                                    sortByParent.Add(new AllinoneBalloon.Entities.Common.AGF_OCR { GroupID = gcount, parentID = gcount, x = ni.X, y = ni.Y, w = ni.W, h = ni.H, text = ni.Text });
                                }
                            }
                            gcount++;
                        }
                        #endregion

                        #region Large Image Final Filter

                        foreach (var i in sortByParent)
                        {
                            OpenCvSharp.Rect textRegionRect = new OpenCvSharp.Rect(i.x, i.y, i.w, i.h);
                            FWords.AppendLine(i.text + " <=> " + i.GroupID + " <=> " + textRegionRect.ToString());
                            bool subballoon = false;
                            if (i.parentID == i.GroupID)
                            {
                                subballoon = true;
                            }
                            auto_ocrresults.Add(new AllinoneBalloon.Entities.Common.AutoBalloon_OCR { parent = i.parentID, subballoon = subballoon, Ocr_Text = i.text, X_Axis = Convert.ToInt32(i.x), Y_Axis = Convert.ToInt32(i.y), Width = Convert.ToInt32(i.w), Height = Convert.ToInt32(i.h), Qty = 1, No = i.GroupID });
                        }
                        #endregion

                        objerr.WriteErrorLog(" large image filter words =>  " + FWords);

                        #endregion
                    }
                    else
                    {
                        #region Small Image Process
                        float padding = 200;
                        int smaximum = 80;
                        float originalHeight = origin.fullHeight;
                        float originalWidth = origin.fullWidth;
                        float scale = 0;
                        float widthScale = 0;
                        float heightScale = 0;
                        if (imageheight < imagewidth)
                        {
                            float sacledratio = imagewidth / imageheight;
                            widthScale = imagewidth / originalWidth;
                            heightScale = imageheight / originalHeight;
                            scale = Math.Min(widthScale, heightScale);
                            padding *= scale;
                        }
                        int processedImgW = 0, processedImgH = 0;
                        // Check PaddleOCR availability early to skip unnecessary Tesseract preprocessing
                        bool usePaddleOcr = await ShouldUsePaddleOcrAsync();
                        objerr.WriteErrorLog(" Selection " + temp);
                        if (imagewidth > smaximum || imageheight > smaximum)
                        {
                            FileInfo cfi = new FileInfo(ImageFile);
                            string cropname = Path.Combine(Path.GetTempPath(), "cropname_" + Guid.NewGuid().ToString() + cfi.Extension);
                            cropname = helper.ChangeResolutionSmall(temp, cropname, 300.0f);
                            temp = cropname;
                            if (usePaddleOcr)
                            {
                                // PaddleOCR: just get dimensions quickly
                                using (var dimImg = System.Drawing.Image.FromFile(temp))
                                {
                                    processedImgW = dimImg.Width;
                                    processedImgH = dimImg.Height;
                                }
                            }
                            else
                            {
                                // Tesseract: need full OpenCV Mat
                                image = new OpenCvSharp.Mat(temp, OpenCvSharp.ImreadModes.Color);
                                processedImgW = image.Width;
                                processedImgH = image.Height;
                            }
                            widthScale = imagewidth / (float)processedImgW;
                            heightScale = imageheight / (float)processedImgH;
                            scale = Math.Min(widthScale, heightScale);
                            padding *= scale;
                        }
                        using (var gray = new OpenCvSharp.Mat())
                        {
                            if (!usePaddleOcr && image != null)
                            {
                                Cv2.CvtColor(image, gray, ColorConversionCodes.BGR2GRAY);
                                Cv2.Threshold(gray, gray, 0, 255, ThresholdTypes.Binary | ThresholdTypes.Otsu);
                            }
                            TesseractEngine engine = usePaddleOcr ? null : new TesseractEngine(customLanguagePath, "IMSsym1", EngineMode.Default);
                            try
                            {
                            var blockPage = engine != null ? engine.Process(Pix.LoadFromFile(temp), PageSegMode.Auto) : null;
                            try
                            {
                            var iter = blockPage?.GetIterator();
                            try
                            {
                                    iter?.Begin();
                                    StringBuilder Words = new StringBuilder();
                                    int regionIndex = 0;
                                    int kk = 1;
                                    List<AutoBalloon_OCR> auto_ocrresults_selected = new List<AutoBalloon_OCR>();

                                    #region iterate small/ selected region
                                    // Pre-check: ensure PaddleOCR service is still available before entering the branch
                                    if (usePaddleOcr)
                                    {
                                        var ocrServiceCheck = await _ocrServiceFactory.GetOcrServiceAsync();
                                        if (ocrServiceCheck == null)
                                        {
                                            objerr.WriteErrorLog("AutoBalloon: PaddleOCR service became unavailable during processing, falling back to Tesseract");
                                            usePaddleOcr = false;
                                        }
                                    }
                                    if (usePaddleOcr)
                                    {
                                        // PaddleOCR path - use standard mode (multi-pass, full accuracy)
                                        var ocrService = await _ocrServiceFactory.GetOcrServiceAsync();
                                        var paddleWords = await ocrService.RecognizeWordsAsync(temp);

                                        // Apply exclusion zone filtering (skip CONFIDENTIAL text blocks)
                                        int exclW = processedImgW > 0 ? processedImgW : imagewidth;
                                        int exclH = processedImgH > 0 ? processedImgH : imageheight;
                                        paddleWords = FilterExclusionZones(paddleWords, exclW, exclH);

                                        // GD&T post-processing: merge horizontally adjacent OCR words
                                        // (e.g. "0.13" + "C" → "0.13 C" for feature control frames)
                                        if (searchForm.accurateGDT)
                                        {
                                            paddleWords = helper.MergeAdjacentGdtWords(paddleWords);
                                            objerr.WriteErrorLog($"AccurateGDT: Post-merge count={paddleWords.Count}");
                                        }

                                        foreach (var pw in paddleWords)
                                        {
                                            string regionText = pw.Text;
                                            if (string.IsNullOrWhiteSpace(regionText)) continue;

                                            int cx = pw.X, cy = pw.Y, xx = pw.X, yy = pw.Y;
                                            int ww = pw.Width, hh = pw.Height, nx = pw.X;

                                            if (searchForm.selectedRegion == "Selected Region")
                                            {
                                                var croppedRegion = lstCircle.Last();
                                                // Use already-known dimensions instead of loading OpenCV Mat per word
                                                float crw = croppedRegion.Bounds.Width;
                                                float crh = croppedRegion.Bounds.Height;
                                                decimal wsf = (decimal)crw / imagewidth;
                                                decimal hsf = (decimal)crh / imageheight;
                                                var cx1 = (int)(pw.X * wsf);
                                                var cy1 = (int)(pw.Y * hsf);
                                                cx = pw.X + (int)s_x + cx1;
                                                xx = pw.X + (int)s_x + cx1;
                                                nx = pw.X + (int)s_x + cx1;
                                                cy = pw.Y + (int)s_y + cy1;
                                                yy = pw.Y + (int)s_y + cy1;
                                                rects.Add(new AllinoneBalloon.Entities.Common.Rect { Text = regionText, X = xx, Y = yy, Width = ww, Height = hh });
                                            }
                                            else
                                            {
                                                rects.Add(new AllinoneBalloon.Entities.Common.Rect { Text = regionText, X = pw.X, Y = pw.Y, Width = pw.Width, Height = pw.Height });
                                            }

                                            auto_ocrresults_selected.Add(new AllinoneBalloon.Entities.Common.AutoBalloon_OCR { Ocr_Text = regionText, X_Axis = pw.X, Y_Axis = pw.Y, Width = pw.Width, Height = pw.Height, Qty = 1, No = kk });
                                            kk++;

                                            int cont = ag_ocrresults.Count();
                                            // Resolution-aware grouping: scale gap threshold with image size
                                            int gapThresholdX = searchForm.accurateGDT ? Math.Max(80, imagewidth / 40) : Math.Max(40, imagewidth / 80);
                                            int gapThresholdY = searchForm.accurateGDT ? Math.Max(80, imageheight / 40) : Math.Max(40, imageheight / 80);
                                            if (cont == 0)
                                            {
                                                ag_ocrresults.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                            }
                                            else
                                            {
                                                var last = ag_ocrresults.Last();
                                                var checky = xx - (last.x + last.w);
                                                bool sameGroup = false;

                                                // Standard horizontal grouping — items must be on the same text line
                                                // Check Y-center alignment: centers must be within half the max height
                                                int lastCenterY = last.y + last.h / 2;
                                                int currCenterY = yy + hh / 2;
                                                int maxItemH = Math.Max(hh, last.h);
                                                bool sameLine = Math.Abs(currCenterY - lastCenterY) < maxItemH;
                                                if (sameLine && last.x + last.w < xx && last.x < xx && checky < gapThresholdX)
                                                {
                                                    sameGroup = true;
                                                }

                                                // GD&T frame grouping: also merge if items overlap horizontally and are vertically adjacent
                                                if (!sameGroup && searchForm.accurateGDT)
                                                {
                                                    // Check if texts are in the same X range (overlapping horizontally)
                                                    bool xOverlap = (xx < last.x + last.w + gapThresholdX) && (xx + ww > last.x - gapThresholdX);
                                                    // Check if vertically adjacent (within 1.5x height)
                                                    int maxH = Math.Max(hh, last.h);
                                                    bool yAdjacent = Math.Abs(yy - (last.y + last.h)) < maxH * 2;
                                                    if (xOverlap && yAdjacent) sameGroup = true;
                                                }

                                                if (sameGroup)
                                                {
                                                    ag_ocrresults.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                                }
                                                else
                                                {
                                                    agocr++;
                                                    ag_ocrresults.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                                }
                                            }
                                            regionIndex++;
                                        }
                                        objerr.WriteErrorLog($"TIMING: ocr_done={_sw.ElapsedMilliseconds}ms, words={paddleWords.Count}");
                                    objerr.WriteErrorLog("Small/Selected Region (PaddleOCR): " + paddleWords.Count + " words");
                                    }
                                    else
                                    {
                                    // Original Tesseract do-while loop
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
                                            if (searchForm.selectedRegion != "Selected Region")
                                            {
                                                rects.Add(new AllinoneBalloon.Entities.Common.Rect { Text = regionText, X = textLineBox.X1, Y = textLineBox.Y1, Width = textLineBox.X2 - textLineBox.X1, Height = textLineBox.Y2 - textLineBox.Y1 });
                                            }
                                            Words.AppendLine(regionText + " " + textLineBox.ToString());
                                            auto_ocrresults_selected.Add(new AllinoneBalloon.Entities.Common.AutoBalloon_OCR { Ocr_Text = regionText, X_Axis = textLineBox.X1, Y_Axis = textLineBox.Y1, Width = textLineBox.X2 - textLineBox.X1, Height = textLineBox.Y2 - textLineBox.Y1, Qty = 1, No = kk });
                                            kk++;
                                            int cont = 0, cx = 0, cy = 0, xx = 0, yy = 0, ww = 0, hh = 0, nx = 0;
                                            cx = textLineBox.X1;
                                            xx = textLineBox.X1;
                                            nx = textLineBox.X1;
                                            cont = ag_ocrresults.Count();
                                            cy = textLineBox.Y1;
                                            yy = textLineBox.Y1;
                                            ww = textLineBox.X2 - textLineBox.X1;
                                            hh = textLineBox.Y2 - textLineBox.Y1;
                                            if (searchForm.selectedRegion == "Selected Region")
                                            {
                                                var croppedRegion = lstCircle.Last();
                                                var simage = new OpenCvSharp.Mat(ImageFile, OpenCvSharp.ImreadModes.Color);
                                                float cry = croppedRegion.Bounds.Y;
                                                float crx = croppedRegion.Bounds.X;
                                                float crw = croppedRegion.Bounds.Width;
                                                float crh = croppedRegion.Bounds.Height;
                                                decimal wsf = (decimal)crw / simage.Width;
                                                decimal hsf = (decimal)crh / simage.Height;
                                                var cx1 = (int)(textLineBox.X1 * wsf);
                                                var cy1 = (int)(textLineBox.Y1 * hsf);
                                                cx = textLineBox.X1 + (int)s_x + cx1;
                                                xx = textLineBox.X1 + (int)s_x + cx1;
                                                nx = textLineBox.X1 + (int)s_x + cx1;
                                                cy = textLineBox.Y1 + (int)s_y + cy1;
                                                yy = textLineBox.Y1 + (int)s_y + cy1;
                                                rects.Add(new AllinoneBalloon.Entities.Common.Rect { Text = regionText, X = xx, Y = yy, Width = ww, Height = hh });
                                            }
                                            // Resolution-aware grouping: scale gap threshold with image size
                                            int tGapX = Math.Max(40, imagewidth / 80);
                                            int tGapY = Math.Max(40, imageheight / 80);
                                            if (cont == 0)
                                            {
                                                ag_ocrresults.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                            }
                                            if (cont > 0)
                                            {
                                                var last = ag_ocrresults.Last();
                                                var checky = xx - (last.x + last.w);
                                                // Check Y-center alignment: items must be on the same text line
                                                int tLastCenterY = last.y + last.h / 2;
                                                int tCurrCenterY = yy + hh / 2;
                                                int tMaxH = Math.Max(hh, last.h);
                                                bool tSameLine = Math.Abs(tCurrCenterY - tLastCenterY) < tMaxH;
                                                if (tSameLine && last.x + last.w < xx && last.x < xx && checky < tGapX)
                                                {
                                                    ag_ocrresults.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                                }
                                                else
                                                {
                                                    agocr++;
                                                    ag_ocrresults.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = agocr, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = regionText });
                                                }
                                            }
                                            regionIndex++;
                                        }
                                    } while (iter.Next(PageIteratorLevel.Word));
                                    } // end else (Tesseract)
                                    //objerr.WriteErrorLog(" Words " + Words);
                                    if (searchForm.selectedRegion == "Selected Region")
                                    {
                                        //  objerr.WriteErrorLog(" lstCircle " + lstCircle.Last().Bounds.ToString());
                                    }
                                    #endregion

                                    #region Selected Group nearby X coordinates words
                                    List<AllinoneBalloon.Entities.Common.AG_OCR> groupedByX = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
                                    List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR> auto_group_ocrresults_selected = new List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR>();
                                    StringBuilder GxWords = new StringBuilder();
                                    if (searchForm.selectedRegion == "Full Image" || searchForm.selectedRegion == "Selected Region" || searchForm.selectedRegion == "Unselected Region")
                                    {
                                        if (rects.Count > 0)
                                        {
                                            groupedByX = helper.SmallImageRectProcess(rects);
                                            objerr.WriteErrorLog($"TIMING: text_processing={_sw.ElapsedMilliseconds}ms, grouped={groupedByX.Count}");
                                        }
                                    }
                                    else
                                    {
                                        var grouped_ocrresults = ag_ocrresults.GroupBy(i => i.GroupID).ToList();
                                        foreach (var group in grouped_ocrresults)
                                        {
                                            int cx, cy, nx = 0; int xx, yy, ww, hh = 0;
                                            string text = string.Empty;
                                            int i = 1;
                                            foreach (var g in group)
                                            {
                                                var gtext = g.text.Replace("\r\n", "").Replace("\n", "")
                                                    .Replace("═P", "");
                                                if (gtext == "P" || gtext == "═P" || gtext == "P-")
                                                {
                                                    continue;
                                                }
                                                if (Regex.IsMatch(gtext, @"^(((?:[A-Z.]+)((?:î)|(?:ë))+(?:[A-Z.,-]+)((?:î)|(?:ë))(?:[A-Z.,-]+))|(((?:î)|(?:ë))+(?:[A-Z.,-]+)((?:î)|(?:ë))(?:[A-Z.,-]+))|(((?:î)|(?:ë))+(?:[A-Z.,-]+))|((?:[A-Z.,-]+)((?:î)|(?:ë))+[.,-])|((?:[A-Z.]+)((?:î)|(?:ë))+(?:[A-Z.,-]+)((?:î)|(?:ë))+)|((?:[A-Z.]+)((?:î)|(?:ë))+(?:[A-Z.,-]+)))$"))
                                                {
                                                    gtext = gtext.Replace("ë.", "L");
                                                    gtext = gtext.Replace("ë", "I");
                                                    gtext = gtext.Replace("î", "O");
                                                }
                                                int gtcDigit = helper.CountDigits(gtext);
                                                int gtcAlpha = helper.CountAlphabetChars(gtext);
                                                int totc = gtcDigit + gtcAlpha;
                                                int totcWidth = totc * 50;
                                                int gttextLength = gtext.Length;
                                                if (gttextLength == totc && totcWidth < g.w)
                                                {
                                                    //gtext = "";
                                                }
                                                if (gtext == "7F" || gtext == "4." || gtext == "Nù." || gtext == "═ç" || gtext == "══" || gtext == "-" || gtext == "═P" || gtext == "═" || gtext == "P")
                                                {
                                                    gtext = "";
                                                }
                                                if (gttextLength == 1 && (gtext == "4" || gtext == "F"))
                                                {
                                                    continue;
                                                }
                                                // concat all grouped text
                                                text += " " + gtext;

                                                if (group.Count() == i)
                                                {
                                                    if (text.EndsWith(" - "))
                                                    {
                                                        if (text.Length > 1)
                                                        {
                                                            //  text = text.Substring(0, text.Length - 1).Trim();
                                                        }
                                                        else
                                                        {
                                                            //  text = string.Empty;
                                                        }
                                                    }
                                                    if (Regex.IsMatch(text, @"^((?:ç)(?:\s)?(?:[\-.])+(\d+)(?:\s)?(?:[A-Z]{1}))$"))
                                                    {
                                                        //  text = text.Replace("-", ".");
                                                    }
                                                    if (Regex.IsMatch(text, @"^(((?:ç)|(?:─)|)(?:\s)?(?:¡)?(?:\s)?(?:\.\d+)(?:\/)?(?:\d+?\.\d+)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?)$"))
                                                    {
                                                        //string mainValuePattern = @"^-?(([(?:¡)|(?:ç)|(?:─)|(?:\s+)]+)?([(?:\.\d+)|(?:/)|(?:\d+\.\d+)]+))?";
                                                    }

                                                    var first = group.First();
                                                    cx = first.x;
                                                    cy = first.y;
                                                    var last = group.Last();
                                                    xx = first.x;
                                                    yy = first.y;
                                                    ww = last.x + last.w - first.x;
                                                    hh = group.Max(i => i.h);
                                                    nx = first.nx;
                                                    text = text.Trim();
                                                    text = Regex.Replace(text, @"\r\n?|\n", "");
                                                    text = text.Trim();
                                                    text = text.Replace("═1-°°", "-1.00").Replace("\r\n", "").Replace("--", "");
                                                    text = text.Replace(".°", "0");
                                                    text = text
                                                        .Replace("î", "0")
                                                        .Replace("ï", "1")
                                                        .Replace("ð", "2")
                                                        .Replace("ñ", "3")
                                                        .Replace("ò", "4")
                                                        .Replace("ó", "5")
                                                        .Replace("ô", "6")
                                                        .Replace("õ", "7")
                                                        .Replace("ö", "8")
                                                        .Replace("÷", "9")
                                                        .Replace("(2)", "¡")
                                                        .Replace("(Z)", "¡")
                                                        .Replace("(:0", "¡")
                                                        .Replace("à", "¡")
                                                        ;
                                                    if (text.StartsWith("I"))
                                                    {
                                                        text = text.Substring(1);
                                                        text = text.Trim();
                                                    }
                                                    if (text.EndsWith("═"))
                                                    {
                                                        text = text.Substring(0, text.Length - 1);
                                                        text = text.Trim();
                                                    }
                                                    if (text.EndsWith("û."))
                                                    {
                                                        text = text.Substring(0, text.Length - 2);
                                                        text = text.Trim();
                                                    }
                                                    if (text.EndsWith("ç") && text.Length > 3)
                                                    {
                                                        text = text.Substring(0, text.Length - 1);
                                                        text = text.Trim();
                                                    }
                                                    if (text.EndsWith("#"))
                                                    {
                                                        text = text.Substring(0, text.Length - 1);
                                                        text = text.Trim();
                                                    }
                                                    if (Regex.IsMatch(text, @"\s+$"))
                                                    {
                                                        text = text.Trim();
                                                    }
                                                    if (Regex.IsMatch(text, @"[A-Z][0-9]{1}$"))
                                                    {
                                                        continue;
                                                    }
                                                    if (text.Trim().Length < 1)
                                                        continue;
                                                    if (Regex.IsMatch(text, @"[0-9]{1,}O$"))
                                                    {
                                                        text = text.Replace("O", "°");
                                                    }
                                                    if (Regex.IsMatch(text, @"(\d+)°(\d+)±?((\d+)|(\d+\.\d+)|(\.\d+))"))
                                                    {
                                                        text = text.Replace("°", ".");
                                                    }
                                                    if (Regex.IsMatch(text, @"^([A-Z]{1})+(\s+)+(\w+)"))
                                                    {
                                                        string[] spltxt = text.Split(" ");
                                                    }
                                                    if (text.StartsWith("(") && !text.EndsWith(")"))
                                                    {
                                                        text += ")";
                                                    }
                                                    if (!text.StartsWith("(") && text.EndsWith(")"))
                                                    {
                                                        text = "(" + text;
                                                    }
                                                    if (text.Contains("X"))
                                                    {
                                                        string[] hastext = text.Split("X");
                                                        if (hastext[0].Trim().Length > 0 && hastext[1].Trim().Length > 0 && Regex.IsMatch(text, @"^((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s|))X((?:\s|)(\d+))$"))
                                                        {
                                                            var deg = hastext[1].Trim();
                                                            if (hastext[1].Trim().Length == 3 && hastext[1].Trim().EndsWith("0"))
                                                            {
                                                                hastext[1] = string.Concat(hastext[1].AsSpan(0, hastext[1].Length - 1), "°");
                                                            }
                                                            text = hastext[0] + "X" + hastext[1];
                                                        }
                                                    }
                                                    if (text.Contains("RëGIHT") || text.Contains("RëGHT") || text.Contains("RIGHT") || text.Contains("LEFT"))
                                                    {
                                                        string[] hastext = text.Split("RëGHT");
                                                        if (hastext[0].Trim().Length > 0)
                                                        {
                                                            text = hastext[0];
                                                        }
                                                        hastext = text.Split("RëGIHT");
                                                        if (hastext[0].Trim().Length > 0)
                                                        {
                                                            text = hastext[0];
                                                        }
                                                        hastext = text.Split("RIGHT");
                                                        if (hastext[0].Trim().Length > 0)
                                                        {
                                                            text = hastext[0];
                                                        }
                                                        hastext = text.Split("LEFT");
                                                        if (hastext[0].Trim().Length > 0)
                                                        {
                                                            text = hastext[0];
                                                        }
                                                    }
                                                    if (text.Contains("SEAT") && Regex.IsMatch(text.Trim(), @"^(((\d+(?:°))(?:±)(?:\d+(?:°))(?:\s))|(?:\d+(?:°))(?:\s))(?:SEAT)$"))
                                                    {
                                                        string[] hastext = text.Split("SEAT");
                                                        if (hastext[0].Trim().Length > 0)
                                                        {
                                                            text = hastext[0].Trim();
                                                        }
                                                    }

                                                    Dictionary<string, string> replacements = new Dictionary<string, string>{
                                                    {"³-","" },
                                                    {".ë","" },
                                                    {"-³ ",""},
                                                    {"-³",""},
                                                    {"³+",""},
                                                    {"+³",""},
                                                    {".³",""},
                                                    {"³.",""},
                                                    { "-═ ",""},
                                                    { "-----",""},
                                                    { "ð","2"},
                                                    { " ±","±"},
                                                    { "à","¡"},
                                                    { "±-","±."},
                                                    { "ó","6"},
                                                    { "ç A",""},
                                                    { "-X",""},
                                                    { "B-",""},
                                                    { "- -Q- ","."},
                                                    { "APART",""},
                                                    {"û","" }
                                                    };
                                                    if (string.IsNullOrWhiteSpace(text) || text == "" || text == "  " || text == " " || text == null)
                                                    {
                                                        continue;
                                                    }
                                                    if (text.Contains(".."))
                                                    {
                                                        string[] spltxt = text.Split("..");
                                                    }
                                                    if (text.Contains("+"))
                                                    {
                                                        if (Regex.IsMatch(text, @"^\d+\s\d+(\.\d+)?(\+\.\d+)?$"))
                                                        {
                                                            text = text.Replace(" ", ".");
                                                        }
                                                    }
                                                    if (text.Contains("-"))
                                                    {
                                                        if (Regex.IsMatch(text, @"^\d+\s\d+(\.\d+)?(\-\.\d+)?$"))
                                                        {
                                                            text = text.Replace(" ", ".");
                                                        }
                                                    }
                                                    if (text.StartsWith(","))
                                                    {
                                                        text = text.Substring(1);
                                                    }
                                                    if (text.StartsWith("³"))
                                                    {
                                                        text = text.Substring(1);
                                                    }
                                                    if (text.EndsWith("³"))
                                                    {
                                                        text = text.Substring(0, text.Length - 1);
                                                    }
                                                    if (text.EndsWith(".") || text.EndsWith("û"))
                                                    {
                                                        text = text.Substring(0, text.Length - 1);
                                                    }
                                                    List<string> stringList = new List<string> { "«", "´", "Ú", "Û", "»" };
                                                    string pattern = $"({Regex.Escape(string.Join("|", stringList))})";
                                                    int matchCount = text.Count(c => stringList.Contains(c.ToString()));
                                                    if (text.StartsWith("R") && (text != "ROWS" || text != "ROW"))
                                                    {
                                                        text = text.Replace(",", ".")
                                                                   .Replace("î", "0")
                                                                   .Replace("ï", "1")
                                                                   .Replace("ð", "2")
                                                                   .Replace("ñ", "3")
                                                                   .Replace("ò", "4")
                                                                   .Replace("ó", "5")
                                                                   .Replace("ô", "6")
                                                                   .Replace("õ", "7")
                                                                   .Replace("ö", "8")
                                                                   .Replace("÷", "9");
                                                        if (text == "R.00")
                                                            text = "R.005";
                                                        // R262.9 , R262.9 Max, R262.9Min
                                                        string Rpattern = @"^(R[\d.\s]+)(:?[A-Za-z\s]+)?$";
                                                        if (Regex.IsMatch(text, Rpattern))
                                                        {
                                                            Match Rpatternmatch = Regex.Match(text, Rpattern);
                                                            if (Rpatternmatch.Success)
                                                            {
                                                                string g2 = Rpatternmatch.Groups[2].Value;
                                                                if (!Regex.IsMatch(g2, @"\b(MIN|MAX)\b"))
                                                                {
                                                                    text = Rpatternmatch.Groups[1].Value;
                                                                }
                                                            }
                                                        }
                                                    }
                                                    if (text.Contains("UNF") || text.Contains("UN"))
                                                    {
                                                        text = text.Replace("═", "-")
                                                            .Replace("2BJ", "2B")
                                                            .Replace("»", "¨")
                                                            ;
                                                    }
                                                    if (text.Contains("ë═ëë"))
                                                    {
                                                        text = text.Replace("ë═ëë", "HI");
                                                    }
                                                    foreach (var replacement in replacements)
                                                    {
                                                        text = text.Trim();
                                                    }
                                                    bool containsBracket = text.Contains("(") || text.Contains(")");
                                                    if (containsBracket)
                                                        text = text.Trim();
                                                    text = Regex.Replace(text, @"\r\n?|\n", "");
                                                    text = text.Trim();
                                                    GxWords.AppendLine(text);
                                                    groupedByX.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = g.GroupID, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = text });
                                                }
                                                i++;
                                            }
                                        }
                                        objerr.WriteErrorLog(" Groupped x axis Words " + GxWords);
                                    }
                                    #endregion

                                    if (searchForm.selectedRegion == "Full Image" || searchForm.selectedRegion == "Selected Region" || searchForm.selectedRegion == "Unselected Region")
                                    {
                                        #region Selected join the PluseMinus 
                                        List<AllinoneBalloon.Entities.Common.AG_OCR> sortByPluseMinuse = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
                                        List<int> snewList = new List<int>();
                                        int scount = 1;
                                        foreach (var i in groupedByX)
                                        {
                                            if (i.text.Contains("+"))
                                            {
                                                sortByPluseMinuse.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = scount, cx = i.cx, cy = i.cy, x = i.x, y = i.y, w = i.w, h = i.h, text = i.text });
                                                snewList.Add(i.GroupID);
                                                var last = sortByPluseMinuse.Last();
                                                var neartext = groupedByX
                                                           .Where(item => !snewList.Contains(item.GroupID))
                                                           .Where(item =>
                                                                item.text.Length > 2 && item.y - last.y < 70 && Math.Sign(item.y - last.y) != -1 && Math.Sign(item.x + item.w - (last.x + last.w)) != -1 && item.x + item.w - (last.x + last.w) < last.h + 30)
                                                           .ToList();
                                                if (neartext.Count() == 0)
                                                {
                                                    if (sortByPluseMinuse.Any())
                                                    {
                                                        sortByPluseMinuse.RemoveAt(sortByPluseMinuse.Count - 1);
                                                    }
                                                    if (snewList.Any())
                                                    {
                                                        snewList.RemoveAt(snewList.Count - 1);
                                                    }
                                                    scount++;
                                                }
                                                foreach (var ni in neartext)
                                                {
                                                    sortByPluseMinuse.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = scount, cx = ni.cx, cy = ni.cy, x = ni.x, y = ni.y, w = ni.w, h = ni.h, text = ni.text });
                                                    snewList.Add(ni.GroupID);
                                                }
                                                if (neartext.Count() > 0)
                                                {
                                                    scount++;
                                                }
                                            }
                                        }

                                        StringBuilder FiWords = new StringBuilder();
                                        groupedByX.RemoveAll(item => snewList.Contains(item.GroupID));
                                        if (groupedByX.Count() > 0)
                                        {
                                            int newId = 1;
                                            foreach (var i in groupedByX)
                                            {
                                                i.GroupID = newId++;
                                                OpenCvSharp.Rect textRegionRect = new OpenCvSharp.Rect(i.nx, i.cy, i.w, i.h);
                                                FiWords.AppendLine(i.text.ToString() + " <=> " + i.GroupID.ToString() + " <=> " + textRegionRect.ToString());
                                            }
                                        }

                                        if (sortByPluseMinuse.Count() > 0)
                                        {
                                            var grouped_PluseMinuse = sortByPluseMinuse.GroupBy(i => i.GroupID).Take(2).ToList();

                                            foreach (var group in grouped_PluseMinuse)
                                            {
                                                var last_Gx = groupedByX.Last();
                                                var last_GroupID = last_Gx.GroupID;
                                                int cx, cy, nx = 0; int xx, yy, ww, hh = 0;
                                                string text = string.Empty;
                                                int i = 1;
                                                string prefix_PluseMinuse = string.Empty;
                                                string sufix_PluseMinuse = string.Empty;
                                                foreach (var g in group)
                                                {
                                                    if (g.text.Contains("+"))
                                                    {
                                                        if (Regex.IsMatch(g.text, @"^\d+\s\d+(\.\d+)?(\+\.\d+)?$"))
                                                        {
                                                            g.text = g.text.Replace(" ", ".");
                                                        }
                                                    }
                                                    if (g.text.Contains("-"))
                                                    {
                                                        if (Regex.IsMatch(g.text, @"^\d+\s\d+(\.\d+)?(\-\.\d+)?$"))
                                                        {
                                                            g.text = g.text.Replace(" ", ".");
                                                        }
                                                    }
                                                    if (g.text.StartsWith("+"))
                                                    {
                                                        sufix_PluseMinuse = g.text;
                                                    }
                                                    else
                                                    {
                                                        prefix_PluseMinuse = g.text;
                                                    }
                                                    if (g.text.StartsWith("-"))
                                                    {
                                                        sufix_PluseMinuse = g.text;
                                                    }
                                                    else
                                                    {
                                                        prefix_PluseMinuse = g.text;
                                                    }
                                                    if (group.Count() == i)
                                                    {
                                                        text = prefix_PluseMinuse + " " + sufix_PluseMinuse;
                                                        var first = group.First();
                                                        cx = first.x;
                                                        cy = first.y;
                                                        var last = group.Last();
                                                        xx = first.x;
                                                        yy = first.y;
                                                        ww = last.x + last.w - first.x;
                                                        hh = group.Max(ii => ii.h);
                                                        nx = first.nx;
                                                        text = text.Trim();
                                                        last_GroupID++;
                                                        OpenCvSharp.Rect textRegionRect = new OpenCvSharp.Rect(xx, yy, ww, hh);
                                                        FiWords.AppendLine(text.ToString() + " <=> " + last_GroupID.ToString() + " <=> " + textRegionRect.ToString());
                                                        groupedByX.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = last_GroupID, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = text });
                                                    }
                                                    i++;
                                                }
                                            }
                                        }
                                        #endregion
                                    }

                                    #region Selected Image List the Initial items
                                    List<AllinoneBalloon.Entities.Common.Item> items = new List<AllinoneBalloon.Entities.Common.Item>();
                                    foreach (var i in groupedByX)
                                    {
                                        auto_group_ocrresults_selected.Add(new AllinoneBalloon.Entities.Common.AutoBalloon_OCR
                                        {
                                            Ocr_Text = i.text,
                                            X_Axis = i.x,
                                            Y_Axis = i.y,
                                            Width = i.w,
                                            Height = i.h,
                                            Qty = 1,
                                            No = i.GroupID
                                        });
                                        items.Add(new AllinoneBalloon.Entities.Common.Item { X = i.x, Y = i.y, W = i.w, H = i.h, Text = i.text, isBallooned = false });
                                    }
                                    #endregion

                                    #region Selected get Exclude boundary
                                    StringBuilder FWordsSelected = new StringBuilder();
                                    // int aftheight = 320;
                                    int finalyaxis = 0;
                                    int finalxaxis = 0;
                                    int paddingy = 220;
                                    int paddingx = 120;
                                    // List of words to search for
                                    var searchWords = new List<string> { "UNLESS OTHERWISE", "ESTIMATED WEIGHT", "TYPE:", "SURFACES MARKED", "FLOW AREA" };

                                    // Find all items where the Label contains any of the words
                                    var infoBox = items
                                        .Where(r => searchWords.Any(word => r.Text.ToLower().Contains(word.ToLower())))
                                        .Select((c, i) => { return c; })
                                        .ToList();
                                    //var infoBox = items.Where((s) => s.Text.ToLower().Contains("unless otherwise")).Select((c, i) => { return c; }).ToList();

                                    if (infoBox.Count > 0)
                                    {
                                        var iBox = infoBox.Last();
                                        finalyaxis = iBox.Y - 100;
                                        finalxaxis = iBox.X - 100;
                                    }
                                    #endregion

                                    #region Selected Y closest
                                    int yId = 1;
                                    int ybId = 1;
                                    List<AllinoneBalloon.Entities.Common.ActiveItems> IactiveItems = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                                    foreach (var i in items)
                                    {
                                        IactiveItems.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = i.X, Text = i.Text, Y = i.Y, W = i.W, H = i.H, NH = i.H, GroupID = ybId });
                                        ybId++;
                                    }

                                    var sortedItemsY = IactiveItems.OrderBy(item => item.Y).ToList();

                                    List<int> YList = new List<int>();
                                    List<AllinoneBalloon.Entities.Common.ActiveItems> YactiveItems = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                                    List<AllinoneBalloon.Entities.Common.ActiveItems> sortY = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                                    foreach (var i in sortedItemsY)
                                    {
                                        string text = i.Text;
                                        int X = i.X;
                                        int Y = i.Y;
                                        int W = i.W;
                                        int H = i.H;
                                        int NH = i.NH;
                                        int GroupID = i.GroupID;

                                        if (Regex.IsMatch(text, @"^(?:[A-Z\s\(\)\.\,\#\d]+)$"))
                                        {
                                            YList.Add(GroupID);
                                            sortY.Add(i);
                                            var last = sortY.Last();
                                            var neartext = sortedItemsY
                                                       .Where(item => !YList.Contains(item.GroupID))
                                                       .Where(a =>
                                                                 a.Y > last.Y + last.H
                                                            )
                                                       .ToList();
                                            foreach (var ni in neartext)
                                            {
                                                var maxwidth = Math.Max(ni.W, W);
                                                YList.Add(ni.GroupID);
                                                YactiveItems.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = ni.X, Y = ni.Y - H, W = maxwidth, H = ni.H + H, NH = ni.H + H, Text = text + " " + ni.Text, isBallooned = true, GroupID = ni.GroupID });
                                            }
                                        }
                                    }
                                    if (YactiveItems.Count() > 0)
                                    {
                                        sortedItemsY.RemoveAll(item => YList.Contains(item.GroupID));
                                        foreach (var i in YactiveItems)
                                        {
                                            sortedItemsY.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = i.X, Y = i.Y, W = i.W, H = i.H, NH = i.NH, Text = i.Text, isBallooned = true, GroupID = i.GroupID });
                                        }
                                    }
                                    sortedItemsY = sortedItemsY.OrderBy(item => item.Y).ThenBy(item => item.X).ToList();
                                    List<AllinoneBalloon.Entities.Common.Item> itemsY = new List<AllinoneBalloon.Entities.Common.Item>();
                                    foreach (var i in sortedItemsY)
                                    {
                                        i.GroupID = yId++;
                                        itemsY.Add(new AllinoneBalloon.Entities.Common.Item { X = i.X, Y = i.Y, W = i.W, H = i.H, Text = i.Text, isBallooned = false });
                                    }
                                    #endregion

                                    // Specify the threshold for grouping based on X coordinate
                                    int thresholdX = 10;

                                    // Group items based on their X coordinates
                                    items = helper.GetClosestRangeData(items, objerr);
                                    List<List<AllinoneBalloon.Entities.Common.Item>> groupedItems = helper.GroupItemsByX(items, thresholdX);

                                    #region Selected  Filter possible balloon
                                    StringBuilder FilterLog = new StringBuilder();
                                    FilterLog.AppendLine($"Filter params: paddingx={paddingx}, paddingy={paddingy}, imagewidth={imagewidth}, imageheight={imageheight}, finalxaxis={finalxaxis}, finalyaxis={finalyaxis}");
                                    List<List<AllinoneBalloon.Entities.Common.Item>> currentGroup = new List<List<AllinoneBalloon.Entities.Common.Item>>();
                                    foreach (var g in groupedItems)
                                    {
                                        foreach (var i in g)
                                        {
                                            if (searchForm.selectedRegion != "Selected Region" && paddingx < i.X && i.X < imagewidth - paddingx && paddingy < i.Y && i.Y < imageheight - paddingy)
                                            {
                                                string txtval = helper.OcrTextOptimization(i.Text, i.X, i.Y, i.W, i.H, imagewidth, imageheight, searchForm);
                                                if (txtval != "")
                                                {
                                                    if (finalyaxis != 0 && i.Y > finalyaxis)
                                                    {
                                                        FilterLog.AppendLine($"EXCLUDED(infoBox): '{i.Text}' at ({i.X},{i.Y}) below finalyaxis={finalyaxis}");
                                                        continue;
                                                    }
                                                    // Exclude title block: bottom 5% full width + bottom 15% right 40%
                                                    int bottomStrip = Math.Max(100, (int)(imageheight * 0.05));
                                                    int titleBlockHeight = Math.Max(350, (int)(imageheight * 0.15));
                                                    int titleBlockX = (int)(imagewidth * 0.60);
                                                    bool inBottomStrip = i.Y > imageheight - bottomStrip;
                                                    bool inTitleBlock = i.Y > imageheight - titleBlockHeight && i.X > titleBlockX;
                                                    if (inBottomStrip || inTitleBlock)
                                                    {
                                                        FilterLog.AppendLine($"EXCLUDED(titleBlock): '{i.Text}' at ({i.X},{i.Y}) bottomStrip={inBottomStrip} titleBlock={inTitleBlock}");
                                                        continue;
                                                    }
                                                    if (searchForm.selectedRegion == "Unselected Region")
                                                    {
                                                        var eBox = lstCircle.Last();
                                                        float eY1axis = eBox.Bounds.Y;
                                                        float eX1axis = eBox.Bounds.X;
                                                        float eX2axis = eBox.Bounds.Width + eX1axis;
                                                        float eY2axis = eBox.Bounds.Height + eY1axis;
                                                        int ix = i.X;
                                                        int iy = i.Y;
                                                        int ix2 = i.X + i.W;
                                                        int iy2 = i.Y + i.H;
                                                        if ((ix < eX2axis && ix > eX1axis || ix2 < eX2axis && ix2 > eX1axis) && (iy >= eY1axis && iy <= eY2axis || iy2 <= eY1axis && iy2 >= eY2axis))
                                                        {
                                                            continue;
                                                        }
                                                    }
                                                    FilterLog.AppendLine($"BALLOON: '{i.Text}' -> '{txtval}' at ({i.X},{i.Y})");
                                                    i.isBallooned = true;
                                                    i.Text = txtval;
                                                }
                                                else
                                                {
                                                    FilterLog.AppendLine($"EXCLUDED(OcrTextOpt empty): '{i.Text}' at ({i.X},{i.Y},{i.W},{i.H})");
                                                }
                                            }
                                            else if (searchForm.selectedRegion != "Selected Region")
                                            {
                                                FilterLog.AppendLine($"EXCLUDED(padding): '{i.Text}' at ({i.X},{i.Y}) bounds: x>{paddingx}&&x<{imagewidth - paddingx}, y>{paddingy}&&y<{imageheight - paddingy}");
                                            }
                                            if (searchForm.selectedRegion == "Selected Region")
                                            {
                                                string txtval = helper.OcrTextOptimization(i.Text, i.X, i.Y, i.W, i.H, imagewidth, imageheight, searchForm);
                                                if (txtval != "")
                                                {
                                                    i.isBallooned = true;
                                                    i.Text = txtval;
                                                    i.X = i.X;
                                                    i.W = i.W;
                                                    i.Y = i.Y;
                                                    i.H = i.H;
                                                }
                                            }
                                        }
                                        if (g.Any(i => i.isBallooned == true && i.Text != ""))
                                        {
                                            currentGroup.Add(g);
                                        }
                                    }
                                    objerr.WriteErrorLog("FILTER TRACE:\n" + FilterLog.ToString());
                                    #endregion

                                    #region Selected Get active items
                                    List<AllinoneBalloon.Entities.Common.ActiveItems> activeItems = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                                    int ai = 1;
                                    foreach (var g in currentGroup)
                                    {
                                        int nh = 0;
                                        int count = 1;
                                        foreach (var i in g)
                                        {
                                            if (i.isBallooned == true)
                                            {
                                                var citem = activeItems.Where(a => a.GroupID == ai).ToList();
                                                if (activeItems.Count > 0 && citem.Count() > 0)
                                                {
                                                    var last = citem.Last();
                                                    last.NH = nh;
                                                }
                                                nh = i.H;
                                                activeItems.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = i.X, Y = i.Y, W = i.W, H = i.H, NH = nh, Text = i.Text, isBallooned = true, GroupID = ai });
                                            }
                                            else
                                            {
                                                nh += i.H;
                                                if (g.Count() == count)
                                                {
                                                    var citem = activeItems.Where(a => a.GroupID == ai).ToList();
                                                    if (activeItems.Count > 0 && citem.Count() > 0)
                                                    {
                                                        var last = citem.Last();
                                                        last.NH += nh;
                                                        last.Y += nh;
                                                    }
                                                }
                                            }
                                            count++;
                                        }
                                        ai++;
                                    }
                                    #endregion

                                    #region Selected Sort all the item by Y
                                    var sortedItems = activeItems.OrderBy(item => item.Y).ThenBy(item => item.X).ToList();
                                    #endregion

                                    #region Selected N-X to sort items
                                    int aId = 1;
                                    int abId = 1;
                                    foreach (var i in sortedItems)
                                    {
                                        i.GroupID = abId++;
                                    }
                                    List<int> NxList = new List<int>();
                                    List<AllinoneBalloon.Entities.Common.ActiveItems> NxactiveItems = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                                    foreach (var i in sortedItems)
                                    {
                                        string text = i.Text;
                                        int X = i.X;
                                        int Y = i.Y;
                                        int W = i.W;
                                        int H = i.H;
                                        int NH = i.NH;
                                        int GroupID = i.GroupID;

                                        if (text.Contains("X") && Regex.IsMatch(text, @"^((\d+)(?:\s|))X$"))
                                        {
                                            NxList.Add(GroupID);
                                            var neartext = sortedItems
                                                       .Where(item => !NxList.Contains(item.GroupID))
                                                       .Where(a =>
                                                                Math.Abs(a.Y - (Y + H)) < 50 && Math.Abs(a.X + a.W - (X + W)) < 100
                                                            )
                                                       .ToList();
                                            foreach (var ni in neartext)
                                            {
                                                var maxwidth = Math.Max(ni.W, W);
                                                NxList.Add(ni.GroupID);
                                                NxactiveItems.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = ni.X, Y = ni.Y - H, W = maxwidth, H = ni.H + H, NH = ni.H + H, Text = text + " " + ni.Text, isBallooned = true, GroupID = ni.GroupID });
                                            }
                                        }
                                    }
                                    if (NxactiveItems.Count() > 0)
                                    {
                                        sortedItems.RemoveAll(item => NxList.Contains(item.GroupID));
                                        foreach (var i in NxactiveItems)
                                        {
                                            sortedItems.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = i.X, Y = i.Y, W = i.W, H = i.H, NH = i.NH, Text = i.Text, isBallooned = true, GroupID = i.GroupID });
                                        }
                                    }
                                    sortedItems = sortedItems.OrderBy(item => item.Y).ThenBy(item => item.X).ToList();
                                    foreach (var i in sortedItems)
                                    {
                                        i.GroupID = aId++;
                                    }
                                    #endregion

                                    #region Selected Find the parent to create sub balloon
                                    List<AllinoneBalloon.Entities.Common.AGF_OCR> sortByParent = new List<AllinoneBalloon.Entities.Common.AGF_OCR>();
                                    List<int> pnewList = new List<int>();
                                    int gcount = 1;
                                    foreach (var i in sortedItems)
                                    {
                                        if (!pnewList.Contains(i.GroupID))
                                        {
                                            sortByParent.Add(new AllinoneBalloon.Entities.Common.AGF_OCR { GroupID = gcount, parentID = 0, x = i.X, y = i.Y, w = i.W, h = i.H, text = i.Text });
                                            pnewList.Add(i.GroupID);
                                        }
                                        foreach (var ii in sortedItems)
                                        {
                                            var last = sortByParent.Last();
                                            List<AllinoneBalloon.Entities.Common.ActiveItems> sortsParent = new List<AllinoneBalloon.Entities.Common.ActiveItems>();
                                            sortsParent.Add(new AllinoneBalloon.Entities.Common.ActiveItems { X = ii.X, Y = ii.Y, W = ii.W, H = ii.H, NH = ii.NH, Text = ii.Text, isBallooned = true, GroupID = ii.GroupID });
                                            var neartext = sortsParent
                                                   .Where(item => !pnewList.Contains(item.GroupID))
                                                   .Where(a =>
                                                        Math.Abs(a.Y - (last.y + last.h)) < 50 && Math.Abs(a.X + a.W - (last.x + last.w)) < 100 && Math.Abs(a.X - last.x) < 150
                                                        ||
                                                        Math.Abs(a.Y - (last.y + last.h)) < 50 && Math.Abs(a.X + a.W - (last.x + last.w)) < 100 && Regex.IsMatch(last.text, @"^([0-9]+(:?X))+.*$")
                                                        ||
                                                        Regex.IsMatch(a.Text, @"^(((?:ç)|(?:─)|)(?:\s)?(?:¡)?(?:\s)?(?:\.\d+)(?:\/)?(?:\d+?\.\d+)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?)$") && Math.Abs(a.Y - (last.y + last.h)) < 50 && Math.Abs(last.x + last.w - (a.X + a.W)) < 100
                                                        )
                                                   .ToList();
                                            foreach (var ni in neartext)
                                            {
                                                pnewList.Add(ni.GroupID);
                                                sortByParent.Add(new AllinoneBalloon.Entities.Common.AGF_OCR { GroupID = gcount, parentID = gcount, x = ni.X, y = ni.Y, w = ni.W, h = ni.H, text = ni.Text });
                                            }
                                        }
                                        gcount++;
                                    }
                                    #endregion

                                    #region Selected Image Final filter
                                    foreach (var i in sortByParent)
                                    {
                                        bool isletonly = Regex.IsMatch(i.text, @"^[a-zA-Z]+$");
                                        if (isletonly && i.text.Length < 3)
                                        {
                                            continue;
                                        }
                                        OpenCvSharp.Rect textRegionRect = new OpenCvSharp.Rect(i.x, i.y, i.w, i.h);
                                        FWordsSelected.AppendLine(i.text + " <=> " + i.parentID + " <=> " + i.GroupID + " <=> " + textRegionRect.ToString());
                                        bool subballoon = false;
                                        if (i.parentID == i.GroupID)
                                        {
                                            subballoon = false;
                                        }
                                        if (i.text.Contains("¨"))
                                        {
                                            string[] resultss = i.text.Split("¨");
                                            for (var s = 0; s < resultss.Length; s++)
                                            {
                                                var x = i.x;
                                                if (s > 0)
                                                {
                                                    var w = i.w / i.text.Length;
                                                    var newx = resultss[s - 1].Length * w;
                                                    x = i.x + newx;
                                                    i.parentID = i.GroupID;
                                                    subballoon = false;
                                                }
                                                auto_ocrresults.Add(new AllinoneBalloon.Entities.Common.AutoBalloon_OCR { parent = 0, subballoon = subballoon, Ocr_Text = resultss[s], X_Axis = Convert.ToInt32(x), Y_Axis = Convert.ToInt32(i.y), Width = Convert.ToInt32(i.w), Height = Convert.ToInt32(i.h), Qty = 1, No = i.GroupID });
                                            }
                                        }
                                        else
                                        {
                                            auto_ocrresults.Add(new AllinoneBalloon.Entities.Common.AutoBalloon_OCR { parent = 0, subballoon = subballoon, Ocr_Text = i.text, X_Axis = Convert.ToInt32(i.x), Y_Axis = Convert.ToInt32(i.y), Width = Convert.ToInt32(i.w), Height = Convert.ToInt32(i.h), Qty = 1, No = i.GroupID });
                                        }
                                    }
                                    #endregion
                                    objerr.WriteErrorLog(" selected image filter words =>  " + FWordsSelected);
                                    objerr.WriteErrorLog($"TIMING: filter_done={_sw.ElapsedMilliseconds}ms, auto_ocrresults={auto_ocrresults.Count}");
                            }
                            finally { iter?.Dispose(); }
                            }
                            finally { blockPage?.Dispose(); }
                            }
                            finally { engine?.Dispose(); }
                        }
                        #endregion
                    }

                    long ballooncid = 1;
                    if (lstoCRResults.Count > 0)
                    {
                        ballooncid = lstoCRResults.Where(r => r.Balloon != null).Max(r => Convert.ToInt64(r.Balloon.Substring(0, r.Balloon.IndexOf('.') > 0 ? r.Balloon.IndexOf('.') : r.Balloon.Length))) + 1;
                    }
                    bool surface_finish = false;
                    bool isplmin = false;
                    string isplmin_spec = "";
                    string isplmin_pltol = "";
                    string isplmin_mintol = "";
                    var passhdr = context.TblBaloonDrawingHeaders.Where(w => w.ProductionOrderNumber == routingNo.ToString() && w.DrawingNumber == searchForm.CdrawingNo.ToString() && w.Revision == searchForm.CrevNo.ToString()).FirstOrDefault();
                    var consumedDatumNos = new HashSet<int>(); // Track datums merged into GD&T frames
                    foreach (var i in auto_ocrresults)
                    {
                        // Skip if this item was already merged into a GD&T frame
                        if (consumedDatumNos.Contains(i.No))
                        {
                            objerr.WriteErrorLog($"SKIP[consumed_datum]: '{i.Ocr_Text}' No={i.No} already merged into GD&T frame");
                            continue;
                        }
                        string ocrtext = i.Ocr_Text.Trim();
                        long ocr_X = i.X_Axis;
                        long ocr_Y = i.Y_Axis;
                        long ocr_W = i.Width;
                        long ocr_H = i.Height;

                        #region Main Balloon Filter
                        if (ocrtext.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.Length > 1 && word.All(char.IsLetter)) > 3 || Regex.IsMatch(ocrtext, @"^[^0-9]*$"))
                        {
                        }
                        else
                        {
                            if (!searchForm.accurateGDT) ocrtext = helper.ocrTextTransform(ocrtext.Trim());
                        }
                        int digitCount = helper.CountDigits(ocrtext);

                        surface_finish = false;
                        if (Regex.IsMatch(ocrtext, @"^(((?:ç)|(?:─)|)(?:\s)?(?:¡)?(?:\s)?(?:\.\d+)(?:\/)?(?:\d+?\.\d+)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?)$"))
                        {
                            surface_finish = true;
                        }
                        if (!ocrtext.Contains("BOX") && !ocrtext.Contains("X") && digitCount < 1 && !surface_finish)
                        {
                        }
                        string Min, Max, Nominal, Type1, SubType, Unit, ToleranceType, PlusTolerance, MinusTolerance;
                        CommonMethods cmt = new AllinoneBalloon.Common.CommonMethods(context, passhdr);
                        cmt.GetMinMaxValues(ocrtext.Trim(), out Min, out Max, out Nominal, out Type1, out SubType, out Unit, out ToleranceType, out PlusTolerance, out MinusTolerance);

                        object isplmincheck1 = new { isplmin = false, isplmin_spec = "", isplmin_pltol = "", isplmin_mintol = "" };
                        helper.checkedPluseMinuse(ocrtext.Trim(), out isplmincheck1);
                        Type type = isplmincheck1.GetType();
                        isplmin = (bool)type.GetProperty("isplmin").GetValue(isplmincheck1);
                        isplmin_spec = (string)type.GetProperty("isplmin_spec").GetValue(isplmincheck1);
                        isplmin_pltol = (string)type.GetProperty("isplmin_pltol").GetValue(isplmincheck1);
                        isplmin_mintol = (string)type.GetProperty("isplmin_mintol").GetValue(isplmincheck1);

                        bool isDigitPresent = ocrtext.Any(c => char.IsDigit(c));
                        string oldtext = string.Empty;
                        if (!ocrtext.Contains("BOX") && ocrtext.Contains("X") && isDigitPresent)
                        {
                            if (Regex.IsMatch(ocrtext, @"^((\.\d+)(?:\s|))X((?:\s|)(\d+))?°$"))
                            {
                                oldtext = ocrtext;
                            }
                        }
                        int Num_Qty;
                        helper.getQty(ocrtext.Trim(), out Num_Qty);

                        bool isletonly = Regex.IsMatch(ocrtext, @"^[a-zA-Z]+$");
                        List<string> stringList = new List<string> { "«", "´", "Ú", "Û", "»" };
                        // Check if the text exactly matches any item in the list
                        bool isMatch = stringList.Any(item => item.Equals(ocrtext, StringComparison.OrdinalIgnoreCase));
                        // Allow single uppercase letters (A-Z) — they may be datum refs for GD&T merge
                        bool isSingleDatum = ocrtext.Length == 1 && Regex.IsMatch(ocrtext, @"^[A-Z]$");
                        if ((ocrtext.Length <= 1 || ocrtext == "" || ocrtext == "X") && !isMatch && !isSingleDatum)
                        {
                            objerr.WriteErrorLog($"SKIP[short/empty]: '{i.Ocr_Text}' at ({ocr_X},{ocr_Y})");
                            continue;
                        }

                        // Skip common drawing labels that are not dimensions
                        string upperText = ocrtext.Trim().ToUpper();
                        var skipLabels = new HashSet<string> { "DETAIL", "DETAIL D", "DETAIL E", "DETAIL A", "DETAIL B", "DETAIL C",
                            "SECTION", "VIEW", "SCALE", "NOTE", "NOTES", "REF", "TYP", "BOTH SIDES",
                            "SEE NOTE", "SEE DETAIL", "THIS SURFACE", "MINOR", "MAJOR" };
                        if (skipLabels.Contains(upperText))
                        {
                            objerr.WriteErrorLog($"SKIP[label]: '{i.Ocr_Text}' at ({ocr_X},{ocr_Y})");
                            continue;
                        }

                        bool containsAny = stringList.Any(ocrtext.Contains);
                        if ((containsAny && Regex.IsMatch(ocrtext, @"([a-zA-Z]+)")) || (Regex.IsMatch(ocrtext, @"([¡ç\s])\1\1+")))
                        {
                            objerr.WriteErrorLog($"SKIP[special_chars]: '{i.Ocr_Text}' at ({ocr_X},{ocr_Y})");
                            continue;
                        }
                        if (Regex.IsMatch(ocrtext, @"^[a-zA-Z.]+$"))
                        {
                        }
                        if (!ocrtext.Contains("SPCL") && (ocrtext.Contains("7V") || ocrtext.Contains("çV") || ocrtext.Contains("ç") && ocrtext.Contains("°") || ocrtext.Contains("çç") || ocrtext.Contains("43X") || ocrtext.Contains("Xç") || ocrtext.Contains("///") || ocrtext.Contains("7Z") || ocrtext.Contains("ZZ") || ocrtext.Contains("J.") || ocrtext.Contains("±V") || ocrtext.Contains("Zç") || ocrtext.Contains("WV") || ocrtext.Contains("Jç") || ocrtext.Contains("1ç") || ocrtext.Contains("çE")))
                        {
                            objerr.WriteErrorLog($"SKIP[noise_pattern]: '{i.Ocr_Text}' at ({ocr_X},{ocr_Y})");
                            continue;
                        }
                        if (Num_Qty > 1)
                        {
                            // Extract dimension after quantity prefix: "4X Ø0.08" → "Ø0.08"
                            // Only strip if pattern is like "NX " (digit + X + space/dimension)
                            var qtyMatch = Regex.Match(ocrtext, @"^\d+\s*X\s*(.+)$", RegexOptions.IgnoreCase);
                            if (qtyMatch.Success)
                            {
                                ocrtext = qtyMatch.Groups[1].Value.Trim();
                            }
                        }
                        #endregion

                        AllinoneBalloon.Entities.Common.OCRResults oCRResults = new AllinoneBalloon.Entities.Common.OCRResults();
                        var Balloon = string.Empty;
                        var subBalloon = auto_ocrresults.Where(a => a.parent == i.No && a.No == i.No).ToList();
                        var parent = auto_ocrresults.Where(a => a.subballoon == false && a.parent == i.parent && a.No == i.No).ToList();
                        if (parent == null || parent.Count() == 0)
                        {
                            // Fallback: if parent lookup fails (common with PaddleOCR where parent=0),
                            // treat the item itself as a standalone parent to avoid losing valid balloons
                            if (i.subballoon == false)
                            {
                                objerr.WriteErrorLog($"RECOVER[parent_fallback]: '{i.Ocr_Text}' parent={i.parent},No={i.No} - treating as standalone");
                                parent = new List<AllinoneBalloon.Entities.Common.AutoBalloon_OCR> { i };
                            }
                            else
                            {
                                objerr.WriteErrorLog($"SKIP[no_parent]: '{i.Ocr_Text}' parent={i.parent},No={i.No} at ({ocr_X},{ocr_Y})");
                                continue;
                            }
                        }
                        bool convert = false;
                        string converted = string.Empty;
                        string iocr = i.Ocr_Text.Trim();
                        if (iocr.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.Length > 1 && word.All(char.IsLetter)) > 3 || Regex.IsMatch(iocr, @"^[^0-9]*$"))
                        {
                        }
                        else
                        {
                            string GDTpattern1 = @"^(([(?:ç)|(?:─)])+(?:\s)?(?:¡)?(?:\s)?(?:\d+?\.\d+)(?:\s)?(?:[A-Z]{1})?(?:Þ)(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ))$";
                            string GDTpattern2 = @"^([(?:ç)|(?:─)|(?:┐)|(?:┤)|(?:┬)|(?:┘)]+(?:\s+)?(?:[(?:¡)|(?:\s+)])?(?:[\d.\s]+)?(?:(\s+|[A-Z]{1}|Þ)?)+)$";
                            string GDTpattern3 = @"^(([(?:ç)|(?:─)])+(?:\s)?(?:¡)?(?:\s)?(?:\.\d+)(?:\/)?(?:\d+?\.\d+)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?)$";
                            if (Regex.IsMatch(iocr, GDTpattern1) || Regex.IsMatch(iocr, GDTpattern2) || Regex.IsMatch(iocr, GDTpattern3))
                            {
                                Dictionary<string, string> surface_replace = new Dictionary<string, string>{
                                {".","ù"},
                                {"0","î"},
                                {"1","ï"},
                                {"2","ð"},
                                {"3","ñ"},
                                {"4", "ò"},
                                {"5","ó"},
                                {"6","ô"},
                                {"7", "õ"},
                                {"8","ö" },
                                {"9","÷" },
                                {"─","û" },
                                {"¡","à" },
                                {" ","ì" },
                                { "┐","á"},
                                {"┤","ä"},
                                {"┬","æ" },
                                {"┘","ã" },
                                {"A","À" },
                                {"B","Á" },
                                {"C","Â" },
                                {"D","Ã" },
                                {"E","Ä" },
                                {"F","Å" },
                                {"G","Æ" },
                                {"H","Ç" },
                                {"I","È" },
                                {"J","É" },
                                {"K","Ê" },
                                {"L","Ë" },
                                {"M","Ì" },
                                {"N","Í" },
                                {"O","Î" }
                               };

                                foreach (var replacement in surface_replace)
                                {
                                    iocr = iocr.Replace(replacement.Value, replacement.Key);
                                }
                                iocr = iocr.Replace("ë", "").Replace("í", "");
                            }
                            Dictionary<string, object> conv = await helper.ConvertSpec(iocr);

                            convert = (bool)conv.Where(key => key.Key == "convert").FirstOrDefault().Value;
                            converted = (string)conv.Where(key => key.Key == "converted").FirstOrDefault().Value;
                        }

                        #region Clean OCR artifacts for GD&T symbols
                        // Clean common OCR misreads of GD&T symbols
                        ocrtext = Regex.Replace(ocrtext, @"^p(?=\d+\.)", "Ø");     // p0.08 → Ø0.08
                        ocrtext = Regex.Replace(ocrtext, @"^\(p(?=\d)", "⊕ Ø");   // (p0.08 → ⊕ Ø0.08
                        ocrtext = Regex.Replace(ocrtext, @"^\((?=\d)", "Ø");       // (0.08 → Ø0.08

                        // Skip balloons that are only GD&T symbols with no actual dimension value
                        if (Regex.IsMatch(ocrtext.Trim(), @"^[⊕Øçp─\(\)\s]+$"))
                        {
                            objerr.WriteErrorLog($"SKIP[gdt_symbols_only]: '{i.Ocr_Text}' at ({ocr_X},{ocr_Y})");
                            continue;
                        }

                        // For GD&T tolerances, find and append neighboring datum refs (deduplicated)
                        bool isGdtSpec = Regex.IsMatch(ocrtext, @"\d+\.\d+") &&
                            (ocrtext.Contains("Ø") || ocrtext.Contains("⊕") || ocrtext.Contains("(M") || ocrtext.Contains("(m") || ocrtext.Contains("ç"));
                        if (isGdtSpec)
                        {
                            var foundDatums = new List<string>();
                            // Only look for datums to the RIGHT of the tolerance value (datums follow the value in GD&T frames)
                            // and within same horizontal band (Y within half the text height)
                            int datumSearchW = Math.Max(200, (int)(ocr_W * 3));  // Max 3x the tolerance width
                            var nearbyDatums = auto_ocrresults
                                .Where(nb => nb.No != i.No &&
                                    !consumedDatumNos.Contains(nb.No) &&
                                    Math.Abs(nb.Y_Axis - ocr_Y) < Math.Max(40, ocr_H) &&
                                    nb.X_Axis > ocr_X &&
                                    nb.X_Axis - ocr_X < datumSearchW)
                                .OrderBy(nb => nb.X_Axis)
                                .ToList();
                            foreach (var datum in nearbyDatums)
                            {
                                string dt = (datum.Ocr_Text ?? "").Trim();
                                bool isDatumRef = (dt.Length <= 4 && Regex.IsMatch(dt, @"^[\(]?[A-Z][\(]?[Mm]?\)?\.?$")) ||
                                                  (dt.Length == 1 && Regex.IsMatch(dt, @"^[A-Z]$"));
                                if (isDatumRef && !foundDatums.Contains(dt) && foundDatums.Count < 3)
                                {
                                    foundDatums.Add(dt);
                                    consumedDatumNos.Add(datum.No);
                                    objerr.WriteErrorLog($"GDT_MERGE: found datum '{dt}' No={datum.No} near '{ocrtext}' at ({datum.X_Axis},{datum.Y_Axis})");
                                }
                            }
                            // Normalize datum text: "AM" → "A(M)", "A(M" → "A(M)"
                            for (int di = 0; di < foundDatums.Count; di++)
                            {
                                string d = foundDatums[di];
                                if (Regex.IsMatch(d, @"^[A-Z]M$")) // AM → A(M)
                                    foundDatums[di] = d[0] + "(M)";
                                else if (Regex.IsMatch(d, @"^[A-Z]\(M$")) // A(M → A(M)
                                    foundDatums[di] = d + ")";
                                else if (Regex.IsMatch(d, @"^[A-Z]\(m$")) // A(m → A(m)
                                    foundDatums[di] = d + ")";
                            }

                            // Infer missing primary datum: if we have a secondary datum like A(M)/B(M)
                            // but the gap between tolerance and datum suggests a missing cell,
                            // the most common missing datum in position tolerance is C
                            if (foundDatums.Count > 0 && nearbyDatums.Count > 0)
                            {
                                var firstDatum = nearbyDatums.First();
                                long gapX = firstDatum.X_Axis - (ocr_X + ocr_W);
                                // If gap > 50px, there's likely a missing datum cell between
                                if (gapX > 50 && !foundDatums.Contains("C") && !foundDatums.Contains("C(M)"))
                                {
                                    foundDatums.Insert(0, "C");
                                    objerr.WriteErrorLog($"GDT_INFER: inserted missing datum 'C' (gap={gapX}px between tolerance and '{firstDatum.Ocr_Text}')");
                                }
                            }

                            // Append unique datums only
                            foreach (var fd in foundDatums)
                            {
                                ocrtext = ocrtext + " " + fd;
                            }
                        }
                        #endregion

                        #region Based on Qty and sub-balloon based generate Balloons
                        byte[] imgbyt = new byte[] { 0x20 };
                        GenerateBalloon g = new GenerateBalloon();
                        g.routingNo = routingNo.ToString(); g.ImageFile = imgbyt; g.drawingNo = drawingNo; g.revNo = revNo; g.pageNo = pageNo; g.desFile = desFile;
                        g.Balloon = Balloon; g.ocrtext = ocrtext; g.Nominal = Nominal; g.Min = Min; g.Max = Max; g.searchForm = searchForm; g.ocr_X = ocr_X; g.ocr_Y = ocr_Y;
                        g.ocr_W = ocr_W; g.ocr_H = ocr_H; g.Type = Type1; g.SubType = SubType; g.Unit = Unit; g.Num_Qty = Num_Qty; g.ToleranceType = ToleranceType;
                        g.PlusTolerance = PlusTolerance; g.MinusTolerance = MinusTolerance; g.isplmin = isplmin; g.isplmin_mintol = isplmin_mintol; g.isplmin_pltol = isplmin_pltol; g.isplmin_spec = isplmin_spec;
                        g.convert = convert; g.converted = converted; g.BalloonShape = searchForm.Settings.BalloonShape;
                        if (Num_Qty == 1 && subBalloon.Count() == 0)
                        {
                            Balloon = Convert.ToString(ballooncid);
                            g.Balloon = Balloon;
                            oCRResults = helper.balloonProcess(g, username);
                            lstoCRResults.Add(oCRResults);
                        }
                        if (Num_Qty == 1 && subBalloon.Count() > 0)
                        {
                            Balloon = Convert.ToString(string.Join(".", ballooncid, 1));
                            g.Balloon = Balloon;
                            oCRResults = helper.balloonProcess(g, username);
                            lstoCRResults.Add(oCRResults);
                            // sub Balloon process
                            long sb = 2;
                            foreach (var ii in subBalloon)
                            {
                                string ocrtext1 = ii.Ocr_Text;
                                long ocr_X1 = ii.X_Axis;
                                long ocr_Y1 = ii.Y_Axis;
                                long ocr_W1 = ii.Width;
                                long ocr_H1 = ii.Height;
                                var sBalloon = string.Empty;
                                surface_finish = false;

                                if (!searchForm.accurateGDT) ocrtext1 = helper.ocrTextTransform(ocrtext1.Trim());

                                if (Regex.IsMatch(ocrtext1, @"^(((?:ç)|(?:─)|)(?:\s)?(?:¡)?(?:\s)?(?:\.\d+)(?:\/)?(?:\d+?\.\d+)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?)$"))
                                {
                                    surface_finish = true;
                                }

                                string Min1, Max1, Nominal1, Type11, SubType1, Unit1, ToleranceType1, PlusTolerance1, MinusTolerance1;
                                cmt.GetMinMaxValues(ocrtext1.Trim(), out Min1, out Max1, out Nominal1, out Type11, out SubType1, out Unit1, out ToleranceType1, out PlusTolerance1, out MinusTolerance1);
                                bool isplmin11 = false;
                                string isplmin_spec11 = "";
                                string isplmin_pltol11 = "";
                                string isplmin_mintol11 = "";
                                object isplmincheck11 = new { isplmin = false, isplmin_spec = "", isplmin_pltol = "", isplmin_mintol = "" };
                                helper.checkedPluseMinuse(ocrtext1.Trim(), out isplmincheck11);
                                Type type1 = isplmincheck11.GetType();
                                isplmin11 = (bool)type1.GetProperty("isplmin").GetValue(isplmincheck11);
                                isplmin_spec11 = (string)type1.GetProperty("isplmin_spec").GetValue(isplmincheck11);
                                isplmin_pltol11 = (string)type1.GetProperty("isplmin_pltol").GetValue(isplmincheck11);
                                isplmin_mintol11 = (string)type1.GetProperty("isplmin_mintol").GetValue(isplmincheck11);

                                bool isDigitPresent1 = ocrtext1.Any(c => char.IsDigit(c));
                                string oldtext1 = string.Empty;
                                if (!ocrtext1.Contains("BOX") && ocrtext1.Contains("X") && isDigitPresent1)
                                {
                                    if (Regex.IsMatch(ocrtext1, @"^((\.\d+)(?:\s|))X((?:\s|)(\d+))?°$"))
                                    {
                                        oldtext1 = ocrtext1;
                                    }
                                }
                                int Num_Qty1;
                                helper.getQty(ocrtext1.Trim(), out Num_Qty1);

                                bool isletonly1 = Regex.IsMatch(ocrtext, @"^[a-zA-Z]+$");
                                List<string> stringList1 = new List<string> { "«", "´", "Ú", "Û", "»" };
                                // Check if the text exactly matches any item in the list
                                bool isMatch1 = stringList.Any(item => item.Equals(ocrtext1, StringComparison.OrdinalIgnoreCase));
                                if ((isletonly1 || ocrtext1.Length <= 1 || ocrtext1 == "" || ocrtext1 == "X") && !isMatch1)
                                {
                                    continue;
                                }
                                if (Regex.IsMatch(ocrtext1, @"^[a-zA-Z.]+$"))
                                {
                                    continue;
                                }
                                if (!ocrtext1.Contains("SPCL") && (ocrtext1.Contains("7V") || ocrtext1.Contains("çV") || ocrtext1.Contains("ç") && ocrtext1.Contains("°") || ocrtext1.Contains("çç") || ocrtext1.Contains("43X") || ocrtext1.Contains("Xç") || ocrtext1.Contains("///") || ocrtext1.Contains("7Z") || ocrtext1.Contains("ZZ") || ocrtext1.Contains("J.") || ocrtext1.Contains("±V") || ocrtext1.Contains("Zç") || ocrtext1.Contains("WV") || ocrtext1.Contains("Jç") || ocrtext1.Contains("1ç") || ocrtext1.Contains("çE")))
                                {
                                    continue;
                                }
                                sBalloon = Convert.ToString(string.Join(".", ballooncid, sb));

                                g.Balloon = sBalloon; g.ocrtext = ocrtext1; g.Nominal = Nominal1; g.Min = Min1; g.Max = Max1; g.searchForm = searchForm; g.ocr_X = ocr_X1; g.ocr_Y = ocr_Y1;
                                g.ocr_W = ocr_W1; g.ocr_H = ocr_H1; g.Type = Type11; g.SubType = SubType1; g.Unit = Unit1; g.Num_Qty = Num_Qty1; g.ToleranceType = ToleranceType1;
                                g.PlusTolerance = PlusTolerance1; g.MinusTolerance = MinusTolerance1; g.isplmin = isplmin11; g.isplmin_mintol = isplmin_mintol11; g.isplmin_pltol = isplmin_pltol11; g.isplmin_spec = isplmin_spec11;

                                oCRResults = helper.balloonProcess(g, username);
                                lstoCRResults.Add(oCRResults);
                                sb++;
                            }
                        }
                        if (Num_Qty > 1 && subBalloon.Count() == 0)
                        {
                            for (var qi = 1; qi <= Num_Qty; qi++)
                            {
                                if (qi > maxBalloonQty) { break; }
                                Balloon = Convert.ToString(string.Join(".", ballooncid, qi));
                                g.Balloon = Balloon;
                                oCRResults = helper.balloonProcess(g, username);
                                lstoCRResults.Add(oCRResults);
                            }
                        }
                        if (Num_Qty > 1 && subBalloon.Count() > 0)
                        {
                            for (var qi = 1; qi <= Num_Qty; qi++)
                            {
                                if (qi > maxBalloonQty) { break; }
                                Balloon = Convert.ToString(string.Join(".", ballooncid, qi));

                                g.Balloon = Balloon;

                                oCRResults = helper.balloonProcess(g, username);
                                lstoCRResults.Add(oCRResults);
                                long sb = 1;
                                foreach (var ii in subBalloon)
                                {
                                    string ocrtext1 = ii.Ocr_Text;
                                    long ocr_X1 = ii.X_Axis;
                                    long ocr_Y1 = ii.Y_Axis;
                                    long ocr_W1 = ii.Width;
                                    long ocr_H1 = ii.Height;
                                    var sBalloon = string.Empty;
                                    surface_finish = false;

                                    if (!searchForm.accurateGDT) ocrtext1 = helper.ocrTextTransform(ocrtext1.Trim());

                                    if (Regex.IsMatch(ocrtext1, @"^(((?:ç)|(?:─)|)(?:\s)?(?:¡)?(?:\s)?(?:\.\d+)(?:\/)?(?:\d+?\.\d+)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?)$"))
                                    {
                                        surface_finish = true;
                                    }

                                    string Min1, Max1, Nominal1, Type11, SubType1, Unit1, ToleranceType1, PlusTolerance1, MinusTolerance1;
                                    cmt.GetMinMaxValues(ocrtext1.Trim(), out Min1, out Max1, out Nominal1, out Type11, out SubType1, out Unit1, out ToleranceType1, out PlusTolerance1, out MinusTolerance1);
                                    bool isplmin11 = false;
                                    string isplmin_spec11 = "";
                                    string isplmin_pltol11 = "";
                                    string isplmin_mintol11 = "";
                                    object isplmincheck11 = new { isplmin = false, isplmin_spec = "", isplmin_pltol = "", isplmin_mintol = "" };
                                    helper.checkedPluseMinuse(ocrtext1.Trim(), out isplmincheck11);
                                    Type type1 = isplmincheck11.GetType();
                                    isplmin11 = (bool)type1.GetProperty("isplmin").GetValue(isplmincheck11);
                                    isplmin_spec11 = (string)type1.GetProperty("isplmin_spec").GetValue(isplmincheck11);
                                    isplmin_pltol11 = (string)type1.GetProperty("isplmin_pltol").GetValue(isplmincheck11);
                                    isplmin_mintol11 = (string)type1.GetProperty("isplmin_mintol").GetValue(isplmincheck11);

                                    bool isDigitPresent1 = ocrtext1.Any(c => char.IsDigit(c));
                                    string oldtext1 = string.Empty;
                                    if (!ocrtext1.Contains("BOX") && ocrtext1.Contains("X") && isDigitPresent1)
                                    {
                                        if (Regex.IsMatch(ocrtext1, @"^((\.\d+)(?:\s|))X((?:\s|)(\d+))?°$"))
                                        {
                                            oldtext1 = ocrtext1;
                                        }
                                    }
                                    int Num_Qty1;
                                    helper.getQty(ocrtext1.Trim(), out Num_Qty1);

                                    bool isletonly1 = Regex.IsMatch(ocrtext, @"^[a-zA-Z]+$");
                                    List<string> stringList1 = new List<string> { "«", "´", "Ú", "Û", "»" };
                                    // Check if the text exactly matches any item in the list
                                    bool isMatch1 = stringList.Any(item => item.Equals(ocrtext1, StringComparison.OrdinalIgnoreCase));
                                    if ((isletonly1 || ocrtext1.Length <= 1 || ocrtext1 == "" || ocrtext1 == "X") && !isMatch1)
                                    {
                                        continue;
                                    }
                                    if (Regex.IsMatch(ocrtext1, @"^[a-zA-Z.]+$"))
                                    {
                                        continue;
                                    }
                                    if (!ocrtext1.Contains("SPCL") && (ocrtext1.Contains("7V") || ocrtext1.Contains("çV") || ocrtext1.Contains("ç") && ocrtext1.Contains("°") || ocrtext1.Contains("çç") || ocrtext1.Contains("43X") || ocrtext1.Contains("Xç") || ocrtext1.Contains("///") || ocrtext1.Contains("7Z") || ocrtext1.Contains("ZZ") || ocrtext1.Contains("J.") || ocrtext1.Contains("±V") || ocrtext1.Contains("Zç") || ocrtext1.Contains("WV") || ocrtext1.Contains("Jç") || ocrtext1.Contains("1ç") || ocrtext1.Contains("çE")))
                                    {
                                        continue;
                                    }
                                    sBalloon = Convert.ToString(string.Join(".", Balloon, sb));

                                    g.Balloon = sBalloon; g.ocrtext = ocrtext1; g.Nominal = Nominal1; g.Min = Min1; g.Max = Max1; g.searchForm = searchForm; g.ocr_X = ocr_X1; g.ocr_Y = ocr_Y1;
                                    g.ocr_W = ocr_W1; g.ocr_H = ocr_H1; g.Type = Type11; g.SubType = SubType1; g.Unit = Unit1; g.Num_Qty = Num_Qty1; g.ToleranceType = ToleranceType1;
                                    g.PlusTolerance = PlusTolerance1; g.MinusTolerance = MinusTolerance1; g.isplmin = isplmin11; g.isplmin_mintol = isplmin_mintol11; g.isplmin_pltol = isplmin_pltol11; g.isplmin_spec = isplmin_spec11;

                                    oCRResults = helper.balloonProcess(g, username);
                                    lstoCRResults.Add(oCRResults);
                                    sb++;
                                }
                            }
                        }
                        #endregion
                        ballooncid++;
                    }

                    if (searchForm.selectedRegion == "Selected Region")
                    {
                        System.IO.File.Delete(temp);
                    }
                    System.IO.File.Delete(processImageFile);
                    System.IO.File.Delete(ImageFile);

                    // Remove duplicate/overlapping balloons
                    int dedupThreshold = 30;
                    var dedupedResults = new List<AllinoneBalloon.Entities.Common.OCRResults>();
                    foreach (var balloon in lstoCRResults)
                    {
                        bool isDuplicate = dedupedResults.Any(existing =>
                            Math.Abs(Convert.ToInt32(existing.Circle_X_Axis) - Convert.ToInt32(balloon.Circle_X_Axis)) < dedupThreshold &&
                            Math.Abs(Convert.ToInt32(existing.Circle_Y_Axis) - Convert.ToInt32(balloon.Circle_Y_Axis)) < dedupThreshold
                        );
                        if (!isDuplicate)
                            dedupedResults.Add(balloon);
                        else
                            objerr.WriteErrorLog($"DEDUP: removed '{balloon.Spec}' at ({balloon.Circle_X_Axis},{balloon.Circle_Y_Axis})");
                    }

                    // Re-number balloons after dedup
                    // Use a mapping from old parent number to new parent number
                    // so sub-balloons stay correctly associated with their parent
                    long reNum = 1;
                    var parentMap = new Dictionary<string, string>();
                    foreach (var b in dedupedResults)
                    {
                        string oldBalloon = b.Balloon;
                        if (oldBalloon != null && oldBalloon.Contains("."))
                        {
                            // Sub-balloon: look up old parent's new number
                            string oldParent = oldBalloon.Substring(0, oldBalloon.IndexOf('.'));
                            string suffix = oldBalloon.Substring(oldBalloon.IndexOf('.'));
                            if (parentMap.ContainsKey(oldParent))
                            {
                                b.Balloon = parentMap[oldParent] + suffix;
                            }
                            else
                            {
                                // Orphan sub-balloon (parent was deduped): assign new parent
                                parentMap[oldParent] = reNum.ToString();
                                b.Balloon = reNum.ToString() + suffix;
                                reNum++;
                            }
                        }
                        else
                        {
                            // Parent balloon: record old-to-new mapping
                            parentMap[oldBalloon] = reNum.ToString();
                            b.Balloon = reNum.ToString();
                            reNum++;
                        }
                    }

                    objerr.WriteErrorLog($"TIMING: total={_sw.ElapsedMilliseconds}ms, balloons={dedupedResults.Count} (removed {lstoCRResults.Count - dedupedResults.Count} duplicates)");
                    _sw.Stop();
                    returnObject = dedupedResults;
                }
                catch (Exception ex)
                {
                    objerr.WriteErrorToText(ex);
                    returnObject = new List<object>();
                }
                return await Task.Run(() =>
                {
                    return StatusCode(StatusCodes.Status200OK, returnObject);
                });
            }
        }

    }
}

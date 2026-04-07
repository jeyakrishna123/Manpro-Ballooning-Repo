using AllinoneBalloon.Models;
using Newtonsoft.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using static AllinoneBalloon.Entities.Common;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Header CRUD operation
        public async Task<bool> CreateHeader(DimTestContext _dbcontext, CreateHeader ch)
        {
            await Task.Run(() =>
            {
                var hdrtable = _dbcontext.TblBaloonDrawingHeaders;
                TblBaloonDrawingHeader tblhdr = new TblBaloonDrawingHeader();
                tblhdr.DrawingNumber = ch.DrawingNo;
                tblhdr.Revision = ch.RevisionNo;
                tblhdr.ProductionOrderNumber = ch.Routerno;
                tblhdr.Quantity = ch.Quantity;
                tblhdr.Part_Revision = "N/A";
                tblhdr.Total_Page_No = ch.Total;
                tblhdr.RotateProperties = ch.rotate;
                tblhdr.CreatedDate = DateTime.Now;
                tblhdr.ModifiedDate = DateTime.Now;
                tblhdr.CreatedBy = ch.UserName;
                tblhdr.ModifiedBy = ch.UserName;
                tblhdr.GroupId = ch.GroupId;
                tblhdr.FilePath = ch.FilePath;
                hdrtable.Add(tblhdr);
                _dbcontext.SaveChanges();
            });
            return true;
        }
        public async Task<bool> UpdateHeader(DimTestContext _dbcontext, CreateHeader ch, TblBaloonDrawingHeader hdr)
        {
            await Task.Run(() =>
            {
                hdr.ModifiedDate = DateTime.Now;
                hdr.Quantity = ch.Quantity;
                hdr.ModifiedBy = ch.UserName;
                hdr.Total_Page_No = ch.Total;
                hdr.RotateProperties = ch.rotate;
                _dbcontext.SaveChanges();
            });
            return true;
        }

        #endregion

        #region Liner CRUD operation
        public async Task<bool> RemoveOldLiner(DimTestContext _dbcontext, CreateBalloon searchForm, TblBaloonDrawingHeader hdr)
        {
            await Task.Run(() =>
            {
                var lnritems = _dbcontext.TblBaloonDrawingLiners.Where(w => w.DrawingNumber == searchForm.drawingNo.ToString() && w.Revision == searchForm.revNo.ToString()).Count();
                if (lnritems > 0)
                {
                    List<TblBaloonDrawingLiner> rList = _dbcontext.TblBaloonDrawingLiners.Where(w => w.DrawingNumber == searchForm.drawingNo.ToString() && w.Revision == searchForm.revNo.ToString()).ToList();
                    _dbcontext.TblBaloonDrawingLiners.RemoveRange(rList);
                    _dbcontext.SaveChanges();
                }
                hdr.RotateProperties = searchForm.rotate;
                _dbcontext.SaveChanges();
            });
            return true;
        }

        public async Task<bool> SaveLiner(DimTestContext _dbcontext, CreateBalloon searchForm, long hdrid)
        {
            await Task.Run(() =>
            {
                List<OCRResults> lstoCRResults = searchForm.ballonDetails;
                List<TblBaloonDrawingLiner> lnr = new List<TblBaloonDrawingLiner>();
                foreach (var i in lstoCRResults)
                {
                    byte[] imgbyt = new byte[] { 0x20 };
                    lnr.Add(new TblBaloonDrawingLiner
                    {
                        BaloonDrwID = hdrid,
                        BaloonDrwFileID = i.BaloonDrwFileID,
                        ProductionOrderNumber = i.ProductionOrderNumber,
                        Part_Revision = i.Part_Revision,
                        Page_No = i.Page_No,
                        DrawingNumber = i.DrawingNumber,
                        Revision = i.Revision,
                        Balloon = i.Balloon,
                        Spec = i.Spec,
                        Nominal = i.Nominal,
                        Minimum = i.Minimum,
                        Maximum = i.Maximum,
                        MeasuredBy = i.MeasuredBy,
                        MeasuredOn = i.MeasuredOn,
                        Measure_X_Axis = i.Measure_X_Axis,
                        Measure_Y_Axis = i.Measure_Y_Axis,
                        Circle_X_Axis = i.Circle_X_Axis,
                        Circle_Y_Axis = i.Circle_Y_Axis,
                        Circle_Width = i.Circle_Width,
                        Circle_Height = i.Circle_Height,
                        Balloon_Thickness = i.Balloon_Thickness,
                        Balloon_Text_FontSize = i.Balloon_Text_FontSize,
                        BalloonShape = i.BalloonShape,
                        ZoomFactor = i.ZoomFactor,
                        Crop_X_Axis = i.Crop_X_Axis,
                        Crop_Y_Axis = i.Crop_Y_Axis,
                        Crop_Width = i.Crop_Width,
                        Crop_Height = i.Crop_Height,
                        Type = i.Type,
                        SubType = i.SubType,
                        Unit = i.Unit,
                        Characteristics = i.Characteristics,
                        Quantity = i.Quantity,
                        ToleranceType = i.ToleranceType,
                        PlusTolerance = i.PlusTolerance,
                        MinusTolerance = i.MinusTolerance,
                        MinTolerance = i.MinTolerance,
                        MaxTolerance = i.MaxTolerance,
                        convert = i.convert,
                        converted = i.converted,
                        CropImage = imgbyt,
                        CreatedBy = i.CreatedBy,
                        CreatedDate = i.CreatedDate,
                        ModifiedBy = i.ModifiedBy,
                        ModifiedDate = i.ModifiedDate,
                        IsCritical = i.IsCritical
                    });
                }
                _dbcontext.TblBaloonDrawingLiners.AddRange(lnr);
                _dbcontext.SaveChanges();
            });
            return true;
        }
        public async Task<List<OCRResults>> GetLiner(DimTestContext _dbcontext, string drawno, string revno, string Routerno, long hdrid, long groupId)
        {
            return await Task.Run(() =>
            {
                List<OCRResults> results = new List<OCRResults>();
                if (drawno != "" && revno != "")
                {
                    var hdr = _dbcontext.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == Routerno.ToString() && w.DrawingNumber == drawno.ToString() && w.Revision == revno.ToString()).FirstOrDefault();
                    if (hdr != null)
                    {
                        results = (from h in _dbcontext.TblBaloonDrawingHeaders

                                   join l in _dbcontext.TblBaloonDrawingLiners
                                     on new { ProductionOrderNumber = "N/A", h.DrawingNumber, h.Revision } equals new { l.ProductionOrderNumber, l.DrawingNumber, l.Revision }
                                   join d in _dbcontext.TblDimensionInputLiners
                                    on new { BaloonDrwID = hdrid, Balloon = l.Balloon, Page_No = l.Page_No } equals new { BaloonDrwID = (long)d.BaloonDrwID, Balloon = d.Balloon, Page_No = d.Page_No }
                                   where (h.BaloonDrwID == hdrid && h.ProductionOrderNumber == Routerno.ToString() && h.DrawingNumber == drawno.ToString() && h.Revision == revno.ToString())
                                   select new OCRResults
                                   {
                                       BaloonDrwID = (long)l.BaloonDrwID,
                                       BaloonDrwFileID = l.BaloonDrwFileID,
                                       ProductionOrderNumber = l.ProductionOrderNumber,
                                       Part_Revision = l.Part_Revision,
                                       Page_No = (int)l.Page_No,
                                       DrawingNumber = l.DrawingNumber,
                                       Revision = l.Revision,
                                       Balloon = l.Balloon,
                                       Spec = l.Spec,
                                       Nominal = l.Nominal,
                                       Minimum = l.Minimum,
                                       Maximum = l.Maximum,
                                       MeasuredBy = l.MeasuredBy,
                                       MeasuredOn = (DateTime)l.MeasuredOn,
                                       Measure_X_Axis = (int)l.Measure_X_Axis,
                                       Measure_Y_Axis = (int)l.Measure_Y_Axis,
                                       Circle_X_Axis = (int)l.Circle_X_Axis,
                                       Circle_Y_Axis = (int)l.Circle_Y_Axis,
                                       Circle_Width = (int)l.Circle_Width,
                                       Circle_Height = (int)l.Circle_Height,
                                       Balloon_Thickness = (int)l.Balloon_Thickness,
                                       Balloon_Text_FontSize = (int)l.Balloon_Text_FontSize,
                                       BalloonShape = l.BalloonShape,
                                       ZoomFactor = (int)l.ZoomFactor,
                                       Crop_X_Axis = (int)l.Crop_X_Axis,
                                       Crop_Y_Axis = (int)l.Crop_Y_Axis,
                                       Crop_Width = (int)l.Crop_Width,
                                       Crop_Height = (int)l.Crop_Height,
                                       Type = l.Type,
                                       SubType = l.SubType,
                                       Unit = l.Unit,
                                       Serial_No = string.Empty,
                                       Quantity = (int)l.Quantity,
                                       ToleranceType = l.ToleranceType,
                                       PlusTolerance = l.PlusTolerance,
                                       MinusTolerance = l.MinusTolerance,
                                       MaxTolerance = l.MaxTolerance,
                                       MinTolerance = l.MinTolerance,
                                       CropImage = l.CropImage,
                                       CreatedBy = l.CreatedBy,
                                       CreatedDate = (DateTime)l.CreatedDate,
                                       ModifiedBy = l.ModifiedBy,
                                       ModifiedDate = (DateTime)l.ModifiedDate,
                                       IsCritical = l.IsCritical,
                                       Actual = string.Empty,
                                       Decision = string.Empty,
                                       BalloonColor = string.Empty,
                                       Characteristics = l.Characteristics,
                                       isSaved = true,
                                       convert = (bool)l.convert,
                                       converted = l.converted,
                                       ActualDecision = AllinoneBalloon.Common.Helper.combineActual(d.Actual_OP, d.Actual_LI, d.Actual_FI),
                                       id = string.Empty,
                                       x = (int)l.Crop_X_Axis,
                                       y = (int)l.Crop_Y_Axis,
                                       width = (int)l.Crop_Width,
                                       height = (int)l.Crop_Height,
                                       selectedRegion = string.Empty,
                                       isballooned = true,
                                   }).ToList();
                    }
                }
                return results;
            });
        }

        #endregion

        #region Settings CRUD Operation

        public async Task<bool> CreateSettings(DimTestContext _dbcontext, AllinoneBalloon.Models.Settings settings, long hdrid)
        {
            var settingtable = _dbcontext.TblBaloonDrawingSettings;
            await Task.Run(() =>
            {
                try
                {
                    TblBaloonDrawingSetting setting = new TblBaloonDrawingSetting();
                    setting.DefaultBalloon = settings.DefaultBalloon;
                    setting.ErrorBalloon = settings.ErrorBalloon;
                    setting.SuccessBalloon = settings.SuccessBalloon;
                    setting.BalloonShape = settings.BalloonShape;
                    setting.MinMaxOneDigit = settings.MinMaxOneDigit;
                    setting.MinMaxTwoDigit = settings.MinMaxTwoDigit;
                    setting.MinMaxThreeDigit = settings.MinMaxThreeDigit;
                    setting.MinMaxFourDigit = settings.MinMaxFourDigit;
                    setting.MinMaxAngles = settings.MinMaxAngles;
                    setting.convert = settings.convert;
                    setting.fontScale = settings.fontScale;
                    setting.BaloonDrwId = hdrid;
                    settingtable.Add(setting);
                    _dbcontext.SaveChanges();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("----------------- Error Start -------------------");
                    Console.WriteLine(string.Concat(ex.StackTrace, ex.Message));
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine("Inner Exception");
                        Console.WriteLine(string.Concat(ex.InnerException.StackTrace, ex.InnerException.Message));
                    }
                    Console.WriteLine("----------------- Error End -------------------");
                }
            });
            return true;
        }
        public async Task<bool> UpdateSettings(DimTestContext _dbcontext, AllinoneBalloon.Models.Settings settings, TblBaloonDrawingSetting snew, long hdrid, bool convert = true)
        {
            await Task.Run(() =>
            {
                try
                {
                    snew.DefaultBalloon = settings.DefaultBalloon;
                    snew.ErrorBalloon = settings.ErrorBalloon;
                    snew.BalloonShape = settings.BalloonShape;
                    snew.MinMaxOneDigit = settings.MinMaxOneDigit;
                    snew.MinMaxTwoDigit = settings.MinMaxTwoDigit;
                    snew.MinMaxThreeDigit = settings.MinMaxThreeDigit;
                    snew.MinMaxFourDigit = settings.MinMaxFourDigit;
                    snew.MinMaxAngles = settings.MinMaxAngles;
                    if (convert)
                    {
                        snew.convert = settings.convert;
                        snew.fontScale = settings.fontScale;
                    }
                    snew.BaloonDrwId = hdrid;
                    _dbcontext.SaveChanges();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("----------------- Error Start -------------------");
                    Console.WriteLine(string.Concat(ex.StackTrace, ex.Message));
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine("Inner Exception");
                        Console.WriteLine(string.Concat(ex.InnerException.StackTrace, ex.InnerException.Message));
                    }
                    Console.WriteLine("----------------- Error End -------------------");
                }
            });
            return true;
        }

        #endregion

        #region Actual Input CRUD Operation

        public static List<Dictionary<string, Dictionary<string, string>>> combineActual(string list_Op, string list_Li, string list_Final)
        {
            List<Dictionary<string, string>> listOp = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(list_Op, new JsonSerializerSettings { PreserveReferencesHandling = PreserveReferencesHandling.Objects });
            List<Dictionary<string, string>> listLi = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(list_Li, new JsonSerializerSettings { PreserveReferencesHandling = PreserveReferencesHandling.Objects });
            List<Dictionary<string, string>> listFinal = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(list_Final, new JsonSerializerSettings { PreserveReferencesHandling = PreserveReferencesHandling.Objects });
            var combinedList = listOp.Zip(listLi, (op, li) => new { op, li })
                                 .Zip(listFinal, (temp, final) => new Dictionary<string, Dictionary<string, string>>
                                 {
                                         { "OP", temp.op },
                                         { "LI", temp.li },
                                         { "Final", final }
                                 })
                                 .ToList();
            return combinedList;
        }

        public async Task<bool> SaveDimensionInput(DimTestContext _dbcontext, CreateBalloon searchForm, long hdrid)
        {
            await Task.Run(() =>
            {
                List<OCRResults> lstoCRResults = searchForm.ballonDetails;
                List<TblDimensionInputLiner> dlnr = new List<TblDimensionInputLiner>();
                foreach (var i in lstoCRResults)
                {
                    List<Dictionary<string, Dictionary<string, string>>> ActualDecision = i.ActualDecision.ToList();
                    var options = new JsonSerializerOptions
                    {
                        ReferenceHandler = ReferenceHandler.Preserve,
                        WriteIndented = true
                    };
                    string jsonData = System.Text.Json.JsonSerializer.Serialize(ActualDecision, options);
                    var dlnnew = _dbcontext.TblDimensionInputLiners.Where(w => w.BaloonDrwID == hdrid && w.Page_No == i.Page_No && w.Balloon == i.Balloon).FirstOrDefault();
                    dlnr.Add(new TblDimensionInputLiner
                    {
                        BaloonDrwID = hdrid,
                        Page_No = i.Page_No,
                        Balloon = i.Balloon,
                        Actual_OP = jsonData,
                        CreatedAt = i.CreatedDate,
                        UpdatedAt = i.ModifiedDate
                    });
                }
                _dbcontext.TblDimensionInputLiners.AddRange(dlnr);
                _dbcontext.SaveChanges();
            });
            return true;
        }

        #endregion

        #region ControlCopy CRUD Operation
        public async Task<List<selectedcc>> TblControllCopy(DimTestContext _dbcontext, long hdrid)
        {
            List<selectedcc> samples = new List<selectedcc>();
            return await Task.Run(() =>
            {
                samples = _dbcontext.TblControlledCopy.Where(w => w.BaloonDrwID == hdrid).Select(e => new selectedcc
                {
                    textGroupPlaced = true,
                    drawingNo = e.drawingNo,
                    revNo = e.revNo,
                    routerno = e.routerno,
                    pageNo = e.pageNo,
                    origin = JsonConvert.DeserializeObject<Dictionary<string, string>>(e.origin, new JsonSerializerSettings
                    {
                        PreserveReferencesHandling = PreserveReferencesHandling.Objects
                    })
                }).ToList();
                return samples;
            });
        }

        #endregion

        #region Project CRUD Operation

        /// <summary>
        /// Gets all projects metadata WITHOUT loading images (fast DB query only).
        /// </summary>
        public async Task<List<Projects>> getallProjectsMetadata(DimTestContext _dbcontext, long groupId)
        {
            return await Task.Run(() =>
            {
                var hdrtable = _dbcontext.TblBaloonDrawingHeaders
                .GroupBy(a => new { a.DrawingNumber, a.Revision })
                .Select(group => new { DrawingNumber = group.Key.DrawingNumber, Revision = group.Key.Revision, Project = group.Where(a => _dbcontext.TblDimensionInputLiners.Any(l => l.BaloonDrwID == a.BaloonDrwID)).ToList() })
                .ToList();

                var projects = new List<Projects>();
                foreach (var key in hdrtable)
                {
                    string DrawingNumber = key.DrawingNumber.ToString();
                    string revision = key.Revision.ToString();
                    var hdr = _dbcontext.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == "N/A" && w.DrawingNumber == DrawingNumber && w.Revision == revision).FirstOrDefault();
                    if (hdr != null)
                    {
                        projects.Add(new Projects
                        {
                            CreatedDate = hdr.CreatedDate,
                            DrawingNumber = key.DrawingNumber,
                            Image = "",
                            Revision = key.Revision,
                            ProjectItem = key.Project,
                            isClosed = hdr.isClosed,
                            BaloonDrwID = hdr.BaloonDrwID
                        });
                    }
                }
                return projects.OrderBy(p => p.isClosed).ThenByDescending(p => p.CreatedDate).ToList();
            });
        }

        /// <summary>
        /// Loads a thumbnail image (max 300px wide) for a single project. Returns base64 string.
        /// </summary>
        public string loadProjectThumbnail(DimTestContext _dbcontext, Projects project, long groupId, string sourceDir)
        {
            string imagePath = string.Empty;
            long hdrid = project.BaloonDrwID;
            string DrawingNumber = project.DrawingNumber.Trim();
            string revision = project.Revision.Trim();

            var lnrCount = _dbcontext.TblBaloonDrawingLiners.Where(w => w.BaloonDrwID == hdrid).Count();
            if (lnrCount == 0)
            {
                imagePath = createPlaceholderImage(sourceDir, DrawingNumber);
            }
            else
            {
                var files = _dbcontext.TblBaloonDrawingLiners.Where(w => w.BaloonDrwID == hdrid).GroupBy(w => w.BaloonDrwFileID).Select(g => new
                {
                    Name = g.Key,
                    Page_NO = g.FirstOrDefault().Page_No
                }).OrderBy(r => r.Page_NO);
                string Fname = DrawingNumber.ToLower() + "-" + revision.ToLower();
                string backupDir = System.IO.Path.Combine(sourceDir, Fname);
                foreach (var file in files)
                {
                    string filePath = System.IO.Path.Combine(backupDir, file.Name);
                    if (System.IO.File.Exists(filePath))
                    {
                        imagePath = filePath;
                        break;
                    }
                }
                if (string.IsNullOrEmpty(imagePath))
                {
                    imagePath = createPlaceholderImage(sourceDir, DrawingNumber);
                }
            }

            // Generate thumbnail instead of sending full image
            try
            {
                using (var bmp = new System.Drawing.Bitmap(imagePath))
                {
                    int maxThumbWidth = 300;
                    if (bmp.Width <= maxThumbWidth)
                    {
                        return Convert.ToBase64String(File.ReadAllBytes(imagePath));
                    }
                    float ratio = (float)maxThumbWidth / bmp.Width;
                    int thumbW = maxThumbWidth;
                    int thumbH = (int)(bmp.Height * ratio);
                    using (var thumb = new System.Drawing.Bitmap(thumbW, thumbH))
                    {
                        using (var g = System.Drawing.Graphics.FromImage(thumb))
                        {
                            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                            g.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighSpeed;
                            g.DrawImage(bmp, 0, 0, thumbW, thumbH);
                        }
                        using (var ms = new MemoryStream())
                        {
                            thumb.Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
                            return Convert.ToBase64String(ms.ToArray());
                        }
                    }
                }
            }
            catch
            {
                return Convert.ToBase64String(File.ReadAllBytes(imagePath));
            }
        }

        // Keep old method for backwards compatibility
        public async Task<List<Projects>> getallProjects(DimTestContext _dbcontext, List<Projects> Projects, long groupId, string sourceDir)
        {
            return await getallProjectsMetadata(_dbcontext, groupId);
        }

        #endregion
    }
}

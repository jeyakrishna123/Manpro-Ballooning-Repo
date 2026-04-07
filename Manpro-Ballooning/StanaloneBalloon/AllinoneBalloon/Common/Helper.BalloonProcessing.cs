using System.Text.RegularExpressions;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Balloon Process
        public IEnumerable<object> CreateDummyBalloon(List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults, AllinoneBalloon.Entities.Common.AutoBalloon searchForm, string desFile, string username)
        {
            IEnumerable<object> returnObject = new List<object>();
            long dBalloonid = 1;
            decimal s_x = 0;
            decimal s_y = 0;
            decimal s_w = 0;
            decimal s_h = 0;
            AllinoneBalloon.Entities.Common.OCRResults dummy = new AllinoneBalloon.Entities.Common.OCRResults();
            var nxtcount = lstoCRResults.Count();
            if (nxtcount > 0)
            {
                dBalloonid = lstoCRResults.Where(r => r.Balloon != null).Max(r => Convert.ToInt64(r.Balloon.Substring(0, r.Balloon.IndexOf('.') > 0 ? r.Balloon.IndexOf('.') : r.Balloon.Length))) + 1;
            }
            List<AllinoneBalloon.Entities.Common.OCRResults> request = searchForm.originalRegions.Where(x1 => x1.isballooned == false).ToList();
            foreach (var obj in request)
            {
                s_x = obj.x;
                s_y = obj.y;
                s_w = obj.width;
                s_h = obj.height;
            }

            dummy.Balloon = Convert.ToString(dBalloonid);
            dummy.BaloonDrwID = 0;
            dummy.DrawingNumber = searchForm.CdrawingNo;
            dummy.Revision = searchForm.CrevNo.ToUpper();
            dummy.Page_No = searchForm.pageNo;
            dummy.BaloonDrwFileID = desFile;
            dummy.ProductionOrderNumber = searchForm.routingNo.ToString();
            dummy.Part_Revision = "N/A";
            dummy.Spec = "";
            dummy.Nominal = "";
            dummy.Minimum = "";
            dummy.Maximum = "";
            dummy.MeasuredBy = username;
            dummy.MeasuredOn = DateTime.Now;
            dummy.Measure_X_Axis = (int)s_x;
            dummy.Measure_Y_Axis = (int)s_y;
            dummy.Crop_X_Axis = (int)s_x;
            dummy.Crop_Y_Axis = (int)s_y;
            dummy.Crop_Width = (int)s_w;
            dummy.Crop_Height = (int)s_h;
            dummy.Circle_X_Axis = (int)s_x;
            dummy.Circle_Y_Axis = (int)s_y;
            dummy.Circle_Width = 28;
            dummy.Circle_Height = 28;
            dummy.Type = "";
            dummy.SubType = "";
            dummy.Unit = "";
            dummy.Quantity = 1;
            dummy.ToleranceType = "Default";
            dummy.PlusTolerance = "0";
            dummy.MinusTolerance = "0";
            dummy.MaxTolerance = "";
            dummy.MinTolerance = "";
            dummy.CreatedBy = username;
            dummy.CreatedDate = DateTime.Now;
            dummy.ModifiedBy = "";
            dummy.ModifiedDate = DateTime.Now;
            dummy.x = (int)s_x;
            dummy.y = (int)s_y;
            dummy.width = (int)s_w;
            dummy.height = (int)s_h;
            dummy.id = "";
            dummy.selectedRegion = "";
            dummy.isSaved = false;
            dummy.isballooned = true;
            dummy.BalloonColor = "";
            dummy.Actual = "";
            dummy.Decision = "";
            dummy.Characteristics = "";
            dummy.convert = false;
            dummy.converted = "0";
            dummy.Serial_No = string.Empty;
            dummy.BalloonShape = searchForm.Settings.BalloonShape;
            // Create the list
            var list = new List<Dictionary<string, Dictionary<string, string>>>();

            // Add the first dictionary to the list
            list.Add(new Dictionary<string, Dictionary<string, string>>
                        {
                            { "OP", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
                            { "LI", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
                            { "Final", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
                        });

            dummy.ActualDecision = list;
            lstoCRResults.Add(dummy);
            returnObject = lstoCRResults;
            return returnObject;
        }
        public AllinoneBalloon.Entities.Common.OCRResults balloonProcess(AllinoneBalloon.Entities.Common.GenerateBalloon g, string username)
        {
            AllinoneBalloon.Entities.Common.OCRResults oCRResults = new AllinoneBalloon.Entities.Common.OCRResults();
            oCRResults.BaloonDrwID = 0;
            oCRResults.DrawingNumber = g.drawingNo;
            oCRResults.Revision = g.revNo.ToUpper();
            oCRResults.Page_No = g.pageNo;
            oCRResults.BaloonDrwFileID = g.desFile;
            oCRResults.ProductionOrderNumber = g.routingNo;
            oCRResults.Part_Revision = "N/A";
            oCRResults.Balloon = Convert.ToString(g.Balloon);
            oCRResults.Spec = g.ocrtext.ToString();
            oCRResults.Nominal = g.Nominal;
            oCRResults.Minimum = g.Min;
            oCRResults.Maximum = g.Max;
            oCRResults.BalloonShape = g.BalloonShape;
            oCRResults.MeasuredBy = username;
            oCRResults.MeasuredOn = DateTime.Now;
            if (g.searchForm.selectedRegion == "Selected Region")
            {
                oCRResults.Crop_X_Axis = (int)g.ocr_X;
                oCRResults.Crop_Y_Axis = (int)g.ocr_Y;
                oCRResults.Crop_Width = (int)g.ocr_W;
                oCRResults.Crop_Height = (int)g.ocr_H;
                oCRResults.Circle_X_Axis = (int)g.ocr_X;
                oCRResults.Circle_Y_Axis = (int)g.ocr_Y;
                oCRResults.Measure_X_Axis = (int)g.ocr_X;
                oCRResults.Measure_Y_Axis = (int)g.ocr_Y;
                oCRResults.Circle_Width = 28;
                oCRResults.Circle_Height = 28;
            }
            else
            {
                if (g.ocr_X < 28)
                {
                    oCRResults.Crop_X_Axis = (int)g.ocr_X + 29;
                    oCRResults.Circle_X_Axis = (int)g.ocr_X + 29;
                    oCRResults.Measure_X_Axis = (int)g.ocr_X + 29;
                }
                else
                {
                    oCRResults.Crop_X_Axis = (int)g.ocr_X;
                    oCRResults.Circle_X_Axis = (int)g.ocr_X;
                    oCRResults.Measure_X_Axis = (int)g.ocr_X;
                }
                oCRResults.Crop_Y_Axis = (int)g.ocr_Y;
                oCRResults.Crop_Width = (int)g.ocr_W;
                oCRResults.Crop_Height = (int)g.ocr_H;
                oCRResults.Circle_Y_Axis = (int)g.ocr_Y;
                oCRResults.Measure_Y_Axis = (int)g.ocr_Y;
                oCRResults.Circle_Width = 28;
                oCRResults.Circle_Height = 28;
            }
            oCRResults.Type = g.Type;
            oCRResults.SubType = g.SubType;
            oCRResults.Unit = g.Unit;
            oCRResults.Quantity = g.Num_Qty;

            if (g.Min != "" && g.Max != "")
            {
                oCRResults.ToleranceType = g.ToleranceType;
            }
            else
            {
                oCRResults.ToleranceType = "Default";
            }
            if (g.ocrtext.Contains("R."))
            {
                oCRResults.ToleranceType = "Linear";
            }
            if (g.PlusTolerance != "")
            {
                oCRResults.PlusTolerance = "+" + g.PlusTolerance;
            }
            else
            {
                oCRResults.PlusTolerance = "0";
            }
            if (g.MinusTolerance != "")
            {
                oCRResults.MinusTolerance = "-" + g.MinusTolerance;
            }
            else
            {
                oCRResults.MinusTolerance = "0";
            }
            oCRResults.MaxTolerance = "";
            oCRResults.MinTolerance = "";
            oCRResults.CreatedBy = username;
            oCRResults.CreatedDate = DateTime.Now;
            oCRResults.ModifiedBy = "";
            oCRResults.ModifiedDate = DateTime.Now;
            oCRResults.x = (int)g.ocr_X;
            oCRResults.y = (int)g.ocr_Y;
            oCRResults.width = (int)g.ocr_W;
            oCRResults.height = (int)g.ocr_H;
            oCRResults.id = "";
            oCRResults.selectedRegion = "Full Image";
            if (g.isplmin && g.isplmin_mintol != "" && g.isplmin_pltol != "" && g.isplmin_spec != "")
            {
                oCRResults.Spec = g.isplmin_spec;
                oCRResults.Nominal = g.isplmin_spec;
                try
                {
                    oCRResults.Minimum = Convert.ToString(Convert.ToDecimal(g.isplmin_spec.Replace("¡", "")) - Convert.ToDecimal(g.isplmin_mintol));
                    oCRResults.Maximum = Convert.ToString(Convert.ToDecimal(g.isplmin_spec.Replace("¡", "")) + Convert.ToDecimal(g.isplmin_pltol));
                    oCRResults.MinusTolerance = "-" + Convert.ToString(g.isplmin_mintol);
                    oCRResults.PlusTolerance = "+" + Convert.ToString(g.isplmin_pltol);
                }
                catch (Exception)
                {

                }
                oCRResults.ToleranceType = "Linear";
                oCRResults.Type = "Dimension";
                oCRResults.Unit = "INCHES";
                oCRResults.SubType = "Circularity";
            }
            if (g.ocrtext.Contains("BOX") || g.ocrtext.Contains("PIN"))
            {
                oCRResults.ToleranceType = "Linear";
                oCRResults.Unit = "";
                oCRResults.Type = "";
                oCRResults.SubType = "";
                oCRResults.Minimum = "0";
                oCRResults.Maximum = "0";
                oCRResults.PlusTolerance = "0";
                oCRResults.MinusTolerance = "0";
            }
            if (g.Type == "Surface Finish")
            {
                oCRResults.ToleranceType = "Linear";
            }
            oCRResults.Characteristics = "";
            if (Regex.IsMatch(g.ocrtext, @"\(([^[\]]*)\)"))
            {
                oCRResults.Characteristics = "REFERENCES";
                oCRResults.Unit = "Visual";
            }
            if (g.ocrtext.Contains("UN") || g.ocrtext.Contains("HIF") || g.ocrtext.Contains("UNC") || g.ocrtext.Contains("UNF") || g.ocrtext.Contains("UNC") || g.ocrtext.Contains("UNS") || g.ocrtext.Contains("STUB ACME") || g.ocrtext.Contains("HST-DS") || g.ocrtext.Contains("HST") || g.ocrtext.Contains("VAM") || g.ocrtext.Contains("TOP") || g.ocrtext.Contains("SPCL"))
            {
                oCRResults.Characteristics = "THREAD";
                oCRResults.Unit = "THREAD GAUGE";
                oCRResults.ToleranceType = "Attribute";
            }
            if (Regex.IsMatch(g.ocrtext, @"^(?:[(\d+)(\d+\.\d+)]+)$"))
            {
                oCRResults.Characteristics = "TOTAL LENGTH";
                oCRResults.Unit = "D.H.G";
            }
            if (Regex.IsMatch(g.ocrtext, @"^(?:[(?:¡)(\d+)(\d+\.\d+)]+)±([(\d+)(\d+\.\d+)]+)$"))
            {
                oCRResults.Characteristics = "DISTANCE";
                oCRResults.Unit = "D.H.G";
            }
            if (Regex.IsMatch(g.ocrtext, @"^(?:[(\d+\.\d+)(\s+)]+)X([(\d+)(\s+)(?:°)]+)$"))
            {
                oCRResults.Characteristics = "DISTANCE";
                oCRResults.Unit = "D.H.G";
            }
            if (Regex.IsMatch(g.ocrtext, @"^(?:[(?:¡)(\d+\.\d+)(\s+)]+)$"))
            {
                oCRResults.Characteristics = "DISTANCE";
                oCRResults.Unit = "D.H.G";
            }
            if (Regex.IsMatch(g.ocrtext, @"^(?:[(?:°)(\d+)(\d+\.\d+)]+)±([(?:°)(\d+)(\d+\.\d+)]+)$"))
            {
                oCRResults.Characteristics = "DISTANCE";
                oCRResults.Unit = "D.H.G";
            }
            if (Regex.IsMatch(g.ocrtext, @"^(?:R[(\d+)(\d+\.\d+)]+)$"))
            {
                oCRResults.Characteristics = "RADIUS";
                oCRResults.Unit = "CMM";
            }
            if (Regex.IsMatch(g.ocrtext, @"^(?:[(\d+)]+(?:°))$"))
            {
                oCRResults.Characteristics = "DIMENTION";
                oCRResults.Unit = "Degree";
            }
            if (g.Num_Qty > 1)
            {
                oCRResults.Characteristics = "Counter Sink";
                oCRResults.Unit = "CMM";
            }
            if (Regex.IsMatch(g.ocrtext, @"^(?:[(\d+)(\d+\.\d+)]+)$"))
            {
                oCRResults.Characteristics = "TOTAL LENGTH";
                oCRResults.Unit = "D.H.G";
            }
            oCRResults.CropImage = g.ImageFile;
            oCRResults.BalloonColor = "";
            oCRResults.Actual = "";
            oCRResults.Decision = "";
            oCRResults.convert = g.convert;
            oCRResults.converted = g.converted;
            oCRResults.Serial_No = string.Empty;
            // Create the list
            var list = new List<Dictionary<string, Dictionary<string, string>>>();

            // Add the first dictionary to the list
            list.Add(new Dictionary<string, Dictionary<string, string>>
            {
                { "OP", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
                { "LI", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
                { "Final", new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } } },
            });

            oCRResults.ActualDecision = list;

            return oCRResults;
        }
        public void checkedPluseMinuse(string ocrtext, out object isplmin)
        {
            try
            {
                if (ocrtext.Contains("+") && ocrtext.Contains("-"))
                {
                    string mainValuePattern = @"^-?((?:¡|)(\d+|(?:\.d+)|)(?:\.\d+))?";
                    string positiveValuePattern = @"\+((\d+|(?:\.d+)|)(?:\.\d+))?";
                    string negativeValuePattern = @"-((\d+|(?:\.d+)|)(?:\.\d+))?";

                    Match mainValueMatch = Regex.Match(ocrtext, mainValuePattern);
                    MatchCollection positiveValueMatches = Regex.Matches(ocrtext, positiveValuePattern);
                    MatchCollection negativeValueMatches = Regex.Matches(ocrtext, negativeValuePattern);

                    string mainValue = mainValueMatch.Value;
                    string positive = string.Empty;
                    string negative = string.Empty;
                    foreach (Match match in positiveValueMatches)
                    {
                        positive = match.Value;
                    }
                    foreach (Match match in negativeValueMatches)
                    {
                        negative = match.Value;
                    }
                    isplmin = new { isplmin = true, isplmin_spec = mainValue, isplmin_pltol = positive.Replace("+", ""), isplmin_mintol = negative.Replace("-", "") };
                }
                else
                {
                    isplmin = new { isplmin = false, isplmin_spec = "", isplmin_pltol = "", isplmin_mintol = "" };
                }
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                isplmin = new { isplmin = false, isplmin_spec = "", isplmin_pltol = "", isplmin_mintol = "" };
            }
        }
        public void getQty(string ocrtext, out int Num_Qty)
        {
            try
            {
                bool isDigitPresent = ocrtext.Any(c => char.IsDigit(c));
                string qty = "";
                if (!ocrtext.Contains("BOX") && ocrtext.Contains("X") && isDigitPresent)
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
                        }
                    }
                    else
                    {
                        qty = ocrtext.Substring(0, ocrtext.IndexOf("X")).Replace(" ", "");
                    }
                }
                int value;
                if (int.TryParse(qty, out value)) { Num_Qty = Convert.ToInt16(qty); }
                else { Num_Qty = 1; }
            }
            catch (Exception ex)
            {
                ErrorLog objErrorLog = new ErrorLog();
                objErrorLog.WriteErrorToText(ex);
                Num_Qty = 1;
            }
        }

        #endregion
    }
}

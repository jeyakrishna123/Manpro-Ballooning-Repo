using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        #region Pop-up Balloon Update

        [Authorize]
        [HttpPost("specificationUpdate")]
        public async Task<IActionResult> specificationUpdate(AllinoneBalloon.Entities.Common.Specification i)
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_dbcontext);
            using var context = _dbcontext.CreateDbContext();
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
            List<AllinoneBalloon.Entities.Common.OCRResults> originalRegions = i.originalRegions;
            var oldocr = originalRegions.Select((s) => new { s.DrawingNumber, s.Revision, s.Spec, Min = s.Minimum, Max = s.Maximum, s.MinusTolerance, s.PlusTolerance, s.ToleranceType, s.Actual }).FirstOrDefault();
            string Min, Max, Nominal, Type, SubType, Unit, ToleranceType, PlusTolerance, MinusTolerance;
            var hdrnew = context.TblBaloonDrawingHeaders.Where(w => w.DrawingNumber == oldocr.DrawingNumber.ToString() && w.Revision == oldocr.Revision.ToString()).FirstOrDefault();
            CommonMethods cmt = new AllinoneBalloon.Common.CommonMethods(context, hdrnew);
            var OCR_Text = i.spec.Trim();
            if (OCR_Text.Contains("X"))
            {
                OCR_Text = OCR_Text.Substring(OCR_Text.IndexOf("X"), OCR_Text.Length - OCR_Text.IndexOf("X")).Replace("X", "").Trim(); ;
            }
            cmt.GetMinMaxValues(OCR_Text, out Min, out Max, out Nominal, out Type, out SubType, out Unit, out ToleranceType, out PlusTolerance, out MinusTolerance);

            bool isplmin = false;
            string isplmin_pltol = "";
            string isplmin_mintol = "";

            string plusTolerance = i.plusTolerance;
            string minusTolerance = i.minusTolerance;
            isplmin_pltol = plusTolerance.Replace("+", "");
            isplmin_mintol = minusTolerance.Replace("-", "");

            string oldplusTolerance = oldocr.PlusTolerance;
            string oldminusTolerance = oldocr.MinusTolerance;
            string oldToleranceType = oldocr.ToleranceType;
            string oldMin = oldocr.Min;
            string oldMax = oldocr.Max;
            string oldSpec = oldocr.Spec;
            string old_pltol = oldplusTolerance.Replace("+", "");
            string old_mintol = oldminusTolerance.Replace("-", "");
            string nominalv = string.Empty;
            if (isplmin_pltol != old_pltol && old_pltol != "" || isplmin_mintol != old_mintol && old_mintol != "")
            {
                isplmin = true;
                if (isplmin && isplmin_mintol != "" && isplmin_pltol != "")
                {
                    string minv = string.Empty;
                    string maxv = string.Empty;
                    string plustolerancev = string.Empty;
                    string minustolerancev = string.Empty;
                    nominalv = helper.getNomianal(OCR_Text, Nominal, hdrnew);
                    if (nominalv != "")
                    {
                        try
                        {
                            minv = Convert.ToString(Convert.ToDecimal(nominalv) - Convert.ToDecimal(isplmin_mintol));
                            maxv = Convert.ToString(Convert.ToDecimal(nominalv) + Convert.ToDecimal(isplmin_pltol));
                            minustolerancev = Convert.ToString(isplmin_mintol);
                            plustolerancev = Convert.ToString(isplmin_pltol);
                            string[] doubleArrayPlusTolerance = plustolerancev.Split('.');
                            string[] doubleArrayMinusTolerance = minustolerancev.Split('.');
                            var mlen = 0; var min1slen = 0;
                            var plen = 0; var max1slen = 0;
                            if (Convert.ToDecimal(isplmin_mintol) > 0)
                            {
                                decimal min1 = Convert.ToDecimal(minv);
                                if (doubleArrayMinusTolerance.Length > 1)
                                {
                                    mlen = doubleArrayMinusTolerance[1].Length;
                                }
                                if (mlen < 2) { mlen = 2; }
                                string[] min1s = minv.Split('.');
                                if (min1s.Length > 1)
                                {
                                    min1slen = min1s[1].Length;
                                }
                                int miValue = Math.Max(mlen, min1slen);
                                minv = min1.ToString($"F{miValue}");
                            }
                            else { minv = ""; }
                            if (Convert.ToDecimal(isplmin_pltol) > 0)
                            {
                                decimal max1 = Convert.ToDecimal(maxv);
                                if (doubleArrayPlusTolerance.Length > 1)
                                {
                                    plen = doubleArrayPlusTolerance[1].Length;
                                }
                                if (plen < 2) { plen = 2; }
                                string[] max1s = maxv.Split('.');
                                if (max1s.Length > 1)
                                {
                                    max1slen = max1s[1].Length;
                                }
                                int miiValue = Math.Max(plen, max1slen);
                                maxv = max1.ToString($"F{miiValue}");
                            }
                            else { maxv = ""; }
                            Min = minv;
                            Max = maxv;
                            Nominal = nominalv;
                            PlusTolerance = plustolerancev;
                            MinusTolerance = minustolerancev;
                        }
                        catch (Exception ex)
                        {
                            ErrorLog objErrorLog = new ErrorLog();
                            objErrorLog.WriteErrorToText(ex);
                            Min = i.minimum;
                            Max = i.maximum;
                            Nominal = OCR_Text;
                            PlusTolerance = isplmin_pltol;
                            MinusTolerance = isplmin_mintol;
                        }
                    }
                    else
                    {
                        Min = i.minimum;
                        Max = i.maximum;
                        Nominal = OCR_Text;
                        PlusTolerance = isplmin_pltol;
                        MinusTolerance = isplmin_mintol;
                    }
                }
            }
            string rspec = string.Empty;
            rspec = i.spec;
            string Num_Qty = "1";
            if (!rspec.Contains("BOX") && rspec.Contains("X"))
            {
                string qty = rspec.Substring(0, rspec.IndexOf("X")).Replace(" ", "");
                rspec = rspec.Replace(qty + "X ", "");
                int value;
                if (int.TryParse(qty, out value))
                    Num_Qty = Convert.ToString(qty);
            }
            if (i.toleranceType != ToleranceType)
            {
                ToleranceType = i.toleranceType;
            }

            if (i.maximum != Max && i.maximum != oldMax || i.minimum != Min && i.minimum != oldMin)
            {
                Max = i.maximum;
                Min = i.minimum;
                PlusTolerance = isplmin_pltol;
                MinusTolerance = isplmin_mintol;
                string minv = string.Empty;
                string maxv = string.Empty;
                string plustolerancev = string.Empty;
                string minustolerancev = string.Empty;
            }

            string rmax = string.Empty;
            string rmin = string.Empty;
            rmax = i.maximum;
            rmin = i.minimum;
            if (oldSpec == rspec && rmax == oldMax && rmin == oldMin && isplmin_pltol == old_pltol && isplmin_mintol == old_mintol)
            {
                Max = i.maximum;
                Min = i.minimum;
                PlusTolerance = isplmin_pltol;
                MinusTolerance = isplmin_mintol;
            }

            string actual = oldocr.Actual == "" ? "0.0" : oldocr.Actual;

            bool decision = false;
            if (Min != "" && Max != "" && oldocr.Actual != "" && oldocr.ToleranceType != "Attribute")
            {
                decision = helper.Between(Convert.ToDecimal(actual), Convert.ToDecimal(Min), Convert.ToDecimal(Max));
            }

            if (Min != "" && Max != "" && oldocr.Actual != "" && oldocr.ToleranceType == "Attribute")
            {
                if (actual == "Yes") { decision = true; }
                if (actual != "Yes") { decision = false; }
            }

            string SuccessBalloon = "#298535ff";
            string ErrorBalloon = "#f17013ff";
            string DefaultBalloon = "#1e88e5ff";

            if (hdrnew != null)
            {
                long hdrid = hdrnew.BaloonDrwID;
                var settingtable = context.TblBaloonDrawingSettings;
                var snew = settingtable.Where(w => w.BaloonDrwId == hdrid).FirstOrDefault();
                if (snew == null)
                {
                    SuccessBalloon = snew.SuccessBalloon;
                    ErrorBalloon = snew.ErrorBalloon;
                    DefaultBalloon = snew.DefaultBalloon;
                }
            }
            Dictionary<string, object> conv = await helper.ConvertSpec(OCR_Text);

            string convert = conv.Where(key => key.Key == "convert").FirstOrDefault().Value.ToString();

            string converted = conv.Where(key => key.Key == "converted").FirstOrDefault().Value.ToString();

            var dataList = new List<KeyValuePair<string, string>>();
            dataList.Add(new KeyValuePair<string, string>("Min", Min));
            dataList.Add(new KeyValuePair<string, string>("Max", Max));
            dataList.Add(new KeyValuePair<string, string>("Nominal", Nominal));
            dataList.Add(new KeyValuePair<string, string>("Type", Type));
            dataList.Add(new KeyValuePair<string, string>("SubType", SubType));
            dataList.Add(new KeyValuePair<string, string>("Unit", Unit));
            dataList.Add(new KeyValuePair<string, string>("convert", convert));
            dataList.Add(new KeyValuePair<string, string>("converted", converted));

            if (Min == "" || Max == "" || oldocr.Actual == "")
            {
                dataList.Add(new KeyValuePair<string, string>("Decision", ""));
                dataList.Add(new KeyValuePair<string, string>("BalloonColor", DefaultBalloon));
            }
            else
            {
                dataList.Add(new KeyValuePair<string, string>("Decision", decision ? "Pass" : "Fail"));
                dataList.Add(new KeyValuePair<string, string>("BalloonColor", decision ? SuccessBalloon : ErrorBalloon));
            }
            dataList.Add(new KeyValuePair<string, string>("ToleranceType", ToleranceType));
            if (PlusTolerance != "")
            {
                dataList.Add(new KeyValuePair<string, string>("PlusTolerance", "+" + PlusTolerance));
            }
            else
            {
                dataList.Add(new KeyValuePair<string, string>("PlusTolerance", "0"));
            }
            if (MinusTolerance != "")
            {
                dataList.Add(new KeyValuePair<string, string>("MinusTolerance", "-" + MinusTolerance));
            }
            else
            {
                dataList.Add(new KeyValuePair<string, string>("MinusTolerance", "0"));
            }
            dataList.Add(new KeyValuePair<string, string>("Num_Qty", Num_Qty));
            dataList.Add(new KeyValuePair<string, string>("Date", DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss.fffffffzzz")));
            return StatusCode(StatusCodes.Status200OK, dataList);
        }
    }
}
#endregion
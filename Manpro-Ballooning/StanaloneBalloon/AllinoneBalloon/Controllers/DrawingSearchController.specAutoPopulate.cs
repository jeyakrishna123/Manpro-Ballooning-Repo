using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        [Authorize]
        [HttpPost("specAutoPopulate")]
        public async Task<IActionResult> specAutoPopulate(AllinoneBalloon.Entities.Common.Specification i)
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
            long groupId = context.UserGroups.FirstOrDefault(a => a.UserId == user.Id).GroupId;
            List<AllinoneBalloon.Entities.Common.OCRResults> originalRegions = i.originalRegions;
            var oldocr = originalRegions.Select((s) => new { s.ProductionOrderNumber, s.DrawingNumber, s.Revision, s.Spec, Min = s.Minimum, Max = s.Maximum, s.MinusTolerance, s.PlusTolerance, s.ToleranceType, s.Actual }).FirstOrDefault();
            var hdrnew = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == oldocr.ProductionOrderNumber.ToString() && w.DrawingNumber == oldocr.DrawingNumber.ToString() && w.Revision == oldocr.Revision.ToString()).FirstOrDefault();
            string Min, Max, Nominal, Type, SubType, Unit, ToleranceType, PlusTolerance, MinusTolerance;
            CommonMethods cmt = new AllinoneBalloon.Common.CommonMethods(context, hdrnew);
            var OCR_Text = i.spec.Trim();
            if (OCR_Text.Contains("X"))
            {
                OCR_Text = OCR_Text.Substring(OCR_Text.IndexOf("X"), OCR_Text.Length - OCR_Text.IndexOf("X")).Replace("X", "").Trim(); ;
            }
            cmt.GetMinMaxValues(OCR_Text, out Min, out Max, out Nominal, out Type, out SubType, out Unit, out ToleranceType, out PlusTolerance, out MinusTolerance);
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
            string isplmin_pltol = string.Empty;
            string isplmin_mintol = string.Empty;

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
            string old_pltol = oldplusTolerance.Replace("+", "").Trim();
            string old_mintol = oldminusTolerance.Replace("-", "").Trim();
            string nominalv = string.Empty;
            if (i.toleranceType != ToleranceType)
            {
                ToleranceType = i.toleranceType;
            }
            if (isplmin_pltol == "")
            {
                isplmin_pltol = PlusTolerance;
            }
            if (isplmin_mintol == "")
            {
                isplmin_mintol = MinusTolerance;
            }

            if (isplmin_pltol != PlusTolerance && (isplmin_pltol != "0" || isplmin_pltol != "0.0" && isplmin_pltol != "" && old_pltol != "" && old_pltol != "0"))
            {
                string maxv = string.Empty;
                string plustolerancev = string.Empty;
                nominalv = helper.getNomianal(OCR_Text, Nominal, hdrnew);
                if (nominalv != "")
                {
                    try
                    {
                        maxv = Convert.ToString(Convert.ToDecimal(nominalv) + Convert.ToDecimal(isplmin_pltol));
                        plustolerancev = Convert.ToString(isplmin_pltol);
                        string[] doubleArrayPlusTolerance = plustolerancev.Split('.');
                        var plen = 0; var max1slen = 0;
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
                        if (isplmin_pltol == "0" || isplmin_pltol == "0.0")
                        {
                            maxv = nominalv;
                        }
                        Max = maxv;
                        Nominal = nominalv;
                        PlusTolerance = plustolerancev;
                    }
                    catch (Exception ex)
                    {
                        ErrorLog objErrorLog = new ErrorLog();
                        objErrorLog.WriteErrorToText(ex);
                        Max = i.maximum;
                        Nominal = OCR_Text;
                        PlusTolerance = isplmin_pltol;
                    }
                }
                else
                {
                    Max = i.maximum;
                    Nominal = OCR_Text;
                    PlusTolerance = isplmin_pltol;
                }
            }

            if (isplmin_mintol != MinusTolerance && isplmin_mintol != "" && (isplmin_mintol != "0" || isplmin_mintol != "0.0") && old_mintol != "" && old_mintol != "0")
            {
                string minv = string.Empty;
                string minustolerancev = string.Empty;
                nominalv = helper.getNomianal(OCR_Text, Nominal, hdrnew);
                if (nominalv != "")
                {
                    try
                    {
                        minv = Convert.ToString(Convert.ToDecimal(nominalv) - Convert.ToDecimal(isplmin_mintol));
                        minustolerancev = Convert.ToString(isplmin_mintol);
                        string[] doubleArrayMinusTolerance = minustolerancev.Split('.');
                        var mlen = 0; var min1slen = 0;
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
                        if (isplmin_mintol == "0" || isplmin_mintol == "0.0")
                        {
                            minv = nominalv;
                        }
                        Min = minv;
                        Nominal = nominalv;
                        MinusTolerance = minustolerancev;
                    }
                    catch (Exception ex)
                    {
                        ErrorLog objErrorLog = new ErrorLog();
                        objErrorLog.WriteErrorToText(ex);
                        Min = i.minimum;
                        Nominal = OCR_Text;
                        MinusTolerance = isplmin_mintol;
                    }
                }
                else
                {
                    Min = i.minimum;
                    Nominal = OCR_Text;
                    MinusTolerance = isplmin_mintol;
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
            dataList.Add(new KeyValuePair<string, string>("Quantity", Num_Qty));
            dataList.Add(new KeyValuePair<string, string>("Date", DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss.fffffffzzz")));
            return StatusCode(StatusCodes.Status200OK, dataList);
        }
    }
}

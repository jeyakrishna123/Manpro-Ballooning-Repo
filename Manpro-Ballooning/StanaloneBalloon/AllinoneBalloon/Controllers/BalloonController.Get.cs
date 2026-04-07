using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class BalloonController
    {
        [Authorize]
        [HttpGet("get")]
        public IEnumerable<object> get(string drawno, string revno, string routingno, long GroupId)
        {
            List<AllinoneBalloon.Entities.Common.OCRResults> results =
                new List<AllinoneBalloon.Entities.Common.OCRResults>();
            using (var context = _dbcontext.CreateDbContext())
            {
                if (drawno != "" && revno != "")
                {
                    var hdr = context
                        .TblBaloonDrawingHeaders.Where(w =>
                            w.GroupId == GroupId
                            && w.ProductionOrderNumber == routingno.ToUpper().ToString()
                            && w.DrawingNumber == drawno.ToUpper().ToString()
                            && w.Revision == revno.ToUpper().ToString()
                        )
                        .FirstOrDefault();
                    if (hdr != null)
                    {
                        var list = new List<Dictionary<string, Dictionary<string, string>>>();
                        list.Add(
                            new Dictionary<string, Dictionary<string, string>>
                            {
                                {
                                    "OP",
                                    new Dictionary<string, string>
                                    {
                                        { "Actual", "" },
                                        { "Decision", "" },
                                    }
                                },
                                {
                                    "LI",
                                    new Dictionary<string, string>
                                    {
                                        { "Actual", "" },
                                        { "Decision", "" },
                                    }
                                },
                                {
                                    "Final",
                                    new Dictionary<string, string>
                                    {
                                        { "Actual", "" },
                                        { "Decision", "" },
                                    }
                                },
                            }
                        );
                        List<Dictionary<string, Dictionary<string, string>>> ActualDecision =
                            list.ToList();
                        results = (
                            from h in context.TblBaloonDrawingHeaders
                            where
                                (
                                    h.GroupId == GroupId
                                    && h.ProductionOrderNumber == routingno.ToUpper().ToString()
                                    && h.DrawingNumber == drawno.ToUpper().ToString()
                                    && h.Revision == revno.ToString()
                                )
                            join l in context.TblBaloonDrawingLiners
                                on h.BaloonDrwID equals l.BaloonDrwID
                            select new AllinoneBalloon.Entities.Common.OCRResults
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
                                ActualDecision = ActualDecision,
                                id = string.Empty,
                                x = (int)l.Crop_X_Axis,
                                y = (int)l.Crop_Y_Axis,
                                width = (int)l.Crop_Width,
                                height = (int)l.Crop_Height,
                                selectedRegion = string.Empty,
                                isballooned = true,
                            }
                        ).ToList();
                        return results;
                    }
                    return results;
                }
            }
            return results;
        }
    }
}

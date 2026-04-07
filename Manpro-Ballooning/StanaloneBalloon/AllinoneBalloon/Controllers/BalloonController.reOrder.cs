using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class BalloonController
    {
        [Authorize]
        [HttpPut]
        [Route("reOrder")]
        public IEnumerable<object> reOrder(AllinoneBalloon.Entities.Common.ResetBalloon searchForm)
        {
            IEnumerable<object> obj1 = new List<object>();
            using var context = _dbcontext.CreateDbContext();
            var query = context
                .TblBaloonDrawingLiners.Where(w =>
                    w.DrawingNumber == searchForm.CdrawingNo.ToString()
                    && w.Page_No == searchForm.pageNo
                    && w.Revision == searchForm.CrevNo.ToString()
                )
                .Count();
            if (query > 0)
            {
                List<TblBaloonDrawingLiner> rList = context
                    .TblBaloonDrawingLiners.Where(w =>
                        w.DrawingNumber == searchForm.CdrawingNo.ToString()
                        && w.Page_No == searchForm.pageNo
                        && w.Revision == searchForm.CrevNo.ToString()
                    )
                    .ToList();
                context.TblBaloonDrawingLiners.RemoveRange(rList);
                context.SaveChanges();
            }
            var hdrnew = context
                .TblBaloonDrawingHeaders.Where(w =>
                    w.DrawingNumber == searchForm.CdrawingNo.ToString()
                    && w.Revision == searchForm.CrevNo.ToString()
                )
                .FirstOrDefault();
            byte[] imgbyt = new byte[] { 0x20 };
            List<TblBaloonDrawingLiner> lnr = new List<TblBaloonDrawingLiner>();
            List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults =
                new List<AllinoneBalloon.Entities.Common.OCRResults>();
            lstoCRResults = searchForm.originalRegions;
            foreach (var i in lstoCRResults)
            {
                long hdrid = hdrnew.BaloonDrwID;
                lnr.Add(
                    new TblBaloonDrawingLiner
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
                        Circle_X_Axis = i.Circle_X_Axis,
                        Circle_Y_Axis = i.Crop_Y_Axis,
                        Circle_Width = i.Circle_Width,
                        Circle_Height = i.Circle_Height,
                        Balloon_Thickness = i.Balloon_Thickness,
                        Balloon_Text_FontSize = i.Balloon_Text_FontSize,
                        ZoomFactor = i.ZoomFactor,
                        Crop_X_Axis = i.Crop_X_Axis,
                        Crop_Y_Axis = i.Crop_Y_Axis,
                        Crop_Width = i.Crop_Width,
                        Crop_Height = i.Crop_Height,
                        Type = i.Type,
                        SubType = i.SubType,
                        Unit = i.Unit,
                        Quantity = i.Quantity,
                        ToleranceType = i.ToleranceType,
                        PlusTolerance = i.PlusTolerance,
                        MinusTolerance = i.MinusTolerance,
                        MinTolerance = i.MinTolerance,
                        MaxTolerance = i.MaxTolerance,
                        CropImage = imgbyt,
                        CreatedBy = i.CreatedBy,
                        CreatedDate = i.CreatedDate,
                        ModifiedBy = i.ModifiedBy,
                        ModifiedDate = i.ModifiedDate,
                        IsCritical = i.IsCritical,
                    }
                );
            }
            context.TblBaloonDrawingLiners.AddRange(lnr);
            context.SaveChanges();

            obj1 = get(
                searchForm.CdrawingNo,
                searchForm.CrevNo,
                searchForm.Routerno,
                searchForm.GroupId
            );
            return obj1;
        }
    }
}

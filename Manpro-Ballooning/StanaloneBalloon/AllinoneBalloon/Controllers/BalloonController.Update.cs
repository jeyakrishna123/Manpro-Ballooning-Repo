using AllinoneBalloon.Common;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class BalloonController
    {
        [Authorize]
        [HttpPut]
        [Route("update")]
        public IEnumerable<object> update(AllinoneBalloon.Entities.Common.CreateBalloon searchForm)
        {
            using var context = _dbcontext.CreateDbContext();
            var hdrnew = context
                .TblBaloonDrawingHeaders.Where(w =>
                    w.GroupId == searchForm.GroupId
                    && w.DrawingNumber == searchForm.drawingNo.ToString()
                    && w.Revision == searchForm.revNo.ToString()
                )
                .FirstOrDefault();
            byte[] imgbyt = new byte[] { 0x20 };

            List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults =
                new List<AllinoneBalloon.Entities.Common.OCRResults>();
            lstoCRResults = searchForm.ballonDetails;
            foreach (var i in lstoCRResults)
            {
                string Min,
                    Max,
                    Nominal,
                    Type,
                    SubType,
                    Unit,
                    ToleranceType,
                    PlusTolerance,
                    MinusTolerance;
                CommonMethods cmt = new AllinoneBalloon.Common.CommonMethods(context, hdrnew);
                cmt.GetMinMaxValues(
                    i.Spec.Trim(),
                    out Min,
                    out Max,
                    out Nominal,
                    out Type,
                    out SubType,
                    out Unit,
                    out ToleranceType,
                    out PlusTolerance,
                    out MinusTolerance
                );
                int Num_Qty = 1;
                if (i.Spec.Contains("X"))
                {
                    string qty = i.Spec.Substring(0, i.Spec.IndexOf("X")).Replace(" ", "");
                    int value;
                    if (int.TryParse(qty, out value))
                        Num_Qty = Convert.ToInt16(qty);
                }
                TblBaloonDrawingLiner lnrup = context
                    .TblBaloonDrawingLiners.Where(f =>
                        f.DrawingNumber == i.DrawingNumber
                        && f.Balloon == i.Balloon
                        && f.Revision == i.Revision
                    )
                    .FirstOrDefault();
                if (lnrup == null)
                    throw new Exception("");
                lnrup.Spec = i.Spec;
                lnrup.Nominal = Nominal;
                lnrup.Minimum = Min;
                lnrup.Maximum = Max;
                lnrup.Type = Type;
                lnrup.SubType = SubType;
                lnrup.Unit = Unit;
                lnrup.Quantity = Num_Qty;
                lnrup.ToleranceType = ToleranceType;
                lnrup.PlusTolerance = PlusTolerance;
                lnrup.MinusTolerance = MinusTolerance;
                lnrup.MinTolerance = i.MinTolerance;
                lnrup.MaxTolerance = i.MaxTolerance;
                lnrup.ModifiedBy = i.ModifiedBy;
                lnrup.ModifiedDate = i.ModifiedDate;
                lnrup.IsCritical = i.IsCritical;
            }
            context.SaveChanges();

            var result = context
                .TblBaloonDrawingLiners.Where(w =>
                    w.DrawingNumber == searchForm.drawingNo.ToString()
                    && w.Revision == searchForm.revNo.ToString()
                )
                .ToList();
            return result;
        }
    }
}

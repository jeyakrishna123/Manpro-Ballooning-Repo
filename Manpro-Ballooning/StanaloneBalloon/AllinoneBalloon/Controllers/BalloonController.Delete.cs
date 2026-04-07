using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class BalloonController
    {
        [Authorize]
        [HttpDelete]
        [Route("delete")]
        public IEnumerable<object> delete(AllinoneBalloon.Entities.Common.DeleteBalloon searchForm)
        {
            IEnumerable<object> obj1 = new List<object>();
            using var context = _dbcontext.CreateDbContext();
            List<AllinoneBalloon.Entities.Common.OCRResults> results =
                new List<AllinoneBalloon.Entities.Common.OCRResults>();
            if (searchForm != null)
            {
                var drawingNo = searchForm.drawingNo.ToString();
                var revNo = searchForm.revNo.ToString();
                var newli = searchForm.deleteItem;

                // Step 1: Delete selected balloons (batch)
                foreach (var item in newli)
                {
                    var intItem = Convert.ToInt64(item);
                    var strItem = Convert.ToString(item);
                    var ck = context.TblBaloonDrawingLiners
                        .Where(p => p.DrawingNumber == drawingNo && p.Revision == revNo && p.Balloon.Contains(intItem + "."))
                        .OrderBy(f => f.DrawLineID).ToList();
                    if (ck.Count() > 0)
                    {
                        context.TblBaloonDrawingLiners.RemoveRange(ck);
                    }
                    else
                    {
                        var del = context.TblBaloonDrawingLiners
                            .Where(p => p.DrawingNumber == drawingNo && p.Revision == revNo && p.Balloon == strItem)
                            .FirstOrDefault();
                        if (del != null) context.TblBaloonDrawingLiners.Remove(del);
                    }
                }
                context.SaveChanges(); // Single save for all deletes

                // Step 2: Re-number remaining balloons (batch)
                var remaining = context.TblBaloonDrawingLiners
                    .Where(p => p.DrawingNumber == drawingNo && p.Revision == revNo)
                    .OrderBy(f => f.DrawLineID).ToList();

                if (remaining.Count > 0)
                {
                    var groups = remaining
                        .Select(e => new
                        {
                            sl = e.Balloon.Contains(".") ? Convert.ToInt64(e.Balloon.Substring(0, e.Balloon.IndexOf("."))) : Convert.ToInt64(e.Balloon),
                            e.DrawLineID,
                        })
                        .DistinctBy(i => i.sl).ToList();

                    long j = 1;
                    foreach (var grp in groups.OrderBy(f => f.DrawLineID))
                    {
                        var subItems = remaining.Where(p => p.Balloon.Contains(grp.sl + ".")).OrderBy(f => f.DrawLineID).ToList();
                        if (subItems.Count > 0)
                        {
                            long k = 1;
                            foreach (var o in subItems)
                            {
                                o.Balloon = j.ToString() + "." + k.ToString();
                                k++;
                            }
                        }
                        else
                        {
                            var liner = remaining.FirstOrDefault(f => f.DrawLineID == grp.DrawLineID);
                            if (liner != null) liner.Balloon = j.ToString();
                        }
                        j++;
                    }
                    context.SaveChanges(); // Single save for all renumbering
                }
            }
            obj1 = get(
                searchForm.drawingNo,
                searchForm.revNo,
                searchForm.Routerno,
                searchForm.GroupId
            );
            return obj1;
        }
    }
}

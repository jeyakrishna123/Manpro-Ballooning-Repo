using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        [Authorize]
        [HttpPost]
        [Route("resetBalloons")]
        public async Task<ActionResult<AllinoneBalloon.Entities.Common.ResetBalloon>> resetBalloons(AllinoneBalloon.Entities.Common.ResetBalloon searchForm)
        {
            using var context = _dbcontext.CreateDbContext();
            if (context.TblConfigurations == null)
            {
                return await Task.Run(() =>
                {
                    return NotFound();
                });
            }
            else
            {
                return await Task.Run(() =>
                {
                    IEnumerable<object> returnObject = new List<object>();
                    var query = context.TblBaloonDrawingLiners.Where(w => w.DrawingNumber == searchForm.CdrawingNo.ToString() && w.Page_No == searchForm.pageNo && w.Revision == searchForm.CrevNo.ToString()).Count();
                    if (query > 0)
                    {
                        List<TblBaloonDrawingLiner> rList = context.TblBaloonDrawingLiners.Where(w => w.DrawingNumber == searchForm.CdrawingNo.ToString() && w.Page_No == searchForm.pageNo && w.Revision == searchForm.CrevNo.ToString()).ToList();
                        context.TblBaloonDrawingLiners.RemoveRange(rList);
                        context.SaveChanges();
                        var oquery = context.TblBaloonDrawingLiners
                       .Where(p => p.DrawingNumber == searchForm.CdrawingNo.ToString() && p.Revision == searchForm.CrevNo.ToString()).ToList();
                        var test = oquery.OrderBy(f => f.DrawLineID).Select(e => new { sl = e.Balloon.Contains(".") ? Convert.ToInt64(e.Balloon.Substring(0, e.Balloon.IndexOf("."))) : Convert.ToInt64(e.Balloon), e.DrawLineID }).DistinctBy(i => i.sl).ToList();
                        var oquery1 = context.TblBaloonDrawingLiners.Where(w => w.DrawingNumber == searchForm.CdrawingNo.ToString() && w.Page_No != searchForm.pageNo && w.Revision == searchForm.CrevNo.ToString()).OrderBy(f => f.Page_No).ToList();
                        if (oquery1.Count() > 0)
                        {
                            long j = 1;
                            foreach (var i in test.OrderBy(f => f.DrawLineID).ToList())
                            {
                                var ck = context.TblBaloonDrawingLiners
                                    .Where(p => p.DrawingNumber == searchForm.CdrawingNo.ToString())
                                    .Where(p => p.Revision == searchForm.CrevNo.ToString())
                                    .Where(p => p.DrawLineID == i.DrawLineID)
                                    .Where(p => p.Balloon.Contains(i.sl + "."))
                                    .OrderBy(f => f.DrawLineID)
                                    .ToList();
                                if (ck.Count() > 0)
                                {
                                    var inner = context.TblBaloonDrawingLiners
                                    .Where(p => p.DrawingNumber == searchForm.CdrawingNo.ToString())
                                    .Where(p => p.Revision == searchForm.CrevNo.ToString())
                                    .Where(p => p.Balloon.Contains(i.sl + "."))
                                    .OrderBy(f => f.DrawLineID)
                                    .ToList();
                                    long k = 1;
                                    foreach (var o in inner)
                                    {
                                        TblBaloonDrawingLiner liner = context.TblBaloonDrawingLiners.Where(f => f.DrawLineID == o.DrawLineID).FirstOrDefault();
                                        var item = liner ?? throw new Exception("");
                                        liner.Balloon = j.ToString() + "." + k.ToString();
                                        k++;
                                        context.SaveChanges();
                                    }
                                }
                                else
                                {
                                    TblBaloonDrawingLiner liner = context.TblBaloonDrawingLiners.Where(f => f.DrawLineID == i.DrawLineID).FirstOrDefault();
                                    var item = liner ?? throw new Exception("");
                                    liner.Balloon = j.ToString();
                                }
                                j++;
                                context.SaveChanges();
                            }
                        }
                    }
                    else
                    {
                        var oquery = context.TblBaloonDrawingLiners
                      .Where(p => p.DrawingNumber == searchForm.CdrawingNo.ToString() && p.Revision == searchForm.CrevNo.ToString()).ToList();
                        var test = oquery.OrderBy(f => f.DrawLineID).Select(e => new { sl = e.Balloon.Contains(".") ? Convert.ToInt64(e.Balloon.Substring(0, e.Balloon.IndexOf("."))) : Convert.ToInt64(e.Balloon), e.DrawLineID }).DistinctBy(i => i.sl).ToList();
                        var oquery1 = context.TblBaloonDrawingLiners.Where(w => w.DrawingNumber == searchForm.CdrawingNo.ToString() && w.Page_No != searchForm.pageNo && w.Revision == searchForm.CrevNo.ToString()).OrderBy(f => f.Page_No).ToList();
                        if (oquery1.Count() > 0)
                        {
                            long j = 1;
                            foreach (var i in test.OrderBy(f => f.DrawLineID).ToList())
                            {
                                var ck = context.TblBaloonDrawingLiners
                                    .Where(p => p.DrawingNumber == searchForm.CdrawingNo.ToString())
                                    .Where(p => p.Revision == searchForm.CrevNo.ToString())
                                    .Where(p => p.DrawLineID == i.DrawLineID)
                                    .Where(p => p.Balloon.Contains(i.sl + "."))
                                    .OrderBy(f => f.DrawLineID)
                                    .ToList();
                                if (ck.Count() > 0)
                                {
                                    var inner = context.TblBaloonDrawingLiners
                                    .Where(p => p.DrawingNumber == searchForm.CdrawingNo.ToString())
                                    .Where(p => p.Revision == searchForm.CrevNo.ToString())
                                    .Where(p => p.Balloon.Contains(i.sl + "."))
                                    .OrderBy(f => f.DrawLineID)
                                    .ToList();
                                    long k = 1;
                                    foreach (var o in inner)
                                    {
                                        TblBaloonDrawingLiner liner = context.TblBaloonDrawingLiners.Where(f => f.DrawLineID == o.DrawLineID).FirstOrDefault();
                                        var item = liner ?? throw new Exception("");
                                        liner.Balloon = j.ToString() + "." + k.ToString();
                                        k++;
                                        context.SaveChanges();
                                    }
                                }
                                else
                                {
                                    TblBaloonDrawingLiner liner = context.TblBaloonDrawingLiners.Where(f => f.DrawLineID == i.DrawLineID).FirstOrDefault();
                                    var item = liner ?? throw new Exception("");
                                    liner.Balloon = j.ToString();
                                }
                                j++;
                                context.SaveChanges();
                            }
                        }
                    }
                    BalloonController balcon = new BalloonController(_dbcontext);
                    returnObject = balcon.get(searchForm.CdrawingNo, searchForm.CrevNo, searchForm.Routerno, searchForm.GroupId);
                    return StatusCode(StatusCodes.Status200OK, returnObject);
                });
            }
        }
    }
}

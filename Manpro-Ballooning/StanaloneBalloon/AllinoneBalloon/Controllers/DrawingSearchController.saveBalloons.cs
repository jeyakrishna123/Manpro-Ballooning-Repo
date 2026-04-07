using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        [Authorize]
        [HttpPost]
        [Route("saveBalloons")]
        public async Task<ActionResult<AllinoneBalloon.Entities.Common.AutoBalloon>> saveBalloons(AllinoneBalloon.Entities.Common.AutoBalloon searchForm)
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
                    List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults = searchForm.originalRegions;
                    BalloonController balcon = new BalloonController(_dbcontext);
                    AllinoneBalloon.Entities.Common.CreateBalloon objbaldet = new AllinoneBalloon.Entities.Common.CreateBalloon();
                    objbaldet.drawingNo = searchForm.CdrawingNo;
                    objbaldet.revNo = searchForm.CrevNo;
                    objbaldet.totalPage = searchForm.totalPage;
                    objbaldet.pageNo = searchForm.pageNo;
                    objbaldet.ballonDetails = lstoCRResults;
                    IEnumerable<object> returnObject = balcon.update(objbaldet);

                    return StatusCode(StatusCodes.Status200OK, returnObject);
                });
            }
        }
    }
}

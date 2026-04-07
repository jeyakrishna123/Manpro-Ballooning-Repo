using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        [Authorize]
        [HttpPost]
        [Route("deleteBalloons")]
        public async Task<ActionResult<AllinoneBalloon.Entities.Common.DeleteBalloon>> deleteBalloons(AllinoneBalloon.Entities.Common.DeleteBalloon searchForm)
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
                    BalloonController balcon = new BalloonController(_dbcontext);
                    AllinoneBalloon.Entities.Common.DeleteBalloon objbaldet = new AllinoneBalloon.Entities.Common.DeleteBalloon();
                    objbaldet.drawingNo = searchForm.drawingNo;
                    objbaldet.revNo = searchForm.revNo;
                    objbaldet.totalPage = searchForm.totalPage;
                    objbaldet.pageNo = searchForm.pageNo;
                    objbaldet.deleteItem = searchForm.deleteItem;
                    IEnumerable<object> returnObject = balcon.delete(objbaldet);
                    return StatusCode(StatusCodes.Status200OK, returnObject);
                });
            }
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        [Authorize]
        [HttpPost("reOrderBalloons")]
        public async Task<ActionResult<AllinoneBalloon.Entities.Common.DeleteBalloon>> reOrderBalloons(AllinoneBalloon.Entities.Common.ResetBalloon searchForm)
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
                    AllinoneBalloon.Entities.Common.ResetBalloon objReCreate = searchForm;
                    IEnumerable<object> returnObject = balcon.reOrder(objReCreate);
                    return StatusCode(StatusCodes.Status200OK, returnObject);
                });
            }

        }
    }
}

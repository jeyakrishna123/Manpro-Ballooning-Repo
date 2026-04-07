using AllinoneBalloon.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class FileUploadController
    {
        #region Block/Unlock Drawing
        [Authorize]
        [HttpPost("block")]
        public async Task<IActionResult> Block(BlockRequest request)
        {
            Dictionary<string, object> return_Object = new Dictionary<string, object>();
            using var context = _dbcontext.CreateDbContext();

            try
            {
                user = await helper.GetLoggedUser(HttpContext);
                if (user != null)
                {
                    username = user.Name;
                }
                else
                {
                    await Task.Run(() =>
                    {
                        return Unauthorized("You are not authorized to access this resource.");
                    });
                }
                jwtToken = await helper.GetToken(HttpContext);
                var gid = jwtToken.Claims.Where(c => c.Type == "groupId").Select(c => c.Value).FirstOrDefault();
                bool groupExist = long.TryParse(gid, out groupId);
                string Urole = user.Role;

                if (Urole == Role.Admin)
                {
                    var hdr = context.TblBaloonDrawingHeaders.Find(request.hdrid);
                    if (hdr != null && hdr.isClosed)
                    {
                        hdr.isClosed = false;
                        context.SaveChanges();
                    }
                    else if (hdr != null && !hdr.isClosed)
                    {
                        hdr.isClosed = true;
                        context.SaveChanges();
                    }
                }
                return_Object.Add("response", "Updated");
                return StatusCode(StatusCodes.Status200OK, return_Object);
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                return BadRequest("Something went wrong!.");
            }
        }
        #endregion
    }
}

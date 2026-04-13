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
                jwtToken = await helper.GetToken(HttpContext);
                user = await helper.GetLoggedUser(HttpContext);
                if (user == null)
                {
                    var nameId = jwtToken?.Claims?.Where(c => c.Type == "unique_name" || c.Type == System.Security.Claims.ClaimTypes.Name).Select(c => c.Value).FirstOrDefault();
                    if (!string.IsNullOrEmpty(nameId))
                    {
                        var userId = long.Parse(nameId);
                        user = context.Users.Find(userId);
                    }
                    if (user == null)
                    {
                        return Unauthorized("Your session has expired. Please log out and log in again.");
                    }
                }
                username = user.Name;
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

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class FileUploadController
    {
        #region Fetch all Images related to the Drawings
        [Authorize]
        [HttpPost("FetchDrawing")]
        public async Task<IActionResult> FetchDrawing([FromBody] DownloadRequest request)
        {
            using var context = _dbcontext.CreateDbContext();
            string env = _appSettings.ENVIRONMENT;
            Dictionary<string, object> return_Object = new Dictionary<string, object>();
            if (env != "development")
            {
                envcpath = AppDomain.CurrentDomain.BaseDirectory;
            }
            string session_UserId = string.Empty;
            string sessionUserId = request.session_UserId;
            try
            {
                #region Create session
                if (sessionData == null)
                {
                    sessionData = helper.setsession(HttpContext);
                }

                if (sessionUserId == "")
                {
                    session_UserId = sessionData.sessionUserId;
                }
                else
                {
                    session_UserId = sessionUserId;
                }
                #endregion

                string sourceDir = System.IO.Path.Combine(envcpath, "SourceDrawings");
                sourceDir = helper.AddTrailingSlash(sourceDir);

                #region User Authentication
                jwtToken = await helper.GetToken(HttpContext);
                user = await helper.GetLoggedUser(HttpContext);
                if (user == null)
                {
                    var nameId = jwtToken?.Claims?.Where(c => c.Type == "unique_name" || c.Type == System.Security.Claims.ClaimTypes.Name).Select(c => c.Value).FirstOrDefault();
                    if (!string.IsNullOrEmpty(nameId))
                    {
                        var userId = long.Parse(nameId);
                        using var ctx = _dbcontext.CreateDbContext();
                        user = ctx.Users.Find(userId);
                    }
                    if (user == null)
                    {
                        return Unauthorized("Your session has expired. Please log out and log in again.");
                    }
                }
                username = user.Name;
                #endregion

                #region User Group
                var gid = jwtToken.Claims.Where(c => c.Type == "groupId").Select(c => c.Value).FirstOrDefault();
                bool groupExist = long.TryParse(gid, out groupId);
                sourceDir = System.IO.Path.Combine(sourceDir, groupId.ToString());
                sourceDir = helper.AddTrailingSlash(sourceDir);
                #endregion

                #region Get drawing folder
                string DrawingNo = request.drawingNo.ToUpper().Trim().ToString();
                string RevisionNo = request.revNo.ToUpper().Trim().ToString();
                string Fname = DrawingNo + "-" + RevisionNo;
                sourceDir = System.IO.Path.Combine(sourceDir, Fname.ToString());
                sourceDir = helper.AddTrailingSlash(sourceDir);
                #endregion

                var images = await helper.GetBase64Images(sourceDir);
                return_Object.Add("images", images);
                return StatusCode(StatusCodes.Status200OK, return_Object);
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                return BadRequest("Something Went wrong!");
            }
        }
        #endregion

    }
}

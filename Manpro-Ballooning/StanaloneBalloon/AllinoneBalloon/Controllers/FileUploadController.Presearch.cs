using AllinoneBalloon.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class FileUploadController
    {
        #region presearch API
        [Authorize]
        [HttpPost("presearch")]
        public async Task<IActionResult> PreSearch(SearchFormRequest request)
        {
            using var context = _dbcontext.CreateDbContext();
            string env = _appSettings.ENVIRONMENT;
            Dictionary<string, object> return_Object = new Dictionary<string, object>();
            if (env != "development")
            {
                envcpath = AppDomain.CurrentDomain.BaseDirectory;
            }
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
                string DrawingNo = request.drawingNo.ToUpper().Trim();
                string RevisionNo = request.revNo.ToUpper().Trim();
                string Routerno = request.routerNo.ToUpper().Trim();
                string MaterialQty = request.materialQty.Trim();
                var nhdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == Routerno.ToString() && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                var permission  = jwtToken.Claims.Where(c => c.Type == "Permission").Select(c => c.Value).ToList();
                bool add_actual_value = permission.Contains("add_actual_value");
                if (!add_actual_value)
                {
                    return await Task.Run(() =>
                    {
                        return BadRequest("Permission denied.");
                    });
                }
                if (Urole != Role.Admin)
                {
                    if (nhdr != null)
                    {
                        if (nhdr.Quantity == MaterialQty || request.agree)
                        {
                            return await Task.Run(() =>
                            {
                                return Search(request);
                            });
                        }
                    }
                    else
                    {
                        return await Task.Run(() =>
                        {
                            return Search(request);
                        });
                    }
                    return_Object.Add("diff", true);
                    return_Object.Add("old", nhdr.Quantity);
                    return_Object.Add("new", MaterialQty);
                }
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

using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        [Authorize]
        [HttpPost("rotate")]
        public async Task<ActionResult> RotateImage(AllinoneBalloon.Entities.Common.RotateBalloon searchForm)
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_dbcontext);
            User user = await helper.GetLoggedUser(HttpContext);
            if (user != null)
            {
                username = user.Name;
            }
            else
            {
                return await Task.Run(() =>
                {
                    return Unauthorized("You are not authorized to access this resource.");
                });
            }
            string dtFiles = searchForm.drawingDetails;
            int rotation = searchForm.rotation;
            string env = _appSettings.ENVIRONMENT;
            string clientPath = System.IO.Path.Combine(envcpath, "ClientApp", "src", "drawing");
            clientPath = helper.AddTrailingSlash(clientPath);
            if (env != "development")
            {
                envcpath = AppDomain.CurrentDomain.BaseDirectory;
                clientPath = System.IO.Path.Combine(envcpath, "ClientApp", "src", "drawing");
                clientPath = helper.AddTrailingSlash(clientPath);

                clientPath = System.IO.Path.Combine(clientPath, searchForm.sessionUserId.ToString());
                clientPath = helper.AddTrailingSlash(clientPath);
                if (!Directory.Exists(clientPath))
                {
                    Directory.CreateDirectory(clientPath);
                }
            }
            FileInfo fi = new FileInfo(dtFiles);
            string desFile = fi.Name;
            string OrgPath = dtFiles;
            if (env != "development")
            {
                //  OrgPath = dtFiles.Replace(desFile, "") + "\\drawing\\" + desFile;
            }
            string clientImg = clientPath + desFile;
            string ImageFile = System.IO.Path.Combine(System.IO.Path.GetTempPath(), Guid.NewGuid().ToString() + desFile);
            System.IO.File.Copy(OrgPath, ImageFile, true);
            if (dtFiles == null || dtFiles == "")
            {
                return BadRequest("No file found.");
            }
            await helper.RotateImagefile(ImageFile, rotation);
            helper.scaleImage(partial_image, ImageFile, 0, true, objerr);
            System.Drawing.Image.FromFile(ImageFile).Save(clientImg, System.Drawing.Imaging.ImageFormat.Png);
            List<object> returnObject = new List<object>();
            returnObject.Add(desFile);
            return await Task.Run(() =>
            {
                return StatusCode(StatusCodes.Status200OK, returnObject);
            });
            //return StatusCode(StatusCodes.Status200OK, returnObject);
        }
    }
}

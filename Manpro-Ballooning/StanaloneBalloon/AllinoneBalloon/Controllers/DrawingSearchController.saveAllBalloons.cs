using Microsoft.EntityFrameworkCore;
using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
//using System.Data.Entity;

namespace AllinoneBalloon.Controllers
{
    public partial class DrawingSearchController
    {
        #region Saving All the Balloons
        [Authorize]
        [HttpPost("saveAllBalloons")]
        public async Task<ActionResult<AllinoneBalloon.Entities.Common.ResetBalloon>> saveAllBalloons(AllinoneBalloon.Entities.Common.CreateBalloon searchForm)
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_dbcontext);
            using var context = _dbcontext.CreateDbContext();
            string session_UserId = searchForm.session_UserId;
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
            long groupId = context.UserGroups.FirstOrDefault(a => a.UserId == user.Id).GroupId;
            var getuser = context.Users.Include(g => g.UserGroups)
                .ThenInclude(g => g.Group)
                .Include(g => g.UserRoles)
                .ThenInclude(g => g.Role)
                .Include(g => g.UserPermission)
                .ThenInclude(g => g.Permission)
                .Where(u => u.UserGroups.Any(ug => ug.GroupId == groupId))
                .AsSplitQuery()
                .FirstOrDefault(u => u.Id == user.Id);
            string env = _appSettings.ENVIRONMENT;
            if (env != "development")
            {
                envcpath = AppDomain.CurrentDomain.BaseDirectory;
            }
            string workingDir = envcpath + "\\Drawed Images\\";
            string Urole = user.Role;
            workingDir = workingDir + session_UserId + "\\downloads\\";

            if (!Directory.Exists(workingDir))
            {
                Directory.CreateDirectory(workingDir);
            }

            if (context.TblConfigurations == null)
            {
                return await Task.Run(() =>
                {
                    return NotFound();
                });
            }
            else
            {
                string Fname = searchForm.drawingNo.Trim().ToUpper().ToString() + "-" + searchForm.revNo.Trim().ToUpper().ToString();
                var newhdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == searchForm.Routerno.ToUpper().ToString() && w.DrawingNumber == searchForm.drawingNo.ToUpper().ToString() && w.Revision == searchForm.revNo.ToUpper().ToString()).FirstOrDefault();
                int pages = (int)newhdr.Total_Page_No;
                if (searchForm.convertStagesToImages != null && searchForm.convertStagesToImages.Count > 0)
                {
                    var chunks = searchForm.convertStagesToImages.Select((x, i) => new { Index = i, Value = x })
                          .GroupBy(x => x.Index / pages)
                          .Select(g => g.Select(x => x.Value).ToList())
                          .ToList();
                    await helper.SaveImages(searchForm.convertStagesToImages, workingDir, Fname);
                }
                bool hasCreateBalloon = getuser.HasPermission("create_balloon");

                if (hasCreateBalloon)
                {
                    return await Task.Run(() =>
                    {
                        BalloonController balcon = new BalloonController(_dbcontext);
                        AllinoneBalloon.Entities.Common.CreateBalloon createBalloon = new AllinoneBalloon.Entities.Common.CreateBalloon();
                        AllinoneBalloon.Models.Settings settings = searchForm.Settings;
                        createBalloon.drawingNo = searchForm.drawingNo;
                        createBalloon.revNo = searchForm.revNo;
                        createBalloon.totalPage = searchForm.totalPage;
                        createBalloon.pageNo = searchForm.pageNo;
                        createBalloon.rotate = searchForm.rotate;
                        createBalloon.Routerno = searchForm.Routerno;
                        createBalloon.username = username;
                        createBalloon.MaterialQty = searchForm.MaterialQty;
                        createBalloon.ballonDetails = searchForm.ballonDetails;
                        createBalloon.Settings = settings;
                        createBalloon.controllCopy = searchForm.controllCopy;
                        createBalloon.GroupId = groupId;

                        IEnumerable<object> returnObject = balcon.create(createBalloon);

                        return StatusCode(StatusCodes.Status200OK, returnObject);
                    });
                }
                else
                {
                    return await Task.Run(async () =>
                    {
                        List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults = searchForm.ballonDetails;
                        long hdrid = newhdr.BaloonDrwID;
                        List<TblDimensionInputLiner> dlnr = new List<TblDimensionInputLiner>();
                        foreach (var i in lstoCRResults)
                        {
                            List<Dictionary<string, Dictionary<string, string>>> actual = i.ActualDecision.ToList();
                            // Separate lists for each column
                            var listOp = new List<Dictionary<string, string>>();
                            var listLi = new List<Dictionary<string, string>>();
                            var listFinal = new List<Dictionary<string, string>>();

                            // Extract dictionaries from the combined list
                            foreach (var row in actual)
                            {
                                if (row.ContainsKey("OP"))
                                    listOp.Add(row["OP"]);
                                if (row.ContainsKey("LI"))
                                    listLi.Add(row["LI"]);
                                if (row.ContainsKey("Final"))
                                    listFinal.Add(row["Final"]);
                            }
                            string json_opData = JsonConvert.SerializeObject(listOp, Newtonsoft.Json.Formatting.Indented, new JsonSerializerSettings { PreserveReferencesHandling = PreserveReferencesHandling.Objects });
                            string json_liData = JsonConvert.SerializeObject(listLi, Newtonsoft.Json.Formatting.Indented, new JsonSerializerSettings { PreserveReferencesHandling = PreserveReferencesHandling.Objects });
                            string json_fiData = JsonConvert.SerializeObject(listFinal, Newtonsoft.Json.Formatting.Indented, new JsonSerializerSettings { PreserveReferencesHandling = PreserveReferencesHandling.Objects });
                            var udlnew = context.TblDimensionInputLiners.Where(w => w.BaloonDrwID == hdrid && w.Page_No == i.Page_No && w.Balloon == i.Balloon).FirstOrDefault();
                            if (udlnew != null)
                            {
                                udlnew.BaloonDrwID = hdrid;
                                udlnew.Page_No = i.Page_No;
                                udlnew.Balloon = i.Balloon;
                                udlnew.Actual_OP = json_opData;
                                udlnew.Actual_LI = json_liData;
                                udlnew.Actual_FI = json_fiData;
                                udlnew.UpdatedAt = i.ModifiedDate;
                                context.SaveChanges();
                            }
                        }
                        IEnumerable<object> returnObject = await helper.GetLiner(context, searchForm.drawingNo, searchForm.revNo, searchForm.Routerno, newhdr.BaloonDrwID, groupId);

                        return StatusCode(StatusCodes.Status200OK, returnObject);
                    });
                }
            }
        }
        #endregion
    }
}

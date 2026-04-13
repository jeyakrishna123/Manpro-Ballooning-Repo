using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace AllinoneBalloon.Controllers
{
    public partial class FileUploadController
    {
        #region Uploadorsearch API
        [Authorize]
        [HttpPost("Uploadorsearch")]
        public async Task<IActionResult> Uploadorsearch([FromHeader(Name = "Authorization")] string Authorization, AllinoneBalloon.Entities.Common.SearchForm searchForm)
        {
            using (var context = _dbcontext.CreateDbContext())
            {
                string session_UserId = string.Empty;
                string env = _appSettings.ENVIRONMENT;
                long hdrid = default;
                Dictionary<string, object> return_Object = new Dictionary<string, object>();
                try
                {
                    #region Create session
                    string sessionUserId = searchForm.sessionUserId;
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

                    #region Create Directory
                    string clientPath = System.IO.Path.Combine(envcpath, "ClientApp", "src", "drawing");
                    clientPath = helper.AddTrailingSlash(clientPath);
                    string workingDir = System.IO.Path.Combine(envcpath, "Drawed Images");
                    workingDir = helper.AddTrailingSlash(workingDir);
                    string sourceDir = System.IO.Path.Combine(envcpath, "SourceDrawings");
                    sourceDir = helper.AddTrailingSlash(sourceDir);
                    if (env != "development")
                    {
                        clientPath = System.IO.Path.Combine(clientPath, session_UserId.ToString());
                        clientPath = helper.AddTrailingSlash(clientPath);
                        if (!Directory.Exists(clientPath))
                        {
                            Directory.CreateDirectory(clientPath);
                        }
                    }
                    workingDir = System.IO.Path.Combine(workingDir, session_UserId.ToString());
                    workingDir = helper.AddTrailingSlash(workingDir);
                    if (!Directory.Exists(workingDir))
                    {
                        Directory.CreateDirectory(workingDir);
                    }
                    string samplePath = System.IO.Path.Combine(workingDir, "sample");
                    samplePath = helper.AddTrailingSlash(samplePath);
                    if (!Directory.Exists(samplePath))
                    {
                        Directory.CreateDirectory(samplePath);
                    }
                    #endregion

                    #region User Authentication
                    jwtToken = await helper.GetToken(HttpContext);
                    user = await helper.GetLoggedUser(HttpContext);
                    if (user != null)
                    {
                        username = user.Name;
                    }
                    else
                    {
                        // Fallback: get username from JWT claims when refresh token expired
                        var nameId = jwtToken?.Claims?.Where(c => c.Type == "unique_name" || c.Type == System.Security.Claims.ClaimTypes.Name).Select(c => c.Value).FirstOrDefault();
                        if (!string.IsNullOrEmpty(nameId))
                        {
                            var userId = long.Parse(nameId);
                            var fallbackUser = context.Users.Find(userId);
                            if (fallbackUser != null)
                            {
                                user = fallbackUser;
                                username = user.Name;
                            }
                        }
                        if (user == null)
                        {
                            return Unauthorized("Your session has expired. Please log out and log in again.");
                        }
                    }
                    #endregion

                    #region User Group
                    var gid = jwtToken.Claims.Where(c => c.Type == "groupId").Select(c => c.Value).FirstOrDefault();
                    bool groupExist = long.TryParse(gid, out groupId);
                    sourceDir = System.IO.Path.Combine(sourceDir, groupId.ToString());
                    sourceDir = helper.AddTrailingSlash(sourceDir);
                    if (!Directory.Exists(sourceDir))
                    {
                        Directory.CreateDirectory(sourceDir);
                    }
                    #endregion

                    string DrawingNo = (searchForm.drawingNo ?? "").ToUpper();
                    string RevisionNo = (searchForm.revNo ?? "").ToUpper();
                    string Routerno = string.Empty;
                    bool demo;
                    var settingtable = context.TblBaloonDrawingSettings;

                    var hdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == "N/A" && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                    if (hdr == null)
                    {
                        return await Task.Run(() =>
                        {
                            return BadRequest("There is no Record found for your request. try with File Upload.");
                        });
                    }
                    else
                    {
                        hdrid = hdr.BaloonDrwID;
                        if (hdr.isClosed)
                        {
                            return await Task.Run(() =>
                            {
                                return BadRequest("Requested Drawing revision is blocked, Try with New Revision.");
                            });
                        }

                        var lnritems = context.TblBaloonDrawingLiners.Where(w => w.BaloonDrwID == hdrid).ToList();

                        demo = config.GetValue<bool>("Demo", defaultValue: false);
                        var files = context.TblBaloonDrawingLiners.Where(w => w.BaloonDrwID == hdrid).GroupBy(w => w.BaloonDrwFileID).Select(g => new
                        {
                            Name = g.Key,
                            Page_NO = g.FirstOrDefault().Page_No
                        }).OrderBy(r => r.Page_NO);

                        #region delete previous request drawings
                        await helper.DeleteOldFiles(workingDir);
                        await helper.DeleteFiles(clientPath);
                        await helper.DeleteFiles(workingDir);
                        if (Directory.Exists(samplePath))
                        {
                            await helper.DeleteFiles(samplePath);
                        }
                        #endregion

                        #region Get request drawing from source Directory
                        string Fname = DrawingNo.Trim().ToUpper().ToString() + "-" + RevisionNo.Trim().ToUpper().ToString();
                        string backupDir = System.IO.Path.Combine(sourceDir, Fname);
                        List<string> addedfiles = new List<string>();
                        foreach (var file in files)
                        {
                            string filePath = System.IO.Path.Combine(backupDir, file.Name);
                            objerr.WriteErrorLog(filePath);
                            if (System.IO.File.Exists(filePath))
                            {
                                addedfiles.Add(filePath);
                            }
                        }
                        // If no files found from liners (e.g. after reset), load directly from source directory
                        if (addedfiles.Count == 0 && Directory.Exists(backupDir))
                        {
                            var sourceFiles = Directory.GetFiles(backupDir, "*.png")
                                .Concat(Directory.GetFiles(backupDir, "*.jpg"))
                                .Concat(Directory.GetFiles(backupDir, "*.jpeg"))
                                .OrderBy(f => f)
                                .ToList();
                            addedfiles.AddRange(sourceFiles);
                        }
                        if (addedfiles.Count == 0)
                        {
                            return await Task.Run(() =>
                            {
                                return BadRequest("There is no Record found for your request. Try with File Upload.");
                            });
                        }
                        #endregion

                        #region Check the Drawing is being used by any other user
                        // Removed: Allow multiple users to open the same drawing simultaneously
                        string Token = Fname;
                        string ClientID = user.Id.ToString() + "-" + groupId.ToString();
                        TokenManager.TryUpdateToken(Token, ClientID);
                        #endregion
                        dtFiles_Header = helper.RequestHeader(dtFiles_Header);
                        dtFiles_Production = helper.RequestProduct(dtFiles_Production);

                        await helper.TableProperties(dtFiles_Production, addedfiles, partial_image);

                        #region Resize the Drawing Images for Download purpose
                        await Task.Run(() => {
                            partial_image = new List<AllinoneBalloon.Entities.Common.PartialImage>();
                            resized_image = new List<AllinoneBalloon.Entities.Common.ResizeImageSize>();
                            int sc = 0;
                            for (int rt = 0; rt < addedfiles.Count; rt++)
                            {
                                dtFiles_Production.Rows[rt]["resize"] = helper.scaleImage(partial_image, addedfiles[rt], sc, true, objerr);
                                string addedfile = (string)dtFiles_Production.Rows[rt]["FileName"];
                                string sampleFilePath = System.IO.Path.Combine(samplePath, addedfile);
                                string addedfilePath = (string)dtFiles_Production.Rows[rt]["FilePath"];
                                resized_image = helper.ResizeImage(resized_image, addedfilePath, sampleFilePath, ResizeMax, ResizeMax);
                                sc++;
                            }
                        });
                        #endregion

                        string rotatea = hdr.RotateProperties;

                        #region Rotate image if required
                        try
                        {
                            var matches = Regex.Matches(rotatea, @"\d+");
                            int[] numbers = matches.Cast<Match>().Select(m => int.Parse(m.Value)).ToArray();
                            for (int k = 0; k < dtFiles_Production.Rows.Count; k++)
                            {
                                string desFile = dtFiles_Production.Rows[k]["FileName"].ToString();
                                string Source = System.IO.Path.Combine(backupDir, desFile);
                                var filePath = System.IO.Path.Combine(clientPath, desFile);
                                var workingPath = System.IO.Path.Combine(workingDir, desFile);
                                System.IO.File.Copy(Source, filePath, true);
                                System.IO.File.Copy(Source, workingPath, true);
                                dtFiles_Production.Rows[k]["FilePath"] = workingPath;
                                dtFiles_Production.Rows[k]["Annotation"] = workingPath;
                                if (numbers.Length > 0)
                                {
                                    try
                                    {
                                        dtFiles_Production.Rows[k]["rotation"] = numbers[k];
                                        await helper.RotateImagefile(filePath, numbers[k]);
                                        await helper.RotateImagefile(workingPath, numbers[k]);
                                    }
                                    catch (Exception ex)
                                    {
                                        objerr.WriteErrorToText(ex);
                                        dtFiles_Production.Rows[k]["rotation"] = 0;
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            objerr.WriteErrorToText(ex);
                            string table = dtFiles_Production.ToString();
                            objerr.WriteErrorLog(table);
                        }
                        #endregion

                        #region check drawings if available 
                        if (addedfiles.Count > 0)
                        {
                            string Urole = user.Role;
                            string Quantity = "1";
                            Routerno = "N/A";
                            string rotate = await helper.Rotate(dtFiles_Production);

                            CreateHeader ch = new CreateHeader();
                            ch.DrawingNo = DrawingNo; ch.RevisionNo = RevisionNo; ch.Routerno = Routerno; ch.Quantity = Quantity;
                            ch.Total = addedfiles.Count; ch.rotate = rotate; ch.UserName = username; ch.Session = session_UserId;
                            ch.GroupId = groupId;
                            ch.FilePath = System.IO.Path.Combine("SourceDrawings", groupId.ToString(), DrawingNo + "-" + RevisionNo);
                            await helper.TableHeaderProperties(dtFiles_Header, ch);

                            if (Urole == Role.Admin)
                            {
                                if (hdr == null)
                                {
                                    await helper.CreateHeader(context, ch);
                                }
                                else
                                {
                                    await helper.UpdateHeader(context, ch, hdr);
                                }
                            }
                        }
                        else
                        {
                            return BadRequest("Please upload a valid file.");
                        }
                        #endregion

                        #region Get Balloon and settings details
                        BalloonController balcon = new BalloonController(_dbcontext);
                        balloons = balcon.get(DrawingNo, RevisionNo, Routerno, groupId);
                        globalSettings = (from s in context.TblBaloonDrawingSettings.AsNoTracking()
                                          join h in context.TblBaloonDrawingHeaders.AsNoTracking()
                                         on s.BaloonDrwId
                                         equals h.BaloonDrwID
                                         into sh
                                          from e in sh.DefaultIfEmpty()
                                          where e.GroupId == groupId && e.ProductionOrderNumber == "N/A" && e.DrawingNumber == DrawingNo.ToString() && e.Revision == RevisionNo.ToString()
                                          select new AllinoneBalloon.Models.Settings()
                                          {
                                              DefaultBalloon = s.DefaultBalloon,
                                              ErrorBalloon = s.ErrorBalloon,
                                              SuccessBalloon = s.SuccessBalloon,
                                              Routerno = Routerno.ToString(),
                                              DrawingNo = DrawingNo.ToString(),
                                              RevNo = RevisionNo.ToString(),
                                              MaterialQty = 1,
                                              BalloonShape = s.BalloonShape,
                                              MinMaxOneDigit = s.MinMaxOneDigit,
                                              MinMaxTwoDigit = s.MinMaxTwoDigit,
                                              MinMaxThreeDigit = s.MinMaxThreeDigit,
                                              MinMaxFourDigit = s.MinMaxFourDigit,
                                              MinMaxAngles = s.MinMaxAngles,
                                              convert = s.convert,
                                              fontScale = s.fontScale,
                                          }).ToList();
                        #endregion

                        #region Get CC details
                        List<selectedcc> controllCopy = new List<selectedcc>();

                        controllCopy = await helper.TblControllCopy(context, hdrid);
                        if (controllCopy.Count == 0)
                        {
                            int sc = 1;
                            foreach (string s in addedfiles)
                            {
                                var list = new List<Dictionary<string, string>>();

                                // Add the first dictionary to the list
                                list.Add(new Dictionary<string, string>
                        {
                            { "x", "0" },
                            { "y", "0" },
                            { "width", "0" },
                            { "height", "0" },
                        });
                                var firstItem = list[0];
                                controllCopy.Add(new selectedcc { textGroupPlaced = false, pageNo = sc, drawingNo = DrawingNo, revNo = RevisionNo, routerno = Routerno, origin = firstItem });
                                sc++;
                            }
                        }
                        #endregion

                        #region Response Data
                        return_Object.Add("FileInfo", dtFiles_Production);
                        return_Object.Add("HeaderInfo", dtFiles_Header);
                        return_Object.Add("Balloons", balloons);
                        //var lmtype = context.TblMeasureTypes.OrderBy(x => x.Type_ID).ToList();
                        var lmtype = helper.Load_MeasureType(objerr);
                        //var lmsubtype = context.TblMeasureSubTypes.OrderBy(x => x.SubTypeId).ToList();
                        var lmsubtype = helper.Load_MeasureSubType(objerr);
                        var unitType = helper.Load_UnitType(objerr);
                        var CharacteristicsType = helper.Load_CharacteristicsType(objerr);
                        //var ToleranceType = context.TblToleranceTypes.OrderBy(x => x.ID).ToList();    
                        var ToleranceType = helper.Load_ToleranceType(objerr);
                        return_Object.Add("MeasureType", lmtype);
                        return_Object.Add("MeasureSubType", lmsubtype);
                        return_Object.Add("UnitsType", unitType); // units 
                        return_Object.Add("TolerenceType", ToleranceType); // Tolerance
                        return_Object.Add("ImageInfo", partial_image);
                        return_Object.Add("SettingsInfo", globalSettings);
                        return_Object.Add("CharacteristicsType", CharacteristicsType);
                        var exportTemplate = helper.Load_exportTemplate(demo, objerr);
                        return_Object.Add("TemplateType", exportTemplate);
                        return_Object.Add("controllCopy", controllCopy);
                        return_Object.Add("resized_image", resized_image);
                        return_Object.Add("Token", Token);
                        return_Object.Add("ClientID", ClientID);
                        #endregion
                    }
                    return StatusCode(StatusCodes.Status200OK, return_Object);
                }
                catch (Exception ex)
                {
                    objerr.WriteErrorToText(ex);
                    return BadRequest("Please upload a valid file.");
                }
            }
        }
        #endregion

    }
}

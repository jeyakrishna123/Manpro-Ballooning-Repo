using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Data;
using System.Text.RegularExpressions;

namespace AllinoneBalloon.Controllers
{
    public partial class FileUploadController
    {
        #region search API
        [Authorize]
        [HttpPost("search")]
        public async Task<IActionResult> Search(SearchFormRequest request)
        {
            using var context = _dbcontext.CreateDbContext();
            string env = _appSettings.ENVIRONMENT;
            Dictionary<string, object> return_Object = new Dictionary<string, object>();
            if (env != "development")
            {
                envcpath = AppDomain.CurrentDomain.BaseDirectory;
            }
            string session_UserId = string.Empty;
            string sessionUserId = request.sessionUserId;
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
                var permission = jwtToken.Claims.Where(c => c.Type == "Permission").Select(c => c.Value).ToList();
                bool add_actual_value = permission.Contains("add_actual_value");
                //long groupId = context.UserGroups.FirstOrDefault(a => a.UserId == user.Id).GroupId;

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
                string samplePath = System.IO.Path.Combine(clientPath, "sample");
                samplePath = helper.AddTrailingSlash(samplePath);
                if (!Directory.Exists(samplePath))
                {
                    Directory.CreateDirectory(samplePath);
                }
                #endregion

                if (!add_actual_value)
                {
                    return await Task.Run(() =>
                    {
                        return BadRequest("Permission denied.");
                    });
                }
                dtFiles_Header = helper.RequestHeader(dtFiles_Header);
                dtFiles_Production = helper.RequestProduct(dtFiles_Production);

                sourceDir = System.IO.Path.Combine(sourceDir, groupId.ToString());
                sourceDir = helper.AddTrailingSlash(sourceDir);
                if (!Directory.Exists(sourceDir))
                {
                    Directory.CreateDirectory(sourceDir);
                }
                long hdrid = default;
                string DrawingNo = request.drawingNo.ToUpper().Trim();
                string RevisionNo = request.revNo.ToUpper().Trim();
                string Routerno = request.routerNo.ToUpper().Trim();
                string MaterialQty = request.materialQty.Trim();
                var settingtable = context.TblBaloonDrawingSettings;
                var hdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == "N/A" && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                if (hdr == null)
                {
                    return await Task.Run(() =>
                    {
                        return BadRequest("There is no Record found for your request.");
                    });
                }
                else
                {
                    hdrid = hdr.BaloonDrwID;
                    var lnritems = context.TblBaloonDrawingLiners.Where(w => w.BaloonDrwID == hdrid && w.ProductionOrderNumber == "N/A" && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).ToList();

                    if (lnritems.Count == 0)
                    {
                        return await Task.Run(() =>
                        {
                            return BadRequest("There is no Record found for your request.");
                        });
                    }
                    else
                    {
                        var files = context.TblBaloonDrawingLiners.Where(w => w.BaloonDrwID == hdrid ).GroupBy( w => w.BaloonDrwFileID).Select(g => new
                        {
                            Name = g.Key,
                            Page_NO = g.FirstOrDefault().Page_No
                        }).OrderBy(r => r.Page_NO);

                        string Fname = request.drawingNo.Trim().ToUpper().ToString() + "-" + request.revNo.Trim().ToUpper().ToString();
                        string backupDir = System.IO.Path.Combine(sourceDir, Fname);
                        List<string> addedfiles = new List<string>();
                        foreach (var file in files)
                        {
                            string filePath = System.IO.Path.Combine(backupDir, file.Name);
                            if (System.IO.File.Exists(filePath))
                            {
                                addedfiles.Add(filePath);
                            }
                        }
                        if (addedfiles.Count == 0)
                        {
                            return await Task.Run(() =>
                            {
                                return BadRequest("There is no Record found for your request.");
                            });
                        }

                        #region delete previous request drawings
                        await helper.DeleteOldFiles(workingDir);
                        await helper.DeleteFiles(clientPath);
                        await helper.DeleteFiles(workingDir);
                        #endregion
       
                        await helper.TableProperties(dtFiles_Production, addedfiles, partial_image);
                        string rotate = hdr.RotateProperties;
                        try
                        {
                            var matches = Regex.Matches(rotate, @"\d+");
                            int[] numbers = matches.Cast<Match>().Select(m => int.Parse(m.Value)).ToArray();
                            for (int k = 0; k < dtFiles_Production.Rows.Count; k++)
                            {
                                string desFile = dtFiles_Production.Rows[k]["FileName"].ToString();
                                string Source = System.IO.Path.Combine(backupDir , desFile);
                                var filePath = System.IO.Path.Combine(clientPath , desFile);
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
                        resized_image = new List<AllinoneBalloon.Entities.Common.ResizeImageSize>();
                        for (int k = 0; k < dtFiles_Production.Rows.Count; k++)
                        {
                            string addedfile = (string)dtFiles_Production.Rows[k]["FileName"];
                            string addedfilePath = (string)dtFiles_Production.Rows[k]["FilePath"];
                            string sampleFilePath = System.IO.Path.Combine(clientPath, "sample", addedfile);
                            resized_image = helper.ResizeImage(resized_image,addedfilePath, sampleFilePath , ResizeMax, ResizeMax);
                        }

                        CreateHeader ch = new CreateHeader();
                        ch.DrawingNo = DrawingNo; ch.RevisionNo = RevisionNo; ch.Routerno = Routerno; ch.Quantity = MaterialQty;
                        ch.Total = addedfiles.Count; ch.rotate = rotate; ch.UserName = username; ch.Session = session_UserId;
                        ch.GroupId = groupId;
                        await helper.TableHeaderProperties(dtFiles_Header, ch);
                        var settings  = settingtable.Where(w => w.BaloonDrwId == hdrid).FirstOrDefault();
                        List<selectedcc> controllCopy = new List<selectedcc>();
                        controllCopy = await helper.TblControllCopy(context, hdrid);
                        /**** copying source such as balloons, settings and cc ****/
                        string Urole = user.Role;
                        var nhdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId  && w.ProductionOrderNumber == Routerno.ToString() && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                        if (Urole != Role.Admin)
                        {
                            if (nhdr == null)
                            {
                                await helper.CreateHeader(context, ch);
                            }
                            else
                            {
                                await helper.UpdateHeader(context, ch, nhdr);
                            }
                            var newhdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == Routerno.ToString() && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                            hdrid = newhdr.BaloonDrwID;
                            var dlnew = context.TblDimensionInputLiners.Where(w => w.BaloonDrwID == hdrid).FirstOrDefault();
                            int intMaterialQty;
                            if (int.TryParse(MaterialQty.ToString(), out intMaterialQty))
                            { // first time operation
                                if (dlnew == null)
                                {
                                    List<TblDimensionInputLiner> dlnr = new List<TblDimensionInputLiner>();
                                    foreach (var i in lnritems)
                                    {
                                        var list_op = new List<Dictionary<string, string>>();
                                        var list_li = new List<Dictionary<string, string>>();
                                        var list_fi = new List<Dictionary<string, string>>();
                                        for (int row = 1; intMaterialQty >= row; row++)
                                        {
                                            list_op.Add(new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } });
                                            list_li.Add(new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } });
                                            list_fi.Add(new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } });
                                        }
                                        List<Dictionary<string, string>> op = list_op.ToList();
                                        string json_opData = JsonConvert.SerializeObject(op, Formatting.Indented, new JsonSerializerSettings
                                        {
                                            PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                        });
                                        List<Dictionary<string, string>> li = list_li.ToList();
                                        string json_liData = JsonConvert.SerializeObject(li, Formatting.Indented, new JsonSerializerSettings
                                        {
                                            PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                        });
                                        List<Dictionary<string, string>> fi = list_fi.ToList();
                                        string json_fiData = JsonConvert.SerializeObject(fi, Formatting.Indented, new JsonSerializerSettings
                                        {
                                            PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                        });

                                        dlnr.Add(new TblDimensionInputLiner
                                        {
                                            BaloonDrwID = hdrid,
                                            Page_No = i.Page_No,
                                            Balloon = i.Balloon,
                                            Actual_OP = json_opData,
                                            Actual_LI = json_liData,
                                            Actual_FI= json_fiData,
                                            CreatedAt = i.CreatedDate,
                                            UpdatedAt = i.ModifiedDate
                                        });
                                    }
                                    context.TblDimensionInputLiners.AddRange(dlnr);
                                    context.SaveChanges();
                                }
                                else
                                {
                                    foreach (var i in lnritems)
                                    {
                                        TblDimensionInputLiner udl = new TblDimensionInputLiner();
                                        var udlnew = context.TblDimensionInputLiners.Where(w => w.BaloonDrwID == hdrid && w.Page_No == i.Page_No && w.Balloon == i.Balloon).FirstOrDefault();
                                        // fallback 
                                        if (udlnew == null)
                                        {
                                            var list_op = new List<Dictionary<string, string>>();
                                            var list_li = new List<Dictionary<string, string>>();
                                            var list_fi = new List<Dictionary<string, string>>();
                                            for (int row = 1; intMaterialQty >= row; row++)
                                            {
                                                list_op.Add(new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } });
                                                list_li.Add(new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } });
                                                list_fi.Add(new Dictionary<string, string> { { "Actual", "" }, { "Decision", "" } });
                                            }
                                            List<Dictionary<string, string>> op = list_op.ToList();
                                            string json_opData = JsonConvert.SerializeObject(op, Formatting.Indented, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });
                                            List<Dictionary<string, string>> li = list_li.ToList();
                                            string json_liData = JsonConvert.SerializeObject(li, Formatting.Indented, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });
                                            List<Dictionary<string, string>> fi = list_fi.ToList();
                                            string json_fiData = JsonConvert.SerializeObject(fi, Formatting.Indented, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });

                                            udl.BaloonDrwID = hdrid;
                                            udl.Page_No = i.Page_No;
                                            udl.Balloon = i.Balloon;
                                            udl.Actual_OP = json_opData;
                                            udl.Actual_LI = json_liData;
                                            udl.Actual_FI = json_fiData;
                                            udl.CreatedAt = i.CreatedDate;
                                            udl.UpdatedAt = i.ModifiedDate;
                                            context.TblDimensionInputLiners.Add(udl);
                                            context.SaveChanges();
                                        }
                                        else
                                        {
                                            var ActualOP = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(udlnew.Actual_OP, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });
                                            if (ActualOP.Count > intMaterialQty)
                                            {
                                                ActualOP.RemoveRange(intMaterialQty, ActualOP.Count - intMaterialQty);
                                            }
                                            if (ActualOP.Count < intMaterialQty)
                                            {
                                                while (ActualOP.Count < intMaterialQty)
                                                {
                                                    Dictionary<string, string> list = new Dictionary<string, string>
                                                    {
                                                        { "Actual", "" }, { "Decision", "" }
                                                    };
                                                    ActualOP.Add(list);
                                                }
                                            }
                                            List<Dictionary<string, string>> actual_op = ActualOP.ToList();
                                            string json_opData = JsonConvert.SerializeObject(actual_op, Formatting.Indented, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });

                                            var ActualLI = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(udlnew.Actual_LI, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });
                                            if (ActualLI.Count > intMaterialQty)
                                            {
                                                ActualLI.RemoveRange(intMaterialQty, ActualLI.Count - intMaterialQty);
                                            }
                                            if (ActualLI.Count < intMaterialQty)
                                            {
                                                while (ActualLI.Count < intMaterialQty)
                                                {
                                                    Dictionary<string, string> list = new Dictionary<string, string>
                                                    {
                                                        { "Actual", "" }, { "Decision", "" }
                                                    };
                                                    ActualLI.Add(list);
                                                }
                                            }
                                            List<Dictionary<string, string>> actual_li = ActualLI.ToList();
                                            string json_liData = JsonConvert.SerializeObject(actual_li, Formatting.Indented, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });

                                            var ActualFI = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(udlnew.Actual_FI, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });
                                            if (ActualFI.Count > intMaterialQty)
                                            {
                                                ActualFI.RemoveRange(intMaterialQty, ActualFI.Count - intMaterialQty);
                                            }
                                            if (ActualFI.Count < intMaterialQty)
                                            {
                                                while (ActualFI.Count < intMaterialQty)
                                                {
                                                    Dictionary<string, string> list = new Dictionary<string, string>
                                                    {
                                                        { "Actual", "" }, { "Decision", "" }
                                                    };
                                                    ActualFI.Add(list);
                                                }
                                            }
                                            List<Dictionary<string, string>> actual_fi = ActualFI.ToList();
                                            string json_fiData = JsonConvert.SerializeObject(actual_fi, Formatting.Indented, new JsonSerializerSettings
                                            {
                                                PreserveReferencesHandling = PreserveReferencesHandling.Objects
                                            });

                                            // actual = ActualDecision.ToString();
                                            udlnew.BaloonDrwID = hdrid;
                                            udlnew.Page_No = i.Page_No;
                                            udlnew.Balloon = i.Balloon;
                                            udlnew.Actual_OP = json_opData;
                                            udlnew.Actual_LI = json_liData;
                                            udlnew.Actual_FI = json_fiData;
                                            udlnew.UpdatedAt = i.ModifiedDate;
                                            context.SaveChanges();
                                        }// liner qty based update
                                    }// ens liner loop
                                }// end existing liner actual
                            }// end tryparse materialqty
                        }// end role
                        /******* end of copying source ********/
                        string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
                        bool demo;
                        
                        var config = new ConfigurationBuilder()
                           .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true) // Always load base appsettings.json
                           .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true) // Optionally load environment-specific settings
                           .Build();
                        demo = config.GetValue<bool>("Demo", defaultValue: false);
                        balloons = await helper.GetLiner(context,ch.DrawingNo, ch.RevisionNo , ch.Routerno, hdrid, groupId);
                        System.Data.DataTable settingdataTable = new System.Data.DataTable();
                        var entityType = context.Model.FindEntityType(typeof(TblBaloonDrawingSetting));
                        var tableName = entityType.GetTableName();

                        settingdataTable = await helper.CreateDataTable(_appSettings.MySqlConnStr, tableName, settingdataTable);
                        settingdataTable = await helper.AddRowToDataTable(settings, settingdataTable);
                        settingdataTable.Columns.Remove("SettingsID");
                        settingdataTable.Columns.Remove("BaloonDrwId");
                        settingdataTable.Columns.Add("Routerno");
                        settingdataTable.Columns.Add("DrawingNo");
                        settingdataTable.Columns.Add("RevNo");
                        settingdataTable.Columns.Add("MaterialQty");
                        foreach (DataRow row in settingdataTable.Rows)
                        {
                            row["Routerno"] = ch.Routerno;
                            row["DrawingNo"] = ch.DrawingNo;
                            row["RevNo"] = ch.RevisionNo;
                            row["MaterialQty"] = ch.Quantity;
                            row["convert"] = (row["convert"].ToString() == "True") ? true : false;
                        }
                        return_Object.Add("FileInfo", dtFiles_Production);
                        return_Object.Add("HeaderInfo", dtFiles_Header);
                        return_Object.Add("Balloons", balloons);
                        var lmtype = helper.Load_MeasureType(objerr);
                        var lmsubtype = helper.Load_MeasureSubType(objerr);
                        var unitType = helper.Load_UnitType(objerr);
                        var CharacteristicsType = helper.Load_CharacteristicsType(objerr);   
                        var ToleranceType = helper.Load_ToleranceType(objerr);
                        return_Object.Add("MeasureType", lmtype);
                        return_Object.Add("MeasureSubType", lmsubtype);
                        return_Object.Add("UnitsType", unitType); // units 
                        return_Object.Add("TolerenceType", ToleranceType); // Tolerance
                        return_Object.Add("ImageInfo", partial_image);
                        return_Object.Add("SettingsInfo", settingdataTable);
                        return_Object.Add("CharacteristicsType", CharacteristicsType);
                        var exportTemplate = helper.Load_exportTemplate(demo, objerr);
                        return_Object.Add("TemplateType", exportTemplate);
                        return_Object.Add("controllCopy", controllCopy);
                        return_Object.Add("resized_image", resized_image);
                        return_Object.Add("diff", false);
                    }
                }
                return StatusCode(StatusCodes.Status200OK, return_Object);
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                return BadRequest("Something went Wrong!.");
            }
        }
        #endregion

    }
}

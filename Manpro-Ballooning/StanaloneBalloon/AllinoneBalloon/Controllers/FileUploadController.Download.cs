#region Importing Libraries
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.AspNetCore.Routing.Template;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileSystemGlobbing.Internal;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.IdentityModel.Tokens;

using System;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;
using System.Data;
using System.Text;
using System.Text.RegularExpressions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using static System.Net.WebRequestMethods;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Reflection.Metadata;
using System.Linq;
using System.Diagnostics.Metrics;
using System.ServiceModel.Channels;
using System.Reflection.PortableExecutable;
using System.Net.Mail;
using System.Collections.Generic;
using System.Security.Policy;

using AllinoneBalloon;
using AllinoneBalloon.Controllers;
using AllinoneBalloon.Models.Configuration;
using AllinoneBalloon.Models;
using AllinoneBalloon.Common;
using AllinoneBalloon.Services;
using AllinoneBalloon.Entities;

using ClosedXML.Excel;
using MailKit.Search;
using Newtonsoft.Json;
using Mysqlx.Resultset;
using MySqlX.XDevAPI.Common;
using MimeKit;
using ImageMagick;
using static AllinoneBalloon.Entities.Common;
using System.Net;
using System.Net.Http;
using Org.BouncyCastle.Asn1.Ocsp;
using DocumentFormat.OpenXml.Spreadsheet;
#endregion

namespace AllinoneBalloon.Controllers
{
    public partial class FileUploadController
    {
        #region Download API
        [Authorize]
        [HttpPost("Download")]
        public async Task<IActionResult> GenerateExcelAndDownload([FromBody] DownloadRequest request)
        { 
            List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults = new List<AllinoneBalloon.Entities.Common.OCRResults>();
            using var context = _dbcontext.CreateDbContext();
            ClosedXmlReportGenerator ReportGenerator = new AllinoneBalloon.Common.ClosedXmlReportGenerator();
            string username = string.Empty;
            string session_UserId = request.session_UserId;
            string env = _appSettings.ENVIRONMENT;
            if (env != "development")
            {
                envcpath = AppDomain.CurrentDomain.BaseDirectory;
            }
            try
            {
                #region Create session
                if (sessionData == null)
                {
                    sessionData = helper.setsession(HttpContext);
                }

                if (session_UserId == "null" || session_UserId == null)
                {
                    session_UserId = sessionData.sessionUserId;
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
                workingDir = System.IO.Path.Combine(workingDir, session_UserId.ToString(), "downloads");
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
                #endregion

                #region User Group
                string Urole = user.Role;
                var gid = jwtToken.Claims.Where(c => c.Type == "groupId").Select(c => c.Value).FirstOrDefault();
                bool groupExist = long.TryParse(gid, out groupId);
                sourceDir = System.IO.Path.Combine(sourceDir, groupId.ToString());
                sourceDir = helper.AddTrailingSlash(sourceDir);
                if (!Directory.Exists(sourceDir))
                {
                    Directory.CreateDirectory(sourceDir);
                }
                #endregion

                var getuser = context.Users.Include(g => g.UserGroups)
                .ThenInclude(g => g.Group)
                .Include(g => g.UserRoles)
                .ThenInclude(g => g.Role)
                .Include(g => g.UserPermission)
                .ThenInclude(g => g.Permission)
                .Where(u => u.UserGroups.Any(ug => ug.GroupId == groupId))
                .AsSplitQuery()
                .FirstOrDefault(u => u.Id == user.Id);

                var hdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == request.Routerno.ToUpper().ToString() && w.DrawingNumber == request.drawingNo.ToUpper().ToString() && w.Revision == request.revNo.ToUpper().ToString()).FirstOrDefault();
                if (hdr == null)
                {
                    return await Task.Run(() =>
                    {
                        return BadRequest("There is no Record found for your request.");
                    });
                }
                var lnritems = context.TblBaloonDrawingLiners.Where(w => w.ProductionOrderNumber == "N/A" && w.DrawingNumber == request.drawingNo.ToUpper().ToString() && w.Revision == request.revNo.ToUpper().ToString()).ToList();
                if (lnritems.Count == 0)
                {
                    return await Task.Run(() =>
                    {
                        return BadRequest("There is no Record found for your request.");
                    });
                }
                long hdrid = hdr.BaloonDrwID;
                string templateDir = System.IO.Path.Combine(envcpath, "Templates") + System.IO.Path.DirectorySeparatorChar;
                var files = context.TblBaloonDrawingLiners.Where(w => w.BaloonDrwID == hdrid).GroupBy(w => w.BaloonDrwFileID).Select(g => new
                {
                    Name = g.Key,
                    Page_NO = g.FirstOrDefault().Page_No
                }).OrderBy(r => r.Page_NO);
                string DrawingNo = request.drawingNo.Trim().ToUpper().ToString();
                string RevisionNo = request.revNo.Trim().ToUpper().ToString();
                string Routerno = request.Routerno.Trim().ToUpper().ToString();
                int MaterialQty = request.MaterialQty;
                string rotate = hdr.RotateProperties;

                string DateTime =  string.Join("_", System.DateTime.Now.ToString("ddMMyyyy_HHmmss") , Regex.Replace(request.templatetype, @"[^a-zA-Z0-9]", "_").ToLower().ToString());
                string Fname = DrawingNo + "-" + RevisionNo;
                string Zname = DrawingNo + "_" + RevisionNo;
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

                CreateHeader ch = new CreateHeader();
                ch.DrawingNo = DrawingNo; ch.RevisionNo = RevisionNo; ch.Routerno = Routerno; ch.Quantity = MaterialQty.ToString();
                ch.Total = addedfiles.Count; ch.rotate = rotate; ch.UserName = username; ch.Session = session_UserId;
                ch.GroupId = groupId;
                var template = context.TblTemplates.Where(w => w.group_name == request.templatetype.ToString()).ToList();
                if (template != null)
                {                   
                    bool hasAddActualValue = getuser.HasPermission("add_actual_value");
                    if (hasAddActualValue) {
                        balloons = await helper.GetLiner(context, ch.DrawingNo, ch.RevisionNo, ch.Routerno, hdrid, groupId);
                    }
                    bool hasCreateBalloon = getuser.HasPermission("create_balloon");
                    if (hasCreateBalloon) {
                        BalloonController balcon = new BalloonController(_dbcontext);
                        balloons = balcon.get(DrawingNo, RevisionNo, Routerno, groupId);
                    }
                    var shdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == "N/A" && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                    var settings = context.TblBaloonDrawingSettings.Where(w => w.BaloonDrwId == shdr.BaloonDrwID).FirstOrDefault();
                    foreach (var file in template)
                    {
                        string templateFile = file.File;
                        var templatePath = System.IO.Path.Combine(templateDir, templateFile);
                        string fileWithoutExtension = System.IO.Path.GetFileNameWithoutExtension(templatePath);
                        string functionName = $"GenerateReport{fileWithoutExtension}";
                        Type[] parameterTypes = { typeof(string), typeof(string), typeof(string), typeof(CreateHeader), typeof(IEnumerable<object>), typeof(TblBaloonDrawingSetting) };
                        object[] parameters = { templatePath, workingDir, Urole, ch, balloons, settings };
                        MethodInfo method = typeof(AllinoneBalloon.Common.ClosedXmlReportGenerator).GetMethod(functionName, BindingFlags.Static | BindingFlags.Public);
                        method.Invoke(null, parameters);
                    }
                }

                try
                {
                    string zipName = string.Empty;
                    if (Urole == Role.Admin)
                    {
                        zipName = $"{Zname}_{DateTime}.zip";
                    }
                    else
                    {
                        zipName = $"{Zname}_{Routerno}_{DateTime}.zip";
                    }
                    var zipPath = System.IO.Path.Combine(workingDir, zipName);
                    
                    string outputPdfPath = System.IO.Path.Combine(workingDir, $"{Fname}.pdf");
                    
                    using (var zipArchive = ZipFile.Open(zipPath, ZipArchiveMode.Create))
                    {
                        // Add PDF
                        zipArchive.CreateEntryFromFile(outputPdfPath, System.IO.Path.GetFileName(outputPdfPath));

                        // Add balloon PNG images and generate JPG versions
                        var pngFiles = Directory.GetFiles(workingDir, $"{Fname}_*.png");
                        foreach (var pngFile in pngFiles)
                        {
                            // Add PNG to zip
                            zipArchive.CreateEntryFromFile(pngFile, System.IO.Path.GetFileName(pngFile));

                            // Convert PNG to JPG and add to zip
                            string jpgFile = System.IO.Path.ChangeExtension(pngFile, ".jpg");
                            using (var img = SixLabors.ImageSharp.Image.Load(pngFile))
                            {
                                img.Save(jpgFile, new SixLabors.ImageSharp.Formats.Jpeg.JpegEncoder());
                            }
                            zipArchive.CreateEntryFromFile(jpgFile, System.IO.Path.GetFileName(jpgFile));
                        }

                        // Add Excel template files
                        if (template != null)
                        {
                            foreach (var file in template)
                            {
                                string templateFile = file.File;
                                string outputXLPath = System.IO.Path.Combine(workingDir, $"{templateFile}");
                                if (System.IO.File.Exists(outputXLPath))
                                {
                                    zipArchive.CreateEntryFromFile(outputXLPath, System.IO.Path.GetFileName(outputXLPath));
                                }
                            }
                        }
                    }
                    var bytes = await System.IO.File.ReadAllBytesAsync(zipPath);
                    // Serve the zip file with custom headers
                    // Add custom headers
                    Response.Headers.Add("X-Custom-Header", "DownloadedImages");
                    Response.Headers.Add("Content-Disposition", $"attachment; filename={zipName}");
                    // Set response headers
                    Response.ContentType = "application/zip";
                    return File(bytes, "application/zip", zipName);                    
                }
                finally
                {
                    // Clean up temporary files
                   // await helper.DeleteFiles(workingDir);
                }
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

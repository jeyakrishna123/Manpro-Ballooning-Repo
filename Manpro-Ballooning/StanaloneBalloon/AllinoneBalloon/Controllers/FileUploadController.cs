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
using Microsoft.Extensions.Caching.Memory;
#endregion

namespace AllinoneBalloon.Controllers
{
    #region Router FileUpload
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public partial class FileUploadController : ControllerBase
    {
        #region class

        #region Download Request

        public class DownloadRequest
        {
            public string drawingNo { get; set; }
            public string revNo { get; set; }
            public string templatetype { get; set; }
            public string session_UserId { get; set; }
            public string Routerno { get; set; }
            public int MaterialQty { get; set; }

        }

        #region SearchForm
        public class SearchFormRequest
        {
            public string drawingNo { get; set; }
            public string revNo { get; set; }
            public string routerNo { get; set; }
            public string materialQty { get; set; }
            public string sessionUserId { get; set; }
            public bool agree { get; set; }
        }
        public class BlockRequest
        {
            public long hdrid { get; set; }
        }
        #endregion

        public class ItemRepository
        {
            private readonly Dictionary<string, List<AllinoneBalloon.Entities.Common.OCRResults>> _itemDictionary;
            public ItemRepository()
            {
                _itemDictionary = new Dictionary<string, List<AllinoneBalloon.Entities.Common.OCRResults>>();
            }

            // Method to add items to a specific key
            public void AddItems(string key, List<AllinoneBalloon.Entities.Common.OCRResults> items)
            {
                if (_itemDictionary.ContainsKey(key))
                {
                    _itemDictionary[key].AddRange(items);
                }
                else
                {
                    _itemDictionary[key] = new List<AllinoneBalloon.Entities.Common.OCRResults>(items);
                }
            }

            // Method to get items by key
            public List<AllinoneBalloon.Entities.Common.OCRResults> GetItems(string key)
            {
                if (_itemDictionary.TryGetValue(key, out var items))
                {
                    return items;
                }
                return new List<AllinoneBalloon.Entities.Common.OCRResults>();
            }

            // Method to get all items
            public Dictionary<string, List<AllinoneBalloon.Entities.Common.OCRResults>> GetAllItems()
            {
                return _itemDictionary;
            }

            // Method to find the group name by item name
            public string FindGroupNameByItemName(string itemName)
            {
                foreach (var kvp in _itemDictionary)
                {
                    if (kvp.Value.Any(item => item.Balloon == itemName))
                    {
                        return kvp.Key;
                    }
                }
                return null; // or return an appropriate value indicating the item was not found
            }
        }

        public class SequenceGenerator
        {
            private readonly string _prefix;
            private int _currentNumber;
            public SequenceGenerator(string prefix, int n)
            {
                if (prefix.Length != 7 || !int.TryParse(prefix, out _))
                {
                    throw new ArgumentException("Prefix must be a 7-digit number.");
                }
                _prefix = prefix;
                _currentNumber = n;
            }
            public string GetNextSequence()
            {
                _currentNumber++;
                return $"{_prefix}-{_currentNumber:D3}";
            }
        }

        #endregion

        #endregion

        #region Referencing the Dependency Injection (DI) and Properties
        private readonly AppSettings _appSettings;
        private readonly IDbContextFactory<DimTestContext> _dbcontext;
        private readonly IMemoryCache _memoryCache;
       // private readonly IHttpContextAccessor _httpcontext;
        string envcpath = Environment.CurrentDirectory;
        public DataTable dtFiles_Production = new DataTable("Production_Files");
        public DataTable dtFiles_Header = new DataTable("Drawing_Header");
        List<AllinoneBalloon.Entities.Common.PartialImage> partial_image = new List<AllinoneBalloon.Entities.Common.PartialImage>();
        List<AllinoneBalloon.Entities.Common.ResizeImageSize>  resized_image = new List<AllinoneBalloon.Entities.Common.ResizeImageSize>();
        IEnumerable<object> globalSettings = new List<object>();
        IEnumerable<object> balloons = new List<object>();
        ErrorLog objerr = new AllinoneBalloon.Common.ErrorLog();
        Helper helper = null;
        JwtSecurityToken jwtToken = null;
        User user = null;
        sessionobj sessionData = null;
        string clientPath = string.Empty;
        string workingDir = string.Empty;
        string sourceDir = string.Empty;
       // private IUserService _userService;
        string username = "Admin";
        long groupId = 0;
        IConfiguration  config = null;
        int ResizeMax = 7000;
        #endregion

        public FileUploadController(IDbContextFactory<DimTestContext> dbcontext, IOptions<AppSettings> options, IMemoryCache memoryCache)
        {
            _dbcontext = dbcontext;
            _appSettings = options.Value;
            _memoryCache = memoryCache;
            string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            config = new ConfigurationBuilder()
           .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true) // Always load base appsettings.json
           .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true) // Optionally load environment-specific settings
           .Build();

            helper = new AllinoneBalloon.Common.Helper(_dbcontext, _memoryCache);
            string env = _appSettings.ENVIRONMENT;
            if (env != "development")
            {
                envcpath = AppDomain.CurrentDomain.BaseDirectory;
            }
            // Auth is handled in each action method — no constructor DB access needed
        }

        #region UploadFile API
        [Authorize]
        [HttpPost("UploadFile")]
        [RequestSizeLimit(52428800)] // 50 MB
        [RequestFormLimits(MultipartBodyLengthLimit = 52428800)]
        public async Task<IActionResult> UploadFile([FromForm] List<IFormFile> files, [FromForm] string sessionUserId, [FromForm] AllinoneBalloon.Models.Settings settings)
        {
            using var context = _dbcontext.CreateDbContext();
            string env = _appSettings.ENVIRONMENT;
            string session_UserId = string.Empty;
            Dictionary<string, object> return_Object = new Dictionary<string, object>();
            try
            {
                #region Create session
                if (sessionData == null)
                {
                    sessionData = helper.setsession(HttpContext);
                }
                if (sessionUserId == "null" || string.IsNullOrEmpty(sessionUserId))
                {
                    session_UserId = sessionData?.sessionUserId ?? Guid.NewGuid().ToString();
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
                if (user == null)
                {
                    // Fallback: get user from JWT claims when refresh token expired
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
                var gid = jwtToken.Claims.Where(c => c.Type == "groupId").Select(c => c.Value).FirstOrDefault();
                bool groupExist = long.TryParse(gid, out groupId);
                sourceDir = System.IO.Path.Combine(sourceDir, groupId.ToString());
                sourceDir = helper.AddTrailingSlash(sourceDir);
                if (!Directory.Exists(sourceDir))
                {
                    Directory.CreateDirectory(sourceDir);
                }
                #endregion

                long hdrid = default;
                string DrawingNo = string.Empty;
                string RevisionNo = string.Empty;
                string Routerno = string.Empty;
                bool demo;
                var settingtable = context.TblBaloonDrawingSettings;
                DrawingNo = settings.DrawingNo.ToUpper().Trim().ToString();
                RevisionNo = settings.RevNo.ToUpper().Trim().ToString();
                var checkHdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == "N/A" && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                if (checkHdr != null && checkHdr.isClosed)
                {
                    return await Task.Run(() =>
                    {
                        return BadRequest("Requested Drawing revision is blocked, Try with New Revision.");
                    });
                }
                string Fname = DrawingNo + "-" + RevisionNo;

                #region Check the Drawing is being used by any other user
                // Removed: Allow multiple users to open the same drawing simultaneously
                string Token = Fname;
                string ClientID = user.Id.ToString() + "-" + groupId.ToString();
                TokenManager.TryUpdateToken(Token, ClientID);
                #endregion

                List<string> addedfiles = new List<string>();
                if (files == null || files.Count == 0)
                {
                    return BadRequest("No file uploaded.");
                }
                else
                {
                    #region delete previous request drawings
                    await helper.DeleteOldFiles(workingDir);
                    await Task.WhenAll(
                        helper.DeleteFiles(clientPath),
                        helper.DeleteFiles(workingDir),
                        Directory.Exists(samplePath) ? helper.DeleteFiles(samplePath) : Task.CompletedTask
                    );
                    #endregion

                    var ext = new List<string> { ".png", ".jpeg", ".jpg", ".pdf" };
                    long maxFileSize = 50 * 1024 * 1024; // 50 MB per file

                    // Validate file types and sizes
                    foreach (var file in files)
                    {
                        var fileExt = System.IO.Path.GetExtension(file.FileName).ToLower();
                        if (!ext.Contains(fileExt))
                        {
                            return BadRequest($"File type '{fileExt}' is not supported. Allowed types: {string.Join(", ", ext)}");
                        }
                        if (file.Length > maxFileSize)
                        {
                            return BadRequest($"File '{file.FileName}' exceeds the maximum size of 50 MB.");
                        }
                    }

                    // Save the uploaded file to a physical path or process it as needed

                    #region To know the no of times / Threshold Limit
                    int DemoLimit;
                    demo = config.GetValue<bool>("Demo", defaultValue: false);
                    DemoLimit = config.GetValue<int>("DemoLimit", defaultValue: 0);
                    DemoLimit = DemoLimit + 1;
                    if (demo)
                    {
                        try
                        {
                            DateTime today = DateTime.Today;
                            var threshold = context.TblDemoThresholds.Where(f => f.UserId == user.Id && f.Created.Date == today ).Sum(a => a.upload_count );
                            var final = files.Count + threshold;
                            if (final < DemoLimit)
                            {
                                var thtable = context.TblDemoThresholds;
                                TblDemoThreshold tblth = new TblDemoThreshold();
                                tblth.UserId = user.Id;
                                tblth.upload_count = files.Count;
                                tblth.Created = DateTime.Now;
                                thtable.Add(tblth);
                                context.SaveChanges();
                            }
                            else
                            {
                              //  return BadRequest("You have reached the upload limit for the Day.");
                            }
                        }
                        catch (Exception ex)
                        {
                            // Handle invalid email format
                            return BadRequest(ex.Message.ToString());
                        }
                    }
                    #endregion

                    /****/
                    dtFiles_Header = helper.RequestHeader(dtFiles_Header);
                    dtFiles_Production = helper.RequestProduct(dtFiles_Production);

                    addedfiles = await helper.StandaloneFileCopy(files, addedfiles, workingDir, clientPath, sourceDir, settings);

                    #region check drawings if available 
                    if (addedfiles.Count > 0)
                    {
                        string Urole = user.Role;
                        string Quantity = "1";
                        Routerno = "N/A";
                        await helper.TableProperties(dtFiles_Production, addedfiles, partial_image);
                        // Parallelize image resizing for multiple files
                        resized_image = new List<AllinoneBalloon.Entities.Common.ResizeImageSize>();
                        if (addedfiles.Count == 1)
                        {
                            await Task.Run(() => {
                                string addedfile = (string)dtFiles_Production.Rows[0]["FileName"];
                                string sampleFilePath = System.IO.Path.Combine(samplePath, addedfile);
                                string addedfilePath = (string)dtFiles_Production.Rows[0]["FilePath"];
                                resized_image = helper.ResizeImage(resized_image, addedfilePath, sampleFilePath, ResizeMax, ResizeMax);
                            });
                        }
                        else
                        {
                            var resizeTasks = new List<Task<AllinoneBalloon.Entities.Common.ResizeImageSize>>();
                            for (int rt = 0; rt < addedfiles.Count; rt++)
                            {
                                string addedfile = (string)dtFiles_Production.Rows[rt]["FileName"];
                                string sampleFilePath = System.IO.Path.Combine(samplePath, addedfile);
                                string addedfilePath = (string)dtFiles_Production.Rows[rt]["FilePath"];
                                resizeTasks.Add(Task.Run(() => {
                                    var singleList = new List<AllinoneBalloon.Entities.Common.ResizeImageSize>();
                                    singleList = helper.ResizeImage(singleList, addedfilePath, sampleFilePath, ResizeMax, ResizeMax);
                                    return singleList.FirstOrDefault();
                                }));
                            }
                            var results = await Task.WhenAll(resizeTasks);
                            resized_image = results.Where(r => r != null).ToList();
                        }
                        string rotate = await helper.Rotate(dtFiles_Production);
                        
                        var hdr = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId && w.ProductionOrderNumber == Routerno.ToString() && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();

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

                            var hdrnew = context.TblBaloonDrawingHeaders.Where(w => w.GroupId == groupId &&  w.ProductionOrderNumber == Routerno.ToString() && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                            if (hdrnew != null)
                            {
                                hdrid = hdrnew.BaloonDrwID;

                                var snew = settingtable.Where(w => w.BaloonDrwId == hdrid).FirstOrDefault();
                                if (snew == null)
                                {
                                    await helper.CreateSettings(context, settings, hdrid);
                                }
                                else
                                {
                                    await helper.UpdateSettings(context, settings, snew, hdrid, false);
                                }
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
                }
                #endregion

                var gethdr = context.TblBaloonDrawingHeaders.AsNoTracking().Where(w => w.GroupId == groupId && w.ProductionOrderNumber == Routerno.ToString() && w.DrawingNumber == DrawingNo.ToString() && w.Revision == RevisionNo.ToString()).FirstOrDefault();
                
                #region Get CC details
                List<selectedcc> controllCopy = new List<selectedcc>();
                if (gethdr != null)
                {
                    hdrid = gethdr.BaloonDrwID;
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
                }
                #endregion

                #region Response Data
                return_Object.Add("FileInfo", dtFiles_Production);
                return_Object.Add("HeaderInfo", dtFiles_Header);
                return_Object.Add("Balloons", balloons);
                // Load lookup data in parallel for speed
                object lmtype = null, lmsubtype = null, unitType = null, CharacteristicsType = null, ToleranceType = null;
                await Task.WhenAll(
                    Task.Run(() => { lmtype = helper.Load_MeasureType(objerr); }),
                    Task.Run(() => { lmsubtype = helper.Load_MeasureSubType(objerr); }),
                    Task.Run(() => { unitType = helper.Load_UnitType(objerr); }),
                    Task.Run(() => { CharacteristicsType = helper.Load_CharacteristicsType(objerr); }),
                    Task.Run(() => { ToleranceType = helper.Load_ToleranceType(objerr); })
                );
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
                #endregion

                return StatusCode(StatusCodes.Status200OK, return_Object);
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                string errorDetail = $"Upload error: {ex.GetType().Name} - {ex.Message}";
                Console.WriteLine(errorDetail);
                Console.WriteLine(ex.StackTrace);
                return BadRequest(errorDetail);
            }
        }
        #endregion

    }
    #endregion
}

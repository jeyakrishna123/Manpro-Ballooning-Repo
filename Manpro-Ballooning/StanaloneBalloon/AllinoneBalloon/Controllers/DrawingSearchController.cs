#region Importing Libraries
using AllinoneBalloon;
using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using AllinoneBalloon.Models.Configuration;
using Emgu.CV;
using Emgu.CV.CvEnum;
using Emgu.CV.Features2D;
using Emgu.CV.Reg;
using ImageMagick;
using MailKit.Search;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.FileSystemGlobbing.Internal;
using Microsoft.Extensions.Options;
using MySqlX.XDevAPI.Common;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OpenCvSharp;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity.Core.Objects;
using System.Diagnostics.CodeAnalysis;
using SixLabors.ImageSharp;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Tesseract;
using TesseractSharp.Hocr;
using static AllinoneBalloon.Controllers.DrawingSearchController;
using static System.Net.Mime.MediaTypeNames;
using static System.Net.WebRequestMethods;
using static AllinoneBalloon.Entities.Common;
using static Emgu.CV.OCR.Tesseract;
using AllinoneBalloon.Services;

#endregion

namespace AllinoneBalloon.Controllers
{
    #region Router DrawingSearch
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public partial class DrawingSearchController : ControllerBase
    {
        #region referencing the dependency injection (DI) and properties
        private readonly IDbContextFactory<DimTestContext> _dbcontext;
        private readonly AppSettings _appSettings;
        private readonly JsonSerializerOptions _options;
        private readonly IOcrServiceFactory _ocrServiceFactory;
       // private readonly IHttpContextAccessor _httpcontext;
        // DataSet dsconfig = new DataSet();
        ErrorLog objerr = new AllinoneBalloon.Common.ErrorLog();
        string envcpath = Environment.CurrentDirectory;
        public System.Data.DataTable dtFiles_Production = new System.Data.DataTable("Production_Files");
        public System.Data.DataTable dtFiles_Header = new System.Data.DataTable("Drawing_Header");
        protected IList<SixLabors.ImageSharp.Image> imageList_Crop;
        List<Circle_AutoBalloon> lstCircle = new List<Circle_AutoBalloon>();
        List<PartialImage> partial_image = new List<PartialImage>();
        string temp = string.Empty;
        string username = "Admin";
        // private Emgu.CV.OCR.Tesseract _ocr;
        int maxBalloonQty = 10;
        #endregion

        public DrawingSearchController(IDbContextFactory<DimTestContext> dbcontext, IOptions<AppSettings> options, IOcrServiceFactory ocrServiceFactory)
        {
            _appSettings = options.Value;
            _dbcontext = dbcontext;
            _options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            _ocrServiceFactory = ocrServiceFactory;
        }

        #region Get all Project
        [Authorize]
        [HttpGet("getallProjects")]
        public async Task<IActionResult> getallProjects(int page = 1, int pageSize = 10, string search = "" )
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_dbcontext);
            using var context = _dbcontext.CreateDbContext();
            string env = _appSettings.ENVIRONMENT;
            if (env != "development")
            {
                envcpath = AppDomain.CurrentDomain.BaseDirectory;
            }
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

            string sourceDir = System.IO.Path.Combine(envcpath , "SourceDrawings" , groupId.ToString() );
            sourceDir = helper.AddTrailingSlash(sourceDir);
            // Step 1: Get metadata only (no images) - fast DB query
            var Projects = await helper.getallProjectsMetadata(context, groupId);

            // Step 2: Apply search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                if (search.Trim().Contains("-"))
                {
                    string[] sp = search.Trim().Split('-');
                    string drawingNumber = sp[0];
                    string revision = sp[1];
                    Projects = Projects.Where(p => p.DrawingNumber.Trim().ToLower() == drawingNumber.Trim().ToLower() && p.Revision.Trim().ToLower() == revision.Trim().ToLower()).ToList();
                }
                else
                {
                    Projects = Projects.Where(p => p.DrawingNumber.ToLower().Contains(search.ToLower()) || p.Revision.ToLower().Contains(search.ToLower())).ToList();
                }
            }

            if (page < 1 || pageSize < 1) return BadRequest("Page and PageSize must be greater than 0.");

            var totalItems = Projects.Count;
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            // Step 3: Paginate FIRST, then load thumbnails only for visible items
            var products = Projects.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            // Step 4: Load thumbnails only for the paginated subset (e.g., 5 items instead of all)
            foreach (var product in products)
            {
                product.Image = helper.loadProjectThumbnail(context, product, groupId, sourceDir);
            }

            return StatusCode(StatusCodes.Status200OK, new
            {
                CurrentPage = page,
                TotalPages = totalPages,
                PageSize = pageSize,
                TotalItems = totalItems,
                Products = products
            });
        }
        #endregion

        #endregion
    }
}
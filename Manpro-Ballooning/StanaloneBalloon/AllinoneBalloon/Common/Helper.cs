#region Importing Libraries
using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using AllinoneBalloon.Controllers;

using System;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Data;
using System.Net.Http;
using System.Security.Cryptography;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Collections;
using System.Diagnostics;
using System.Net.Mail;

using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.Extensions.FileSystemGlobbing.Internal;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Emgu.CV;
using Emgu.CV.CvEnum;
using Emgu.CV.Features2D;
using PdfSharp.Pdf;
using PdfSharp.Drawing;
using OpenCvSharp;
using AutoMapper;
using MySql.Data.MySqlClient;
using Mysqlx.Expr;
using Mysqlx.Datatypes;
using MailKit.Search;
using Newtonsoft.Json;
using Tesseract;
using ClosedXML.Report.Utils;
using static AllinoneBalloon.Controllers.DrawingSearchController;
using static AllinoneBalloon.Entities.Common;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
#endregion

namespace AllinoneBalloon.Common
{
    #region Swagger to add AuthorizationHeader
    public class AddAuthorizationHeaderOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Check if the action has `[AllowAnonymous]`, then skip adding the header
            var hasAnonymous = context.MethodInfo.DeclaringType?.GetCustomAttributes(true)
                .OfType<AllowAnonymousAttribute>().Any() == true ||
                context.MethodInfo.GetCustomAttributes(true).OfType<AllowAnonymousAttribute>().Any();

            if (hasAnonymous)
                return; // Don't add the header for `[AllowAnonymous]` APIs

            // Check if the action has `[Authorize]` or if the Controller has `[Authorize]`
            var hasAuthorize = context.MethodInfo.DeclaringType?.GetCustomAttributes(true)
                .OfType<AuthorizeAttribute>().Any() == true ||
                context.MethodInfo.GetCustomAttributes(true).OfType<AuthorizeAttribute>().Any();

            if (hasAuthorize)
            {
                if (operation.Parameters == null)
                    operation.Parameters = new List<OpenApiParameter>();

                operation.Parameters.Add(new OpenApiParameter
                {
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Required = true, // Change to `false` if you want optional
                    Description = "Bearer {token}",
                    Schema = new OpenApiSchema { Type = "string" }
                });
            }
        }
    }
    #endregion

    #region App Exception
    public class AppException : Exception
    {
        public AppException() : base() { }

        public AppException(string message) : base(message) { }

        public AppException(string message, params object[] args)
            : base(String.Format(CultureInfo.CurrentCulture, message, args))
        {
        }
    }
    #endregion

    #region Map User details
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<User, UserDto>();
            CreateMap<UserDto, User>();
        }
    }
    #endregion

    #region Helper for Ballooning
    public partial class Helper
    {
        private readonly IDbContextFactory<DimTestContext> _dbcontext;
        private readonly IMemoryCache _cache;
        ErrorLog objerr = new AllinoneBalloon.Common.ErrorLog();
       // private Emgu.CV.OCR.Tesseract _ocr;
        public Helper(IDbContextFactory<DimTestContext> dbcontext, IMemoryCache cache = null)
        {
            _dbcontext = dbcontext;
            _cache = cache;
        }
        #region Generate OCR Rectangle by Emgu/OpenCvSharp 
        public AllinoneBalloon.Entities.Common.Rect GenerateRectangles(object source, string temp, List<Circle_AutoBalloon> lstCircle, RectSize croppedSize, string regionText, RectSize TextSize, List<AllinoneBalloon.Entities.Common.Rect> rects)
        {
            int xx = 0, yy = 0, ww = 0, hh = 0;
            int s_x = 0, s_y = 0, s_w = 0, s_h = 0;
            var newrect = new AllinoneBalloon.Entities.Common.Rect { Text = string.Empty, X = xx, Y = yy, Width = ww, Height = hh };
            try
            {
                xx = TextSize.x; yy = TextSize.y; ww = TextSize.w; hh = TextSize.h;
                s_x = croppedSize.x; s_y = croppedSize.y; s_w = croppedSize.w; s_h = croppedSize.h;
                var croppedRegion = lstCircle.Last();

                float cry = croppedRegion.Bounds.Y;
                float crx = croppedRegion.Bounds.X;
                float crw = croppedRegion.Bounds.Width;
                float crh = croppedRegion.Bounds.Height;

                if (source is OpenCvSharp.Mat)
                {
                    Emgu.CV.Mat sourceImage = new Emgu.CV.Mat(temp);
                    decimal wsf = (decimal)crw / sourceImage.Width;
                    decimal hsf = (decimal)crh / sourceImage.Height;

                    var cx1 = (int)(TextSize.x * wsf);
                    var cy1 = (int)(TextSize.y * hsf);
                    xx = TextSize.x + (int)s_x + cx1;
                    yy = TextSize.y + (int)s_y + cy1;
                }
                else if (source is Emgu.CV.Mat)
                {
                    OpenCvSharp.Mat sourceImage = new OpenCvSharp.Mat(temp, OpenCvSharp.ImreadModes.Color);
                    decimal wsf = (decimal)crw / sourceImage.Width;
                    decimal hsf = (decimal)crh / sourceImage.Height;

                    var cx1 = (int)(TextSize.x * wsf);
                    var cy1 = (int)(TextSize.y * hsf);
                    xx = TextSize.x + (int)s_x + cx1;
                    yy = TextSize.y + (int)s_y + cy1;
                }
                newrect = new AllinoneBalloon.Entities.Common.Rect { Text = regionText, X = xx, Y = yy, Width = ww, Height = hh };
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
            }
            return newrect;
        }
        #endregion

        #region Print List to log Process

        public void PrintListAsLog<T>(List<List<T>> rects, ErrorLog objerr, string pre)
        {
            StringBuilder StepWords = new StringBuilder();
            for (int i = 0; i < rects.Count; i++)
            {
                StepWords.AppendLine($"{i}:");
                foreach (var rect in rects[i])
                {
                    StepWords.AppendLine(rect.ToString());
                }
            }
            objerr.WriteErrorLog($"{pre}: {typeof(T).Name} {Environment.NewLine} {StepWords}");
        }
        public void PrintListAsLog<T>(List<T> rects, ErrorLog objerr, string pre)
        {
            StringBuilder StepWords = new StringBuilder();
            foreach (var rect in rects)
            {
                StepWords.AppendLine(rect.ToString());
            }
            objerr.WriteErrorLog($"{pre}: {typeof(T).Name} {Environment.NewLine} {StepWords}");
        }

        #endregion

        #region Collection
        public System.Data.DataTable RequestHeader(System.Data.DataTable dtFiles_Header)
        {
            List<string> header = new List<string> { "DrawingNo", "Part_No", "Revision_No", "PRevisionNo", "sessionId", "RoutingNo", "Quantity" };
            for (var i = 0; i < header.Count; i++)
            {
                dtFiles_Header.Columns.Add(header[i].ToString(), typeof(string));
                dtFiles_Header.Columns[i].ColumnName = header[i].ToString();
            }
            return dtFiles_Header;
        }
        public System.Data.DataTable RequestProduct(System.Data.DataTable dtFiles_Production)
        {
            List<string> header = new List<string> { "FileName", "FilePath", "Annotation", "Drawing", "CurrentPage", "TotalPage", "rotation", "partial", "resize", "changed" };
            for (var i = 0; i < header.Count; i++)
            {
                dtFiles_Production.Columns.Add(header[i].ToString(), typeof(string));
                dtFiles_Production.Columns[i].ColumnName = header[i].ToString();
            }
            return dtFiles_Production;
        }
        #endregion

        #region Data Transform
        public async Task<List<T>> ConvertDataTableToEntityList<T>(System.Data.DataTable dt) where T : class, new()
        {
            return await Task.Run(() =>
            {
                List<T> entityList = new List<T>();
                var properties = typeof(T).GetProperties();

                foreach (DataRow row in dt.Rows)
                {
                    T entity = new T();
                    foreach (var prop in properties)
                    {
                        if (dt.Columns.Contains(prop.Name) && row[prop.Name] != DBNull.Value)
                        {
                            prop.SetValue(entity, Convert.ChangeType(row[prop.Name], prop.PropertyType));
                        }
                    }
                    entityList.Add(entity);
                }
                return entityList;
            });
        }
        public async Task<System.Data.DataTable> ToDataTable<T>(List<T> items)
        {
            return await Task.Run(() =>
            {
                System.Data.DataTable dataTable = new System.Data.DataTable(typeof(T).Name);
                //Get all the properties
                PropertyInfo[] Props = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);
                foreach (PropertyInfo prop in Props)
                {
                    //Setting column names as Property names
                    dataTable.Columns.Add(prop.Name);
                }
                foreach (T item in items)
                {
                    var values = new object[Props.Length];
                    for (int i = 0; i < Props.Length; i++)
                    {
                        //inserting property values to datatable rows
                        values[i] = Props[i].GetValue(item, null);
                    }
                    dataTable.Rows.Add(values);
                }
                //put a breakpoint here and check datatable
                return dataTable;
            });
        }
        #endregion

        #region Predefined data

        private static readonly TimeSpan CacheExpiry = TimeSpan.FromMinutes(30);

        public List<AllinoneBalloon.Entities.Common.ToleranceType> Load_ToleranceType(ErrorLog objerr)
        {
            try
            {
                if (_cache != null)
                    return _cache.GetOrCreate("ref_ToleranceType", entry => { entry.AbsoluteExpirationRelativeToNow = CacheExpiry; return LoadToleranceTypeFromDb(); });
                return LoadToleranceTypeFromDb();
            }
            catch (Exception ex) { objerr.WriteErrorToText(ex); return new List<AllinoneBalloon.Entities.Common.ToleranceType>(); }
        }
        private List<AllinoneBalloon.Entities.Common.ToleranceType> LoadToleranceTypeFromDb()
        {
            using var context = _dbcontext.CreateDbContext();
            return context.TblToleranceTypes.AsNoTracking().Select(p => new AllinoneBalloon.Entities.Common.ToleranceType() { ID = p.ID, Name = p.TypeName }).ToList();
        }

        public List<AllinoneBalloon.Entities.Common.MeasureType> Load_MeasureType(ErrorLog objerr)
        {
            try
            {
                if (_cache != null)
                    return _cache.GetOrCreate("ref_MeasureType", entry => { entry.AbsoluteExpirationRelativeToNow = CacheExpiry; return LoadMeasureTypeFromDb(); });
                return LoadMeasureTypeFromDb();
            }
            catch (Exception ex) { objerr.WriteErrorToText(ex); return new List<AllinoneBalloon.Entities.Common.MeasureType>(); }
        }
        private List<AllinoneBalloon.Entities.Common.MeasureType> LoadMeasureTypeFromDb()
        {
            using var context = _dbcontext.CreateDbContext();
            return context.TblMeasureTypes.AsNoTracking().Select(p => new AllinoneBalloon.Entities.Common.MeasureType() { type_ID = p.Type_ID, type_Name = p.TypeName }).ToList();
        }

        public List<AllinoneBalloon.Entities.Common.MeasureSubType> Load_MeasureSubType(ErrorLog objerr)
        {
            try
            {
                if (_cache != null)
                    return _cache.GetOrCreate("ref_MeasureSubType", entry => { entry.AbsoluteExpirationRelativeToNow = CacheExpiry; return LoadMeasureSubTypeFromDb(); });
                return LoadMeasureSubTypeFromDb();
            }
            catch (Exception ex) { objerr.WriteErrorToText(ex); return new List<AllinoneBalloon.Entities.Common.MeasureSubType>(); }
        }
        private List<AllinoneBalloon.Entities.Common.MeasureSubType> LoadMeasureSubTypeFromDb()
        {
            using var context = _dbcontext.CreateDbContext();
            return context.TblMeasureSubTypes.AsNoTracking().Select(p => new AllinoneBalloon.Entities.Common.MeasureSubType() { subType_ID = p.SubType_ID, subType_Name = p.SubTypeName }).ToList();
        }

        public List<AllinoneBalloon.Entities.Common.UnitType> Load_UnitType(ErrorLog objerr)
        {
            try
            {
                if (_cache != null)
                    return _cache.GetOrCreate("ref_UnitType", entry => { entry.AbsoluteExpirationRelativeToNow = CacheExpiry; return LoadUnitTypeFromDb(); });
                return LoadUnitTypeFromDb();
            }
            catch (Exception ex) { objerr.WriteErrorToText(ex); return new List<AllinoneBalloon.Entities.Common.UnitType>(); }
        }
        private List<AllinoneBalloon.Entities.Common.UnitType> LoadUnitTypeFromDb()
        {
            using var context = _dbcontext.CreateDbContext();
            return context.TblUnits.AsNoTracking().Select(p => new AllinoneBalloon.Entities.Common.UnitType() { ID = p.ID, Units = p.Units }).ToList();
        }

        public List<AllinoneBalloon.Entities.Common.CharacteristicsType> Load_CharacteristicsType(ErrorLog objerr)
        {
            try
            {
                if (_cache != null)
                    return _cache.GetOrCreate("ref_CharacteristicsType", entry => { entry.AbsoluteExpirationRelativeToNow = CacheExpiry; return LoadCharacteristicsTypeFromDb(); });
                return LoadCharacteristicsTypeFromDb();
            }
            catch (Exception ex) { objerr.WriteErrorToText(ex); return new List<AllinoneBalloon.Entities.Common.CharacteristicsType>(); }
        }
        private List<AllinoneBalloon.Entities.Common.CharacteristicsType> LoadCharacteristicsTypeFromDb()
        {
            using var context = _dbcontext.CreateDbContext();
            return context.TblCharacteristics.AsNoTracking().Select(p => new AllinoneBalloon.Entities.Common.CharacteristicsType() { ID = p.ID, Characteristics = p.Characteristics }).ToList();
        }

        public List<AllinoneBalloon.Entities.Common.TemplateType> Load_exportTemplate(bool d,ErrorLog objerr)
        {
            try
            {
                string cacheKey = d ? "ref_Template_demo" : "ref_Template";
                if (_cache != null)
                    return _cache.GetOrCreate(cacheKey, entry => { entry.AbsoluteExpirationRelativeToNow = CacheExpiry; return LoadExportTemplateFromDb(d); });
                return LoadExportTemplateFromDb(d);
            }
            catch (Exception ex) { objerr.WriteErrorToText(ex); return new List<AllinoneBalloon.Entities.Common.TemplateType>(); }
        }
        private List<AllinoneBalloon.Entities.Common.TemplateType> LoadExportTemplateFromDb(bool d)
        {
            using var context = _dbcontext.CreateDbContext();
            var templatetype = context.TblTemplates.AsNoTracking().AsQueryable();
            if (!d) { templatetype = templatetype.Where(row => row.Name != "Demo"); }
            return templatetype.GroupBy(w => w.group_name).Select(p => new AllinoneBalloon.Entities.Common.TemplateType() { id = p.FirstOrDefault().ID, name = p.FirstOrDefault().group_name }).ToList();
        }

        #endregion

        #region Excel Helper
        public List<string> GenerateExcelCellNames(int startRow, int endRow, string startColumn, string endColumn)
        {
            List<string> cellNames = new List<string>();

            int startColIndex = ColumnNameToIndex(startColumn);
            int endColIndex = ColumnNameToIndex(endColumn);

            for (int row = startRow; row <= endRow; row++)
            {
                for (int col = startColIndex; col <= endColIndex; col++)
                {
                    string columnName = IndexToColumnName(col);
                    cellNames.Add($"{columnName}{row}");
                }
            }
            return cellNames;
        }

        static int ColumnNameToIndex(string columnName)
        {
            int index = 0;
            for (int i = 0; i < columnName.Length; i++)
            {
                index *= 26;
                index += (columnName[i] - 'A' + 1);
            }
            return index;
        }

        static string IndexToColumnName(int index)
        {
            string columnName = String.Empty;
            while (index > 0)
            {
                index--;
                columnName = (char)('A' + (index % 26)) + columnName;
                index /= 26;
            }
            return columnName;
        }
        #endregion

        #region Session
        public sessionobj getsession(HttpContext httpContext)
        {
            var session = httpContext.Session;
            sessionobj obj = session.GetObjectFromJson<sessionobj>("sessionobj");
            return obj;
        }
        public sessionobj setsession(HttpContext httpContext)
        {
            var fallback = new sessionobj
            {
                sessionUserName = "Current User",
                sessionUserId = Guid.NewGuid().ToString(),
                expire = TimeSpan.FromDays(1)
            };
            try
            {
                var session = httpContext.Session;
                sessionobj sessionobj = session.GetObjectFromJson<sessionobj>("sessionobj");
                if (sessionobj == null)
                {
                    session.SetObjectAsJson("sessionobj", fallback);
                    sessionobj obj = session.GetObjectFromJson<sessionobj>("sessionobj");
                    return obj ?? fallback;
                }
                else
                {
                    sessionobj.expire = TimeSpan.FromMinutes(10);
                    session.SetObjectAsJson("sessionobj", sessionobj);
                    return sessionobj;
                }
            }
            catch
            {
                return fallback;
            }
        }

        #endregion

        #region Emgu library
        public string OcrImage(Emgu.CV.OCR.Tesseract ocr, Emgu.CV.Mat image, Emgu.CV.Mat imageColor)
        {
            try
            {
                Emgu.CV.Structure.Bgr drawCharColor = new Emgu.CV.Structure.Bgr(255, 0, 0);
                if (image.NumberOfChannels == 1)
                    CvInvoke.CvtColor(image, imageColor, ColorConversion.Gray2Bgr);
                else
                    image.CopyTo(imageColor);
                ocr.SetImage(imageColor);
                if (ocr.Recognize() != 0)
                    throw new Exception("Failed to recognizer image");
                Emgu.CV.OCR.Tesseract.Character[] characters = ocr.GetCharacters();
                foreach (Emgu.CV.OCR.Tesseract.Character character in characters)
                {
                    // Retrieve text
                    string text = character.Text;

                    // Retrieve position (bounding box)
                    var boundingBox = character.Region;

                    // Display text and position                
                     Console.WriteLine($"Text:{text} Position:{boundingBox} ");
                }
                if (characters.Length == 0)
                {
                    Emgu.CV.Mat imgGrey = new Emgu.CV.Mat();
                    CvInvoke.CvtColor(image, imgGrey, ColorConversion.Bgr2Gray);
                    Emgu.CV.Mat imgThresholded = new Emgu.CV.Mat();
                    CvInvoke.Threshold(imgGrey, imgThresholded, 65, 255, ThresholdType.Binary);
                    GC.Collect();
                    ocr.SetImage(imgThresholded);
                    imageColor = imgThresholded;
                    if (characters.Length == 0)
                    {
                        CvInvoke.Threshold(image, imgThresholded, 190, 255, ThresholdType.Binary);
                        ocr.SetImage(imgThresholded);
                        imageColor = imgThresholded;
                    }
                }
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
            }
            return ocr.GetUTF8Text();
        }
        #endregion

        #region Traits

        class XCoordinateComparer : IComparer<int>
        {
            public int Compare(int x1, int x2)
            {
                // Check if the x-coordinates are within 300 units
                if (Math.Sign(x1 - x2) == -1 && Math.Abs(x1 - x2) <= 300 || Math.Abs(x1 - x2) <= 300)
                //if (Math.Abs(x1 - x2) < 300)
                {
                    // If within 300 units, consider them equal
                    return 0;
                }
                else
                {
                    // Otherwise, compare based on x-coordinate
                    return x1.CompareTo(x2);
                }
            }
        }

        class GroupCoordinateComparer : IComparer<int>
        {
            public int Compare(int y1, int y2)
            {
                return y1.CompareTo(y2);
            }
        }
        #endregion

    }
    #endregion
}

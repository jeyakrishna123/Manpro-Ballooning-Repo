#region Importing Libraries
using System;
using System.Data;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Reflection.PortableExecutable;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml.Linq;
using AllinoneBalloon.Common;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using static AllinoneBalloon.Controllers.FileUploadController;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
#endregion

namespace AllinoneBalloon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public partial class BalloonController : ControllerBase
    {
        #region Data Transform
        public static IEnumerable<object> GetValues<T>(IEnumerable<T> items, string propertyName)
        {
            Type type = typeof(T);
            var prop = type.GetProperty(propertyName);
            foreach (var item in items)
                yield return prop.GetValue(item, null);
        }

        public List<T> ConvertToList<T>(System.Data.DataTable dt)
        {
            var columnNames = dt.Columns.Cast<DataColumn>().Select(c => c.ColumnName).ToList();
            var properties = typeof(T).GetProperties();
            return dt.AsEnumerable()
                .Select(row =>
                {
                    var objT = Activator.CreateInstance<T>();
                    foreach (var pro in properties)
                    {
                        if (columnNames.Contains(pro.Name))
                        {
                            PropertyInfo pI = objT.GetType().GetProperty(pro.Name);
                            pro.SetValue(
                                objT,
                                row[pro.Name] == DBNull.Value
                                    ? null
                                    : Convert.ChangeType(row[pro.Name], pI.PropertyType)
                            );
                        }
                    }
                    return objT;
                })
                .ToList();
        }

        public static System.Data.DataTable ToDataTable<T>(List<T> items)
        {
            System.Data.DataTable dataTable = new System.Data.DataTable(typeof(T).Name);

            //Get all the properties
            PropertyInfo[] Props = typeof(T).GetProperties(
                BindingFlags.Public | BindingFlags.Instance
            );
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
        }
        #endregion

        private readonly IDbContextFactory<DimTestContext> _dbcontext;

        public BalloonController(IDbContextFactory<DimTestContext> dbcontext)
        {
            _dbcontext = dbcontext;
        }

        #region Create Data
        [Authorize]
        [HttpPost("create")]
        public IEnumerable<object> create(AllinoneBalloon.Entities.Common.CreateBalloon searchForm)
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_dbcontext);
            using var context = _dbcontext.CreateDbContext();
            if (searchForm != null)
            {
                var hdr = context
                    .TblBaloonDrawingHeaders.Where(w =>
                        w.GroupId == searchForm.GroupId
                        && w.ProductionOrderNumber == searchForm.Routerno.ToString()
                        && w.DrawingNumber == searchForm.drawingNo.ToString()
                        && w.Revision == searchForm.revNo.ToString()
                    )
                    .FirstOrDefault();
                if (hdr == null)
                {
                    var hdrtable = context.TblBaloonDrawingHeaders;
                    TblBaloonDrawingHeader tblhdr = new TblBaloonDrawingHeader();
                    tblhdr.DrawingNumber = searchForm.drawingNo.ToUpper().ToString();
                    tblhdr.Revision = searchForm.revNo.ToUpper().ToString();
                    tblhdr.ProductionOrderNumber = searchForm.Routerno.ToUpper().ToString();
                    tblhdr.Quantity = searchForm.MaterialQty.ToString();
                    tblhdr.Part_Revision = "N/A";
                    tblhdr.Total_Page_No = searchForm.totalPage;
                    tblhdr.RotateProperties = searchForm.rotate;
                    tblhdr.CreatedDate = DateTime.Now;
                    tblhdr.ModifiedDate = DateTime.Now;
                    tblhdr.CreatedBy = searchForm.username;
                    tblhdr.ModifiedBy = searchForm.username;
                    tblhdr.GroupId = searchForm.GroupId;
                    hdrtable.Add(tblhdr);
                    context.SaveChanges();
                }
                else
                {
                    hdr.ModifiedDate = DateTime.Now;
                    hdr.Quantity = searchForm.MaterialQty.ToString();
                    hdr.ModifiedBy = searchForm.username;
                    hdr.Total_Page_No = searchForm.totalPage;
                    hdr.RotateProperties = searchForm.rotate;
                    context.SaveChanges();

                    var lnritems = context
                        .TblBaloonDrawingLiners.Where(w =>
                            w.ProductionOrderNumber == searchForm.Routerno.ToUpper().ToString()
                            && w.DrawingNumber == searchForm.drawingNo.ToUpper().ToString()
                            && w.Revision == searchForm.revNo.ToUpper().ToString()
                        )
                        .Count();
                    if (lnritems > 0)
                    {
                        List<TblBaloonDrawingLiner> rList = context
                            .TblBaloonDrawingLiners.Where(w =>
                                w.ProductionOrderNumber == searchForm.Routerno.ToUpper().ToString()
                                && w.DrawingNumber == searchForm.drawingNo.ToUpper().ToString()
                                && w.Revision == searchForm.revNo.ToUpper().ToString()
                            )
                            .ToList();
                        context.TblBaloonDrawingLiners.RemoveRange(rList);
                        context.SaveChanges();
                    }
                    hdr.RotateProperties = searchForm.rotate;
                    context.SaveChanges();
                }
                var hdrnew = context
                    .TblBaloonDrawingHeaders.Where(w =>
                        w.GroupId == searchForm.GroupId
                        && w.ProductionOrderNumber == searchForm.Routerno.ToUpper().ToString()
                        && w.DrawingNumber == searchForm.drawingNo.ToUpper().ToString()
                        && w.Revision == searchForm.revNo.ToUpper().ToString()
                    )
                    .FirstOrDefault();
                long hdrid = hdrnew.BaloonDrwID;

                AllinoneBalloon.Models.Settings settings = searchForm.Settings;
                var snew = context
                    .TblBaloonDrawingSettings.Where(w => w.BaloonDrwId == hdrid)
                    .FirstOrDefault();
                if (snew == null)
                {
                    TblBaloonDrawingSetting setting = new TblBaloonDrawingSetting();
                    setting.DefaultBalloon = settings.DefaultBalloon;
                    setting.ErrorBalloon = settings.ErrorBalloon;
                    setting.SuccessBalloon = settings.SuccessBalloon;
                    setting.BalloonShape = settings.BalloonShape;
                    setting.MinMaxOneDigit = settings.MinMaxOneDigit;
                    setting.MinMaxTwoDigit = settings.MinMaxTwoDigit;
                    setting.MinMaxThreeDigit = settings.MinMaxThreeDigit;
                    setting.MinMaxFourDigit = settings.MinMaxFourDigit;
                    setting.MinMaxAngles = settings.MinMaxAngles;
                    setting.convert = settings.convert;
                    setting.fontScale = settings.fontScale;
                    setting.BaloonDrwId = hdrid;
                    context.TblBaloonDrawingSettings.Add(setting);
                    context.SaveChanges();
                }
                else
                {
                    snew.DefaultBalloon = settings.DefaultBalloon;
                    snew.ErrorBalloon = settings.ErrorBalloon;
                    snew.BalloonShape = settings.BalloonShape;
                    snew.MinMaxOneDigit = settings.MinMaxOneDigit;
                    snew.MinMaxTwoDigit = settings.MinMaxTwoDigit;
                    snew.MinMaxThreeDigit = settings.MinMaxThreeDigit;
                    snew.MinMaxFourDigit = settings.MinMaxFourDigit;
                    snew.MinMaxAngles = settings.MinMaxAngles;
                    snew.convert = settings.convert;
                    snew.fontScale = settings.fontScale;
                    snew.BaloonDrwId = hdrid;
                    context.SaveChanges();
                }
                List<AllinoneBalloon.Entities.Common.OCRResults> lstoCRResults =
                    searchForm.ballonDetails;
                List<TblBaloonDrawingLiner> lnr = new List<TblBaloonDrawingLiner>();
                foreach (var i in lstoCRResults)
                {
                    byte[] imgbyt = new byte[] { 0x20 };
                    lnr.Add(
                        new TblBaloonDrawingLiner
                        {
                            BaloonDrwID = hdrid,
                            BaloonDrwFileID = i.BaloonDrwFileID,
                            ProductionOrderNumber = i.ProductionOrderNumber.ToUpper(),
                            Part_Revision = i.Part_Revision,
                            Page_No = i.Page_No,
                            DrawingNumber = i.DrawingNumber.ToUpper(),
                            Revision = i.Revision.ToUpper(),
                            Balloon = i.Balloon,
                            Spec = i.Spec,
                            Nominal = i.Nominal,
                            Minimum = i.Minimum,
                            Maximum = i.Maximum,
                            MeasuredBy = i.MeasuredBy,
                            MeasuredOn = i.MeasuredOn,
                            Measure_X_Axis = i.Measure_X_Axis,
                            Measure_Y_Axis = i.Measure_Y_Axis,
                            Circle_X_Axis = i.Circle_X_Axis,
                            Circle_Y_Axis = i.Circle_Y_Axis,
                            Circle_Width = i.Circle_Width,
                            Circle_Height = i.Circle_Height,
                            Balloon_Thickness = i.Balloon_Thickness,
                            Balloon_Text_FontSize = i.Balloon_Text_FontSize,
                            BalloonShape = i.BalloonShape,
                            ZoomFactor = i.ZoomFactor,
                            Crop_X_Axis = i.Crop_X_Axis,
                            Crop_Y_Axis = i.Crop_Y_Axis,
                            Crop_Width = i.Crop_Width,
                            Crop_Height = i.Crop_Height,
                            Type = i.Type,
                            SubType = i.SubType,
                            Unit = i.Unit,
                            Serial_No = i.Serial_No,
                            Characteristics = i.Characteristics,
                            Quantity = i.Quantity,
                            ToleranceType = i.ToleranceType,
                            PlusTolerance = i.PlusTolerance,
                            MinusTolerance = i.MinusTolerance,
                            MinTolerance = i.MinTolerance,
                            MaxTolerance = i.MaxTolerance,
                            convert = i.convert,
                            converted = i.converted,
                            CropImage = imgbyt,
                            CreatedBy = i.CreatedBy,
                            CreatedDate = i.CreatedDate,
                            ModifiedBy = i.ModifiedBy,
                            ModifiedDate = i.ModifiedDate,
                            IsCritical = i.IsCritical,
                        }
                    );
                }
                context.TblBaloonDrawingLiners.AddRange(lnr);
                context.SaveChanges();
                
                var ccnew = context
                    .TblControlledCopy.Where(w => w.BaloonDrwID == hdrid)
                    .FirstOrDefault();
                List<selectedcc> selectedcc = searchForm.controllCopy;
                if (ccnew == null)
                {
                    List<TblControllCopy> ccnr = new List<TblControllCopy>();
                    foreach (var i in selectedcc)
                    {
                        Dictionary<string, string> origin = i.origin;
                        string jsonData = JsonConvert.SerializeObject(
                            origin,
                            Newtonsoft.Json.Formatting.Indented,
                            new JsonSerializerSettings
                            {
                                PreserveReferencesHandling = PreserveReferencesHandling.Objects,
                            }
                        );

                        ccnr.Add(
                            new TblControllCopy
                            {
                                BaloonDrwID = hdrid,
                                drawingNo = i.drawingNo.ToUpper(),
                                revNo = i.revNo.ToUpper(),
                                origin = jsonData,
                                routerno = i.routerno.ToUpper(),
                                pageNo = i.pageNo,
                                textGroupPlaced = i.textGroupPlaced,
                            }
                        );
                    }
                    context.TblControlledCopy.AddRange(ccnr);
                    context.SaveChanges();
                }
                else
                {
                    foreach (var i in selectedcc)
                    {
                        TblControllCopy ucc = new TblControllCopy();
                        Dictionary<string, string> origin = i.origin;
                        string jsonData = JsonConvert.SerializeObject(
                            origin,
                            Newtonsoft.Json.Formatting.Indented,
                            new JsonSerializerSettings
                            {
                                PreserveReferencesHandling = PreserveReferencesHandling.Objects,
                            }
                        );
                        var uccnew = context
                            .TblControlledCopy.Where(w =>
                                w.BaloonDrwID == hdrid && w.pageNo == i.pageNo
                            )
                            .FirstOrDefault();
                        if (uccnew == null)
                        {
                            ucc.BaloonDrwID = hdrid;
                            ucc.drawingNo = i.drawingNo.ToUpper();
                            ucc.revNo = i.revNo.ToUpper();
                            ucc.origin = jsonData;
                            ucc.pageNo = i.pageNo;
                            ucc.routerno = i.routerno.ToUpper();
                            ucc.textGroupPlaced = i.textGroupPlaced;
                            context.TblControlledCopy.Add(ucc);
                            context.SaveChanges();
                        }
                        else
                        {
                            uccnew.BaloonDrwID = hdrid;
                            uccnew.pageNo = i.pageNo;
                            uccnew.origin = jsonData;
                            uccnew.textGroupPlaced = i.textGroupPlaced;
                            context.SaveChanges();
                        }
                    }
                }
            }
            IEnumerable<object> obj = get(
                searchForm.drawingNo,
                searchForm.revNo,
                searchForm.Routerno,
                searchForm.GroupId
            );
            return obj.Select(d => (object)d);
        }
        #endregion        
    }
}

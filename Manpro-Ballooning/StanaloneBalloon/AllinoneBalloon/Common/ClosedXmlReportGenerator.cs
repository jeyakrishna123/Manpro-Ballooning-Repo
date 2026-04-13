using AllinoneBalloon.Models;
using AllinoneBalloon.Controllers;
using ClosedXML.Excel;
using ClosedXML.Report;
using Microsoft.Net.Http.Headers;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Data;
using System.Diagnostics.Metrics;
using System.Dynamic;
using static AllinoneBalloon.Controllers.FileUploadController;

namespace AllinoneBalloon.Common
{
    public partial class ClosedXmlReportGenerator
    {

        #region FORMAT_1_FIRSTOFF
        public static void GenerateReportFORMAT_1_FIRSTOFF(string templatePath, string workingDir, string role, CreateHeader header, IEnumerable<object> items, TblBaloonDrawingSetting setting)
        {
            FileInfo fi = new FileInfo(templatePath);
            string desFile = fi.Name;
            string filePath = Path.Combine(workingDir, $"{desFile}");

            int intMaterialQty;
            var selectedColumns = new List<ThisItem>();
            var dynamicList = new List<ExpandoObject>();

            if (int.TryParse(header.Quantity.ToString(), out intMaterialQty))
            {
                // Sample data collection for the report
                selectedColumns = items.Select(item => new ThisItem
                {
                    Page_No = ((dynamic)item).Page_No,
                    Balloon = ((dynamic)item).Balloon,
                    Characteristics = ((dynamic)item).Characteristics,
                    Spec = ((dynamic)item).Spec,
                    Unit = ((dynamic)item).Unit,
                    Quantity = ((dynamic)item).Quantity,
                    Actual = ((dynamic)item).ActualDecision

                }).ToList();

                foreach (var item in selectedColumns)
                {
                    dynamic obj = new ExpandoObject();
                    var objDict = (IDictionary<string, object>)obj;
                    objDict["Balloon"] = $"'{item.Balloon}";
                    objDict["Characteristics"] = $"'{item.Characteristics}";
                    objDict["Spec"] = $"'{item.Spec}";
                    objDict["Unit"] = $"'{item.Unit}";
                    var i = 1;
                    foreach (var ad in item.Actual)
                    {
                        // Transform the dictionary to an array format
                        var arrayFormat = ad.Select(outer => new object[]
                        {
                            outer.Key,
                            outer.Value.Select(inner => new[] { inner.Key, inner.Value }).ToArray()
                        })
                        .ToArray();

                        foreach (var user in arrayFormat)
                        {
                            //Console.WriteLine($"user: {user[0]}");
                            if (user[0].ToString() == "OP" || user[0].ToString() == "LI")
                            {
                                var userValue = (object[])user[1];
                                foreach (var ActualDecision in userValue)
                                {
                                    var KeyValue = (string[])ActualDecision;

                                    if (KeyValue[0] == "Actual")
                                    {
                                        objDict[$"{user[0].ToString() + i.ToString()}"] = $"'{KeyValue[1]}";
                                    }
                                }
                            }
                        }
                        i++;
                    }
                    dynamicList.Add(obj);
                }
            }

            using (var workbook = new XLWorkbook(templatePath))
            {
                var worksheet = workbook.Worksheet(1);

                worksheet.Cell("C2").Value = header.DrawingNo.ToUpper();
                worksheet.Cell("K2").Value = header.RevisionNo.ToUpper();
                worksheet.Cell("K3").Value = DateTime.Today.ToString("dd-MM-YYYY");
                worksheet.Cell("K4").Value = header.UserName.ToUpper();
                worksheet.Cell("K4").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                worksheet.Cell("K4").Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                worksheet.Cell("P3").Value = intMaterialQty;

                var row = 8;
                var col = row + dynamicList.Count - 1;
                var dataRange = worksheet.Range($"A{row}:R{col}");
                //worksheet.AutoFilter.Clear();
                // Insert the DataTable into the worksheet
                foreach (var property in dynamicList)
                {
                    var c = 1;
                    var newRow = worksheet.Row(row - 1).InsertRowsBelow(1).First();
                    foreach (var item in property)
                    {
                        newRow.Cell(c).Value = $"{item.Value}";
                        // Console.WriteLine($"{property.Key}: {item.Value}");
                        c++;
                    }
                    ++row;
                }
                var srow = 8; // reset
                foreach (var item in selectedColumns)
                {
                    var c = 1;
                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                    c++;

                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                    c++;

                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Font.FontName = "IMS";
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                    c++;

                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);

                    foreach (var ad in item.Actual)
                    {
                        var counter = c;
                        if (counter > 18)
                        {
                            // last
                            break;
                        }
                        // Transform the dictionary to an array format
                        var arrayFormat = ad.Select(outer => new object[]
                        {
                        outer.Key,
                        outer.Value.Select(inner => new[] { inner.Key, inner.Value }).ToArray()
                        })
                        .ToArray();

                        foreach (var user in arrayFormat)
                        {
                            //Console.WriteLine($"user: {user[0]}");
                            if (user[0].ToString() == "OP" || user[0].ToString() == "LI")
                            {
                                c++;
                                var userValue = (object[])user[1];
                                foreach (var ActualDecision in userValue)
                                {
                                    var KeyValue = (string[])ActualDecision;

                                    if (KeyValue[0] == "Actual")
                                    {
                                        Cell cell = new Cell()
                                        {
                                            CellReference = worksheet.Cell(srow, c).Address.ToString(), // Location of Cell
                                            DataType = CellValues.String,
                                            //  CellValue = new CellValue($"'{KeyValue[1]}".ToString(CultureInfo.InvariantCulture))
                                        };

                                        worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                                        worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                                        worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                                        worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                                        worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                                    }
                                    if (KeyValue[0] == "Decision")
                                    {
                                        string BalloonColor = "#ffffff";
                                        if (KeyValue[1] == "false")
                                        {
                                            BalloonColor = setting.ErrorBalloon;
                                            //Console.WriteLine($"key: {KeyValue[0]}, Value: {KeyValue[1]} ,BalloonColor: {ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10)}");
                                            worksheet.Cell(srow, c).Style.Fill.BackgroundColor = ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10);
                                        }
                                        if (KeyValue[1] == "true")
                                        {
                                            BalloonColor = setting.SuccessBalloon;
                                            // Console.WriteLine($"key: {KeyValue[0]}, Value: {KeyValue[1]} ,BalloonColor: {ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10)}");
                                            worksheet.Cell(srow, c).Style.Fill.BackgroundColor = ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    ++srow;
                }

                var drow = 8;

                var dcol = drow + dynamicList.Count - 1;
                dataRange = worksheet.Range($"A{drow}:R{dcol}");
                var BdataRange = worksheet.Range($"A6:R7");
                var AdataRange = worksheet.Range($"A{dcol + 1}:R{dcol + 10}");

                dataRange.Style.Border.TopBorder = XLBorderStyleValues.Thin;
                dataRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
                dataRange.Style.Border.LeftBorder = XLBorderStyleValues.Thin;
                dataRange.Style.Border.RightBorder = XLBorderStyleValues.Thin;

                dataRange.Style.Border.TopBorderColor = XLColor.Black;
                dataRange.Style.Border.BottomBorderColor = XLColor.Black;
                dataRange.Style.Border.LeftBorderColor = XLColor.Black;
                dataRange.Style.Border.RightBorderColor = XLColor.Black;
                dataRange.Style.Font.Bold = false;

                workbook.SaveAs(filePath);
            }
        }
        #endregion

        #region FORMAT_1_FINAL
        public static void GenerateReportFORMAT_1_FINAL(string templatePath, string workingDir, string role, CreateHeader header, IEnumerable<object> items, TblBaloonDrawingSetting setting)
        {
            FileInfo fi = new FileInfo(templatePath);
            string desFile = fi.Name;
            string filePath = Path.Combine(workingDir, $"{desFile}");

            int intMaterialQty;
            var selectedColumns = new List<ThisItem>();
            var dynamicList = new List<ExpandoObject>();

            if (int.TryParse(header.Quantity.ToString(), out intMaterialQty))
            {
                // Sample data collection for the report
                selectedColumns = items.Select(item => new ThisItem
                {
                    Page_No = ((dynamic)item).Page_No,
                    Balloon = ((dynamic)item).Balloon,
                    Characteristics = ((dynamic)item).Characteristics,
                    Spec = ((dynamic)item).Spec,
                    Unit = ((dynamic)item).Unit,
                    Quantity = ((dynamic)item).Quantity,
                    Actual = ((dynamic)item).ActualDecision

                }).ToList();

                foreach (var item in selectedColumns)
                {
                    dynamic obj = new ExpandoObject();
                    var objDict = (IDictionary<string, object>)obj;
                    objDict["Balloon"] = $"'{item.Balloon}";
                    objDict["Characteristics"] = $"'{item.Characteristics}";
                    objDict["Spec"] = $"'{item.Spec}";
                    objDict["Unit"] = $"'{item.Unit}";
                    var i = 1;
                    foreach (var ad in item.Actual)
                    {
                        // Transform the dictionary to an array format
                        var arrayFormat = ad.Select(outer => new object[]
                        {
                            outer.Key,
                            outer.Value.Select(inner => new[] { inner.Key, inner.Value }).ToArray()
                        })
                        .ToArray();

                        foreach (var user in arrayFormat)
                        {
                            //Console.WriteLine($"user: {user[0]}");
                            if (user[0].ToString() == "Final")
                            {
                                var userValue = (object[])user[1];
                                foreach (var ActualDecision in userValue)
                                {
                                    var KeyValue = (string[])ActualDecision;

                                    if (KeyValue[0] == "Actual")
                                    {
                                        objDict[$"{user[0].ToString() + i.ToString()}"] = $"'{KeyValue[1]}";
                                    }
                                }
                            }
                        }
                        i++;
                    }
                    dynamicList.Add(obj);
                }
            }

            using (var workbook = new XLWorkbook(templatePath))
            {
                var worksheet = workbook.Worksheet(1);

                worksheet.Cell("C3").Value = header.DrawingNo.ToUpper();
                worksheet.Cell("C4").Value = header.DrawingNo.ToUpper() + " & " + header.RevisionNo.ToUpper();
                
                worksheet.Cell("I5").Value = header.Routerno.ToUpper();
                worksheet.Cell("I5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                worksheet.Cell("I5").Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                worksheet.Cell("N4").Value = intMaterialQty;
                worksheet.Cell("N5").Value = DateTime.Today.ToString("dd-MM-YYYY");

                var row = 8;
                var col = row + dynamicList.Count - 1;
                var dataRange = worksheet.Range($"A{row}:O{col}");
                //worksheet.AutoFilter.Clear();
                // Insert the DataTable into the worksheet
                foreach (var property in dynamicList)
                {
                    var c = 1;
                    var newRow = worksheet.Row(row - 1).InsertRowsBelow(1).First();
                    foreach (var item in property)
                    {
                        newRow.Cell(c).Value = $"{item.Value}";
                        // Console.WriteLine($"{property.Key}: {item.Value}");
                        c++;
                    }
                    ++row;
                }
                var srow = 8; // reset
                foreach (var item in selectedColumns)
                {
                    var c = 1;
                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                    c++;

                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                    c++;

                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Font.FontName = "IMS";
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                    c++;

                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);

                    foreach (var ad in item.Actual)
                    {
                        var counter = c;
                        if (counter > 14)
                        {
                            // last
                            break;
                        }
                        // Transform the dictionary to an array format
                        var arrayFormat = ad.Select(outer => new object[]
                        {
                        outer.Key,
                        outer.Value.Select(inner => new[] { inner.Key, inner.Value }).ToArray()
                        })
                        .ToArray();

                        foreach (var user in arrayFormat)
                        {
                            //Console.WriteLine($"user: {user[0]}");
                            if (user[0].ToString() == "Final")
                            {
                                c++;
                                var userValue = (object[])user[1];
                                foreach (var ActualDecision in userValue)
                                {
                                    var KeyValue = (string[])ActualDecision;

                                    if (KeyValue[0] == "Actual")
                                    {
                                        Cell cell = new Cell()
                                        {
                                            CellReference = worksheet.Cell(srow, c).Address.ToString(), // Location of Cell
                                            DataType = CellValues.String,
                                            //  CellValue = new CellValue($"'{KeyValue[1]}".ToString(CultureInfo.InvariantCulture))
                                        };

                                        worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                                        worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                                        worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                                        worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                                        worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                                    }
                                    if (KeyValue[0] == "Decision")
                                    {
                                        string BalloonColor = "#ffffff";
                                        if (KeyValue[1] == "false")
                                        {
                                            BalloonColor = setting.ErrorBalloon;
                                            //Console.WriteLine($"key: {KeyValue[0]}, Value: {KeyValue[1]} ,BalloonColor: {ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10)}");
                                            worksheet.Cell(srow, c).Style.Fill.BackgroundColor = ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10);
                                        }
                                        if (KeyValue[1] == "true")
                                        {
                                            BalloonColor = setting.SuccessBalloon;
                                            // Console.WriteLine($"key: {KeyValue[0]}, Value: {KeyValue[1]} ,BalloonColor: {ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10)}");
                                            worksheet.Cell(srow, c).Style.Fill.BackgroundColor = ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    ++srow;
                }

                var drow = 8;

                var dcol = drow + dynamicList.Count - 1;
                dataRange = worksheet.Range($"A{drow}:O{dcol}");
                var BdataRange = worksheet.Range($"A6:O7");
                var AdataRange = worksheet.Range($"A{dcol + 1}:O{dcol + 10}");

                dataRange.Style.Protection.SetLocked(true);
                dataRange.Style.Border.TopBorder = XLBorderStyleValues.Thin;
                dataRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
                dataRange.Style.Border.LeftBorder = XLBorderStyleValues.Thin;
                dataRange.Style.Border.RightBorder = XLBorderStyleValues.Thin;

                dataRange.Style.Border.TopBorderColor = XLColor.Black;
                dataRange.Style.Border.BottomBorderColor = XLColor.Black;
                dataRange.Style.Border.LeftBorderColor = XLColor.Black;
                dataRange.Style.Border.RightBorderColor = XLColor.Black;
                dataRange.Style.Font.Bold = false;

                //worksheet.Protect();
                workbook.SaveAs(filePath);
            }
        }
        #endregion

    }
}

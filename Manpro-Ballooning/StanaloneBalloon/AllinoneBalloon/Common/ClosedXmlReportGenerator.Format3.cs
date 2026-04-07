using AllinoneBalloon.Models;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Spreadsheet;
using System.Dynamic;

namespace AllinoneBalloon.Common
{
    public partial class ClosedXmlReportGenerator
    {
        #region FORMAT_3
        public static void GenerateReportFORMAT_3(string templatePath, string workingDir, string role, CreateHeader header, IEnumerable<object> items, TblBaloonDrawingSetting setting)
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
                    Maximum = ((dynamic)item).Maximum,
                    Minimum = ((dynamic)item).Minimum,
                    Unit = ((dynamic)item).Unit,
                    Serial_No = ((dynamic)item).Serial_No,
                    Quantity = ((dynamic)item).Quantity,
                    Actual = ((dynamic)item).ActualDecision
                }).ToList();

                //float inchToMM = 25.4f;

                foreach (var item in selectedColumns)
                {
                    dynamic obj = new ExpandoObject();
                    var objDict = (IDictionary<string, object>)obj;
                    objDict["Balloon"] = $"'{item.Balloon}";
                    objDict["Characteristics"] = $"'{item.Characteristics}";
                    objDict["Spec"] = $"'{item.Spec}";
                    objDict["Unit"] = $"'{item.Unit}";
                    objDict["frequency"] = $"'100%";
                    objDict["Serial_No"] = $"'{item.Serial_No}";

                    if (item.Minimum == "0" || item.Minimum == string.Empty)
                    {
                        objDict["lower"] = $"'";
                    }
                    else
                    {
                        objDict["lower"] = $"'{item.Minimum}";
                    }

                    if (item.Maximum == "0" || item.Maximum == string.Empty)
                    {
                        objDict["upper"] = $"'";
                    }
                    else
                    {
                        objDict["upper"] = $"'{item.Maximum}";
                    }

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

                worksheet.Cell("E5").Value = header.DrawingNo.ToUpper();
                worksheet.Cell("E6").Value = header.RevisionNo.ToUpper();
                worksheet.Cell("O7").Value = DateTime.Today.ToString("dd-MM-yyyy");
                worksheet.Cell("O5").Value = intMaterialQty;
                worksheet.Cell("O5").Style.Font.FontSize = 12;

                var row = 13;
                var col = row + dynamicList.Count - 1;
                var dataRange = worksheet.Range($"A{row}:P{col}");
                // worksheet.AutoFilter.Clear();
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

                var srow = 13; // reset
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
                    c++;

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
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                    c++;

                    worksheet.Cell(srow, c).Style.NumberFormat.Format = "General";
                    worksheet.Cell(srow, c).Style.Font.FontSize = 11;
                    worksheet.Cell(srow, c).Style.Alignment.WrapText = true;
                    worksheet.Cell(srow, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                    worksheet.Cell(srow, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                    var cellnum = 0;
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
                                        cellnum++;
                                        Cell cell = new Cell()
                                        {
                                            CellReference = worksheet.Cell(srow, c).Address.ToString(), // Location of Cell
                                            DataType = CellValues.String,
                                            //  CellValue = new CellValue($"'{KeyValue[1]}".ToString(CultureInfo.InvariantCulture))
                                        };
                                        worksheet.Cell(12, c).Value = $"{header.DrawingNo.ToUpper()}-{cellnum.ToString()}";
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

                var drow = 12;

                var dcol = drow + dynamicList.Count - 1;
                dataRange = worksheet.Range($"A{drow}:P{dcol}");

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

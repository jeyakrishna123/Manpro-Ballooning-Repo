using AllinoneBalloon.Models;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Spreadsheet;

namespace AllinoneBalloon.Common
{
    public partial class ClosedXmlReportGenerator
    {
        #region Demo
        public static void GenerateReportDemo(string templatePath, string workingDir, string role, CreateHeader header, IEnumerable<object> items, TblBaloonDrawingSetting setting)
        {
            // Console.WriteLine($"String: {templatePath}");
            FileInfo fi = new FileInfo(templatePath);
            string desFile = fi.Name;
            string filePath = Path.Combine(workingDir, $"{desFile}");

            using (var workbook = new XLWorkbook(templatePath))
            {
                var worksheet = workbook.Worksheet(1);
                int intMaterialQty;
                if (int.TryParse(header.Quantity.ToString(), out intMaterialQty))
                {
                    worksheet.Cell("C2").Value = header.DrawingNo.ToUpper();
                    worksheet.Cell("K2").Value = header.RevisionNo.ToUpper();
                    worksheet.Cell("K3").Value = DateTime.Today;
                    worksheet.Cell("K4").Value = header.UserName.ToUpper();
                    worksheet.Cell("K4").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    worksheet.Cell("K4").Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                    worksheet.Cell("P3").Value = intMaterialQty;

                    var selectedColumns = items.Select(item => new ThisItem
                    {
                        Page_No = ((dynamic)item).Page_No,
                        Balloon = ((dynamic)item).Balloon,
                        Characteristics = ((dynamic)item).Characteristics,
                        Spec = ((dynamic)item).Spec,
                        Unit = ((dynamic)item).Unit,
                        Quantity = ((dynamic)item).Quantity,
                        Actual = ((dynamic)item).ActualDecision
                    }).ToList();
                    var row = 8;
                    var col = row + selectedColumns.Count - 1;
                    var dataRange = worksheet.Range($"A{row}:R{col}");

                    foreach (var item in selectedColumns)
                    {
                        var c = 1;

                        worksheet.Cell(row, c).Value = $"'{item.Balloon}";
                        worksheet.Cell(row, c).Style.NumberFormat.Format = "General";
                        worksheet.Cell(row, c).Style.Font.FontSize = 11;
                        worksheet.Cell(row, c).Style.Alignment.WrapText = true;
                        worksheet.Cell(row, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                        worksheet.Cell(row, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        c++;

                        worksheet.Cell(row, c).Value = $"'{item.Characteristics}";
                        worksheet.Cell(row, c).Style.NumberFormat.Format = "@";
                        worksheet.Cell(row, c).Style.Font.FontSize = 11;
                        worksheet.Cell(row, c).Style.Alignment.WrapText = true;
                        worksheet.Cell(row, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                        worksheet.Cell(row, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        c++;

                        worksheet.Cell(row, c).Value = $"'{item.Spec}";
                        worksheet.Cell(row, c).Style.NumberFormat.Format = "@";
                        worksheet.Cell(row, c).Style.Font.FontSize = 11;
                        worksheet.Cell(row, c).Style.Font.FontName = "IMS";
                        worksheet.Cell(row, c).Style.Alignment.WrapText = true;
                        worksheet.Cell(row, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                        worksheet.Cell(row, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        c++;

                        worksheet.Cell(row, c).Value = $"'{item.Unit}";
                        worksheet.Cell(row, c).Style.NumberFormat.Format = "@";
                        worksheet.Cell(row, c).Style.Font.FontSize = 11;
                        worksheet.Cell(row, c).Style.Alignment.WrapText = true;
                        worksheet.Cell(row, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                        worksheet.Cell(row, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);

                        foreach (var ad in item.Actual)
                        {
                            var counter = c;
                            if (counter > 20)
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
                                                CellReference = worksheet.Cell(row, c).Address.ToString(), // Location of Cell
                                                DataType = CellValues.String,
                                                //  CellValue = new CellValue($"'{KeyValue[1]}".ToString(CultureInfo.InvariantCulture))
                                            };
                                            worksheet.Cell(row, c).Value = $"'{KeyValue[1]}";
                                            worksheet.Cell(row, c).Style.NumberFormat.Format = "@";
                                            worksheet.Cell(row, c).Style.Alignment.WrapText = true;
                                            worksheet.Cell(row, c).Style.Font.FontSize = 11;
                                            worksheet.Cell(row, c).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                                            worksheet.Cell(row, c).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                                        }
                                        if (KeyValue[0] == "Decision")
                                        {
                                            string BalloonColor = "#ffffff";
                                            if (KeyValue[1] == "false")
                                            {
                                                BalloonColor = setting.ErrorBalloon;
                                                //Console.WriteLine($"key: {KeyValue[0]}, Value: {KeyValue[1]} ,BalloonColor: {ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10)}");
                                                worksheet.Cell(row, c).Style.Fill.BackgroundColor = ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10);
                                            }
                                            if (KeyValue[1] == "true")
                                            {
                                                BalloonColor = setting.SuccessBalloon;
                                                // Console.WriteLine($"key: {KeyValue[0]}, Value: {KeyValue[1]} ,BalloonColor: {ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10)}");
                                                worksheet.Cell(row, c).Style.Fill.BackgroundColor = ColorConverter.HexToRgba(BalloonColor.Substring(0, 7), .10);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        ++row;
                    }
                    dataRange.Style.Protection.SetLocked(true);
                    dataRange.Style.Border.TopBorder = XLBorderStyleValues.Thin;
                    dataRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
                    dataRange.Style.Border.LeftBorder = XLBorderStyleValues.Thin;
                    dataRange.Style.Border.RightBorder = XLBorderStyleValues.Thin;

                    dataRange.Style.Border.TopBorderColor = XLColor.Black;
                    dataRange.Style.Border.BottomBorderColor = XLColor.Black;
                    dataRange.Style.Border.LeftBorderColor = XLColor.Black;
                    dataRange.Style.Border.RightBorderColor = XLColor.Black;
                }
                // Save the workbook
                worksheet.Protect();
                workbook.SaveAs(filePath);
            }
        }
        #endregion
    }
}

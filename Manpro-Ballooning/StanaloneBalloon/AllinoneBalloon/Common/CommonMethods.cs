using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Drawing.Imaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using static System.Net.Mime.MediaTypeNames;
using AllinoneBalloon.Models.Configuration;
using AllinoneBalloon.Models;

namespace AllinoneBalloon.Common
{
#pragma warning disable IDE0018
    public class CommonMethods
    {
        private readonly DimTestContext _dbcontext;
        public TblBaloonDrawingHeader _tblhdr;
        public CommonMethods(DimTestContext dbcontext, TblBaloonDrawingHeader tblhdr)
        {
            _dbcontext = dbcontext;
            _tblhdr = tblhdr;
        }

        #region Fraction to Double Conversion
        double FractionToDouble(string fraction)
        {
            if (fraction == null)
            {
                return 0;
            }
            
            double result;

            if (double.TryParse(fraction.Replace("°", ""), out result))
            {
                return result;
            }
            
            string[] split = fraction.Replace("°", "").Split(new char[] { ' ', '/' });

            if (split.Length == 2 || split.Length == 3)
            {
                int a, b;

                if (int.TryParse(split[0], out a) && int.TryParse(split[1], out b))
                {
                    if (split.Length == 2)
                    {
                        return (double)a / b;
                    }

                    int c;

                    if (int.TryParse(split[2], out c))
                    {
                        return a + (double)b / c;
                    }
                }
            }         
            throw new FormatException("Not a valid fraction.");
        }
        #endregion

        #region Assign Min Max Value Degree
        string AssignMinMaxValue_Degree(string ocrtext)
        {
            long hdrid = 0;
            string MinMaxAngles = string.Empty ;
            if (_tblhdr != null)
            {
                hdrid = _tblhdr.BaloonDrwID;
                MinMaxAngles = _dbcontext.TblBaloonDrawingSettings.Where(w => w.BaloonDrwId == hdrid).Select(w => w.MinMaxAngles).FirstOrDefault();
            }
            else
            {
                MinMaxAngles = _dbcontext.TblConfigurations.Where(w => w.Key == "MinMaxAngles").Select(w => w.Value).FirstOrDefault();
            }
            
            string Nominal_Min_Max = string.Empty;
            decimal nominal = 0;
            decimal min = 0;
            decimal max = 0;
            decimal angl = 0;
            string Type = string.Empty;
            string SubType = string.Empty;
            string Unit = string.Empty;
            string ToleranceType = string.Empty;
            string PlusTolerance = string.Empty;
            string MinusTolerance = string.Empty;

            if (Regex.IsMatch(ocrtext, @"^((\.\d+)(?:\s|))X((?:\s|)(\d+))?°$"))
            {
                string pattern_non_dot = @"^((\.\d+)(?:\s|))X((?:\s|)(\d+))?°$";
                Regex non_dot_regex = new Regex(pattern_non_dot);
                Match match_non_plmin = non_dot_regex.Match(ocrtext);
                if (match_non_plmin.Success)
                {
                    GroupCollection groups = match_non_plmin.Groups;
                    nominal = Convert.ToDecimal(groups[4].Value.ToString());
                }

                min = 0;
                max = 0;
                Type = "";
                SubType = "";
                Unit = "";
                ToleranceType = "Linear";
                PlusTolerance = "";
                MinusTolerance = "";
                Nominal_Min_Max = nominal.ToString() + "°" + "," + min.ToString() + "," + max.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }
            else
            {
                string inputStr = ocrtext.Replace("\r\n", "").Replace("2X", "").Replace("3 X", "").Replace("3X", "").Replace("4X", "").Replace("4 X", "");
                if (inputStr.Contains("X"))
                {
                    inputStr = inputStr.Substring(inputStr.IndexOf("X"), inputStr.Length - 1).Replace("X", "");
                }
                if (inputStr.Contains("°") && inputStr.Contains("±"))
                {
                    nominal = Convert.ToDecimal(inputStr.Substring(0, inputStr.IndexOf("±")).Replace("°", ""));
                    string value = inputStr.Replace("°", "").Substring(inputStr.Replace("°", "").IndexOf("±") + 1);
                    min = nominal - Convert.ToDecimal(value);
                    max = nominal + Convert.ToDecimal(value);
                    Type = "Dimension";
                    SubType = "Linear Dimension";
                    Unit = "INCHES";
                    ToleranceType = "Linear";
                    PlusTolerance = value;
                    MinusTolerance = value;
                    Nominal_Min_Max = nominal.ToString() + "°" + "," + min.ToString() + "," + max.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
                }
                else if (inputStr.Contains("°"))
                {
                    nominal = Convert.ToDecimal(inputStr.Replace("°", ""));
                    angl = Convert.ToDecimal(FractionToDouble(MinMaxAngles));
                    min = nominal - angl;
                    max = nominal + angl;
                    Type = "Dimension";
                    SubType = "Default";
                    Unit = "INCHES";
                    ToleranceType = "Default";
                    PlusTolerance = Convert.ToString(angl);
                    MinusTolerance = Convert.ToString(angl);
                    Nominal_Min_Max = nominal.ToString() + "°" + "," + min.ToString() + "," + max.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
                }

                try
                {
                    string[] doubleArrayPlusTolerance = PlusTolerance.Split('.');
                    string[] doubleArrayMinusTolerance = MinusTolerance.Split('.');
                    string[] minmax;
                    minmax = Nominal_Min_Max.Split(',');
                    string minv = string.Empty;
                    string maxv = string.Empty;
                    if (minmax.Length > 0)
                    {
                        if (minmax.Length > 1)
                        {
                            decimal min1 = Convert.ToDecimal(minmax[1]);
                            var mlen = doubleArrayMinusTolerance[1].Length;
                            if (mlen < 2) { mlen = 2; }
                            string[] min1s = minmax[1].Split('.');
                            var min1slen = min1s[1].Length;
                            if (min1slen < 2)
                            {
                                min1 = Convert.ToDecimal(minmax[1] + "00");
                            }
                            decimal dmround = decimal.Round(min1, mlen);
                            minv = Convert.ToString(dmround);
                            minmax[1] = minv;
                        }
                        if (minmax.Length > 2)
                        {
                            decimal max1 = Convert.ToDecimal(minmax[2]);
                            var plen = doubleArrayPlusTolerance[1].Length;
                            if (plen < 2) { plen = 2; }
                            string[] max1s = minmax[2].Split('.');
                            var max1slen = max1s[1].Length;
                            if (max1slen < 2)
                            {
                                max1 = Convert.ToDecimal(minmax[2] + "00");
                            }
                            decimal dpround = decimal.Round(max1, plen);
                            maxv = Convert.ToString(dpround);
                            minmax[2] = maxv;
                        }
                        Nominal_Min_Max = string.Join(",", minmax);
                    }
                }
                catch (Exception ex)
                {
                    objErrorLog.WriteErrorToText(ex);
                }
            }
            return Nominal_Min_Max;
        }
        #endregion

        #region Assign Min Max Value
        public string AssignMinMaxValue(string ocrtext)
        {
            string nominal = string.Empty;
            string Type = string.Empty;
            string SubType = string.Empty;
            string Unit = string.Empty;
            string ToleranceType = string.Empty;
            string PlusTolerance = string.Empty;
            string MinusTolerance = string.Empty;
            //Regex pattern = new Regex("[;,\t\r ]|[\n]{2}"); pattern.Replace(myString, "\n");
            string Nominal_Min_Max = string.Empty;
            string inputStr = ocrtext.Replace("\r\n", "").Replace("o", "0").Replace("O", "0").Replace("MAX", "").Replace(" ", "");
            var doubleArray = Regex.Split(inputStr, @"[^0-9\.]+").Where(c => c != "." && c.Trim() != "");
            
            string[] xmlLines = doubleArray.ToArray();
            long hdrid = 0;
            decimal MinMaxOneDigit = decimal.MinValue;
            decimal MinMaxTwoDigit = decimal.MinValue;
            decimal MinMaxThreeDigit = decimal.MinValue;
            decimal MinMaxFourDigit = decimal.MinValue;

            if (_tblhdr != null){
                hdrid = _tblhdr.BaloonDrwID;

                var _setting = _dbcontext.TblBaloonDrawingSettings.Where(w => w.BaloonDrwId == hdrid).FirstOrDefault();
                 MinMaxOneDigit = Convert.ToDecimal(_setting.MinMaxOneDigit);
                 MinMaxTwoDigit = Convert.ToDecimal(_setting.MinMaxTwoDigit);
                 MinMaxThreeDigit = Convert.ToDecimal(_setting.MinMaxThreeDigit);
                 MinMaxFourDigit = Convert.ToDecimal(_setting.MinMaxFourDigit);
            }
            else {
                 MinMaxOneDigit = Convert.ToDecimal(_dbcontext.TblConfigurations.Where(w => w.Key == "MinMaxOneDigit").Select(w => w.Value).FirstOrDefault());
                 MinMaxTwoDigit = Convert.ToDecimal(_dbcontext.TblConfigurations.Where(w => w.Key == "MinMaxTwoDigit").Select(w => w.Value).FirstOrDefault());
                 MinMaxThreeDigit = Convert.ToDecimal(_dbcontext.TblConfigurations.Where(w => w.Key == "MinMaxThreeDigit").Select(w => w.Value).FirstOrDefault());
                 MinMaxFourDigit = Convert.ToDecimal(_dbcontext.TblConfigurations.Where(w => w.Key == "MinMaxFourDigit").Select(w => w.Value).FirstOrDefault());
            }
            if (xmlLines.Length > 0)
                if (xmlLines.Length > 1)
                {
                    int count = xmlLines[1].Count(f => f == '.');
                    if (count == 3)
                    {
                        string stringAfterChar = xmlLines[1].Substring(xmlLines[1].IndexOf("..") + 0).Replace("..", ".");
                        Array.Resize(ref xmlLines, xmlLines.Length + 1);
                        xmlLines[1] = xmlLines[1].Substring(0, xmlLines[1].IndexOf(".."));
                        xmlLines[2] = stringAfterChar;
                    }
                }
            if (xmlLines.Length == 1 && (inputStr.Contains("R.") || inputStr.Contains("R") || inputStr.Contains("Ø") || inputStr.Contains("(") || inputStr.Contains(")") || inputStr.Contains("¡")))
            {
                decimal min = 0;
                decimal max = 0;
                decimal output = 0;
                int incdecvalue = 0;
                string sym = string.Empty;

                nominal = inputStr.Replace("Ø", "").Replace("±", "").Replace("°", "").Replace("+", "").Replace("-", "").Replace("/", "").Replace("\r\n", "").Replace("¡", "").Replace("R", "").Replace("(", "").Replace(")", "").Replace("n", "").Replace("MAX", "").Replace("E", "").Replace("j", "").Replace(".MAX", "");
                output = Convert.ToDecimal(nominal);
                int i = 0;
                i = xmlLines[0].ToString().Split('.').Count() > 1
                 ? xmlLines[0].ToString().Split('.').ToList().ElementAt(1).Length
                 : 0;
                incdecvalue = i;
                if (incdecvalue == 1 || incdecvalue == 0)
                {
                    min = output - MinMaxOneDigit;
                    max = output + MinMaxOneDigit;
                    PlusTolerance = Convert.ToString(MinMaxOneDigit);
                    MinusTolerance = Convert.ToString(MinMaxOneDigit);
                }
                if (incdecvalue == 2)
                {
                    min = output - MinMaxTwoDigit;
                    max = output + MinMaxTwoDigit;
                    PlusTolerance = Convert.ToString(MinMaxTwoDigit);
                    MinusTolerance = Convert.ToString(MinMaxTwoDigit);
                }
                if (incdecvalue == 3)
                {
                    min = output - MinMaxThreeDigit;
                    max = output + MinMaxThreeDigit;
                    PlusTolerance = Convert.ToString(MinMaxThreeDigit);
                    MinusTolerance = Convert.ToString(MinMaxThreeDigit);
                }
                if (incdecvalue == 4)
                {
                    min = output - MinMaxFourDigit;
                    max = output + MinMaxFourDigit;
                    PlusTolerance = Convert.ToString(MinMaxFourDigit);
                    MinusTolerance = Convert.ToString(MinMaxFourDigit);
                }
                Type = "Dimension";
                SubType = "Circularity";
                Unit = "INCHES";
                ToleranceType = "Default";  

                Nominal_Min_Max = output + "," + min.ToString() + "," + max.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }
            else if (xmlLines.Length == 2 && inputStr.Contains("X"))
            {
                decimal min = 0;
                decimal max = 0;
                decimal output = 0;
                int incdecvalue = 0;
                string sym = string.Empty;

                int i = 0;
                i = xmlLines[1].ToString().Split('.').Count() > 1
                 ? xmlLines[1].ToString().Split('.').ToList().ElementAt(1).Length
                 : 0;
                incdecvalue = i;
                output = Convert.ToDecimal(xmlLines[1]);
                if (incdecvalue == 1 || incdecvalue == 0)
                {
                    min = output - MinMaxOneDigit;
                    max = output + MinMaxOneDigit;
                    PlusTolerance = Convert.ToString(MinMaxOneDigit);
                    MinusTolerance = Convert.ToString(MinMaxOneDigit);
                }
                if (incdecvalue == 2)
                {
                    min = output - MinMaxTwoDigit;
                    max = output + MinMaxTwoDigit;
                    PlusTolerance = Convert.ToString(MinMaxTwoDigit);
                    MinusTolerance = Convert.ToString(MinMaxTwoDigit);
                }
                if (incdecvalue == 3)
                {
                    min = output - MinMaxThreeDigit;
                    max = output + MinMaxThreeDigit;
                    PlusTolerance = Convert.ToString(MinMaxThreeDigit);
                    MinusTolerance = Convert.ToString(MinMaxThreeDigit);
                }
                if (incdecvalue == 4)
                {
                    min = output - MinMaxFourDigit;
                    max = output + MinMaxFourDigit;
                    PlusTolerance = Convert.ToString(MinMaxFourDigit);
                    MinusTolerance = Convert.ToString(MinMaxFourDigit);
                }
                Type = "Dimension";
                SubType = "Circularity";
                Unit = "INCHES";
                ToleranceType = "Default";

                Nominal_Min_Max = output + "," + min.ToString() + "," + max.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }
            else if (xmlLines.Length == 1 && (!inputStr.Contains("R.") || !inputStr.Contains("R") || !inputStr.Contains("Ø") || !inputStr.Contains("(") || !inputStr.Contains(")") || !inputStr.Contains("¡")))
            {
                decimal min = 0;
                decimal max = 0;
                decimal output = 0;
                int incdecvalue = 0;
                inputStr = inputStr.Replace("Ø", "").Replace("±", "").Replace("°", "").Replace("+", "").Replace("-", "").Replace("/", "").Replace("\r\n", "");
                output = Convert.ToDecimal(inputStr);
                int i = 0;
                i = xmlLines[0].ToString().Split('.').Count() > 1
                 ? xmlLines[0].ToString().Split('.').ToList().ElementAt(1).Length
                 : 0;
                incdecvalue = i;
                if (incdecvalue == 1 || incdecvalue == 0)
                {
                    min = output - MinMaxOneDigit;
                    max = output + MinMaxOneDigit;
                    PlusTolerance = Convert.ToString(MinMaxOneDigit);
                    MinusTolerance = Convert.ToString(MinMaxOneDigit);
                }
                if (incdecvalue == 2)
                {
                    min = output - MinMaxTwoDigit;
                    max = output + MinMaxTwoDigit;
                    PlusTolerance = Convert.ToString(MinMaxTwoDigit);
                    MinusTolerance = Convert.ToString(MinMaxTwoDigit);
                }
                if (incdecvalue == 3)
                {
                    min = output - MinMaxThreeDigit;
                    max = output + MinMaxThreeDigit;
                    PlusTolerance = Convert.ToString(MinMaxThreeDigit);
                    MinusTolerance = Convert.ToString(MinMaxThreeDigit);
                }
                if (incdecvalue == 4)
                {
                    min = output - MinMaxFourDigit;
                    max = output + MinMaxFourDigit;
                    PlusTolerance = Convert.ToString(MinMaxFourDigit);
                    MinusTolerance = Convert.ToString(MinMaxFourDigit);
                }
                Type = "Dimension";
                SubType = "Linear Dimension";
                Unit = "INCHES";
                ToleranceType = "Default";
                Nominal_Min_Max = output.ToString().Replace("\r\n", "") + "," + min.ToString() + "," + max.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }

            else if (inputStr.Contains("±") && (inputStr.Contains("R.") || inputStr.Contains("R") || inputStr.Contains("Ø") || inputStr.Contains("(") || inputStr.Contains(")") || inputStr.Contains("¡")))
            {
                if (xmlLines.Length == 2)
                {
                    nominal = xmlLines[0];
                    string newnominal = string.Empty;
                    double mini = Convert.ToDouble(xmlLines[0]) - Convert.ToDouble(xmlLines[1]);
                    double maxi = Convert.ToDouble(xmlLines[0]) + Convert.ToDouble(xmlLines[1]);

                    Type = "Dimension";
                    SubType = "Circularity";
                    Unit = "INCHES";
                    ToleranceType = "Linear";
                    PlusTolerance = xmlLines[1];
                    MinusTolerance = xmlLines[1];
                    Nominal_Min_Max = nominal.ToString() + "," + mini.ToString() + "," + maxi.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
                }
                else if (xmlLines.Length == 3)
                {
                    nominal = xmlLines[1];
                    string newnominal = string.Empty;
                    double mini = Convert.ToDouble(xmlLines[1]) - Convert.ToDouble(xmlLines[2]);
                    double maxi = Convert.ToDouble(xmlLines[1]) + Convert.ToDouble(xmlLines[2]);

                    Type = "Dimension";
                    SubType = "Circularity";
                    Unit = "INCHES";
                    ToleranceType = "Linear";
                    PlusTolerance = xmlLines[2];
                    MinusTolerance = xmlLines[2];
                    Nominal_Min_Max = nominal.ToString() + "," + mini.ToString() + "," + maxi.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
                }
            }
            else if (inputStr.Contains("±") && (!inputStr.Contains("R.") || !inputStr.Contains("R") || !inputStr.Contains("Ø") || !inputStr.Contains("(") || !inputStr.Contains(")") || !inputStr.Contains("¡")))
            {
                if (xmlLines.Length == 2)
                {
                    nominal = xmlLines[0];
                    double mini = Convert.ToDouble(xmlLines[0]) - Convert.ToDouble(xmlLines[1]);
                    double maxi = Convert.ToDouble(xmlLines[0]) + Convert.ToDouble(xmlLines[1]);
                    Type = "Dimension";
                    SubType = "Circularity";
                    Unit = "INCHES";
                    ToleranceType = "Linear";
                    PlusTolerance = xmlLines[1];
                    MinusTolerance = xmlLines[1];
                    Nominal_Min_Max = nominal.ToString() + "," + mini.ToString() + "," + maxi.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
                }
                if (xmlLines.Length == 3)
                {
                    nominal = xmlLines[1];
                    double mini = Convert.ToDouble(xmlLines[1]) - Convert.ToDouble(xmlLines[2]);
                    double maxi = Convert.ToDouble(xmlLines[1]) + Convert.ToDouble(xmlLines[2]);
                    Type = "Dimension";
                    SubType = "Circularity";
                    Unit = "INCHES";
                    ToleranceType = "Linear";
                    PlusTolerance = xmlLines[2];
                    MinusTolerance = xmlLines[2];
                    Nominal_Min_Max = nominal.ToString() + "," + mini.ToString() + "," + maxi.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
                }
            }
            else if (inputStr.Contains("+") || inputStr.Contains("-"))
            {
                if (xmlLines.Length == 3)
                {
                    double nom = Convert.ToDouble(xmlLines[0]);
                    double mini = Convert.ToDouble(xmlLines[0]) - Convert.ToDouble(xmlLines[2]);
                    double maxi = Convert.ToDouble(xmlLines[0]) + Convert.ToDouble(xmlLines[1]);
                    Type = "Dimension";
                    SubType = "Circularity";
                    Unit = "INCHES";
                    ToleranceType = "Linear";
                    PlusTolerance = xmlLines[0];
                    MinusTolerance = xmlLines[2];
                    Nominal_Min_Max = nom.ToString() + "," + mini.ToString() + "," + maxi.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
                }
                else if (xmlLines.Length == 2)
                {
                    //string totalstr = ocredText.Replace("\r\n", "");
                    string frststr = ocrtext.Substring(0, ocrtext.IndexOf("\r\n")).Replace("-", "");
                    string secondstr = ocrtext.Substring(0, ocrtext.LastIndexOf("+"));
                    string secondstrfinal = secondstr.Replace(frststr, "").Replace("+", "").Replace("\r\n", "").Replace("-", "");
                    string thirdstr = ocrtext.Substring(ocrtext.IndexOf("+") + 0).Replace("-", "").Replace("\r\n", "").Replace("+", "");

                    double nom = Convert.ToDouble(secondstrfinal);
                    double mini = Convert.ToDouble(secondstrfinal) - Convert.ToDouble(frststr);
                    double maxi = Convert.ToDouble(secondstrfinal) + Convert.ToDouble(thirdstr);
                    Type = "Dimension";
                    SubType = "Circularity";
                    Unit = "INCHES";
                    ToleranceType = "Linear";
                    PlusTolerance = frststr;
                    MinusTolerance = thirdstr;
                    Nominal_Min_Max = nom.ToString() + "," + mini.ToString() + "," + maxi.ToString() + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
                }
            }
            if (!inputStr.Contains("±") && !inputStr.Contains("+") && !inputStr.Contains("-") && !inputStr.Contains(".") && !inputStr.Contains("R"))
            {
                Type = "Notes";
                SubType = "Notes";
                Unit = "INCHES";
                ToleranceType = "Linear";
                PlusTolerance = "";
                MinusTolerance = "";
                Nominal_Min_Max = inputStr + "," + "" + "," + "" + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }
            if (inputStr.Contains("Û") || inputStr.Contains("Ú") || inputStr.Contains("´") || inputStr.Contains("»") || inputStr.Contains("«"))
            {
                Type = "Surface Finish";
                SubType = "Surface Finish";
                Unit = "INCHES";
                ToleranceType = "Linear";
                PlusTolerance = "";
                MinusTolerance = "";
                Nominal_Min_Max = inputStr + "," + "" + "," + "" + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }
            if (inputStr.Contains("ëûí"))
            {
                Type = "Geometric Tolerance";
                SubType = "Position";
                Unit = "INCHES";
                ToleranceType = "Linear";
                PlusTolerance = "";
                MinusTolerance = "";
                Nominal_Min_Max = inputStr + "," + "" + "," + "" + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }
            if (inputStr.Contains("ëÐí"))
            {
                Type = "Geometric Tolerance";
                SubType = "Parallelism";
                Unit = "INCHES";
                ToleranceType = "Linear";
                PlusTolerance = "";
                MinusTolerance = "";
                Nominal_Min_Max = inputStr + "," + "" + "," + "" + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }
           
            try
            {
                string[] doubleArrayPlusTolerance = PlusTolerance.Split('.');
                string[] doubleArrayMinusTolerance = MinusTolerance.Split('.');
                string[] minmax;
                minmax = Nominal_Min_Max.Split(',');
                string minv = string.Empty;
                string maxv = string.Empty;
                if (minmax.Length > 0 && !IsNullOrEmpty(minmax))
                {
                    string[] minspeclen = minmax[0].Split('.');
                    var spelen = minspeclen[1].Length;

                    if (minmax.Length > 1)
                    {
                        decimal min = Convert.ToDecimal(minmax[1]);
                        var mtlen = doubleArrayMinusTolerance[1].Length;
                        if (mtlen < 2) { mtlen = 2; }
                        int miValue = Math.Max(mtlen, spelen);
                        minv = min.ToString($"F{miValue}");
                        minmax[1] = minv;
                    }
                    if (minmax.Length > 2)
                    {
                        decimal max = Convert.ToDecimal(minmax[2]);
                        var ptlen = doubleArrayPlusTolerance[1].Length;
                        if (ptlen < 2) { ptlen = 2; }
                        int miValue = Math.Max(ptlen, spelen);
                        maxv = max.ToString($"F{miValue}");
                        minmax[2] = maxv;
                    }
                    Nominal_Min_Max = string.Join(",", minmax);
                }
            }
            catch (Exception ex)
            {
                objErrorLog.WriteErrorToText(ex);
                Type = "";
                SubType = "";
                Unit = "";
                ToleranceType = "";
                PlusTolerance = "";
                MinusTolerance = "";
                Nominal_Min_Max = inputStr + "," + "" + "," + "" + "," + Type + "," + SubType + "," + Unit + "," + ToleranceType + "," + PlusTolerance + "," + MinusTolerance;
            }
            return Nominal_Min_Max;
        }
        #endregion

        #region Null or Empty Check
        public bool IsNullOrEmpty(Array array)
        {
            return (array == null || array.Length == 0);
        }
        #endregion

        #region Get Min Max Values
        public void GetMinMaxValues(string OCR_Text, out string Min, out string Max, out string Nomimal, out string Type, out string Subtype, out string Unit, out string ToleranceType, out string PlusTolerance, out string MinusTolerance)
        {
            try
            {
                if(OCR_Text.Contains("UN") || OCR_Text.Contains("HIF") || OCR_Text.Contains("UNF") || OCR_Text.Contains("UNS") || OCR_Text.Contains("STUB ACME") || OCR_Text.Contains("HST-DS") || OCR_Text.Contains("HST") || OCR_Text.Contains("VAM") || OCR_Text.Contains("TOP") || OCR_Text.Contains("SPCL"))
                {
                    throw new Exception("THREAD GAUGE Detected.");
                }

                int count = OCR_Text.Count(f => f == '.');
                string minv = string.Empty;
                string maxv = string.Empty;
                string nominalv = string.Empty;
                string typev = string.Empty;
                string subtypev = string.Empty;
                string unitv = string.Empty;
                string tolerancetypev = string.Empty;
                string plustolerancev = string.Empty;
                string minustolerancev = string.Empty;
                string[] minmax;
                string patternthru = @"^([\d.\s]+)?(X)?(\s*¡)([\d.\s]+)(-)?([\d.\s]+)?([\w\s]+)?$";
                if (Regex.IsMatch(OCR_Text, patternthru))
                {
                    Match match = Regex.Match(OCR_Text, patternthru);
                    if (match.Success)
                    {
                        string group1 = match.Groups[1].Value.Trim();
                        string group2 = match.Groups[2].Value.Trim();
                        string group3 = match.Groups[3].Value.Trim();
                        string group4 = match.Groups[4].Value.Trim();
                        string group5 = match.Groups[5].Value.Trim();
                        string group6 = match.Groups[6].Value.Trim();
                        string group7 = match.Groups[7].Value.Trim();
                        if (!string.IsNullOrEmpty(group4) && !string.IsNullOrEmpty(group6))
                        {
                            if (Convert.ToDecimal(group4) < Convert.ToDecimal(group6))
                            {
                                minv = group4;
                                maxv = group6;
                            }
                            else
                            {
                                minv = group6;
                                maxv = group4;
                            }
                            nominalv = $"{group1}{group2}{group3}{group4}{group5}{group6}";
                            typev = "";
                            subtypev = "";
                            unitv = "";
                            tolerancetypev = "";
                            plustolerancev = "";
                            minustolerancev = "";
                        }
                        else
                        {
                            minmax = AssignMinMaxValue(OCR_Text).Split(',');
                            if (minmax.Length > 0)
                            {
                                nominalv = minmax[0];
                                if (minmax.Length > 1)
                                {
                                    minv = minmax[1];
                                }
                                if (minmax.Length > 2)
                                {
                                    maxv = minmax[2];
                                }
                                if (minmax.Length > 3)
                                {
                                    typev = minmax[3];
                                }
                                if (minmax.Length > 4)
                                {
                                    subtypev = minmax[4];
                                }
                                if (minmax.Length > 5)
                                {
                                    unitv = minmax[5];
                                }
                                if (minmax.Length > 6)
                                {
                                    tolerancetypev = minmax[6];
                                }
                                if (minmax.Length > 7)
                                {
                                    plustolerancev = minmax[7];
                                }
                                if (minmax.Length > 8)
                                {
                                    minustolerancev = minmax[8];
                                }
                            }
                        }
                    }
                }
                else if ((OCR_Text.Contains("±") || OCR_Text.Contains("+") || OCR_Text.Contains("-") || count == 1 || count == 2 || count == 3 || OCR_Text.Contains("Û") || OCR_Text.Contains("Ú") || OCR_Text.Contains("´") || OCR_Text.Contains("»") || OCR_Text.Contains("«") || OCR_Text.Contains("ëûí") || OCR_Text.Contains("ëÐí")) && !OCR_Text.Contains("°"))
                {
                    minmax = AssignMinMaxValue(OCR_Text).Split(',');
                    if (minmax.Length > 0)
                    {
                        nominalv = minmax[0];
                        if (minmax.Length > 1)
                        {
                            minv = minmax[1];
                        }
                        if (minmax.Length > 2)
                        {
                            maxv = minmax[2];
                        }
                        if (minmax.Length > 3)
                        {
                            typev = minmax[3];
                        }
                        if (minmax.Length > 4)
                        {
                            subtypev = minmax[4];
                        }
                        if (minmax.Length > 5)
                        {
                            unitv = minmax[5];
                        }
                        if (minmax.Length > 6)
                        {
                            tolerancetypev = minmax[6];
                        }
                        if (minmax.Length > 7)
                        {
                            plustolerancev = minmax[7];
                        }
                        if (minmax.Length > 8)
                        {
                            minustolerancev = minmax[8];
                        }
                    }
                }
                else if (OCR_Text.Contains("°"))
                {
                    minmax = AssignMinMaxValue_Degree(OCR_Text).Split(',');
                    if (minmax.Length > 0)
                    {
                        nominalv = minmax[0];
                        if (minmax.Length > 1)
                        {
                            minv = minmax[1];
                        }
                        if (minmax.Length > 2)
                        {
                            maxv = minmax[2];
                        }
                        if (minmax.Length > 3)
                        {
                            typev = minmax[3];
                        }
                        if (minmax.Length > 4)
                        {
                            subtypev = minmax[4];
                        }
                        if (minmax.Length > 5)
                        {
                            unitv = minmax[5];
                        }
                        if (minmax.Length > 6)
                        {
                            tolerancetypev = minmax[6];
                        }
                        if (minmax.Length > 7)
                        {
                            plustolerancev = minmax[7];
                        }
                        if (minmax.Length > 8)
                        {
                            minustolerancev = minmax[8];
                        }
                    }
                }

                Min = minv;
                Max = maxv;
                Nomimal = nominalv;
                Type = typev;
                Subtype = subtypev;
                Unit = unitv;
                ToleranceType = tolerancetypev;
                PlusTolerance = plustolerancev;
                MinusTolerance = minustolerancev;
            }
            catch (Exception ex)
            {
                objErrorLog.WriteErrorToText(ex);
                Min = "";
                Max = "";
                Nomimal = OCR_Text;
                Type = "";
                Subtype = "";
                Unit = "";
                ToleranceType = "";
                PlusTolerance = "";
                MinusTolerance = "";
            }
        }
        #endregion

        #region Resize and Crop Image
        public static System.Drawing.Image resizeImage(System.Drawing.Image imgToResize, Size size)
        {
            return new Bitmap(imgToResize, size);
        }
        public static System.Drawing.Image cropImage(System.Drawing.Image img, System.Drawing.Rectangle cropArea)
        {
            Bitmap bmpImage = new Bitmap(img);
            return bmpImage.Clone(cropArea, bmpImage.PixelFormat);
        }
        #endregion

        #region Error Log
        ErrorLog objErrorLog = new ErrorLog();
        public string ErrorlogPath = string.Empty;
        #endregion

        #region Store Values in DataTable 
        public DataTable InitializeBalloonInline()
        {
            DataTable dtBalloonInline = new DataTable();
            try
            {
                //dtBalloonInline.Columns.Add("DrawLineID", typeof(Int64));
                dtBalloonInline.Columns.Add("BaloonDrwID", typeof(long));
                dtBalloonInline.Columns.Add("BaloonDrwFileID", typeof(string));
                dtBalloonInline.Columns.Add("Page_No", typeof(int));
                dtBalloonInline.Columns.Add("DrawingNumber", typeof(string));
                dtBalloonInline.Columns.Add("Revision", typeof(string));
                dtBalloonInline.Columns.Add("ProductionOrderNumber", typeof(string));
                dtBalloonInline.Columns.Add("SerialNo", typeof(string));
                dtBalloonInline.Columns.Add("Balloon", typeof(string));
                dtBalloonInline.Columns.Add("Spec", typeof(string));
                dtBalloonInline.Columns.Add("Nominal", typeof(string));
                dtBalloonInline.Columns.Add("Minimum", typeof(string));
                dtBalloonInline.Columns.Add("Maximum", typeof(string));
                dtBalloonInline.Columns.Add("Actual", typeof(string));
                dtBalloonInline.Columns.Add("Decision", typeof(string));
                dtBalloonInline.Columns.Add("DecisionBy", typeof(string));
                dtBalloonInline.Columns.Add("GaugeID", typeof(string));
                dtBalloonInline.Columns.Add("Operation", typeof(string));
                dtBalloonInline.Columns.Add("Comments", typeof(string));
                dtBalloonInline.Columns.Add("WorkCenter", typeof(string));
                dtBalloonInline.Columns.Add("RemarksonlyforQcInput", typeof(string));
                dtBalloonInline.Columns.Add("MeasuredBy", typeof(string));
                dtBalloonInline.Columns.Add("MeasuredOn", typeof(DateTime));
                dtBalloonInline.Columns.Add("Circle_X_Axis", typeof(int));
                dtBalloonInline.Columns.Add("Circle_Y_Axis", typeof(int));
                dtBalloonInline.Columns.Add("Circle_Width", typeof(int));
                dtBalloonInline.Columns.Add("Circle_Height", typeof(int));
                dtBalloonInline.Columns.Add("Balloon_Thickness", typeof(decimal));
                dtBalloonInline.Columns.Add("Balloon_Text_FontSize", typeof(decimal));
                dtBalloonInline.Columns.Add("ZoomFactor", typeof(decimal));
                dtBalloonInline.Columns.Add("Crop_X_Axis", typeof(int));
                dtBalloonInline.Columns.Add("Crop_Y_Axis", typeof(int));
                dtBalloonInline.Columns.Add("Crop_Width", typeof(int));
                dtBalloonInline.Columns.Add("Crop_Height", typeof(int));
                dtBalloonInline.Columns.Add("Dimension_Checked", typeof(bool));
                dtBalloonInline.Columns.Add("InspectionSet", typeof(int));
                dtBalloonInline.Columns.Add("CompletePercentage", typeof(string));
                dtBalloonInline.Columns.Add("Status", typeof(string));
                dtBalloonInline.Columns.Add("Approve_Status", typeof(int));
                dtBalloonInline.Columns.Add("Type", typeof(string));
                dtBalloonInline.Columns.Add("SubType", typeof(string));
                dtBalloonInline.Columns.Add("Unit", typeof(string));
                dtBalloonInline.Columns.Add("Quantity", typeof(int));
                dtBalloonInline.Columns.Add("ToleranceType", typeof(string));
                dtBalloonInline.Columns.Add("PlusTolerance", typeof(string));
                dtBalloonInline.Columns.Add("MinusTolerance", typeof(string));
                dtBalloonInline.Columns.Add("MaxTolerance", typeof(string));
                dtBalloonInline.Columns.Add("MinTolerance", typeof(string));
                dtBalloonInline.Columns.Add("CropImage", typeof(byte[]));
                dtBalloonInline.Columns.Add("CreatedBy", typeof(string));
                dtBalloonInline.Columns.Add("CreatedDate", typeof(DateTime));
                dtBalloonInline.Columns.Add("ModifiedBy", typeof(string));
                dtBalloonInline.Columns.Add("ModifiedDate", typeof(DateTime));
                dtBalloonInline.Columns.Add("Folder_PDFReport", typeof(string));
                dtBalloonInline.Columns.Add("Folder_DWNGReport", typeof(string));
                dtBalloonInline.Columns.Add("Folder_EXCELReport", typeof(string));
                dtBalloonInline.Columns.Add("BeforBalloon", typeof(int));
            }
            catch (Exception ex)
            {
                objErrorLog.WriteErrorToText(ex);
            }
            return dtBalloonInline;
        }
        #endregion
    }
#pragma warning restore IDE0018
}

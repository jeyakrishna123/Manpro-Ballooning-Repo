using System.Globalization;
using System.Text.RegularExpressions;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Data Transform
        public string OcrTextOptimization(string regionText, int x, int y, int w, int h, int imagewidth, int imageheight, AllinoneBalloon.Entities.Common.AutoBalloon searchForm)
        {
            string retval = "";
            try
            {
                regionText = regionText.Trim();
                if (string.IsNullOrWhiteSpace(regionText) || regionText == "" || regionText == "  " || regionText == " " || regionText == null)
                {
                    return retval;
                }

                // Accurate GD&T mode — preserve raw OCR text with symbols, skip simplification
                if (searchForm.accurateGDT)
                {
                    // Skip known non-dimension words
                    string[] skipwordsGDT = { "DRAWING", "FRAME", "SHEET", "SECTION", "D-D", "C-C", "B-B", "A-A",
                        "DETAIL", "DETAIL E", "VIEW",
                        searchForm.CdrawingNo, searchForm.CrevNo };
                    if (skipwordsGDT.Any(sw => regionText.Equals(sw, StringComparison.OrdinalIgnoreCase)))
                        return retval;

                    // Skip note/description text (not inspection dimensions)
                    string[] skipContainsGDT = { "ACCEPTANCE", "CRITERIA", "ESTIMATED", "WEIGHT",
                        "FLOW AREA", "INCREASED", "DECREASED", "ANGLE ALLOWED", "INCREMENTS",
                        "CHORD LENGTH", "SURFACES", "REQUIRE", "PLATING", "UNLESS", "OTHERWISE",
                        "SPECIFIED", "TOLERANCE", "INTERPRET", "FINISH", "MATERIAL",
                        "DIMENSIONS ARE", "DO NOT SCALE", "THIRD", "PROJECTION",
                        "CONFIDENTIAL", "PROPRIETARY", "COPYRIGHT" };
                    if (skipContainsGDT.Any(sw => regionText.IndexOf(sw, StringComparison.OrdinalIgnoreCase) >= 0))
                        return retval;

                    // Skip orphan single-letter datum refs (A, B, C, M) — not useful alone
                    // They should already be merged with their GD&T value by post-processing
                    if (regionText.Length == 1 && Regex.IsMatch(regionText, @"^[A-Z]$"))
                        return retval;

                    // Skip orphan datum modifiers: AM, A(M, (AM), (A(M), A(m)
                    if (Regex.IsMatch(regionText, @"^[\(]?[A-Z][\(]?[Mm]?\)?$"))
                        return retval;

                    return regionText;
                }

                if (regionText.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.Length > 1 && word.All(char.IsLetter)) > 3 || Regex.IsMatch(regionText, @"^[^0-9]*$"))
                {
                    return regionText;
                }
                if (regionText == "2180°")
                {
                    regionText = "2X180°";
                }
                if (regionText == "00")
                {
                    regionText = "30°";
                }
                if (regionText == "çë")
                {
                    regionText = "ç";
                }
                if (regionText == "63")
                {
                    regionText = "»";
                }
                if (regionText == "X5°" || regionText == "45°(" || regionText == "45Z" || regionText == "452" || regionText == "45" || regionText == "45O" || regionText == "450" || regionText == "42" || regionText == "459")
                {
                    regionText = "45°";
                }
                // Fix degree misreads: "459 450", "450 459", "459 459" etc → "45°"
                if (Regex.IsMatch(regionText, @"^45[0-9O]\s+45[0-9O]$"))
                {
                    regionText = "45°";
                }
                if (regionText == "32")
                {
                    regionText = "´";
                }
                if (regionText == "38" || regionText == "39" || regionText == "30" || regionText == "396" || regionText == "380" || regionText == "390" || regionText == "300" || regionText == "3905" || regionText == "398" || regionText == "30O")
                {
                    regionText = "30°";
                }
                if (regionText == "150" || regionText == "15")
                {
                    regionText = "15°";
                }
                if (regionText == "600" || regionText == "60")
                {
                    regionText = "60°";
                }
                if (regionText == "100" || regionText == "10")
                {
                    regionText = "10°";
                }
                if (regionText == "250" || regionText == "25")
                {
                    regionText = "25°";
                }
                if (regionText == "200" || regionText == "29«")
                {
                    regionText = "20°";
                }
                if (regionText == "900")
                {
                    regionText = "90°";
                }
                if (regionText == "70")
                {
                    regionText = "7°";
                }
                if (regionText == "50")
                {
                    regionText = "5°";
                }
                if (regionText == "500")
                {
                    regionText = "50°";
                }
                if (regionText == "û" || regionText == "E")
                {
                    regionText = "";
                }
                if (regionText == "Rù6")
                {
                    regionText = "R.6";
                }
                if (regionText == "R.î3" || regionText == "R.îñ")
                {
                    regionText = "R.03";
                }
                if (regionText == "R.00")
                {
                    regionText = "R.005";
                }
                if (regionText == ".îîóë")
                {
                    regionText = ".005";
                }
                if (regionText == "125")
                {
                    regionText = "«";
                }
                if (regionText == "4-" || regionText == "T-")
                {
                    regionText = "";
                }
                if (regionText.EndsWith(".") || regionText.EndsWith("-") || regionText.EndsWith("û"))
                    regionText = string.Concat(regionText.AsSpan(0, regionText.Length - 1), "");

                if (regionText.Contains(")("))
                    regionText = regionText.Replace(")(", "X");

                Dictionary<string, string> replacements = new Dictionary<string, string>{

                        { "î.", "O" },
                        { "çç", "" },
                        { "ç ç", "" },
                        { "═", "" },
                        { "══", "" },
                        { "EB", "─" },
                        {"XX",""},
                        {"##","" },
                        {"..","" },
                        {":","" },
                        {"«ç","" },
                        {"-ç","" },
                        {"ç-","" },
                        {"çë","ç" },
                        {"±F","OF" },
                        {"°F","OF" },
                        {"-³","" },
                        {".³","" },
                        {"³-","" },
                        {".ë","" },
                        {"-³ ",""},
                        { "-═",""},
                        { "-----",""},
                        { "-Q-","."},
                        { "ð","2"},
                        { " ±","±"},
                        { "à","¡"},
                        { "±-","±."},
                        { "|","" },
                        { "-X","" },
                        { "APART","" }
                                      };
                foreach (var replacement in replacements)
                {
                    regionText = regionText.Replace(replacement.Key, replacement.Value);
                }
                if (regionText.Contains("(") && regionText.Contains(")") && regionText.Contains("-"))
                {
                    //regionText = regionText.Replace("-", ".");
                }
                if (regionText.Trim().StartsWith("I"))
                {
                    regionText = regionText.Substring(1);
                }
                if (regionText.Trim().StartsWith("T-"))
                {
                    regionText = regionText.Substring(2);
                }
                if (regionText.Trim().EndsWith("LX"))
                {
                    regionText = string.Concat(regionText.AsSpan(0, regionText.Length - 2), "°");
                }
                if (regionText.Length == 1 && (regionText == "«" || regionText == "´" || regionText == "Ú" || regionText == "Û" || regionText == "»"))
                {
                    return regionText;
                }
                if (Regex.IsMatch(regionText, @"\(([^[\]]*)\)"))
                {
                    return regionText;
                }
                string zeroDegreePattern = @"\b([\d\s]+)+(\.0)\b";
                if (Regex.IsMatch(regionText, zeroDegreePattern))
                {
                    Regex arrowregex = new Regex(zeroDegreePattern);
                    Match match = arrowregex.Match(regionText);

                    if (match.Success)
                    {
                        string group1 = match.Groups[1].Value.Trim();
                        string group2 = match.Groups[2].Value;
                        regionText = $"{group1}°";
                        return regionText;
                    }
                }
                regionText = Regex.Replace(regionText, @"\r\n?|\n", "");

                try
                {
                    if (regionText.Contains("+") && regionText.Contains(")"))
                    {
                        regionText = regionText.Substring(0, regionText.IndexOf(")", regionText.IndexOf(")") + 1));
                    }
                }
                catch (Exception ex)
                {
                    objerr.WriteErrorToText(ex);
                }
                // repeated value
                if (Regex.IsMatch(regionText, @"([a-zA-Z0-9])\1\1+"))
                {
                    //return retval;
                }
                // Only discard if text is purely GD&T noise (ç without any digits)
                if (regionText.Contains("ç") && !regionText.StartsWith("ç") && !Regex.IsMatch(regionText, @"\d"))
                {
                    return retval;
                }
                //─ ¡0.08Þ C AÞ
                if (Regex.IsMatch(regionText, @"^(((?:ç)|(?:─))(?:\s)?(?:¡)?(?:\s)?(?:\d+?\.\d+)(?:\s)?(?:[A-Z]{1})?(?:Þ)(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ))$"))
                {
                    return regionText;
                }
                if (Regex.IsMatch(regionText, @"^([(?:ç)|(?:─)|(?:┐)|(?:┤)|(?:┬)|(?:┘)](?:\s+)?(?:[(?:¡)|(?:\s+)])?(?:[\d.\s]+)?(?:(\s+|[A-Z]{1}|Þ)?)+)$"))
                {
                    return regionText;
                }
                if (Regex.IsMatch(regionText, @"^(((?:ç)|(?:─))(?:\s)?(?:¡)?(?:\s)?(?:\.\d+)(?:\/)?(?:\d+?\.\d+)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?)$"))
                {
                    if (regionText.Contains("─"))
                    {
                        string[] spltxt = regionText.Split("─");
                        if (spltxt[1].Length > 0 && !spltxt[1].StartsWith(" "))
                        {
                            if (spltxt[0] == "") { regionText = "─" + " " + spltxt[1]; }
                            else { regionText = spltxt[0] + "─ " + spltxt[1]; }
                        }
                    }

                    if (regionText.Contains("ç"))
                    {
                        string[] spltxt = regionText.Split("ç");
                        if (spltxt[1].Length > 0 && !spltxt[1].StartsWith(" "))
                        {
                            if (spltxt[0] == "") { regionText = "ç" + " " + spltxt[1]; }
                            else { regionText = spltxt[0] + "ç " + spltxt[1]; }
                        }
                    }
                    return regionText;
                }
                if (regionText.Contains("ç") && regionText.Contains("°"))
                {
                    return retval;
                }
                if ((regionText.EndsWith("X.") || regionText.EndsWith("X-")) && regionText.Length > 3)
                {
                    regionText = regionText.Replace("X.", "").Replace("X-", "");
                }

                if (regionText.Contains("X"))
                {
                    string[] hastext = regionText.Split("X");
                    if (hastext[0].Trim().Length > 0 && hastext[1].Trim().Length > 0 && Regex.IsMatch(regionText, @"^([\d\.\s]+)X((?:\s)?(\d+))$"))
                    {
                        var deg = hastext[1].Trim();
                        if (deg.EndsWith("0"))
                        {
                            deg = string.Concat(deg.AsSpan(0, deg.Length - 1), "°");
                        }
                        regionText = hastext[0].Trim() + "X" + deg;
                        return regionText;
                    }
                    // Only exclude if it's just "X" with spaces/dots but no meaningful dimension
                    // Keep patterns like "4X 20.6" (count × dimension)
                    if (Regex.IsMatch(regionText, @"^[X\s\d.]+$") && !Regex.IsMatch(regionText, @"\d+X\s*\d"))
                    {
                        return retval;
                    }
                }
                if (regionText.Contains("X") && regionText.Contains("±"))
                {
                    string[] hastext = regionText.Split("X");
                    if (hastext[0].Trim().Length > 0 && hastext[1].Trim().Length > 0)
                    {
                        regionText = hastext[0] + "X" + hastext[1];
                        return regionText;
                    }
                }

                if (Regex.IsMatch(regionText, @"^¡((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s|))±((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s|))((?:V\-)|(?:»))((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s|))+$"))
                {
                    string arrowpattern = @"^¡(\d+(\.\d+)|(\.\d+))±(\d+(\.\d+)|(\.\d+))((?:V\-)|(?:»))(\d+(\.\d+)|(\.\d+))+$";
                    Regex arrowregex = new Regex(arrowpattern);
                    Match match = arrowregex.Match(regionText);

                    if (match.Success)
                    {
                        regionText = regionText.Replace("1V-", "¨").Replace("»", "¨");
                        return regionText;
                    }
                }

                if (Regex.IsMatch(regionText, @"^¡((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s+|))((?:V\-)|(?:»))(?:\s+|)?((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s|))([A-Z]+)"))
                {
                    string arrowpattern = @"^¡((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s+|))((?:V\-)|(?:»))(?:\s+|)?((\d+(\.\d+))|(\d+)|(\.\d+)(?:\s|))([A-Z]+)";
                    Regex arrowregex = new Regex(arrowpattern);
                    Match match = arrowregex.Match(regionText);

                    if (match.Success)
                    {
                        regionText = regionText.Replace("1V-", "¨").Replace("»", "¨");
                        return regionText;
                    }
                }

                if (Regex.IsMatch(regionText, @"^(?:¡)?(\d+\.\d+)((\.\:\d+)|(\.\d+))$"))
                {
                    string pattern_non_plmin = @"^(?:¡)?(\d+\.\d+)((\.\:\d+)|(\.\d+))$";
                    Regex non_plmin_regex = new Regex(pattern_non_plmin);
                    Match match_non_plmin = non_plmin_regex.Match(regionText);
                    if (match_non_plmin.Success)
                    {
                        string non_plmin_suffix = match_non_plmin.Groups[2].Value;
                        non_plmin_suffix = non_plmin_suffix.Replace(":", "");
                        string non_plmin_prefix = regionText.Substring(0, regionText.Length - non_plmin_suffix.Length);
                        regionText = non_plmin_prefix + " -" + non_plmin_suffix;
                        return regionText;
                    }
                }
                if (searchForm.selectedRegion == "Full Image")
                {
                    string[] stringArray = { "unless", "PRODUCTS" };
                    if (stringArray.Any(s => regionText.ToLower().Contains(s.ToLower())))
                    {
                        return regionText;
                    }
                }
                if (string.IsNullOrWhiteSpace(regionText) || regionText == "  " || regionText == " " || regionText == null)
                {
                    return retval;
                }
                bool Is_Need_Ocr = true;
                bool isDigitPresent1 = regionText.Any(c => char.IsDigit(c));
                if (regionText.Contains("X") && isDigitPresent1 == false && !regionText.Contains("°") && regionText != "SPCL" && regionText != "TOP" && regionText != "BOX" && regionText != "PIN")
                {
                    Is_Need_Ocr = false;
                }
                if (regionText.Contains("çç") || regionText.Contains("7J") || regionText.Contains("4J"))
                {
                    Is_Need_Ocr = false;
                }

                string[] skipwords = { "DRAWING", "Nî.", "FRAME", "SHEET", "VëEW", "REVISIîN", "SECTION", "D-D", "C-C", "B-B", "A-A", "DETAII.", "LINE", "WITH", "WIDTH", "SLOT", "SLOTS", "LEAD", "HAND", "I.EFT", "RIGHT", "SEE", "LINEWITH", "IN", "E-", "(COAT", "PER", "BOM", "FLATS", "CONFIGURATION", "FLAT", "EB", searchForm.CdrawingNo.ToLower(), searchForm.CdrawingNo.ToUpper(), searchForm.CdrawingNo };
                string resultskipwords = skipwords.FirstOrDefault(x => x == regionText);
                if (resultskipwords != null)// || isletonly==true)
                {
                    Is_Need_Ocr = false;
                }
                string pattern = @"^\d+0F\d+$";
                Regex regex = new Regex(pattern);
                MatchCollection matches = regex.Matches(regionText);
                if (matches.Count() > 0)
                {
                    return retval;
                }

                if (regionText.StartsWith("R") && (regionText != "ROWS" || regionText != "ROW") && Regex.IsMatch(regionText.Trim(), @"^(?:R(\d+|(?:\.d+)|)(?:\.\d+))$"))
                {
                    return regionText;
                }
                if (regionText.StartsWith("V ") && Regex.IsMatch(regionText.Trim(), @"^(?:V)(?:\s)?((\d+\.\d+)|(\d+)|(\.\d+))(?:\s)?X(?:\s)?(\d+)?°"))
                {
                    regionText = regionText.Replace("V", "§");
                    return regionText;
                }

                if (regionText.Contains("±"))
                {
                    if (regionText.Contains('O'))
                    {
                        regionText = regionText.Replace("O", "0");
                    }
                    string[] hastext = regionText.Split("±");

                    if (hastext[0].Trim().Length > 0 && hastext[1].Trim().Length > 0 && Regex.IsMatch(regionText, @"^((\d+)(?:\s|))±((?:\s|)(\d+)?°)$"))
                    {
                        var deg = hastext[0].Trim();
                        if (hastext[0].Trim().Length == 3 && hastext[0].Trim().EndsWith("0"))
                        {
                            hastext[0] = string.Concat(hastext[0].AsSpan(0, hastext[0].Length - 1), "°");
                        }
                        regionText = hastext[0] + "±" + hastext[1];
                    }

                    if (hastext[0].Length > 0 && hastext[1].Length > 0 && Regex.IsMatch(regionText.Trim(), @"^((\d+|(?:\.d+)|)(?:\.\d+)?°)±((\d+|(?:\.d+)|)(?:\.\d+)?°)$"))
                    {
                        regionText = hastext[0] + "±" + hastext[1];
                        return regionText;
                    }
                }
                if (regionText.Contains('¡') && regionText.Length == 1)
                {
                    return regionText;
                }
                string[] skipContains = { "FROM", "TO", "MIN", "MAX", "THRU", "ROW", "FLOW", "AREA", "WEIGHT", "PD", "SEAT" };
                bool resultcontains = skipContains.Any(x => regionText.ToLower().Contains(x.ToLower()));
                if (regionText.IndexOf('¡') != regionText.LastIndexOf('¡') && resultcontains != true)
                {
                    return retval;
                }
                if (resultcontains == true)
                {
                    return regionText;
                }
                if (regionText.StartsWith("ë³") && regionText.Length == 2)
                {
                    return regionText;
                }
                if (regionText.Contains("³") && regionText.Length > 1)
                {
                    regionText = regionText.Replace("³", "");
                }
                if (regionText.Length == 1 && Regex.IsMatch(regionText, @"^[a-zA-Z!@#$%^&*()-_=+\[\]{};:'"",.<>/?]+$"))
                {
                    return retval;
                }
                if (Regex.IsMatch(regionText, @"^[^0-9]*$"))
                {
                    //return retval;
                }

                if (Regex.IsMatch(regionText, @"^[XxWMI]"))
                {
                    regionText = regex.Replace(regionText, "");
                }
                if (regionText.Contains("-.") && regionText.Contains("-") && !regionText.Contains("+"))
                {
                    regionText = regionText.Replace("-.", "±.");
                    return regionText;
                }
                // contain + - 
                if (regionText.Contains("+") && regionText.Contains("-"))
                {
                    string mainValuePattern = @"^-?((?:¡|)(\d+|(?:\.d+)|)(?:\.\d+))?";
                    string positiveValuePattern = @"\+((\d+|(?:\.d+)|)(?:\.\d+))?";
                    string negativeValuePattern = @"-((\d+|(?:\.d+)|)(?:\.\d+))?";

                    Match mainValueMatch = Regex.Match(regionText, mainValuePattern);
                    MatchCollection positiveValueMatches = Regex.Matches(regionText, positiveValuePattern);
                    MatchCollection negativeValueMatches = Regex.Matches(regionText, negativeValuePattern);

                    string mainValue = mainValueMatch.Value;
                    string positive = string.Empty;
                    string negative = string.Empty;
                    foreach (Match match in positiveValueMatches)
                    {
                        positive = match.Value;
                    }
                    foreach (Match match in negativeValueMatches)
                    {
                        negative = match.Value;
                    }
                    return regionText;
                }

                if (regionText.Contains("TURNED"))
                {
                    regionText = regionText.Replace("TURNED", "RMS");
                    return regionText;
                }
                if (regionText.StartsWith("FGS") || regionText.StartsWith("FROM"))
                {
                    return regionText;
                }
                // UN thread

                if (Regex.IsMatch(regionText, @"^(((\d+)(?:\s)(\d+)|(\d+)-(\d+))/(\d+)-(\d+)(?:\s)UN((?:-)|(?:\s))[0-9]+[A-Z])"))
                {
                    return regionText;
                }
                if (regionText.Contains("UNF") || regionText.Contains("UNC") || regionText.Contains("UNS-"))
                {
                    return regionText;
                }
                if (regionText.Contains("HIF"))
                {
                    return regionText;
                }
                //UNS thread
                if (Regex.IsMatch(regionText, @"^((?:L)(\d+)/(\d+)-(\d+)(?:\s)UNS-[0-9]+[A-Z])"))
                {
                    if (regionText.StartsWith("L"))
                    {
                        return regionText.Substring(1) + "," + x.ToString() + "," + y.ToString() + "," + w.ToString() + "," + h.ToString();
                    }
                    return regionText;
                }
                // STUB ACME
                if (regionText.Contains("STUB ACME"))
                {
                    if (regionText.StartsWith("L") || regionText.StartsWith("ç"))
                    {
                        return regionText.Substring(1) + "," + x.ToString() + "," + y.ToString() + "," + w.ToString() + "," + h.ToString();
                    }
                    return regionText;
                }
                // HST-DS
                if (regionText.Contains("HST-DS"))
                {
                    if (regionText.StartsWith("L") || regionText.StartsWith("ç"))
                    {
                        return regionText.Substring(1) + "," + x.ToString() + "," + y.ToString() + "," + w.ToString() + "," + h.ToString();
                    }
                    return regionText;
                }
                // HST
                if (regionText.Contains("HST"))
                {
                    if (regionText.StartsWith("L") || regionText.StartsWith("ç"))
                    {
                        return regionText.Substring(1) + "," + x.ToString() + "," + y.ToString() + "," + w.ToString() + "," + h.ToString();
                    }
                    return regionText;
                }

                if (Regex.IsMatch(regionText, @"^[0-9.#]+$") && !regionText.StartsWith("#") && !regionText.EndsWith("#") && new Regex(Regex.Escape("#")).Matches(regionText).Count == 1)
                {
                    string[] hastext = regionText.Split("#");
                    if (hastext[0].Length > 0 && hastext[1].Length > 0 && Regex.IsMatch(hastext[0], @"^([0-9]+|(?:\.[0-9]+))?$") && Regex.IsMatch(hastext[1], @"^([0-9]+|(?:\.[0-9]+))?$"))
                    {
                        // regionText = hastext[0] + " -."+ hastext[1];
                        //  return regionText ;
                    }
                }
                if (regionText.Contains("VAM") || regionText.Contains("TOP") || regionText.Contains("SPCL"))
                {
                    return regionText;
                }
                // surface finish 
                if (Regex.IsMatch(regionText, @"^[0-9.#]+$"))
                {
                }

                if (Regex.IsMatch(regionText, @"^(?:¡)?((?:\d+\-\d{2,})|(?:\d+\s\d{2,}))(?:.)?((?:\d+\-\d{2,})|(?:\d+\s\d{2,}))?"))
                {
                    string pattern_non_dot = @"^(?:¡)?((?:\d+\-\d{2,})|(?:\d+\s\d{2,}))(?:.)?((?:\d+\-\d{2,})|(?:\d+\s\d{2,}))?";
                    Regex non_dot_regex = new Regex(pattern_non_dot);
                    Match match_non_plmin = non_dot_regex.Match(regionText);
                    if (match_non_plmin.Success)
                    {
                        GroupCollection groups = match_non_plmin.Groups;
                        string g1 = groups[1].Value.ToString();
                        string g2 = groups[2].Value.ToString();
                        string g11 = string.Empty;
                        string g22 = string.Empty;
                        if (g1 != "" && (g1.Contains("-") || g1.Contains(" ")))
                        {
                            g11 = g1.Replace(" ", ".").Replace("-", ".");
                            regionText = regionText.Replace(g1, g11);
                        }
                        if (g2 != "" && (g2.Contains("-") || g2.Contains(" ")))
                        {
                            g22 = g2.Replace(" ", ".").Replace("-", ".");
                            regionText = regionText.Replace(g2, g22);
                        }
                    }
                }
                if (regionText.EndsWith("+") && regionText.Length > 1)
                {
                    regionText = regionText.Replace("+", "");
                }

                if (regionText.Contains(".") && !regionText.Contains("¡"))
                {
                    var res1 = regionText.Split('.').Last();
                    if (Regex.IsMatch(res1, @"^[a-zA-Z]+$"))
                    {
                        Is_Need_Ocr = false;
                    }
                    if (res1.Length == 0)
                    {
                        Is_Need_Ocr = false;
                    }
                    string[] res2 = regionText.Split('.');
                    if (res2[0] == "»" || res2[0] == "«")
                    {
                        Is_Need_Ocr = false;
                    }
                }
                if ((regionText.Contains(".") || regionText.Contains("/")) && regionText.Contains("°") && !regionText.Contains("X"))
                {
                    regionText = regionText.Replace("/", "").Replace(".", "").Replace("-", "");
                }
                if (!Regex.IsMatch(regionText, @"\d+(\.\d+)?\s*-\s*\d+(\.\d+)?"))
                {
                    if (regionText.Contains("T") || regionText.Contains("#") || regionText.Contains("ZZ") || regionText.Contains("//") || regionText.Contains("/") || regionText.Contains("--") || regionText.Contains(",,") || regionText.Contains("C") || regionText.Contains("D") || regionText.Contains(":") || regionText.Contains("î") || regionText.Contains("K") || regionText.Contains("VV") || regionText.Contains("SS") || regionText.Contains("HF") || regionText.Contains("çV") || regionText.Contains("7V") || regionText.Contains("I") || regionText.Contains("W«") || regionText.Contains("Mç") || regionText.Contains("22") && !regionText.Contains(".") && !regionText.Contains("PIN"))
                    {
                        if (regionText.Length > 1 || regionText.Contains("-"))
                        {
                            if (regionText.Contains("-"))
                            {
                                string[] minussym = regionText.Split("-");
                                if ((Regex.IsMatch(minussym[0], @"^[0-9]+$") || Regex.IsMatch(minussym[1], @"^[0-9]+$") || isDigitPresent1) && !regionText.Contains("#"))
                                {
                                    regionText = regionText.Replace("-", ".");
                                }
                            }
                            else if (regionText != "PIN")
                            {
                                Is_Need_Ocr = false;
                            }
                        }
                        else if (regionText.Length > 0)
                        {
                            Is_Need_Ocr = false;
                        }
                    }
                }
                int finalyaxis = imageheight - 200;
                int finalxaxis = imagewidth - 200;
                if (regionText.Contains("±") || regionText.Contains("û"))
                {
                    regionText = Regex.Replace(regionText, "[A-Za-z ]", "");
                    regionText = regionText.Replace("û", "");
                }
                if (regionText.Contains(".."))
                {
                    var res11 = regionText.Split("..");
                    if (res11.Length > 0)
                    {
                        if (res11[1].Length > 0)
                        {
                            regionText = regionText.Replace("..", "");
                        }
                    }
                }
                if (regionText.Contains("¡"))
                {
                    var res11 = regionText.Split('¡');
                    if (res11.Length > 0)
                    {
                        if (res11[1].Any(c => char.IsDigit(c)) == false)
                        {
                            return retval;
                        }
                    }
                }

                if (!Regex.IsMatch(regionText, @"\d+(\.\d+)?\s*-\s*\d+(\.\d+)?") && regionText.Contains("-") && !regionText.Contains("#"))
                {
                    var res1 = regionText.Split('-');
                    if (res1.Length > 0)
                    {
                        if (res1[0].Any(c => char.IsDigit(c)))
                        {
                            regionText = regionText.Replace("-", ".");
                            if (regionText.Contains(".."))
                            {
                                var res11 = regionText.Split("..");
                                if (res11.Length > 0)
                                {
                                    if (res11[1].Length == 0)
                                    {
                                        regionText = regionText.Replace("..", "");
                                    }
                                }
                            }
                        }
                        else if (regionText.Contains("X"))
                        {
                            regionText = regionText.Replace("-", "");
                            int count = Regex.Matches(regionText, "X").Count;
                            if (count > 1)
                            {
                                string[] cntt = regionText.Split("X");
                                if (cntt[0] == "")
                                {
                                    regionText = regionText.Remove(0, 1);
                                }
                            }
                        }
                        else if (!regionText.Contains("+-"))
                        {
                            Is_Need_Ocr = false;
                        }
                    }
                }
                if (regionText != "" && Is_Need_Ocr == true)
                {
                    retval = regionText;
                }
                return retval;
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                return retval;
            }
        }
        public async Task<Dictionary<string, object>> ConvertSpec(string ocrtext)
        {
            return await Task.Run(() =>
            {
                bool convert = false;
                string converted = string.Empty;
                float inchToMM = 25.4f;
                List<string> restricted = new List<string> {
            "UN","HIF", "UNF","UNS","STUB ACME","HST-DS","HST","VAM","TOP","SPCL","Û","Ú","´","»","«","ROW","FGS"
            };
                bool doesNotContainRestricted = restricted.All(rest => !ocrtext.Contains(rest, StringComparison.OrdinalIgnoreCase));
                int alphabeticWordCount = ocrtext
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries) // Split text by spaces
                    .Count(word => word.All(char.IsLetter));
                if (doesNotContainRestricted && alphabeticWordCount < 3)
                {
                    string nxHdrillpattern = @"(\d*(?:\.\d+)?\s?X)(.*)";
                    if (Regex.IsMatch(ocrtext, nxHdrillpattern))
                    {
                        Match nthmatches = Regex.Match(ocrtext, nxHdrillpattern);
                        if (nthmatches.Success)
                        {
                            ocrtext = nthmatches.Groups[2].Value;
                        }
                    }
                    string pattern = @"([^\d.-]+)|([-+]?\d*\.?\d+)";
                    MatchCollection matches = Regex.Matches(ocrtext, pattern);
                    string extractPattern = @"([a-zA-Z]+|([\d.]|[\d.°])+|[¡─çÞ\s\-+±]+)";
                    string extractinnerPattern = @"([\d.]+|[\s\-+±]+)";

                    var wholematches = Regex.Matches(ocrtext, extractPattern);
                    List<string> list = new List<string>();
                    foreach (Match match in wholematches)
                    {
                        if (!match.Value.Contains("°"))
                        {
                            var matchinner = Regex.Matches(match.Value, extractinnerPattern);
                            foreach (Match inner in matchinner)
                            {
                                list.Add(inner.Value);
                            }
                        }
                    }
                    var filteredList = list.Any(item => Regex.IsMatch(item, @"([\d.]+)"));

                    convert = filteredList;
                    string s = string.Empty;
                    foreach (string match in list)
                    {
                        if (!string.IsNullOrEmpty(match.Trim()))
                        {
                            string m = match.ToString();
                            string cleanedInput = m.Replace(" ", string.Empty);
                            string pattern1 = @"([\d.]+)";
                            if (Regex.IsMatch(cleanedInput, pattern1))
                            {
                                float convert1 = 0;
                                if (float.TryParse(cleanedInput, NumberStyles.Float, CultureInfo.InvariantCulture, out float floatNumber))
                                {
                                    string[] b = cleanedInput.Split('.');
                                    convert1 = floatNumber * inchToMM;
                                    string[] a = Convert.ToString(convert1).Split('.');
                                    if (b.Length > 1 && a.Length > 1)
                                    {
                                        int miValue = Math.Min(a[1].Length, b[1].Length);
                                        convert1 = (float)Math.Round(convert1, miValue);
                                    }
                                }
                                s += Convert.ToString(convert1);
                            }
                            else
                            {
                                s += m;
                            }
                        }
                    }
                    converted = s;
                }
                if (string.IsNullOrWhiteSpace(converted))
                    convert = false;
                if (convert == false)
                    converted = string.Empty;
                Dictionary<string, object> obj = new Dictionary<string, object>();
                obj.Add("convert", convert);
                obj.Add("converted", converted);
                return obj;
            });
        }
        public string ocrTextTransform(string ocrtext)
        {
            try
            {
                if (ocrtext == "63" || ocrtext == "ç63" || ocrtext == "63(")
                {
                    ocrtext = "»";
                }
                if (ocrtext == "X5°" || ocrtext == "45Z" || ocrtext == "45" || ocrtext == "45O" || ocrtext == "42" || ocrtext == "45ç" || ocrtext == "450" || ocrtext == "452" || ocrtext == "459")
                {
                    ocrtext = "45°";
                }
                // Fix degree misreads: "459 450", "450 459", "459 459" etc → "45°"
                if (Regex.IsMatch(ocrtext, @"^45[0-9O]\s+45[0-9O]$"))
                {
                    ocrtext = "45°";
                }
                if (ocrtext == "32")
                {
                    ocrtext = "´";
                }
                if (ocrtext == "38" || ocrtext == "35" || ocrtext == "30" || ocrtext == "396" || ocrtext == "380" || ocrtext == "390" || ocrtext == "300" || ocrtext == "3905" || ocrtext == "398" || ocrtext == "30O")
                {
                    ocrtext = "30°";
                }
                if (ocrtext == "150" || ocrtext == "15")
                {
                    ocrtext = "15°";
                }
                if (ocrtext == "100" || ocrtext == "10")
                {
                    ocrtext = "10°";
                }
                if (ocrtext == "250" || ocrtext == "25")
                {
                    ocrtext = "25°";
                }
                if (ocrtext == "200" || ocrtext == "29«")
                {
                    ocrtext = "20°";
                }
                if (ocrtext == "900")
                {
                    ocrtext = "90°";
                }
                if (ocrtext == "70")
                {
                    ocrtext = "7°";
                }
                if (ocrtext == "û")
                {
                    ocrtext = "";
                }
                if (ocrtext == "Rù6")
                {
                    ocrtext = "R.6";
                }
                if (ocrtext == "R.î3" || ocrtext == "R.îñ")
                {
                    ocrtext = "R.03";
                }
                if (ocrtext == ".îîóë")
                {
                    ocrtext = ".005";
                }
                if (ocrtext.StartsWith("±") || ocrtext.StartsWith("=±") || ocrtext.Contains("MACHINE") || ocrtext.Contains("FINISH"))
                {
                    ocrtext = "";
                    return ocrtext;
                }
                if (ocrtext.Contains(")("))
                    ocrtext = ocrtext.Replace(")(", "X");

                if (ocrtext.Contains("#") && !ocrtext.StartsWith("#") && !(ocrtext.Contains("VAM") || ocrtext.Contains("PIN") || ocrtext.Contains("BOX") || ocrtext.Contains("SPCL")))
                {
                    string[] spltxt = ocrtext.Split("#");
                    bool isDigit1 = spltxt[0].Any(c => char.IsDigit(c));
                    bool isDigit2 = spltxt[1].Any(c => char.IsDigit(c));
                    if (!isDigit1 || !isDigit2)
                    {
                        ocrtext = "";
                    }
                }
                string patternNU = @"^((?:─)|(?:¡))?([\d\.\s]+)?(\s*([A-Z]|Þ)){1,4}$";
                if (Regex.IsMatch(ocrtext, patternNU))
                {
                    Match match = Regex.Match(ocrtext, patternNU);
                    if (match.Success)
                    {
                        string group1 = match.Groups[1].Value.Trim(); // ¡ or ─ (if exists)
                        string group2 = match.Groups[2].Value.Trim(); // Number part
                        // Convert group2 to a number and check if it's greater than 1
                        if (double.TryParse(group2, out double num) && num > 1)
                        {
                            return $"{group1} {group2}".Trim();
                        }
                    }
                }
                string pattern = @"^(?:─)?\s*¡?\s*\d+(\.\d+)?(\s*([A-Z]|Þ)){1,4}$";
                if (Regex.IsMatch(ocrtext, pattern))
                {
                    string mainValuePattern = @"^-?(([(?:¡)|(?:ç)|(?:─)|(?:\s+)]+)?([(?:\.\d+)|(?:/)|(?:\d+\.\d+)]+))?";
                    if (ocrtext.Contains("─"))
                    {
                        string[] spltxt = ocrtext.Split("─");
                        if (spltxt[1].Length > 0 && !spltxt[1].StartsWith(" "))
                        {
                            if (spltxt[0] == "") { ocrtext = "─" + " " + spltxt[1]; }
                            else { ocrtext = spltxt[0] + "─ " + spltxt[1]; }
                        }
                    }

                    if (ocrtext.Contains("ç"))
                    {
                        string[] spltxt = ocrtext.Split("ç");
                        if (spltxt[1].Length > 0 && !spltxt[1].StartsWith(" "))
                        {
                            if (spltxt[0] == "") { ocrtext = "ç" + " " + spltxt[1]; }
                            else { ocrtext = spltxt[0] + "ç " + spltxt[1]; }
                        }
                    }

                    Match mainValueMatch = Regex.Match(ocrtext, mainValuePattern);
                    string mainValue = mainValueMatch.Value;
                    string[] mspltxt = ocrtext.Split(mainValue);
                    if (mspltxt[1].Length > 0)
                    {
                        if (Regex.IsMatch(mspltxt[1], @"^[A-Z]")) { ocrtext = mainValue + " " + mspltxt[1]; }
                    }
                    Dictionary<string, string> surface_replace = new Dictionary<string, string>{
                                {".","ù"},
                                {"0","î"},
                                {"1","ï"},
                                {"2","ð"},
                                {"3","ñ"},
                                {"4", "ò"},
                                {"5","ó"},
                                {"6","ô"},
                                {"7", "õ"},
                                {"8","ö" },
                                {"9","÷" },
                                {"─","û" },
                                {"¡","à" },
                                {" ","ì" },
                                {"A","À" },
                                {"B","Á" },
                                {"C","Â" },
                                {"D","Ã" },
                                {"E","Ä" },
                                {"F","Å" },
                                {"G","Æ" },
                                {"H","Ç" },
                                {"I","È" },
                                {"J","É" },
                                {"K","Ê" },
                                {"L","Ë" },
                                {"M","Ì" },
                                {"N","Í" },
                                {"O","Î" }
                               };

                    foreach (var replacement in surface_replace)
                    {
                        ocrtext = ocrtext.Replace(replacement.Key, replacement.Value);
                    }
                    ocrtext = "ë" + ocrtext + "í";
                }
                string GDTpattern1 = @"^(([(?:ç)|(?:─)])+(?:\s)?(?:¡)?(?:\s)?(?:\d+?\.\d+)(?:\s)?(?:[A-Z]{1})?(?:Þ)(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ))$";
                string GDTpattern2 = @"^([(?:ç)|(?:─)|(?:┐)|(?:┤)|(?:┬)|(?:┘)]+(?:\s+)?(?:[(?:¡)|(?:\s+)])?(?:[\d.\s]+)?(?:(\s+|[A-Z]{1}|Þ)?)+)$";
                string GDTpattern3 = @"^(([(?:ç)|(?:─)])+(?:\s)?(?:¡)?(?:\s)?(?:\.\d+)(?:\/)?(?:\d+?\.\d+)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?(?:\s)?(?:[A-Z]{1})?(?:Þ)?)$";
                if (Regex.IsMatch(ocrtext, GDTpattern1) || Regex.IsMatch(ocrtext, GDTpattern2) || Regex.IsMatch(ocrtext, GDTpattern3))
                {
                    Dictionary<string, string> surface_replace = new Dictionary<string, string>{
                                {".","ù"},
                                {"0","î"},
                                {"1","ï"},
                                {"2","ð"},
                                {"3","ñ"},
                                {"4", "ò"},
                                {"5","ó"},
                                {"6","ô"},
                                {"7", "õ"},
                                {"8","ö" },
                                {"9","÷" },
                                {"─","û" },
                                {"¡","à" },
                                {" ","ì" },
                                { "┐","á"},
                                {"┤","ä"},
                                {"┬","æ" },
                                {"┘","ã" },
                                {"A","À" },
                                {"B","Á" },
                                {"C","Â" },
                                {"D","Ã" },
                                {"E","Ä" },
                                {"F","Å" },
                                {"G","Æ" },
                                {"H","Ç" },
                                {"I","È" },
                                {"J","É" },
                                {"K","Ê" },
                                {"L","Ë" },
                                {"M","Ì" },
                                {"N","Í" },
                                {"O","Î" }
                               };

                    foreach (var replacement in surface_replace)
                    {
                        ocrtext = ocrtext.Replace(replacement.Key, replacement.Value);
                    }
                    ocrtext = "ë" + ocrtext + "í";

                }
                if (Regex.IsMatch(ocrtext, @"\b(MIN|MAX)\b"))
                {
                    // ocrtext = ocrtext.Replace("MIN", "").Replace("MAX", "");
                }
                if (Regex.IsMatch(ocrtext, @"^[(?:\d+?\.\d+)?(?:\s)]+$"))
                {
                    ocrtext = ocrtext.Replace(" ", string.Empty);
                }
                return ocrtext;
            }
            catch (Exception ex)
            {
                ErrorLog objErrorLog = new ErrorLog();
                objErrorLog.WriteErrorToText(ex);
                return ocrtext;
            }
        }

        #endregion
    }
}

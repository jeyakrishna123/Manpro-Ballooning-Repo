using System.Text.RegularExpressions;
using static AllinoneBalloon.Entities.Common;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Text Processing
        public List<AllinoneBalloon.Entities.Common.AG_OCR> SmallImageRectProcess(List<AllinoneBalloon.Entities.Common.Rect> rects)
        {
            List<AllinoneBalloon.Entities.Common.AG_OCR> groupedByX = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
            try
            {
                List<List<AllinoneBalloon.Entities.Common.Rect>> GroupedRectsX = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
                List<List<AllinoneBalloon.Entities.Common.Rect>> GroupedRectsDiff = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
                List<AllinoneBalloon.Entities.Common.Rect> MergedGroupedRects = new List<AllinoneBalloon.Entities.Common.Rect>();
                List<AllinoneBalloon.Entities.Common.Rect> GroupRectsXY = new List<AllinoneBalloon.Entities.Common.Rect>();
                if (rects.Count > 0)
                {
                    PrintListAsLog(rects, objerr, " OCR Initial");
                    // Step 1: To group all data by X axis
                    GroupedRectsX = NonAlphabeticTransform(rects);
                    // Step 2: Re-check if any group having non-relational X-axis Text
                    // re-check the group has different element
                    GroupedRectsDiff = GroupClosestXRect(GroupedRectsX);
                    // Step 3: merge the List of group into List
                    MergedGroupedRects = MergeGroupClosestXRect(GroupedRectsDiff);
                    // Step 4: Get closest X,Y Axis to merge
                    GroupRectsXY = GroupByClosestYAndX(MergedGroupedRects);
                    // Step 5: Get closest Y Axis
                    groupedByX = GroupClosestYRect(GroupRectsXY);
                    //Clean the groupedByX items
                    groupedByX = CleanGroupByX(groupedByX);
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorToText(e);
                return groupedByX;
            }
            PrintListAsLog(groupedByX, objerr, "Final: ");
            return groupedByX;
        }
        public string LatinToNumber(string s)
        {
            s = s.Replace(",", ".")
                .Replace("A", ".")
                .Replace("#", ".")
                .Replace("ù", ".")
                .Replace("ï", "1")
                .Replace("ð", "2")
                .Replace("ñ", "3")
                .Replace("ò", "4")
                .Replace("ó", "5")
                .Replace("ô", "6")
                .Replace("õ", "7")
                .Replace("ö", "8")
                .Replace("÷", "9")
                .Replace("O", "0")
                ;
            return s;
        }
        // 1. To convert the Non-Alpha character to Alpha join the tect group
        public List<List<AllinoneBalloon.Entities.Common.Rect>> NonAlphabeticTransform(List<AllinoneBalloon.Entities.Common.Rect> rects)
        {
            Dictionary<string, string> replacements = new Dictionary<string, string>{
            {"³-","" },
            {".ë","" },
            {"-³ ",""},
            {"-³",""},
            {"³+",""},
            {"+³",""},
            {".³",""},
            {"³.",""},
            { "-═ ",""},
            { "-----",""},
            { "ð","2"},
            { " ±","±"},
            { "à","¡"},
            { "±-","±."},
            { "ó","6"},
            { "ç A",""},
            { "-X",""},
            { "B-",""},
            { "- -Q- ","."},
            { "«/1",""},
            {"û","" },
            {"═-","" },
            {"XX",""},
            {"##","" },
            {"«ç","" },
            {"çë","ç" },
            {"±F","OF" },
            {"°F","OF" },
            { "-═",""},
            {"-═(","(" },
            { ")-P",")"},
            { "|","" },
            { "SJF","" },
            { "4-","" },
            { "T-","" },
            {"/F)","6.3" },
            {"SHGWN", "SHOWN" },
            {"STVLE", "STYLE" },
            {"AEEEPTANCE", "ACCEPTANCE" },
            {"AEEEPTANEE", "ACCEPTANCE" },
            {"FES", "FGS" },
            {"GR", "OR" },
            {"RîW", "ROW" },
            {"RDW", "ROW" },
            {"RîWS", "ROWS" },
            {"ERITERIA", "CRITERIA" },
            {"î°", "0°" },
            {"(HDRD", "CHORD" },
            {"FLAWSA", "FLAWS," },
            {"MCKS", "NICKS" },
            {"SCRATEHES", "SCRATCHES" },
            {"NILLINETERS", "MILLIMETERS" },
            {"VYEW", "VIEW" },
            {"HîLES", "HOLES" },
            {"ERCNF", "CRCMF" },
            {"NIN", "MIN" },
            {"SEALE", "SCALE" },
            {"90.,", "90°" },
            {"OOSÞ", "0.08Þ" },
            {"EîL", "EQL" },
            {"RîTATE", "ROTATE" },
            {"DESYRED", "DESIRED" },
            {"UNC-ZB", "UNC-2B" },
            {"1V═1442", "¨ 14.2" },
            { "B-E","BE"},
            {"PP(SCIISZUSAFEREFSIAL","99 CIRCUMFERENTIAL" },
            { "TYPE=","TYPE:"},
            { "PRî)ECT","PROJECT"},
            {"F:N:SH","FINISH" },
            {"-ëV-", "¨" },
            };
            rects.ForEach(rect =>
            {
                if (replacements.ContainsKey(rect.Text))
                {
                    rect.Text = replacements[rect.Text];
                }
            });

            rects = rects.Where(r => !string.IsNullOrWhiteSpace(r.Text.Trim())).ToList();

            // PrintListAsLog(rects, objerr, "Step 1: After Replace ");
            var groupedRects = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            var currentGroup = new List<AllinoneBalloon.Entities.Common.Rect>();
            var CleanedRects = new List<AllinoneBalloon.Entities.Common.Rect>();

            // Grouping by X and Y axis
            {
                for (int i = 0; i < rects.Count; i++)
                {
                    try
                    {
                    var gtext = rects[i].Text;
                    Dictionary<string, string> LatinReplacements = new Dictionary<string, string>
                    {
                        { "\r\n", ""},
                        {"\n", "" },
                        {"ëù", "L" },
                        { "ë-ë", "H"},
                        //{ "î", "O"},
                        { "(2)", "¡"},
                        { "(Z)", "¡"},
                        { "(:0", "¡"},
                        { "à", "¡"},
                        { ".IT", "TI"},
                        { "QPZ", "CIPI"},
                        { "TIT", "ITT"},
                        { "Të.", "IT"},
                        { "ë.", "L"},
                        { "ZZ", "ZI"},
                        { "Z", "I"},
                        { "ë", "I"},
                        { "OTHERW:SE", "OTHERWISE"},
                        { "îTHERW:SE", "OTHERWISE"},
                        { "SPEC:F:ED", "SPECIFIED"},
                        { "0TH+ERWISE", "OTHERWISE"},
                        {"îRDER","ORDER" },
                        { "îF","OF"},
                        { "îN","ON"},
                        {"HDLES","HOLES" },
                        {"SHWN" ,"SHOWN"},
                        { "Nî","NO"},
                        { "îR","OR"} ,
                        { "Tî", "TO"},
                        { "ALLîWED","ALLOWED"},
                        { "INS-PEC═TED","INSPECTED"},
                        { "PAEK","PACK"},
                        { "MAEHINING","MACHINING"},
                        {"MARI(ED","MARKED"},
                        {"UNMARI(ED","UNMARKED"},
                        {"I(","K"},
                        {"═V─",""},
                        { "³",""},
                        {"/XK","" },
                        {"VS-","" },
                        {"X2X","" },
                       // {"(F","" },
                    };
                    if (LatinReplacements.ContainsKey(gtext))
                    {
                        gtext = LatinReplacements[gtext];
                    }
                    foreach (var replacement in LatinReplacements)
                    {
                        gtext = gtext.Replace(replacement.Key, replacement.Value).TrimEnd('.');
                    }
                    gtext = gtext.Trim();
                    gtext = gtext.Replace("\r\n", "").Replace("\n", "").Replace("═P", "");
                    if (Regex.IsMatch(gtext, @"^\.\d+"))
                    {
                        gtext = "0" + gtext;
                    }

                    string BracketToX = @"((\d+)|(\d+\.\d+)|(\.\d+))?\)\($";
                    if (Regex.IsMatch(gtext, BracketToX))
                    {
                        gtext = gtext.Replace(")(", "X");
                        gtext = gtext.Trim();
                    }
                    string RepeatedPattern = @"(?:(80|0|O|G|9|\{|\})\1{3,}|(?:(DOG|BOB|GOG|ÞGÞ|GÞG)+){1}|(?:¡.*¡.*¡.*¡)|(¡|Þ|\/|³){3,})";
                    if (Regex.IsMatch(gtext, RepeatedPattern))
                    {
                        MatchCollection matches = Regex.Matches(gtext, RepeatedPattern);

                        gtext = "";
                        continue;
                    }
                    string samePattern = @"^([\d]{1})([:\-\.])([\d]{1})$";
                    if (Regex.IsMatch(gtext, samePattern))
                    {
                        Match matches = Regex.Match(gtext, samePattern);
                        if (matches.Success)
                        {
                            string one = matches.Groups[1].Value;
                            string Alpha = matches.Groups[2].Value;
                            string three = matches.Groups[3].Value;
                            // if (Alpha == ":") { gtext = gtext.Replace(":", "."); }
                            // if (Alpha == "-") { gtext = gtext.Replace("-", "."); }
                            if (one == three)
                            {
                                gtext = "";
                                continue;
                            }
                        }
                    }
                    string AlphaNumericToNumericDegree = @"([\d.]+)+([A-Z])+(°)";
                    if (Regex.IsMatch(gtext, AlphaNumericToNumericDegree))
                    {
                        Match DegreeAlphaNumeric = Regex.Match(gtext, AlphaNumericToNumericDegree);
                        if (DegreeAlphaNumeric.Success)
                        {
                            string Alpha = DegreeAlphaNumeric.Groups[2].Value;
                            if (Alpha == "A") { gtext = gtext.Replace("A", "."); }
                            if (Alpha == "B") { gtext = gtext.Replace("B", "5"); }
                            if (Alpha == "O") { gtext = gtext.Replace("O", "0"); }
                            if (Alpha == "P") { gtext = gtext.Replace("P", "9"); }
                            if (Alpha == "S") { gtext = gtext.Replace("P", "8"); }
                        }
                    }
                    // ¡3 Ú 12.7
                    string drillpattern = @"^(¡)?([\d\.\s]+)?(T|Ú|¨|»)([\d\.\s]+)$";
                    if (Regex.IsMatch(gtext, drillpattern))
                    {
                        Match nxHdrillpatternmatch = Regex.Match(gtext, drillpattern);
                        if (nxHdrillpatternmatch.Success)
                        {
                            string AlphaDrill = nxHdrillpatternmatch.Groups[3].Value;
                            if (AlphaDrill == "T") { gtext = gtext.Replace("T", "¨"); }
                            if (AlphaDrill == "Ú") { gtext = gtext.Replace("Ú", "¨"); }
                            if (AlphaDrill == "»") { gtext = gtext.Replace("»", "¨"); }
                        }
                    }

                    string endwithhypenNumberPattern = @"^(¡)?([\d\.\s]+)?(-)?([\d\.\s]+)?(-)?$";
                    if (Regex.IsMatch(gtext, endwithhypenNumberPattern))
                    {
                        Match endwithhypenNumber = Regex.Match(gtext, endwithhypenNumberPattern);
                        if (endwithhypenNumber.Success)
                        {
                            string g1 = endwithhypenNumber.Groups[1].Value;
                            string g2 = endwithhypenNumber.Groups[2].Value;
                            string g3 = endwithhypenNumber.Groups[3].Value;
                            string g4 = endwithhypenNumber.Groups[4].Value;
                            string g5 = endwithhypenNumber.Groups[5].Value;
                            if (!string.IsNullOrEmpty(g2) && !string.IsNullOrEmpty(g4))
                            {
                                gtext = $"{g1}{g2}-{g4}";
                            }
                            else if (!string.IsNullOrEmpty(g2))
                            {
                                gtext = $"{g1}{g2}";
                            }
                        }
                    }
                    string RangeDiaPattern = @"([A-Z]+)+(¡[\d.]+)+([A-Z0-9]+)+(¡[\d.]+)+([A-Z]+)$"; // FRON¡342.57T0¡369.8NIN
                    if (Regex.IsMatch(gtext, RangeDiaPattern))
                    {
                        Match rangedia = Regex.Match(gtext, RangeDiaPattern);
                        if (rangedia.Success)
                        {
                            gtext = string.Join(" ", rangedia.Groups.Values.Skip(1).Select(g => g.Value).Where(v => !string.IsNullOrEmpty(v)));
                            gtext = gtext.Replace("FRON", "FROM");
                            gtext = gtext.Replace("T0", "TO");
                            gtext = gtext.Replace("NIN", "MIN");
                            gtext = gtext.Trim();
                        }
                    }

                    if (Regex.IsMatch(gtext, @"^(((?:[A-Z.]+)((?:î)|(?:ë))+(?:[A-Z.,-]+)((?:î)|(?:ë))(?:[A-Z.,-]+))|(((?:î)|(?:ë))+(?:[A-Z.,-]+)((?:î)|(?:ë))(?:[A-Z.,-]+))|(((?:î)|(?:ë))+(?:[A-Z.,-]+))|((?:[A-Z.,-]+)((?:î)|(?:ë))+[.,-])|((?:[A-Z.]+)((?:î)|(?:ë))+(?:[A-Z.,-]+)((?:î)|(?:ë))+)|((?:[A-Z.]+)((?:î)|(?:ë))+(?:[A-Z.,-]+)))$"))
                    {
                        gtext = gtext.Replace("ë.", "L");
                        gtext = gtext.Replace("ë", "I");
                        gtext = gtext.Replace("î", "O");
                    }
                    if (gtext == "°.3")
                    {
                        gtext = "6.3";
                    }
                    if (gtext == "//")
                    {
                        gtext = "┐";
                    }
                    if (Regex.IsMatch(gtext, @"^0(\d+)$"))
                    {
                        gtext = Regex.Replace(gtext, @"^0(\d+)", "0.$1");
                    }
                    if (gtext == "D#DOS")
                    {
                        gtext = "┤ .008";
                    }

                    string RangeDotPattern = @"^((\d+)+/0+(\d+)+-(\d+))$"; // 3/02-23 to 342.23
                    if (Regex.IsMatch(gtext, RangeDotPattern))
                    {
                        gtext = Regex.Replace(gtext, RangeDotPattern, match =>
                        {
                            // Replace Group 4 (index 4) with a dot
                            string group1 = match.Groups[1].Value; // Full match
                            string group2 = match.Groups[2].Value; // First ¡
                            string group3 = match.Groups[3].Value; // Digits after first ¡
                            string group4 = match.Groups[3].Value;

                            // Reconstruct the output with the replacement
                            return $"{group2}4{group3}{group4}";
                        });
                    }
                    string RangeDotPattern1 = @"^((\d+)+-(\d+))$"; // 302-23 to 302.23
                    if (Regex.IsMatch(gtext, RangeDotPattern1))
                    {
                        gtext = Regex.Replace(gtext, RangeDotPattern1, "$2.$3");
                    }
                    if (gtext == "ODBÞ")
                    {
                        gtext = "0.08Þ";
                    }
                    if (gtext == "J.")
                    {
                        gtext = "┘";
                    }
                    string gdtDotPattern = @"^((¡)(\d+)(¡)(\d+)?Þ?)$"; // ¡0¡08Þ
                    if (Regex.IsMatch(gtext, gdtDotPattern))
                    {
                        gtext = Regex.Replace(gtext, gdtDotPattern, match =>
                        {
                            // Replace Group 4 (index 4) with a dot
                            string group1 = match.Groups[1].Value; // Full match
                            string group2 = match.Groups[2].Value; // First ¡
                            string group3 = match.Groups[3].Value; // Digits after first ¡
                            string group4 = ".";                   // Replace this group
                            string group5 = match.Groups[5].Value; // Digits after second ¡ (if any)
                            string group6 = match.Groups[6].Value; // Þ (if any)

                            // Reconstruct the output with the replacement
                            return $"{group2}{group3}{group4}{group5}{group6}";
                        });
                    }

                    string RangeHashToDotPattern = @"^((\d+)+#(\d+))$"; // 302#23 to 302.23
                    if (Regex.IsMatch(gtext, RangeHashToDotPattern))
                    {
                        gtext = Regex.Replace(gtext, RangeHashToDotPattern, "$2.$3");
                    }
                    if (gtext == "îAðó" || gtext == "îùîBÞ")
                    {
                        gtext = LatinToNumber(gtext);
                    }
                    string startwithFGSpattern = @"^FGS([A-Z0-9\s]+)STYLE([\s\d]+)OR([\s\d]+)$";
                    if (Regex.IsMatch(gtext, startwithFGSpattern))
                    {
                        //FGS8A2OSTYLE1OR11
                        gtext = Regex.Replace(gtext, startwithFGSpattern, match =>
                        {
                            // Replace Group 4 (index 4) with a dot
                            string group1 = match.Groups[1].Value;
                            string group2 = match.Groups[2].Value;
                            string group3 = match.Groups[3].Value;
                            string spacepatternend = @"\s$";
                            string spacepatternbegin = @"^\s";
                            string patternendbegin = @"\s(.*?)\s";

                            if (!Regex.IsMatch(group1, spacepatternend))
                                group1 += " ";
                            if (!Regex.IsMatch(group2, patternendbegin))
                                group2 = " " + group2 + " ";
                            if (!Regex.IsMatch(group3, spacepatternbegin))
                                group3 = " " + group3;

                            // Reconstruct the output with the replacement
                            return $"FGS{group1}STYLE{group2}OR{group3}";
                        });
                    }

                    int gttextLength = gtext.Length;

                    if (Regex.IsMatch(gtext, @"^(#+(^\d+)?([A-Z]+)?)$") || gtext == "═P" || gtext == "P-" || gtext == "4-" || gtext == "T-" || gtext == "7F" || gtext == "4." || gtext == "Nù." || gtext == "═ç" || gtext == "══" || gtext == "-" || gtext == "═P" || gtext == "═")
                    {
                        gtext = "";
                        continue;
                    }
                    if (gttextLength == 1 && (gtext == "4" || gtext == "F"))
                    {
                        gtext = "";
                        continue;
                    }

                    gtext = gtext.Trim();
                    gtext = Regex.Replace(gtext, @"\r\n?|\n", "");
                    gtext = gtext.Trim();
                    gtext = gtext.Replace("═1-°°", "-1.00").Replace("\r\n", "").Replace("--", "");
                    gtext = gtext.Replace(".°", "0");
                    if (Regex.IsMatch(gtext, @"[0-9]{1,}O$"))
                    {
                        gtext = gtext.Replace("O", "°");
                    }
                    if (Regex.IsMatch(gtext, @"(\d+)°(\d+)±?((\d+)|(\d+\.\d+)|(\.\d+))"))
                    {
                        gtext = gtext.Replace("°", ".");
                    }
                    if (gtext.StartsWith(","))
                    {
                        gtext = gtext.Substring(1);
                    }
                    if (gtext.EndsWith(".") || gtext.EndsWith("#"))
                    {
                        gtext = gtext.Substring(0, gtext.Length - 1);
                    }
                    //To ignore words that start with "R" followed by an alphabetical character
                    string startwithRpattern = @"\bR[A-Za-z]+\b";
                    if (gtext.StartsWith("R") && !Regex.IsMatch(gtext, startwithRpattern))
                    {
                        gtext = gtext.Replace(",", ".")
                                   .Replace("ù", ".")
                                   .Replace("î", "0")
                                   .Replace("ï", "1")
                                   .Replace("ð", "2")
                                   .Replace("ñ", "3")
                                   .Replace("ò", "4")
                                   .Replace("ó", "5")
                                   .Replace("ô", "6")
                                   .Replace("õ", "7")
                                   .Replace("ö", "8")
                                   .Replace("÷", "9")
                                   .Replace("O", "0")
                                   ;
                        if (gtext == "R.00")
                            gtext = "R.005";
                    }
                    if (gtext.Contains("UNF") || gtext.Contains("UN"))
                    {
                        gtext = gtext.Replace("═", "-")
                            .Replace("2BJ", "2B")
                            .Replace("»", "¨")
                            ;
                    }
                    if (gtext.Contains("ë═ëë"))
                    {
                        gtext = gtext.Replace("ë═ëë", "HI");
                    }

                    if (gtext.EndsWith("/"))
                    {
                        gtext = gtext.Substring(0, gtext.Length - 1);
                        gtext += ",";
                        gtext = gtext.Trim();
                    }
                    gtext = gtext.Trim();
                    CleanedRects.Add(new AllinoneBalloon.Entities.Common.Rect { X = rects[i].X, Y = rects[i].Y, Width = rects[i].Width, Height = rects[i].Height, Text = gtext, });
                    }
                    catch (Exception e)
                    {
                        // Skip this item but continue processing others
                        objerr.WriteErrorLog($"TextProcess item error at index {i}: {e.Message}");
                        CleanedRects.Add(new AllinoneBalloon.Entities.Common.Rect { X = rects[i].X, Y = rects[i].Y, Width = rects[i].Width, Height = rects[i].Height, Text = rects[i].Text });
                    }
                }
                //PrintListAsLog(CleanedRects, objerr, "Step 1: After Replace2 ");
                CleanedRects = CleanedRects.Where(r => !string.IsNullOrWhiteSpace(r.Text.Trim())).ToList();
                //PrintListAsLog(rects, objerr, "Step 1: After filter ");
                var sortedRects = CleanedRects.ToList();

                for (int i = 0; i < sortedRects.Count; i++)
                {
                    var currentItem = sortedRects[i];
                    // Text Transform
                    var gtext = currentItem.Text;

                    if (string.IsNullOrWhiteSpace(gtext))
                    {
                        continue;
                    }
                    currentItem.Text = gtext;
                    // if (currentGroup.Count == 0 || ((Math.Abs(currentGroup.Last().Y - currentItem.Y) < Math.Max(currentGroup.Last().Height, currentItem.Height) )))
                    if (currentGroup.Count == 0 || ((Math.Abs(currentGroup.Last().Y - currentItem.Y) < currentGroup.Last().Height)))
                    {
                        currentGroup.Add(currentItem);
                    }
                    else
                    {
                        var sortedGroupRects = new List<AllinoneBalloon.Entities.Common.Rect>();
                        sortedGroupRects = currentGroup.ToList();
                        sortedGroupRects.Sort((l, r) => { return l.X.CompareTo(r.X); });
                        groupedRects.Add(sortedGroupRects);
                        currentGroup = new List<AllinoneBalloon.Entities.Common.Rect> { currentItem };
                    }
                }
            }
            // assing last item
            if (currentGroup.Count > 0)
            {
                groupedRects.Add(currentGroup);
            }
            // print the Step 1 results
            PrintListAsLog(groupedRects, objerr, "Step 1: ");
            List<List<AllinoneBalloon.Entities.Common.Rect>> groups = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            for (int i = 0; i < groupedRects.Count; i++)
            {
                var current = groupedRects[i];
                List<List<AllinoneBalloon.Entities.Common.Rect>> GroupText = GroupTexts(current, objerr);
                for (int j = 0; j < GroupText.Count; j++)
                {
                    var item = GroupText[j];
                    groups.Add(item);
                }
            }
            //PrintListAsLog(groups, objerr, "Step 1-A: ");
            return groups;
        }

        // create a new list of group of items from the existing List of items
        public List<List<AllinoneBalloon.Entities.Common.Rect>> GroupTexts(List<AllinoneBalloon.Entities.Common.Rect> texts, ErrorLog objerr)
        {
            var groups = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            var currentGroup = new List<AllinoneBalloon.Entities.Common.Rect>();

            try
            {
                for (int i = 0; i < texts.Count; i++)
                {
                    var current = texts[i];
                    var prev = new AllinoneBalloon.Entities.Common.Rect() { Text = string.Empty, X = 0, Y = 0, Width = 0, Height = 0 };
                    int space = 0;
                    int prev_size = 0;
                    int current_size = current.X + current.Width;
                    decimal prev_single_text = 0.0M;
                    decimal current_single_text = 0.0M;
                    if (i > 0)
                    {
                        prev = texts[i - 1];
                        prev_size = prev.X + prev.Width;
                        space = current_size - prev_size;
                        prev_single_text = (prev.Width / (prev.Text.Length == 0 ? 1 : prev.Text.Length));
                        current_single_text = (current.Width / (current.Text.Length == 0 ? 1 : current.Text.Length));
                    }

                    // if (i == 0 || ((current.Y - prev.Y) <= (Math.Max(current.Height, prev.Height)) && ( ((prev_size  )- current.X) <= (Math.Max(prev_single_text*3, current_single_text*3) ) || ((prev_size + prev_single_text * 2) >  current.X))))
                    if (i == 0 || ((current.Y - prev.Y) <= (current.Height) && (((prev_size) - current.X) <= (Math.Max(prev_single_text * 3, current_single_text * 3)) || ((prev_size + prev_single_text * 2) > current.X))))
                    {
                        currentGroup.Add(current);
                    }
                    else
                    {
                        var sortedGroupRects = new List<AllinoneBalloon.Entities.Common.Rect>();
                        sortedGroupRects = currentGroup.ToList();
                        sortedGroupRects.Sort((l, r) => { return l.X.CompareTo(r.X); });
                        groups.Add(sortedGroupRects);
                        currentGroup = new List<AllinoneBalloon.Entities.Common.Rect> { texts[i] };
                    }
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorLog(e.Message);
            }
            if (currentGroup.Count > 0)
            {
                groups.Add(currentGroup);
            }
            // PrintListAsLog(groups, objerr, "Step 1-A: ");
            return groups;
        }

        // 2. create a list of group closest to X axis
        public List<List<AllinoneBalloon.Entities.Common.Rect>> GroupClosestXRect(List<List<AllinoneBalloon.Entities.Common.Rect>> rects)
        {
            var sortedRects = rects.ToList();
            var groupedRects = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            var currentGroup = new List<AllinoneBalloon.Entities.Common.Rect>();
            try
            {
                if (rects.Count > 0)
                {
                    for (int i = 0; i < sortedRects.Count; i++)
                    {
                        var sort = sortedRects[i].ToList();
                        if (sort.Count > 1 && sort[0].Text == "°")
                        {
                            sort.RemoveAt(0);
                        }
                        var maxRectW = sort.OrderByDescending(r => r.Width).First();
                        var maxRectH = sort.OrderByDescending(r => r.Height).First();
                        var avgTextSize = maxRectW.Width / (maxRectW.Text.Length == 0 ? 1 : maxRectW.Text.Length);
                        var sortedGroupRects = new List<AllinoneBalloon.Entities.Common.Rect>();

                        foreach (var rect in sort)
                        {
                            var prev = new AllinoneBalloon.Entities.Common.Rect() { Text = string.Empty, X = 0, Y = 0, Width = 0, Height = 0 };
                            int prev_size = 0;
                            int space = 0;
                            var current = rect;
                            int current_size = current.X + current.Width;
                            decimal prev_single_text = 0.0M;
                            decimal current_single_text = 0.0M;
                            if (currentGroup.Count > 0)
                            {
                                prev = currentGroup.Last();
                                prev_size = prev.X + prev.Width;
                                space = current_size - prev_size;
                                prev_single_text = (prev.Width / (prev.Text.Length == 0 ? 1 : prev.Text.Length));
                                current_single_text = (current.Width / (current.Text.Length == 0 ? 1 : current.Text.Length));
                            }

                            if (currentGroup.Count == 0 || ((prev_size < current.X) && (((prev_size - current.X) > (Math.Max(prev_single_text, current_single_text) * 3)) || ((current.X - prev_size) < avgTextSize * 3))))
                            {
                                currentGroup.Add(rect);
                            }
                            else
                            {
                                sortedGroupRects = new List<AllinoneBalloon.Entities.Common.Rect>();
                                sortedGroupRects = currentGroup.ToList();
                                sortedGroupRects.Sort((l, r) => { return l.X.CompareTo(r.X); });
                                groupedRects.Add(sortedGroupRects);
                                currentGroup = new List<AllinoneBalloon.Entities.Common.Rect> { rect };
                            }
                            // Console.WriteLine(rect.ToString());
                        }

                        sortedGroupRects = new List<AllinoneBalloon.Entities.Common.Rect>();
                        sortedGroupRects = currentGroup.ToList();
                        sortedGroupRects.Sort((l, r) => { return l.X.CompareTo(r.X); });
                        groupedRects.Add(sortedGroupRects);
                        currentGroup = new List<AllinoneBalloon.Entities.Common.Rect>();
                    }
                    // assing last item
                    if (currentGroup.Count > 0)
                    {
                        groupedRects.Add(currentGroup);
                    }
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorLog(e.Message);
            }

            groupedRects = GroupClosestText(groupedRects, objerr);
            // print the Step 2 results
            PrintListAsLog(groupedRects, objerr, "Step 2: ");

            return groupedRects;
        }

        public List<List<AllinoneBalloon.Entities.Common.Rect>> SplitGroupOfDia(List<AllinoneBalloon.Entities.Common.Rect> items, string pattern, ErrorLog objerr)
        {
            // List to store groups
            List<List<AllinoneBalloon.Entities.Common.Rect>> groups = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            List<AllinoneBalloon.Entities.Common.Rect> currentGroup = new List<AllinoneBalloon.Entities.Common.Rect>();

            // Iterate through the list
            for (int i = 0; i < items.Count; i++)
            {
                try
                {
                    string itemText = items[i].Text ?? "";
                    if (Regex.IsMatch(itemText, pattern))
                    {
                        string prevText = (i > 0) ? (items[i - 1].Text ?? "") : "";
                        if (i == 0 || !Regex.IsMatch(prevText, pattern))
                        {
                            currentGroup.Add(items[i]);
                        }
                        else
                        {
                            groups.Add(currentGroup);
                            currentGroup = new List<AllinoneBalloon.Entities.Common.Rect> { items[i] };
                        }
                    }
                }
                catch (Exception e)
                {
                    objerr.WriteErrorLog($"SplitGroupOfDia error at index {i}: {e.Message}");
                }
            }

            // Add the last group if it exists
            if (currentGroup.Count > 0)
            {
                groups.Add(currentGroup);
            }
            return groups;
        }
        // re-arrange the text group by X axis
        public List<List<AllinoneBalloon.Entities.Common.Rect>> GroupClosestText(List<List<AllinoneBalloon.Entities.Common.Rect>> rects, ErrorLog objerr)
        {
            var visited = new HashSet<List<AllinoneBalloon.Entities.Common.Rect>>();
            var removable = new HashSet<List<AllinoneBalloon.Entities.Common.Rect>>();
            var near = new HashSet<List<AllinoneBalloon.Entities.Common.Rect>>();
            //PrintListAsLog(rects, objerr, "Step 2 Before : ");
            // var gRects = rects.OrderBy(innerList => innerList.First().X).ToList();
            var gRects = rects.Select(innerList => innerList.OrderBy(rect => rect.X).ToList()).ToList();

            try
            {
                for (int i = 0; i < gRects.Count; i++)
                {
                    var group = gRects[i];
                    List<AllinoneBalloon.Entities.Common.Rect> p = group.OrderBy(r => r.X).ToList();
                    visited.Add(group);
                    foreach (var igroup in gRects)
                    {
                        List<AllinoneBalloon.Entities.Common.Rect> c = igroup.OrderBy(r => r.X).ToList();
                        p = p.OrderBy(r => r.X).ToList();

                        var pl = p.Last();
                        var cf = c.First();
                        var neartext = gRects
                                       .Where(item => !removable.Contains(item))
                                        .Where(item => ClosestGroupSatisfy(p.Last(), item.First()))
                                        .ToList();
                        if (neartext.Count() > 0)
                        {
                            foreach (var g in neartext)
                            {
                                removable.Add(g);
                                visited.Add(g);
                                foreach (var newchild in g)
                                {
                                    p.Add(newchild);
                                }
                            }
                        }
                    }
                    List<AllinoneBalloon.Entities.Common.Rect> n = p;
                    gRects[i] = n;
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorLog(e.Message);
            }
            if (removable.Count > 0)
            {
                //gRects = gRects.RemoveAll(item => removable.Contains(item) );
                gRects = gRects.ToList();
                // Filtering out the groups
                gRects = gRects.Where(group =>
                !removable.Any(removeGroup =>
                group.SequenceEqual(removeGroup, new RectSequenceEqualComparer()))).ToList();
            }
            // Regex pattern
            string pattern = @"^¡+(([\d\.\s]+))+(?:°)?(±([\d\.\s]+))?(?:°)?$";
            string[] skipContains = { "FROM", "TO", "MIN", "MAX", "THRU" };

            List<List<AllinoneBalloon.Entities.Common.Rect>> groups = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            for (int i = 0; i < gRects.Count; i++)
            {
                var current = gRects[i];
                // Count matches using LINQ and Any
                int matchCount = current.Count(item => Regex.IsMatch(item.Text, pattern));
                int matchCountnum = current.Count(item => Regex.IsMatch(item.Text, @"^(([\d\.\s]+))$"));
                int matchCounti = current.Count(item => Regex.IsMatch(item.Text, @"^¡+(([\d\.\s]+))"));
                bool result = skipContains.Any(x => current.Any(a => a.Text.ToLower().Contains(x.ToLower())));
                if ((matchCount > 0 && (matchCounti > 0 && matchCountnum <= 0)) && result != true)
                {
                    List<List<AllinoneBalloon.Entities.Common.Rect>> GroupText = SplitGroupOfDia(current, pattern, objerr);
                    for (int j = 0; j < GroupText.Count; j++)
                    {
                        groups.Add(GroupText[j]);
                    }
                }
                else
                {
                    groups.Add(current);
                }
            }
            return groups;
        }
        public bool ClosestGroupSatisfy(AllinoneBalloon.Entities.Common.Rect a, AllinoneBalloon.Entities.Common.Rect b) // previous, current
        {
            bool satisfy = false;
            satisfy = ((a.X + a.Width) < b.X) && ((b.X - (a.X + a.Width)) < (a.Width / (a.Text.Length == 0 ? 1 : a.Text.Length)) * 1) && (Math.Abs(b.Y - a.Y) < 20);

            return satisfy;
        }
        // 3. Merge all re-arranged group by X axis
        public List<AllinoneBalloon.Entities.Common.Rect> MergeGroupClosestXRect(List<List<AllinoneBalloon.Entities.Common.Rect>> rects)
        {
            var sortedRects = rects.ToList();
            var groupedRects = new List<AllinoneBalloon.Entities.Common.Rect>();
            Dictionary<string, string> datum_replace = new Dictionary<string, string>{
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
            try
            {
                for (int i = 0; i < sortedRects.Count; i++)
                {
                    try
                    {
                    var sort = sortedRects[i].OrderBy(r => r.X).ToList();
                    if (sort.Count == 0) continue;
                    string gtext = string.Empty;
                    int x, y = 0; int w, h = 0;
                    var first = sort.First();
                    x = first.X;
                    y = first.Y;
                    var last = sort.Last();
                    if (sort.Count > 1)
                    {
                        // Calculate the total width
                        int totalWidth = 0;
                        for (int k = 0; k < sort.Count; k++)
                        {
                            totalWidth += sort[k].Width;

                            // Add space between items
                            if (k < sort.Count - 1)
                            {
                                int space = sort[k + 1].X - (sort[k].X + sort[k].Width);
                                totalWidth += space;
                            }
                        }
                        w = totalWidth; h = sort.Max(i => i.Height);
                    }
                    else
                    {
                        w = sort.First().Width; h = sort.First().Height;
                    }
                    int c = 0;
                    foreach (var group in sort)
                    {
                        var text = group.Text;
                        // Replace multiple spaces with a single space
                        text = Regex.Replace(text, @"\s{2,}", " ");
                        text = Regex.Replace(text, @"^((\d+)+(:?:)(\d+)+)$", "$2.$4");
                        if (c > 0)
                        {
                            var gLastText = string.Empty;
                            var gCurrentText = string.Empty;
                            var gLast = sort[c - 1];
                            var gCurrent = sort[c];
                            gLastText = gLast.Text;
                            gCurrentText = gCurrent.Text;
                            if ((Regex.IsMatch(gLastText, @"^(¡?(\d+))$")) && (Regex.IsMatch(gCurrentText, @"^(\d+)$")))
                            {
                                gtext += "." + text;
                            }
                            else if ((Regex.IsMatch(gLastText, @"[0-9]{1}$")) && (Regex.IsMatch(gCurrentText, @"^(?:([\-.]+(\d+)|(\.\d+))|(\d+))+$")))
                            {
                                if (text.Contains("-"))
                                {
                                    string[] hastext = text.Split("-");
                                    text = string.Join(" - ", hastext);
                                    text = Regex.Replace(text, @"\s{2,}", " ");
                                }
                                gtext += "" + text;
                            }
                            else
                            {
                                gtext += " " + text;
                            }
                        }
                        else
                        {
                            // concat all grouped text
                            gtext = text + " ";
                        }

                        if (last == sort[c])
                        {
                            gtext = Regex.Replace(gtext, @"\s{2,}", " ");
                            gtext = Regex.Replace(gtext, @"^\.+", "");
                            gtext = gtext.Trim();
                            string nxHdrillpattern = @"^([\d\.]+?)(?:\s?)([X])(?:\s?)([H]?)(?:\s?)(¡)(?:\s?)([\d\.]+?)-([\d\.]+?)(?:\s?)(T|Ú|¨|»)(?:\s?)([\d\.]+?)$";
                            if (Regex.IsMatch(gtext, nxHdrillpattern))
                            {
                                Match nxHdrillpatternmatch = Regex.Match(gtext, nxHdrillpattern);
                                if (nxHdrillpatternmatch.Success)
                                {
                                    string AlphaH = nxHdrillpatternmatch.Groups[3].Value;
                                    string AlphaDrill = nxHdrillpatternmatch.Groups[7].Value;
                                    if (AlphaH == "H") { gtext = gtext.Replace("H", "ƒ"); }
                                    if (AlphaDrill == "T") { gtext = gtext.Replace("T", "¨"); }
                                    if (AlphaDrill == "Ú") { gtext = gtext.Replace("Ú", "¨"); }
                                    if (AlphaDrill == "»") { gtext = gtext.Replace("»", "¨"); }
                                }
                            }
                            // ¡3 Ú 12.7
                            string drillpattern = @"^(¡)?([\d\.\s]+)?(T|Ú|¨|»)([\d\.\s]+)$";
                            if (Regex.IsMatch(gtext, drillpattern))
                            {
                                Match nxHdrillpatternmatch = Regex.Match(gtext, drillpattern);
                                if (nxHdrillpatternmatch.Success)
                                {
                                    string AlphaDrill = nxHdrillpatternmatch.Groups[3].Value;
                                    if (AlphaDrill == "T") { gtext = gtext.Replace("T", "¨"); }
                                    if (AlphaDrill == "Ú") { gtext = gtext.Replace("Ú", "¨"); }
                                    if (AlphaDrill == "»") { gtext = gtext.Replace("»", "¨"); }
                                }
                            }
                            //I─I¡0-08Þ, C 1AÞ1

                            string patternNU = @"^([\\I\\─\\¡]+)([\d\-\d+(\s+)]+)([A-Z\\Þ\,\\I1\s]+)$";
                            if (Regex.IsMatch(gtext, patternNU))
                            {
                                Match match = Regex.Match(gtext, patternNU);
                                if (match.Success)
                                {
                                    string group1 = match.Groups[1].Value.Replace("I", " ").Trim(); // ¡ or ─ (if exists)
                                    string group2 = match.Groups[2].Value.Replace("-", ".").Trim(); // Number part
                                    string group3 = match.Groups[3].Value.Replace("I", " ").Replace(",", "").Replace("1", " ").Trim(); // Number part
                                                                                                                                       // Convert group2 to a number and check if it's greater than 1
                                    if (double.TryParse(group2, out double num) && num > 1)
                                    {
                                        gtext = $"{group1} {group2}".Trim();
                                    }
                                }
                            }
                            // ¡ 527.81 A
                            string patternNUH = @"^((?:─)|(?:¡))?([\d\.\s]+)?(\s*([A-Z]|Þ)){1,4}$";
                            if (Regex.IsMatch(gtext, patternNUH))
                            {
                                Match match = Regex.Match(gtext, patternNUH);
                                if (match.Success)
                                {
                                    string group1 = match.Groups[1].Value.Trim(); // ¡ or ─ (if exists)
                                    string group2 = match.Groups[2].Value.Trim(); // Number part
                                                                                  // Convert group2 to a number and check if it's greater than 1
                                    if (double.TryParse(group2, out double num) && num > 1)
                                    {
                                        gtext = $"{group1} {group2}".Trim();
                                    }
                                }
                            }
                            string partpattern = @"^(DETAIL(\s?)[A-Z]{1}|VIEW(\s?)[A-Z]{1}|SCALE(\s?)(\d*:\d*)|SEETION(\s?)[A-Z]{1}-[A-Z]{1})$";
                            if (Regex.IsMatch(gtext, partpattern))
                            {
                                gtext = "";
                            }
                            if (gtext.Contains("/═"))
                            {
                                gtext = gtext.Replace("/═", "");
                            }
                            if (gtext.Contains("/Û"))
                            {
                                gtext = "";
                            }
                            groupedRects.Add(new AllinoneBalloon.Entities.Common.Rect { X = x, Y = y, Width = w, Height = h, Text = gtext });
                        }
                        ++c;
                    }
                    }
                    catch (Exception e)
                    {
                        objerr.WriteErrorLog($"MergeStep3 item error at index {i}: {e.Message}");
                    }
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorLog(e.Message);
            }
            groupedRects = groupedRects.Where(r => !string.IsNullOrWhiteSpace(r.Text.Trim())).ToList();
            PrintListAsLog(groupedRects, objerr, "Step 3: ");
            return groupedRects;
        }
        // 4. Get closest Y and X
        public List<AllinoneBalloon.Entities.Common.Rect> GroupByClosestYAndX(List<AllinoneBalloon.Entities.Common.Rect> rects)
        {
            // Sort by Y first, then by X
            var sortedRectsX = rects.OrderBy(r => r.X).ThenBy(r => r.Y).ToList();
            var sortedRects = rects.OrderBy(r => r.Y).ThenBy(r => r.X).ToList();
            var groups = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            try
            {
                foreach (var rect in sortedRects)
                {
                    bool addedToGroup = false;
                    string rectText = rect.Text ?? "";

                    // Check if it belongs to any existing group
                    foreach (var group in groups)
                    {
                        var lastRect = group.Last();
                        string lastText = lastRect.Text ?? "";
                        bool cTextCondition2 = rectText.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.Length > 0 && word.All(char.IsLetter)) > 1;
                        bool LTextCondition2 = lastText.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.Length > 0 && word.All(char.IsLetter)) > 1;
                        bool cTextCondition3 = rectText.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.Length > 0 && word.All(char.IsLetter)) > 3;
                        bool LTextCondition3 = lastText.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.Length > 0 && word.All(char.IsLetter)) > 3;

                        if (((lastRect.Text.Trim() == "¡" || rect.Text.Trim() == "¡" || (cTextCondition3 && LTextCondition3))
                            && Math.Abs(lastRect.Y + lastRect.Height - rect.Y) <= Math.Max(lastRect.Height, rect.Height) && Math.Abs(lastRect.X - rect.X) <= Math.Max(lastRect.Width, rect.Width))
                            || (Math.Abs(rect.X - lastRect.X) < 8 && (rect.Y - (lastRect.Y + lastRect.Height)) < 10) && (cTextCondition2 && LTextCondition2))
                        {
                            group.Add(rect);
                            addedToGroup = true;
                            break;
                        }
                    }

                    // If not added to any group, create a new group
                    if (!addedToGroup)
                    {
                        groups.Add(new List<AllinoneBalloon.Entities.Common.Rect> { rect });
                    }
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorLog(e.Message);
            }

            PrintListAsLog(groups, objerr, "Step 4: ");

            return MergeGroupClosestYAndX(groups, objerr);
        }
        // Merge all closest Y and X
        public List<AllinoneBalloon.Entities.Common.Rect> MergeGroupClosestYAndX(List<List<AllinoneBalloon.Entities.Common.Rect>> rects, ErrorLog objerr)
        {
            List<AllinoneBalloon.Entities.Common.Rect> grouped = new List<AllinoneBalloon.Entities.Common.Rect>();
            var sortedRects = rects.ToList();
            try
            {
                for (int i = 0; i < sortedRects.Count; i++)
                {
                    var sort = sortedRects[i].ToList();
                    string gtext = string.Empty;
                    int cx, cy, nx = 0; int xx, yy, ww, hh = 0;
                    var first = sort.First();
                    cx = first.X;
                    cy = first.Y;
                    var last = sort.Last();
                    xx = first.X;
                    yy = first.Y;
                    if (sort.Count > 1)
                    {
                        // Calculate the total width
                        ww = sort.Max(i => i.Width); hh = sort.Max(i => i.Height);
                    }
                    else
                    {
                        ww = sort.First().Width; hh = sort.First().Height;
                    }

                    nx = first.X;
                    gtext = string.Join("\r\n", sort.Select(r => r.Text));
                    if (sort.Any(a => a.Text.Trim() == "¡"))
                    {
                        var filteredRects = sort.Where(a => a.Text.Trim() != "¡").ToList();
                        var filtereddegree = sort.Where(a => a.Text.Trim().Contains("°")).ToList();
                        if (filtereddegree.Count == 0)
                        {
                            gtext = "¡ " + string.Join(" - ", filteredRects.Select(r => r.Text));
                        }
                        else
                        {
                            gtext = string.Join("", filteredRects.Select(r => r.Text));
                        }
                    }
                    grouped.Add(new AllinoneBalloon.Entities.Common.Rect { X = xx, Y = yy, Width = ww, Height = hh, Text = gtext });
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorLog(e.Message);
            }
            // PrintListAsLog(grouped, objerr, "X and Y Axis Based : ");
            return grouped;
        }
        // 5. Get closest Y
        public List<AllinoneBalloon.Entities.Common.AG_OCR> GroupClosestYRect(List<AllinoneBalloon.Entities.Common.Rect> rects)
        {
            var sortedRects = rects.OrderBy(item => item.Y).ToList();
            var groupedRects = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            var currentGroup = new List<AllinoneBalloon.Entities.Common.Rect>();

            try
            {
                for (int i = 0; i < sortedRects.Count; i++)
                {
                    var rect = sortedRects[i];
                    // Split text into words and count alphabetic words
                    int alphabeticWordCount = rect.Text
                        .Split(' ', StringSplitOptions.RemoveEmptyEntries) // Split text by spaces
                        .Count(word => word.All(char.IsLetter));          // Count words that are fully alphabetic
                    var sortedRectSearchY = new List<AllinoneBalloon.Entities.Common.Rect>();
                    if (currentGroup.Count == 0 || ((currentGroup.Last().Text.Trim() == "¡" || rect.Text.Trim() == "¡" || (rect.Text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.All(char.IsLetter)) > 3 && currentGroup.Last().Text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Count(word => word.All(char.IsLetter)) > 3))
                            && Math.Abs(currentGroup.Last().Y + currentGroup.Last().Height - rect.Y) <= Math.Max(currentGroup.Last().Height, rect.Height) &&
                            Math.Abs(currentGroup.Last().X - rect.X) <= Math.Max(currentGroup.Last().Width, rect.Width)))
                    //&& ( ((currentGroup.Last().X + currentGroup.Last().Width/2) > rect.X && rect.X - currentGroup.Last().X > currentGroup.Last().Width / 2) || ((currentGroup.Last().X - currentGroup.Last().Width / 2) > rect.X && rect.X + rect.Width > currentGroup.Last().X) ) ) )
                    {
                        currentGroup.Add(rect);
                    }
                    else
                    {
                        sortedRectSearchY = new List<AllinoneBalloon.Entities.Common.Rect>();
                        sortedRectSearchY = currentGroup.ToList();
                        sortedRectSearchY.Sort((l, r) => { return l.X.CompareTo(r.X); });
                        groupedRects.Add(sortedRectSearchY);
                        currentGroup = new List<AllinoneBalloon.Entities.Common.Rect> { rect };
                    }
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorLog(e.Message);
            }
            //adding last group
            if (currentGroup.Count > 0)
            {
                groupedRects.Add(currentGroup);
            }
            PrintListAsLog(groupedRects, objerr, "Step 5: ");
            List<AG_OCR> groupedByX = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
            groupedByX = MergeGroupClosestYRect(groupedRects, objerr);

            return groupedByX;
        }
        // Merge Closest Y
        public List<AllinoneBalloon.Entities.Common.AG_OCR> MergeGroupClosestYRect(List<List<AllinoneBalloon.Entities.Common.Rect>> rects, ErrorLog objerr)
        {
            List<AllinoneBalloon.Entities.Common.AG_OCR> groupedByX = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
            var sortedRectsDiffYY = rects.ToList();
            try
            {
                for (int i = 0; i < sortedRectsDiffYY.Count; i++)
                {
                    var sort = sortedRectsDiffYY[i].OrderBy(item => item.Y).ToList();
                    string gtext = string.Empty;
                    int cx, cy, nx = 0; int xx, yy, ww, hh = 0;
                    var first = sort.First();
                    cx = first.X;
                    cy = first.Y;
                    var last = sort.Last();
                    xx = first.X;
                    yy = first.Y;
                    if (sort.Count > 1)
                    {
                        ww = sort.Max(i => i.X + i.Width); hh = sort.Max(i => i.Height);
                    }
                    else
                    {
                        ww = sort.First().Width; hh = sort.First().Height;
                    }

                    nx = first.X;
                    gtext = string.Join(" ", sort.Select(r => r.Text));
                    if (sort.Any(a => a.Text.Trim() == "¡"))
                    {
                        var filteredRects = sort.Where(a => a.Text.Trim() != "¡").ToList();
                        gtext = "¡ " + string.Join(" - ", filteredRects.Select(r => r.Text));
                    }
                    string[] removable = { "-EE-", "-E", "E-", "E2", "Eð", "I:E", "ç-", "-ç" };
                    bool resultcontains = removable.Any(x => gtext.ToLower().Contains(x.ToLower()));
                    if (resultcontains)
                    {
                        continue;
                    }
                    groupedByX.Add(new AllinoneBalloon.Entities.Common.AG_OCR { GroupID = i + 1, cx = cx, nx = nx, cy = cy, x = xx, y = yy, w = ww, h = hh, text = gtext });
                }
            }
            catch (Exception e)
            {
                objerr.WriteErrorLog(e.Message);
            }
            return groupedByX;
        }

        public List<AllinoneBalloon.Entities.Common.AG_OCR> CleanGroupByX(List<AllinoneBalloon.Entities.Common.AG_OCR> groupedByX)
        {
            try
            {
                for (int i = 0; i < groupedByX.Count; i++)
                {
                    AG_OCR rect = groupedByX[i];
                    string text = groupedByX[i].TrimText();
                    //string text = rect.TrimText();
                    if (string.IsNullOrWhiteSpace(text) || (Regex.IsMatch(text, @"^[A-Z]{1}\-$") || Regex.IsMatch(text, @"^(?:¡\s*[^0-9]+)$")))
                    {
                        rect.text = "";
                    }
                    else
                    {
                        text = text.Replace("═", "").Replace("(2)", "¡");
                        string samePattern = @"^([\d]{1})([:\-\.])([\d]{1})$";
                        if (Regex.IsMatch(text, samePattern))
                        {
                            Match matches = Regex.Match(text, samePattern);
                            if (matches.Success)
                            {
                                string one = matches.Groups[1].Value;
                                string Alpha = matches.Groups[2].Value;
                                string three = matches.Groups[3].Value;
                                // if (Alpha == ":") { gtext = gtext.Replace(":", "."); }
                                // if (Alpha == "-") { gtext = gtext.Replace("-", "."); }
                                if (one == three)
                                {
                                    rect.text = "";
                                    text = "";
                                }
                            }
                        }
                        string startwithRpattern = @"\bR[A-Za-z]+\b";
                        if (text.StartsWith("R") && !Regex.IsMatch(text, startwithRpattern))
                        // if (text.StartsWith("R") && Regex.IsMatch(text, @"^(R[\d.\s]+)") && (text != "ROWS" || text != "ROW"))
                        {
                            text = text.Replace(",", ".")
                                       .Replace("î", "0")
                                       .Replace("ï", "1")
                                       .Replace("ð", "2")
                                       .Replace("ñ", "3")
                                       .Replace("ò", "4")
                                       .Replace("ó", "5")
                                       .Replace("ô", "6")
                                       .Replace("õ", "7")
                                       .Replace("ö", "8")
                                       .Replace("÷", "9");
                            if (text == "R.00")
                                text = "R.005";
                            // R262.9 , R262.9 Max, R262.9Min
                            string Rpattern = @"^(R[\d.\s]+)(:?[A-Za-z\s\W]+)?$";
                            if (Regex.IsMatch(text, Rpattern))
                            {
                                // text = LatinToNumber(text);
                                Match Rpatternmatch = Regex.Match(text, Rpattern);
                                if (Rpatternmatch.Success)
                                {
                                    string g2 = Rpatternmatch.Groups[2].Value;
                                    if (!Regex.IsMatch(g2, @"\b(MIN|MAX)\b"))
                                    {
                                        text = Rpatternmatch.Groups[1].Value;
                                    }
                                }
                            }
                        }
                        string DpatternGDT = @"^(D|DO)([\w\s]+)$";
                        if (Regex.IsMatch(text, DpatternGDT) && !text.Contains("DETAIL"))
                        {
                            Match DpatternGDTmatch = Regex.Match(text, DpatternGDT);
                            if (DpatternGDTmatch.Success)
                            {
                                string Alpha = DpatternGDTmatch.Groups[2].Value;
                                Alpha = Alpha.Replace(",", ".")
                                       .Replace("ù", ".")
                                       .Replace("î", "0")
                                       .Replace("ï", "1")
                                       .Replace("ð", "2")
                                       .Replace("ñ", "3")
                                       .Replace("ò", "4")
                                       .Replace("ó", "5")
                                       .Replace("ô", "6")
                                       .Replace("õ", "7")
                                       .Replace("ö", "8")
                                       .Replace("÷", "9")
                                       .Replace("O", "0")
                                       ;
                                Alpha = Regex.Replace(Alpha, @"^0(\d+)", "0.$1");
                                text = "┤ " + Alpha;
                            }
                        }
                        // removal of unwanted GD&T
                        string unwantedGDTpattern = @"^([A-Z]{1})([\d.\s]+)?([ç|Û|¡|\s]+)?$";
                        if (Regex.IsMatch(text, unwantedGDTpattern))
                        {
                            text = Regex.Replace(text, unwantedGDTpattern, match =>
                            {
                                // Replace Group 4 (index 4) with a dot
                                string group1 = match.Groups[1].Value; // Full match
                                try
                                {
                                    string group2 = match.Groups[2].Value; // First match
                                    return $"{group1}{group2}";
                                }
                                catch (Exception e)
                                {
                                    objerr.WriteErrorLog($"removal of unwanted {text} - " + e.Message);
                                    return $"";
                                }
                            });
                        }
                        if (text.EndsWith("û"))
                        {
                            text = text.Substring(0, text.Length - 1);
                        }
                        List<string> stringList = new List<string> { "«", "´", "Ú", "Û", "»" };
                        int matchCount = text.Count(c => stringList.Contains(c.ToString()));
                        if (matchCount == 1)
                        {
                            rect.text = "";
                        }
                        string unwanteddotpattern = @"^(\.)([\s\w\\\/]+)?(\.)$";
                        if (Regex.IsMatch(text, unwanteddotpattern))
                        {
                            text = Regex.Replace(text, unwanteddotpattern, match =>
                            {
                                return $"";
                            });
                        }
                        string singleDiaPattern = @"^(¡)(\s?[\d]{1})$";
                        if (Regex.IsMatch(text, singleDiaPattern))
                        {
                            text = Regex.Replace(text, singleDiaPattern, match =>
                            {
                                return $"";
                            });
                        }
                        string repeatedarrowPattern = @"^(ç.*ç.*)$";
                        if (Regex.IsMatch(text, repeatedarrowPattern))
                        {
                            text = Regex.Replace(text, repeatedarrowPattern, match =>
                            {
                                return $"";
                            });
                        }
                        string patternthru = @"^([\d.\s]+)?(X)?(\s*¡)([\d.\s]+)(-)?([\d.\s]+)?([\w\s]+)?$";
                        if (Regex.IsMatch(text, patternthru))
                        {
                            text = Regex.Replace(text, patternthru, match =>
                            {
                                try
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
                                        if (Convert.ToDecimal(group4) > Convert.ToDecimal(group6))
                                        {
                                            return $"{group3} {group4}.{group6}";
                                        }
                                    }
                                    return $"{group1}{group2} {group3} {group4}{group5}{group6} {group7}";
                                }
                                catch (Exception e)
                                {
                                    objerr.WriteErrorLog($"pattern THRU {text} - " + e.Message);
                                    return $"";
                                }
                            });
                        }
                        string QpatternGDT = @"^(Q)(\s*¡)?([\d\.\s]+)+([\w\s]+)?$";
                        if (Regex.IsMatch(text, QpatternGDT))
                        {
                            Match QpatternGDTmatch = Regex.Match(text, QpatternGDT);
                            if (QpatternGDTmatch.Success)
                            {
                                string group2 = QpatternGDTmatch.Groups[2].Value;
                                string group3 = QpatternGDTmatch.Groups[3].Value;
                                string group4 = QpatternGDTmatch.Groups[4].Value.Trim();
                                string Alpha = $"{group2}{group3}{group4}";
                                Alpha = Alpha.Replace(",", ".")
                                       .Replace("ù", ".")
                                       .Replace("î", "0")
                                       .Replace("ï", "1")
                                       .Replace("ð", "2")
                                       .Replace("ñ", "3")
                                       .Replace("ò", "4")
                                       .Replace("ó", "5")
                                       .Replace("ô", "6")
                                       .Replace("õ", "7")
                                       .Replace("ö", "8")
                                       .Replace("÷", "9")
                                       .Replace("O", "0")
                                       ;
                                text = "┬ " + Alpha;
                            }
                        }
                        string JpatternGDT = @"^(J)(\s*¡)?([\d\.\s]+)+([\w\s]+)?$";
                        if (Regex.IsMatch(text, JpatternGDT))
                        {
                            Match match = Regex.Match(text, JpatternGDT);
                            if (match.Success)
                            {
                                string group2 = match.Groups[2].Value;
                                string group3 = match.Groups[3].Value;
                                string group4 = match.Groups[4].Value.Trim();
                                string Alpha = $"{group2}{group3}{group4}";
                                Alpha = Alpha.Replace(",", ".")
                                       .Replace("ù", ".")
                                       .Replace("î", "0")
                                       .Replace("ï", "1")
                                       .Replace("ð", "2")
                                       .Replace("ñ", "3")
                                       .Replace("ò", "4")
                                       .Replace("ó", "5")
                                       .Replace("ô", "6")
                                       .Replace("õ", "7")
                                       .Replace("ö", "8")
                                       .Replace("÷", "9")
                                       .Replace("O", "0")
                                       ;
                                text = "┘ " + Alpha;
                            }
                        }
                        string unc2bpattern = @"^((\d{1}\:\-)(\d{2}))(0?U\d{1}\:\(\d{1}B)(\sK)?(A\d{1})?(\d+)?";
                        if (Regex.IsMatch(text, unc2bpattern))
                        {
                            text = Regex.Replace(text, unc2bpattern, match =>
                            {
                                try
                                {
                                    string group2 = match.Groups[2].Value;
                                    group2 = Regex.Replace(group2, @"(\:\-)", "/8-");
                                    string group3 = match.Groups[3].Value;
                                    string group4 = match.Groups[4].Value;
                                    group4 = Regex.Replace(group4, @"(0?U\d{1}\:\(\d{1}B)", "UNC-2B");
                                    string group5 = match.Groups[5].Value;
                                    group5 = Regex.Replace(group5, @"(\s?K)", "¨");
                                    string group6 = match.Groups[6].Value;
                                    group6 = Regex.Replace(group6, @"(A\d{1})", "14.");
                                    string group7 = match.Groups[7].Value;
                                    return $"{group2}{group3} {group4} {group5} {group6}{group7}";
                                }
                                catch (Exception e)
                                {
                                    objerr.WriteErrorLog($"pattern UNC-2B {text} - " + e.Message);
                                    return $"";
                                }
                            });
                        }
                        string rangePattern = @"^(([(?:¡)|(?:\s)|(?:\()]+\s*)?([(\d+\.\d+)(?:\))(?:\s+)]+)?)$";
                        if (Regex.IsMatch(text, rangePattern))
                        {
                            text = Regex.Replace(text, rangePattern, match =>
                            {
                                try
                                {
                                    string group2 = match.Groups[2].Value.Trim();
                                    string group3 = match.Groups[3].Value.Trim();
                                    group3 = Regex.Replace(group3, @"\s+", "");
                                    return $"{group2} {group3}";
                                }
                                catch (Exception e)
                                {
                                    objerr.WriteErrorLog($"pattern Range {text} - " + e.Message);
                                    return $"";
                                }
                            });
                        }
                        string unwantedTextPattern = @"^([\+\-])?(\s+)?([E|X|\{|\}]+)(\s+)?([\+])?$";
                        if (Regex.IsMatch(text, unwantedTextPattern))
                        {
                            text = Regex.Replace(text, unwantedTextPattern, match =>
                            {
                                return $"";
                            });
                        }
                        if (text.EndsWith("-"))
                        {
                            text = string.Concat(text.AsSpan(0, text.Length - 1), "");
                        }
                        if (text.StartsWith("(") && !text.EndsWith(")"))
                        {
                            text += ")";
                        }
                        if (!text.StartsWith("(") && text.EndsWith(")"))
                        {
                            text = "(" + text;
                        }
                        text = text.Replace(",", ".")
                           .Replace("î", "0")
                           .Replace("ï", "1")
                           .Replace("ð", "2")
                           .Replace("ñ", "3")
                           .Replace("ò", "4")
                           .Replace("ó", "5")
                           .Replace("ô", "6")
                           .Replace("õ", "7")
                           .Replace("ö", "8")
                           .Replace("÷", "9")
                           ;
                        rect.text = text;
                    }
                }
            }
            catch (Exception ex)
            {
                objerr.WriteErrorLog(ex.Message);
            }
            groupedByX = groupedByX.Where(r => !string.IsNullOrWhiteSpace(r.text.Trim())).ToList();
            PrintListAsLog(groupedByX, objerr, "Final: ");
            return groupedByX;
        }
        public List<AllinoneBalloon.Entities.Common.Item> GetClosestRangeData(List<AllinoneBalloon.Entities.Common.Item> rects, ErrorLog objerr)
        {
            var visited = new HashSet<AllinoneBalloon.Entities.Common.Item>();
            string rangePattern = @"^(([(?:¡)|(?:\s)|(?:\()]+\s*)?([(\d+\.\d+)(?:\))(?:\s+)]+)?)$";
            var items = rects.Where(item => Regex.IsMatch(item.Text, rangePattern)).ToList();
            foreach (var i in items)
            {
                visited.Add(i);
            }
            if (visited.Count > 0)
            {
                // Filtering out the groups
                rects = rects.Where(group => !visited.Any(r => r == group)).ToList();
            }

            // Define thresholds for grouping
            int proximityThresholdX = 100;
            int proximityThresholdY = 100;
            items = items.OrderBy(item => item.X).ThenBy(a => a.Y).ToList();
            // Group items by proximity
            var groupedItems = new List<List<AllinoneBalloon.Entities.Common.Item>>();
            foreach (var item in items)
            {
                var group = groupedItems.FirstOrDefault(g =>
                    g.Any(i => Math.Abs(i.X + (Regex.IsMatch(i.Text, @"^\(") ? 150 : 0) - item.X + (Regex.IsMatch(item.Text, @"^\(") ? 250 : 0)) <= proximityThresholdX &&
                                Math.Abs(i.Y - item.Y) <= proximityThresholdY));

                if (group == null)
                {
                    groupedItems.Add(new List<AllinoneBalloon.Entities.Common.Item> { item });
                }
                else
                {
                    group.Add(item);
                }
            }
            var grouped = new List<AllinoneBalloon.Entities.Common.Item>();
            if (groupedItems.Count > 0)
            {
                // Filtering out the groups
                for (int i = 0; i < groupedItems.Count; i++)
                {
                    var sort = groupedItems[i].ToList();
                    string text = string.Join(" - ", sort.Select(r => r.Text.Replace(")", "").Replace("(", "")));
                    grouped.Add(new AllinoneBalloon.Entities.Common.Item { X = sort.Max(a => a.X), Y = sort.Max(a => a.Y), W = sort.Max(a => a.W), H = sort.Max(a => a.H), Text = text, isBallooned = false });
                }
            }
            if (grouped.Count > 0)
            {
                rects.AddRange(grouped);
            }
            return rects;
        }
        public List<List<AllinoneBalloon.Entities.Common.Item>> GroupItemsByX(List<AllinoneBalloon.Entities.Common.Item> items, int thresholdX)
        {
            List<List<AllinoneBalloon.Entities.Common.Item>> groups = new List<List<AllinoneBalloon.Entities.Common.Item>>();
            List<AllinoneBalloon.Entities.Common.Item> currentGroup = null;

            // Sort by X then Y for column-based grouping
            var sortedItems = items.OrderBy(item => item.X).ThenBy(item => item.Y).ToList();

            // Group items in the same vertical column
            foreach (var item in sortedItems)
            {
                if (currentGroup == null)
                {
                    currentGroup = new List<AllinoneBalloon.Entities.Common.Item>();
                    groups.Add(currentGroup);
                }
                else
                {
                    var last = currentGroup.Last();
                    // Items must have overlapping X ranges (same column)
                    bool xOverlap = Math.Abs(item.X - last.X) < thresholdX;
                    // Y gap: space between bottom of last and top of current must be small
                    // Use item height as threshold — items more than 1 text-height apart are separate
                    int yGap = item.Y - (last.Y + last.H);
                    bool yClose = yGap >= -5 && yGap < Math.Max(last.H, item.H);
                    if (!xOverlap || !yClose)
                    {
                        currentGroup = new List<AllinoneBalloon.Entities.Common.Item>();
                        groups.Add(currentGroup);
                    }
                }
                currentGroup.Add(item);
            }
            return groups;
        }
        public List<List<AllinoneBalloon.Entities.Common.Rect>> SortMerged(List<AllinoneBalloon.Entities.Common.Rect> rects)
        {
            var sortedRects = rects.OrderBy(r => r.Y).ThenBy(r => r.X).ToList();
            var groupedRects = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            var currentGroup = new List<AllinoneBalloon.Entities.Common.Rect>();
            for (int i = 0; i < sortedRects.Count; i++)
            {
                var currentItem = sortedRects[i];
                if (currentGroup.Count == 0 || ((Math.Abs(currentGroup.Last().Y - currentItem.Y) < 15) && (currentGroup.Last().Y + currentGroup.Last().Height - currentItem.Y < 15)))
                {
                    currentGroup.Add(currentItem);
                }
                else
                {
                    var sortedGroupRects = new List<AllinoneBalloon.Entities.Common.Rect>();
                    sortedGroupRects = currentGroup.ToList();
                    sortedGroupRects.Sort((l, r) => { return l.X.CompareTo(r.X); });
                    groupedRects.Add(sortedGroupRects);
                    currentGroup = new List<AllinoneBalloon.Entities.Common.Rect> { currentItem };
                }
            }
            if (currentGroup.Count > 0)
            {
                groupedRects.Add(currentGroup);
            }
            return groupedRects;
        }
        public List<List<AllinoneBalloon.Entities.Common.Rect>> GroupTextItems(List<AllinoneBalloon.Entities.Common.Rect> items)
        {
            List<List<AllinoneBalloon.Entities.Common.Rect>> groups = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            List<AllinoneBalloon.Entities.Common.Rect> currentGroup = new List<AllinoneBalloon.Entities.Common.Rect>();

            for (int i = 0; i < items.Count; i++)
            {
                if (currentGroup.Count == 0)
                {
                    currentGroup.Add(items[i]);
                }
                else
                {
                    var LastTextSize = currentGroup.Last().Width / currentGroup.Last().Text.Length - currentGroup.Last().Text.Count(c => c == ' ');
                    var CurrentTextSize = items[i].Width / items[i].Text.Length - items[i].Text.Count(c => c == ' ');
                    // space consider 3 text
                    if (Math.Abs(currentGroup[currentGroup.Count - 1].X + currentGroup[currentGroup.Count - 1].Width - items[i].X) < 110) // 3* 35
                    {
                        currentGroup.Add(items[i]);
                    }
                    else
                    {
                        groups.Add(currentGroup);
                        currentGroup = new List<AllinoneBalloon.Entities.Common.Rect> { items[i] };
                    }
                }
            }

            if (currentGroup.Count > 0)
            {
                groups.Add(currentGroup);
            }
            return groups;
        }
        public List<List<AllinoneBalloon.Entities.Common.Rect>> GroupRects(List<AllinoneBalloon.Entities.Common.Rect> rects, int yThreshold, int xThreshold)
        {
            // Sort rectangles by Y value
            rects = rects.OrderBy(r => r.Y).ThenBy(r => r.X).ToList();
            var grouped = new List<List<AllinoneBalloon.Entities.Common.Rect>>();
            var visited = new HashSet<AllinoneBalloon.Entities.Common.Rect>();

            foreach (var rect in rects)
            {
                if (visited.Contains(rect)) continue;

                // Start a new group
                var group = new List<AllinoneBalloon.Entities.Common.Rect> { rect };
                visited.Add(rect);

                // Find all other rectangles that belong to this group
                for (int i = 0; i < group.Count; i++)
                {
                    var current = group[i];
                    foreach (var other in rects)
                    {
                        if (visited.Contains(other)) continue;

                        // Check proximity in Y and X axes
                        if (Math.Abs(current.Y + current.Height - other.Y) <= yThreshold && Math.Abs(current.X - other.X) <= xThreshold)
                        {
                            group.Add(other);
                            visited.Add(other);
                        }
                    }
                }
                grouped.Add(group);
            }
            return grouped;
        }

        #endregion
    }
}

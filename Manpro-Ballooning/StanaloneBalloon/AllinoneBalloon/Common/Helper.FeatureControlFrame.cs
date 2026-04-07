using AllinoneBalloon.Services;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region GD&T Post-Processing — Merge Horizontally Adjacent OCR Words

        /// <summary>
        /// Post-processing step: merges OCR words that are on the same horizontal line
        /// and very close together. This groups GD&T feature control frame content
        /// (e.g. "0.13" + "C" → "0.13 C") without any image-based detection.
        ///
        /// Preserves original text exactly — no brackets, no reformatting.
        /// Preserves original positional order for non-merged items.
        /// Only applies when items are clearly aligned and close.
        /// </summary>
        public List<OcrWordResult> MergeAdjacentGdtWords(List<OcrWordResult> words)
        {
            if (words == null || words.Count < 2)
                return words;

            // Sort by Y (top to bottom) then X (left to right)
            var sorted = words
                .Select((w, idx) => (word: w, origIndex: idx))
                .OrderBy(t => t.word.Y)
                .ThenBy(t => t.word.X)
                .ToList();

            var used = new bool[sorted.Count];
            // Map: original index of first word in group -> merged result
            var mergedAtOrigIndex = new Dictionary<int, OcrWordResult>();
            var usedOrigIndices = new HashSet<int>();

            for (int i = 0; i < sorted.Count; i++)
            {
                if (used[i]) continue;

                var group = new List<(int sortedIdx, OcrWordResult word, int origIndex)>();
                group.Add((i, sorted[i].word, sorted[i].origIndex));
                used[i] = true;

                // Scan forward for adjacent words on the same horizontal line
                bool foundMore;
                do
                {
                    foundMore = false;
                    var lastInGroup = group.Last();

                    for (int j = i + 1; j < sorted.Count; j++)
                    {
                        if (used[j]) continue;
                        var candidate = sorted[j].word;
                        var lastWord = lastInGroup.word;

                        // Same horizontal line: Y centers within half the max height
                        int lastCenterY = lastWord.Y + lastWord.Height / 2;
                        int candCenterY = candidate.Y + candidate.Height / 2;
                        int heightTol = Math.Max(lastWord.Height, candidate.Height) / 2;
                        if (Math.Abs(lastCenterY - candCenterY) > heightTol)
                            continue;

                        // Similar height (within 60% ratio)
                        int maxH = Math.Max(lastWord.Height, candidate.Height);
                        int minH = Math.Min(lastWord.Height, candidate.Height);
                        if (maxH > 0 && minH < maxH * 0.4)
                            continue;

                        // Very close horizontally: gap between right edge of last and left edge of candidate
                        int lastRight = lastWord.X + lastWord.Width;
                        int gap = candidate.X - lastRight;
                        int refHeight = Math.Max(lastWord.Height, candidate.Height);

                        // Determine max allowed gap based on content context
                        // GD&T feature control frames have cell dividers creating larger gaps
                        // between tolerance values and datum references
                        string groupText = string.Join(" ", group.Select(g => g.word.Text));
                        bool groupIsGdt = IsGdtContent(groupText);
                        bool candidateIsDatum = IsDatumRef(candidate.Text);

                        // Use wider gap (4x height) when merging GD&T tolerance with datum ref
                        // Use normal gap (1.5x height) for general text
                        int maxGap = (groupIsGdt && candidateIsDatum) || (candidateIsGdt(candidate.Text) && IsDatumRef(groupText))
                            ? (int)(refHeight * 4)
                            : (int)(refHeight * 1.5);

                        if (gap < -5 || gap > maxGap)
                            continue;

                        // Merge candidate into group
                        group.Add((j, candidate, sorted[j].origIndex));
                        used[j] = true;
                        foundMore = true;
                        break; // Restart scan from this new last word
                    }
                } while (foundMore);

                if (group.Count >= 2)
                {
                    // Merge: combine text left-to-right with spaces, preserve exactly
                    string mergedText = string.Join(" ", group.Select(g => g.word.Text));

                    int minX = group.Min(g => g.word.X);
                    int minY = group.Min(g => g.word.Y);
                    int maxX = group.Max(g => g.word.X + g.word.Width);
                    int maxY = group.Max(g => g.word.Y + g.word.Height);
                    float avgConf = group.Average(g => g.word.Confidence);

                    // Place at the smallest original index in the group
                    int firstOrigIndex = group.Min(g => g.origIndex);
                    mergedAtOrigIndex[firstOrigIndex] = new OcrWordResult
                    {
                        Text = mergedText,
                        X = minX,
                        Y = minY,
                        Width = maxX - minX,
                        Height = maxY - minY,
                        Confidence = avgConf
                    };

                    foreach (var g in group)
                        usedOrigIndices.Add(g.origIndex);

                    objerr.WriteErrorLog($"GDT merged: '{mergedText}' at ({minX},{minY},{maxX - minX},{maxY - minY})");
                }
            }

            // Rebuild list preserving original positional order
            var result = new List<OcrWordResult>();
            for (int i = 0; i < words.Count; i++)
            {
                if (mergedAtOrigIndex.TryGetValue(i, out var merged))
                    result.Add(merged);
                else if (!usedOrigIndices.Contains(i))
                    result.Add(words[i]);
            }

            return result;
        }

        /// <summary>
        /// Same post-processing for AG_OCR results (used in large image path).
        /// Merges horizontally adjacent items on the same line.
        /// </summary>
        public List<AllinoneBalloon.Entities.Common.AG_OCR> MergeAdjacentGdtAgOcr(
            List<AllinoneBalloon.Entities.Common.AG_OCR> agResults)
        {
            if (agResults == null || agResults.Count < 2)
                return agResults;

            var sorted = agResults
                .Select((a, idx) => (item: a, origIndex: idx))
                .OrderBy(t => t.item.y)
                .ThenBy(t => t.item.x)
                .ToList();

            var used = new bool[sorted.Count];
            var mergedAtOrigIndex = new Dictionary<int, AllinoneBalloon.Entities.Common.AG_OCR>();
            var usedOrigIndices = new HashSet<int>();
            int nextGroupId = agResults.Max(a => a.GroupID) + 1;

            for (int i = 0; i < sorted.Count; i++)
            {
                if (used[i]) continue;

                var group = new List<(int sortedIdx, AllinoneBalloon.Entities.Common.AG_OCR item, int origIndex)>();
                group.Add((i, sorted[i].item, sorted[i].origIndex));
                used[i] = true;

                bool foundMore;
                do
                {
                    foundMore = false;
                    var last = group.Last();

                    for (int j = i + 1; j < sorted.Count; j++)
                    {
                        if (used[j]) continue;
                        var cand = sorted[j].item;
                        var lastItem = last.item;

                        int lastCenterY = lastItem.y + lastItem.h / 2;
                        int candCenterY = cand.y + cand.h / 2;
                        int heightTol = Math.Max(lastItem.h, cand.h) / 2;
                        if (Math.Abs(lastCenterY - candCenterY) > heightTol)
                            continue;

                        int maxH = Math.Max(lastItem.h, cand.h);
                        int minH = Math.Min(lastItem.h, cand.h);
                        if (maxH > 0 && minH < maxH * 0.4)
                            continue;

                        int lastRight = lastItem.x + lastItem.w;
                        int gap = cand.x - lastRight;
                        int refH = Math.Max(lastItem.h, cand.h);

                        string grpText = string.Join(" ", group.Select(g => g.item.text));
                        bool grpIsGdt = IsGdtContent(grpText);
                        bool candIsDatum = IsDatumRef(cand.text);
                        int maxGap = (grpIsGdt && candIsDatum) || (candidateIsGdt(cand.text) && IsDatumRef(grpText))
                            ? (int)(refH * 4)
                            : (int)(refH * 1.5);

                        if (gap < -5 || gap > maxGap)
                            continue;

                        group.Add((j, cand, sorted[j].origIndex));
                        used[j] = true;
                        foundMore = true;
                        break;
                    }
                } while (foundMore);

                if (group.Count >= 2)
                {
                    string mergedText = string.Join(" ", group.Select(g => g.item.text));

                    var first = group.First().item;
                    int minX = group.Min(g => g.item.x);
                    int minY = group.Min(g => g.item.y);
                    int maxX = group.Max(g => g.item.x + g.item.w);
                    int maxY = group.Max(g => g.item.y + g.item.h);

                    int firstOrigIndex = group.Min(g => g.origIndex);
                    mergedAtOrigIndex[firstOrigIndex] = new AllinoneBalloon.Entities.Common.AG_OCR
                    {
                        GroupID = nextGroupId++,
                        cx = first.cx,
                        nx = first.nx,
                        cy = minY,
                        x = minX,
                        y = minY,
                        w = maxX - minX,
                        h = maxY - minY,
                        text = mergedText
                    };

                    foreach (var g in group)
                        usedOrigIndices.Add(g.origIndex);

                    objerr.WriteErrorLog($"GDT merged (large): '{mergedText}' at ({minX},{minY})");
                }
            }

            var result = new List<AllinoneBalloon.Entities.Common.AG_OCR>();
            for (int i = 0; i < agResults.Count; i++)
            {
                if (mergedAtOrigIndex.TryGetValue(i, out var merged))
                    result.Add(merged);
                else if (!usedOrigIndices.Contains(i))
                    result.Add(agResults[i]);
            }

            return result;
        }

        #region GD&T Content Detection Helpers

        /// <summary>
        /// Checks if text contains GD&T tolerance content (values, symbols, modifiers).
        /// </summary>
        private static bool IsGdtContent(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            // Contains tolerance value like 0.08, 0.13, 0.25, 0.76
            // or starts with GD&T-like prefix: (, p, ⌀, ç, ─
            return System.Text.RegularExpressions.Regex.IsMatch(text,
                @"(\d+\.\d+)|(\(M\))|(\(m\))|(^[\(p⌀ç─])");
        }

        /// <summary>
        /// Checks if text is a standalone function alias for IsGdtContent.
        /// </summary>
        private static bool candidateIsGdt(string text)
        {
            return IsGdtContent(text);
        }

        /// <summary>
        /// Checks if text looks like a datum reference (A, B, C, A(M), B(M), AM, etc.)
        /// </summary>
        private static bool IsDatumRef(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            text = text.Trim();
            // Single datum letter: A, B, C
            // Datum with modifier: A(M), B(M), AM, A(m)
            // Datum with parens: (A(M), (AM), (A(m)
            return System.Text.RegularExpressions.Regex.IsMatch(text,
                @"^[\(]?[A-Z][\(]?[Mm]?\)?\.?$");
        }

        #endregion

        #endregion
    }
}

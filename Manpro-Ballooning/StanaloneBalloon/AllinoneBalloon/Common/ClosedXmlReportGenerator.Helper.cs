using ClosedXML.Excel;
using ClosedXML.Excel;
using System.Globalization;

namespace AllinoneBalloon.Common
{
    public partial class ClosedXmlReportGenerator
    {
        #region Helper
        public class ColorConverter
        {
            public static XLColor HexToRgba(string hex, double opacity)
            {
                if (hex.StartsWith("#"))
                {
                    hex = hex.TrimStart('#');
                }

                if (hex.Length == 6)
                {
                    hex += "FF"; // Add full opacity if alpha is not provided
                }

                if (hex.Length != 8)
                {
                    throw new ArgumentException("Invalid hex format. Must be 6 or 8 characters long.");
                }

                byte r = byte.Parse(hex.Substring(0, 2), NumberStyles.HexNumber);
                byte g = byte.Parse(hex.Substring(2, 2), NumberStyles.HexNumber);
                byte b = byte.Parse(hex.Substring(4, 2), NumberStyles.HexNumber);
                byte a = byte.Parse(hex.Substring(6, 2), NumberStyles.HexNumber);

                string rgba = $"rgba({r}, {g}, {b}, .{a})";
                var parts = rgba.Replace("rgba(", "").Replace(")", "").Split(',');
                int ri = int.Parse(parts[0].Trim());
                int gi = int.Parse(parts[1].Trim());
                int bi = int.Parse(parts[2].Trim());

                return ColorConverter.BlendWithWhite(ri, gi, bi, opacity);
            }
            public static XLColor BlendWithWhite(int r, int g, int b, double opacity)
            {
                int newR = (int)(r + (255 - r) * (1 - opacity));
                int newG = (int)(g + (255 - g) * (1 - opacity));
                int newB = (int)(b + (255 - b) * (1 - opacity));
                return XLColor.FromHtml($"#{newR:X2}{newG:X2}{newB:X2}");
            }
        }
        public class ThisItem
        {
            public int Page_No { get; set; }
            public string Balloon { get; set; }
            public string Characteristics { get; set; }
            public string Spec { get; set; }
            public string Minimum { get; set; }
            public string Maximum { get; set; }
            public string Unit { get; set; }
            public string Serial_No { get; set; }
            public long Quantity { get; set; }
            public List<Dictionary<string, Dictionary<string, string>>> Actual { get; set; }
        }
        public class GRepository
        {
            private readonly Dictionary<string, List<ThisItem>> _itemDictionary;
            public GRepository()
            {
                _itemDictionary = new Dictionary<string, List<ThisItem>>();
            }

            // Method to add items to a specific key
            public void AddItems(string key, List<ThisItem> items)
            {
                if (_itemDictionary.ContainsKey(key))
                {
                    _itemDictionary[key].AddRange(items);
                }
                else
                {
                    _itemDictionary[key] = new List<ThisItem>(items);
                }
            }

            // Method to get items by key
            public List<ThisItem> GetItems(string key)
            {
                if (_itemDictionary.TryGetValue(key, out var items))
                {
                    return items;
                }
                return new List<ThisItem>();
            }

            // Method to get all items
            public Dictionary<string, List<ThisItem>> GetAllItems()
            {
                return _itemDictionary;
            }
        }
        #endregion
    }
}

using AllinoneBalloon.Models;
using System.Text;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Misc
        public int CountDigits(string input)
        {
            int count = 0;

            foreach (char c in input)
            {
                if (char.IsDigit(c))
                {
                    count++;
                }
            }
            return count;
        }
        public int CountAlphabetChars(string input)
        {
            int count = 0;
            foreach (char c in input)
            {
                if (char.IsLetter(c))
                {
                    count++;
                }
            }
            return count;
        }
        public string AddTrailingSlash(string path)
        {
            // Use Path.DirectorySeparatorChar for platform-specific slash
            if (!path.EndsWith(System.IO.Path.DirectorySeparatorChar.ToString()))
            {
                path += System.IO.Path.DirectorySeparatorChar;
            }
            return path;
        }
        public string getNomianal(string OCR_Text, string Nominal, TblBaloonDrawingHeader hdrnew)
        {
            int count = OCR_Text.Count(f => f == '.');
            using var context = _dbcontext.CreateDbContext();
            CommonMethods cmt = new AllinoneBalloon.Common.CommonMethods(context, hdrnew);
            string[] minmax;
            string nominalv = string.Empty;
            if ((OCR_Text.Contains("±") || OCR_Text.Contains("+") || OCR_Text.Contains("-") || count == 1 || count == 2 || count == 3 || OCR_Text.Contains("Û") || OCR_Text.Contains("Ú") || OCR_Text.Contains("´") || OCR_Text.Contains("»") || OCR_Text.Contains("«") || OCR_Text.Contains("ëûí") || OCR_Text.Contains("ëÐí")) && !OCR_Text.Contains("°"))
            {
                minmax = cmt.AssignMinMaxValue(OCR_Text).Split(',');
                if (minmax.Length > 0)
                {
                    nominalv = minmax[0];
                }
            }
            else if (Nominal.Contains("°"))
            {
                if (OCR_Text.Contains("°") && OCR_Text.Contains("±"))
                {
                    nominalv = Convert.ToString(OCR_Text.Substring(0, OCR_Text.IndexOf("±")).Replace("°", ""));
                }
                else
                {
                    nominalv = Nominal.Replace("°", "");
                }
            }
            return nominalv;
        }
        public bool Between(decimal number, decimal min, decimal max)
        {
            return number >= min && number <= max;
        }
        public string GenerateRandomSecretCode(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            StringBuilder secretCode = new StringBuilder();
            Random random = new Random();

            for (int i = 0; i < length; i++)
            {
                int index = random.Next(chars.Length);
                secretCode.Append(chars[index]);
            }

            string str = secretCode.ToString();
            byte[] byteArray = Encoding.UTF8.GetBytes(str);
            return Convert.ToBase64String(byteArray);
        }
        public static bool ByteArraysEqual(byte[] b1, byte[] b2)
        {
            if (b1 == b2) return true;
            if (b1 == null || b2 == null) return false;
            if (b1.Length != b2.Length) return false;
            for (int i = 0; i < b1.Length; i++)
            {
                if (b1[i] != b2[i]) return false;
            }
            return true;
        }
        public async Task<List<string>> Samples(List<string> addedfiles)
        {
            List<string> samples = new List<string>();
            return await Task.Run(() =>
            {
                foreach (string s in addedfiles)
                {
                    FileInfo drawingName = new FileInfo(s);
                    string Drawing_No = drawingName.Name.Replace(drawingName.Extension, "");
                    samples.Add(Drawing_No);
                }
                return samples;
            });
        }
        #endregion
    }
}

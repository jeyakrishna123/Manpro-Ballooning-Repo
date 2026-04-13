using System.IO;
using ImageMagick;

namespace AllinoneBalloon.Common
{
    public class PDF_Parsing
    {
        ErrorLog objerr = new AllinoneBalloon.Common.ErrorLog();
        public List<string> GhostscriptPDFtoImage(string sourcePdf, string outputPath, AllinoneBalloon.Models.Settings settings)
        {
            var imgs = new List<string>();
            try
            {
                if (!Directory.Exists(outputPath))
                    Directory.CreateDirectory(outputPath);

                string Fname = settings.DrawingNo.Trim().ToUpper().ToString() + "-" + settings.RevNo.Trim().ToUpper().ToString();

                // Use Magick.NET (cross-platform) to convert PDF pages to PNG
                var readSettings = new MagickReadSettings
                {
                    Density = new Density(300, 300), // 300 DPI - same as before
                    BackgroundColor = MagickColors.White
                };

                using (var images = new MagickImageCollection())
                {
                    images.Read(sourcePdf, readSettings);

                    int pageNumber = 0;
                    foreach (var image in images)
                    {
                        pageNumber++;
                        // Flatten with white background (same as g.Clear(White) + DrawImage before)
                        image.BackgroundColor = MagickColors.White;
                        image.Alpha(AlphaOption.Remove);
                        image.Format = MagickFormat.Png;

                        string path = System.IO.Path.Combine(outputPath, String.Format(@"{0}-{1:000}.png", Fname, pageNumber));
                        int count = 1;
                        while (System.IO.File.Exists(path))
                        {
                            string FileName = string.Format("{0}-{1:000}({2}).png", Fname, pageNumber, count++);
                            path = System.IO.Path.Combine(outputPath, FileName);
                        }

                        image.Write(path);
                        imgs.Add(path);
                    }
                }
                return imgs;
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                return imgs;
            }
        }
    }
}

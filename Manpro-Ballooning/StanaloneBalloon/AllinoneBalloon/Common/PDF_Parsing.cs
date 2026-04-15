using System.IO;
using Ghostscript.NET;
using Ghostscript.NET.Rasterizer;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;

namespace AllinoneBalloon.Common
{
    public class PDF_Parsing
    {
        ErrorLog objerr = new AllinoneBalloon.Common.ErrorLog();

        private GhostscriptVersionInfo GetGhostscriptVersion()
        {
            // Look for gsdll64.dll in the Lib folder relative to the app base directory
            string libPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Lib");
            string dllPath = Path.Combine(libPath, Environment.Is64BitProcess ? "gsdll64.dll" : "gsdll32.dll");

            if (!File.Exists(dllPath))
            {
                // Fallback: check project root Lib folder (for dotnet run)
                string projectLib = Path.Combine(Directory.GetCurrentDirectory(), "Lib");
                dllPath = Path.Combine(projectLib, Environment.Is64BitProcess ? "gsdll64.dll" : "gsdll32.dll");
            }

            if (!File.Exists(dllPath))
            {
                throw new FileNotFoundException($"Ghostscript DLL not found. Searched: {dllPath}");
            }

            return new GhostscriptVersionInfo(dllPath);
        }

        public List<string> GhostscriptPDFtoImage(string sourcePdf, string outputPath, AllinoneBalloon.Models.Settings settings)
        {
            var imgs = new List<string>();
            try
            {
                if (!Directory.Exists(outputPath))
                    Directory.CreateDirectory(outputPath);

                string Fname = settings.DrawingNo.Trim().ToUpper().ToString() + "-" + settings.RevNo.Trim().ToUpper().ToString();

                var gvi = GetGhostscriptVersion();

                using (var rasterizer = new GhostscriptRasterizer())
                {
                    rasterizer.Open(sourcePdf, gvi, true);

                    for (int pageNumber = 1; pageNumber <= rasterizer.PageCount; pageNumber++)
                    {
                        string path = Path.Combine(outputPath, string.Format(@"{0}-{1:000}.png", Fname, pageNumber));
                        int count = 1;
                        while (File.Exists(path))
                        {
                            string FileName = string.Format("{0}-{1:000}({2}).png", Fname, pageNumber, count++);
                            path = Path.Combine(outputPath, FileName);
                        }

                        // Rasterize at 300 DPI and save as PNG
                        using (var pageImage = rasterizer.GetPage(300, pageNumber))
                        {
                            using (var ms = new MemoryStream())
                            {
                                pageImage.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
                                ms.Position = 0;
                                using (var img = SixLabors.ImageSharp.Image.Load(ms))
                                {
                                    img.Save(path, new PngEncoder());
                                }
                            }
                        }

                        imgs.Add(path);
                    }
                }
                return imgs;
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                objerr.WriteErrorLog($"PDF conversion failed: {ex.Message}");
                return imgs;
            }
        }
    }
}

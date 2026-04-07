using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using Dotnet = System.Drawing.Image;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Text;
using Ghostscript.NET.Rasterizer;
using Google.Protobuf.Collections;
using System;
using DocumentFormat.OpenXml.Vml;
using Ghostscript.NET.Processor;
using Ghostscript.NET;
using System.Runtime.InteropServices;

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
                // Read the PDF file from the request body
                using (Stream pdfStream = new System.IO.FileStream(sourcePdf, FileMode.Open, FileAccess.Read))
                {
                    // and then pass that GhostscriptVersionInfo to the required constructor or method
                    string ghostscriptDllPath = new DirectoryInfo(Environment.CurrentDirectory).FullName + (Environment.Is64BitProcess ? @"\Lib\gsdll64.dll" : @"\Lib\gsdll32.dll");
                    if (!File.Exists(ghostscriptDllPath))
                    {
                        throw new FileNotFoundException($"The required Ghostscript DLL could not be found: {ghostscriptDllPath}");
                    }

                    // Create a Ghostscript rasterizer
                    using (GhostscriptRasterizer rasterizer = new GhostscriptRasterizer())
                    {
                        Ghostscript.NET.GhostscriptVersionInfo versionInfo = new Ghostscript.NET.GhostscriptVersionInfo(ghostscriptDllPath);
                        // Open the PDF stream
                        rasterizer.Open(pdfStream, versionInfo, true);

                        // Set the resolution (DPI) for rendering the images
                        int dpi = 300;
                        // Convert each page to an image
                        for (int pageNumber = 1; pageNumber <= rasterizer.PageCount; pageNumber++)
                        {
                            // Render the page to a bitmap
                            using (System.Drawing.Image img = rasterizer.GetPage(dpi, pageNumber))
                            {
                                // Convert bitmap to MemoryStream
                                using (MemoryStream memoryStream = new MemoryStream())
                                {
                                    //bitmap.Save(memoryStream, System.Drawing.Imaging.ImageFormat.Png);

                                    // Return the image as a file stream
                                    memoryStream.Position = 0;
                                    System.Drawing.Bitmap bmp = new System.Drawing.Bitmap(img.Width, img.Height);
                                    using (System.Drawing.Graphics g = System.Drawing.Graphics.FromImage(bmp))
                                    {
                                        g.Clear(System.Drawing.Color.White);
                                        g.DrawImageUnscaled(img, 0, 0);
                                    }

                                    // must save the file while stream is open.
                                    if (!Directory.Exists(outputPath))
                                        Directory.CreateDirectory(outputPath);

                                    FileInfo fi = new FileInfo(sourcePdf);
                                    //string Fname = fi.Name.Replace(fi.Extension, "");
                                    string Fname = settings.DrawingNo.Trim().ToUpper().ToString() + "-" + settings.RevNo.Trim().ToUpper().ToString();
                                    string path = System.IO.Path.Combine(outputPath, String.Format(@"{0}-{1:000}.png", Fname, pageNumber));
                                    int count = 1;
                                    while (System.IO.File.Exists(path))
                                    {
                                        string FileName = string.Format("{0}-{1:000}({2}).png", Fname, pageNumber, count++);
                                        path = System.IO.Path.Combine(outputPath, FileName);
                                    }

                                    System.Drawing.Imaging.EncoderParameters parms = new System.Drawing.Imaging.EncoderParameters(1);
                                    parms.Param[0] = new System.Drawing.Imaging.EncoderParameter(System.Drawing.Imaging.Encoder.Compression, 0);
                                    var pngEncoder = ImageCodecInfo.GetImageEncoders().ToList().Find(x => x.FormatID == System.Drawing.Imaging.ImageFormat.Png.Guid);
                                    img.Save(path, pngEncoder, parms);

                                    img.Dispose();
                                    imgs.Add(path);
                                }
                            }
                        }
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

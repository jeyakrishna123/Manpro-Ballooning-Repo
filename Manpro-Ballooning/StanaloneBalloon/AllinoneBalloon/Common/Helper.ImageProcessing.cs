using PdfSharp.Drawing;
using PdfSharp.Pdf;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Drawing.Processing;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Image Process
        public MemoryStream imageToByteArray(string imagePath, ErrorLog objerr)
        {
            var ms = new MemoryStream();
            try
            {
                using (var image = SixLabors.ImageSharp.Image.Load(imagePath))
                {
                    image.Save(ms, new PngEncoder());
                    ms.Position = 0;
                }
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
            }
            return ms;
        }
        public string scaleImage(List<AllinoneBalloon.Entities.Common.PartialImage> partial_image, string s, int itemview, bool isFlag, ErrorLog objerr)
        {
            int maximum = 32767;
            string resize = "false";
            try
            {
                int originalWidth, originalHeight;
                byte[] fileBytes = System.IO.File.ReadAllBytes(s);
                using (var image = SixLabors.ImageSharp.Image.Load<Rgba32>(fileBytes))
                {
                    originalWidth = image.Width;
                    originalHeight = image.Height;
                    int newWidth, newHeight;
                    if (image.Width > maximum || image.Height > maximum)
                    {
                        resize = "true";
                        if (originalWidth > originalHeight)
                        {
                            newWidth = maximum;
                            newHeight = (int)((double)originalHeight / originalWidth * maximum);
                        }
                        else
                        {
                            newHeight = maximum;
                            newWidth = (int)((double)originalWidth / originalHeight * maximum);
                        }
                        float widthScale = (float)newWidth / originalWidth;
                        float heightScale = (float)newHeight / originalHeight;
                        float scale = Math.Min(widthScale, heightScale);
                        int scaledWidth = (int)(originalWidth * scale);
                        int scaledHeight = (int)(originalHeight * scale);
                        FileInfo fi = new FileInfo(s);
                        string fileName = fi.Name;
                        if (isFlag)
                        {
                            partial_image.Add(new AllinoneBalloon.Entities.Common.PartialImage
                            {
                                x = 0,
                                y = 0,
                                width = newWidth,
                                height = newHeight,
                                src = Convert.ToString(fileName),
                                scale = scale,
                                fullWidth = originalWidth,
                                fullHeight = originalHeight,
                                item = itemview,
                                count = partial_image.Count()
                            });
                        }
                        image.Mutate(x => x.Resize(scaledWidth, scaledHeight));
                        image.Save(s);
                    }
                    else
                    {
                        if (isFlag)
                        {
                            FileInfo fi = new FileInfo(s);
                            string fileName = fi.Name;
                            partial_image.Add(new AllinoneBalloon.Entities.Common.PartialImage
                            {
                                x = 0,
                                y = 0,
                                width = originalWidth,
                                height = originalHeight,
                                src = Convert.ToString(fileName),
                                scale = 1,
                                fullWidth = originalWidth,
                                fullHeight = originalHeight,
                                item = itemview,
                                count = partial_image.Count()
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
            }
            return resize;
        }

        public Image<Rgba32> CropImage(Image<Rgba32> img, SixLabors.ImageSharp.Rectangle cropArea)
        {
            var croppedImage = img.Clone(x => x.Crop(cropArea));
            return croppedImage;
        }
        public Image<Rgba32> ChangeResolution(Image<Rgba32> img, float newDpi)
        {
            var newImage = img.Clone();
            newImage.Metadata.HorizontalResolution = newDpi;
            newImage.Metadata.VerticalResolution = newDpi;
            return newImage;
        }

        public string ChangeResolutionSmall(string inputPath, string outputPath, float targetDpi)
        {
            using (var original = SixLabors.ImageSharp.Image.Load<Rgba32>(inputPath))
            {
                original.Metadata.HorizontalResolution = targetDpi;
                original.Metadata.VerticalResolution = targetDpi;
                original.Save(outputPath, new PngEncoder());
            }
            return outputPath;
        }

        public List<AllinoneBalloon.Entities.Common.ResizeImageSize> ResizeImage(List<AllinoneBalloon.Entities.Common.ResizeImageSize> size, string inputPath, string outputPath, int maxWidth, int maxHeight)
        {
            const int maxRetries = 3;
            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                try
                {
                    byte[] fileBytes = System.IO.File.ReadAllBytes(inputPath);
                    using (var originalImage = SixLabors.ImageSharp.Image.Load<Rgba32>(fileBytes))
                    {
                        int originalWidth = originalImage.Width;
                        int originalHeight = originalImage.Height;

                        // Check if resizing is needed
                        if (originalWidth <= maxWidth && originalHeight <= maxHeight)
                        {
                            originalImage.Save(outputPath, new PngEncoder());
                            size.Add(new AllinoneBalloon.Entities.Common.ResizeImageSize { Width = originalWidth, Height = originalHeight });
                            return size;
                        }

                        // Calculate the scaling factor
                        double widthRatio = (double)maxWidth / originalWidth;
                        double heightRatio = (double)maxHeight / originalHeight;
                        double scaleFactor = Math.Min(widthRatio, heightRatio);

                        int newWidth = (int)(originalWidth * scaleFactor);
                        int newHeight = (int)(originalHeight * scaleFactor);

                        // Resize with high quality bicubic resampler (same as HighQualityBicubic)
                        using (var resizedImage = originalImage.Clone(x => x.Resize(new ResizeOptions
                        {
                            Size = new SixLabors.ImageSharp.Size(newWidth, newHeight),
                            Sampler = KnownResamplers.Bicubic,
                            Mode = ResizeMode.Stretch
                        })))
                        {
                            resizedImage.Save(outputPath, new PngEncoder());
                        }
                        size.Add(new AllinoneBalloon.Entities.Common.ResizeImageSize { Width = newWidth, Height = newHeight });
                        return size;
                    }
                }
                catch (IOException) when (attempt < maxRetries - 1)
                {
                    System.Threading.Thread.Sleep(300 * (attempt + 1));
                }
            }
            return size;
        }
        public async Task<bool> RotateImagefile(string ImageFile, int angle)
        {
            return await Task.Run(() =>
            {
                if (angle != 0)
                {
                    using (var image = SixLabors.ImageSharp.Image.Load(ImageFile))
                    {
                        image.Mutate(x => x.Rotate(angle));
                        image.Save(ImageFile);
                    }
                }
                return true;
            });
        }

        public async Task<List<object>> GetBase64Images(string samplePath)
        {
            return await Task.Run(() =>
            {
                var imageFiles = Directory.GetFiles(samplePath, "*.*");
                var images = new List<object>();

                foreach (var file in imageFiles)
                {
                    var bytes = System.IO.File.ReadAllBytes(file);
                    var base64 = Convert.ToBase64String(bytes);
                    images.Add(new { fileName = Path.GetFileName(file), base64 });
                }
                return images;
            });
        }
        public async Task<List<string>> SaveImages(List<string> base64Images, string folderPath, string Fname)
        {
            var imagePaths = new List<string>();
            return await Task.Run(() =>
            {
                for (int i = 0; i < base64Images.Count; i++)
                {
                    var base64String = base64Images[i].Split(',')[1];
                    var bytes = Convert.FromBase64String(base64String);
                    var imagePath = System.IO.Path.Combine(folderPath, $"{Fname}_{i + 1}.png");
                    System.IO.File.WriteAllBytes(imagePath, bytes);
                    imagePaths.Add(imagePath);
                }
                try
                {
                    string outputPdfPath = System.IO.Path.Combine(folderPath, $"{Fname}.pdf");
                    // Create the PDF document
                    PdfDocument document = new PdfDocument();

                    foreach (var imagePath in imagePaths)
                    {
                        PdfPage page = document.AddPage();
                        page.Size = PdfSharp.PageSize.Letter;
                        page.Orientation = PdfSharp.PageOrientation.Landscape;
                        // Get graphics for the page
                        XGraphics gfx = XGraphics.FromPdfPage(page);

                        // Load the image
                        XImage image = XImage.FromFile(imagePath);

                        // Draw the image on the PDF page
                        // Get the image dimensions
                        double imgWidth = image.PixelWidth;
                        double imgHeight = image.PixelHeight;
                        XUnit pageheight = page.Height;
                        XUnit pagewidth = page.Width;
                        // Get the page dimensions
                        double pageWidth = Convert.ToDouble(pagewidth);
                        double pageHeight = Convert.ToDouble(pageheight);

                        // Calculate the scaling factor to fit the image within the page
                        double scalingFactor = Math.Min(pageWidth / imgWidth, pageHeight / imgHeight);

                        // Calculate new dimensions based on scaling
                        double newImgWidth = imgWidth * scalingFactor;
                        double newImgHeight = imgHeight * scalingFactor;

                        // Center the image on the page
                        double x = (pageWidth - newImgWidth) / 2;
                        double y = (pageHeight - newImgHeight) / 2;

                        // Draw the resized image on the PDF page
                        gfx.DrawImage(image, x, y, newImgWidth, newImgHeight);
                    }
                    document.Save(outputPdfPath);
                    document.Close();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Exception: {ex.Message}");
                }
                return imagePaths;
            });
        }
        public string createPlaceholderImage(string sourceDir, string text)
        {
            int width = 400;
            int height = 400;
            string path = sourceDir + $"{text}.png";
            using (var image = new Image<Rgba32>(width, height, SixLabors.ImageSharp.Color.White))
            {
                var font = SixLabors.Fonts.SystemFonts.CreateFont("Arial", 20);
                var textOptions = new SixLabors.ImageSharp.Drawing.Processing.RichTextOptions(font)
                {
                    HorizontalAlignment = SixLabors.Fonts.HorizontalAlignment.Center,
                    VerticalAlignment = SixLabors.Fonts.VerticalAlignment.Center,
                    Origin = new SixLabors.ImageSharp.PointF(width / 2f, height / 2f)
                };
                image.Mutate(x => x.DrawText(textOptions, text, SixLabors.ImageSharp.Color.Black));
                image.Save(path, new PngEncoder());
            }
            return path;
        }

        #endregion
    }
}

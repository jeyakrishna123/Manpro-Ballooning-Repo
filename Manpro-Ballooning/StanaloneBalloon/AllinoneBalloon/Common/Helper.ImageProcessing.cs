using PdfSharp.Drawing;
using PdfSharp.Pdf;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;
using System.Drawing;
using System.Drawing.Imaging;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Image Process
        public MemoryStream imageToByteArray(System.Drawing.Image imageIn, ErrorLog objerr)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                try
                {
                    imageIn.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
                }
                catch (Exception ex)
                {
                    objerr.WriteErrorToText(ex);
                }
                return ms;
            }
        }
        public string scaleImage(List<AllinoneBalloon.Entities.Common.PartialImage> partial_image, string s, int itemview, bool isFlag, ErrorLog objerr)
        {
            int maximum = 32767;
            string resize = "false";
            try
            {
                using (FileStream inputStream = System.IO.File.OpenRead(s))
                {
                    using (SixLabors.ImageSharp.Image image = SixLabors.ImageSharp.Image.Load(s))
                    {
                        int originalWidth = image.Width;
                        int originalHeight = image.Height;
                        int newWidth, newHeight;
                        if (image.Width > maximum || image.Height > maximum)
                        {
                            resize = "true";
                            if (originalWidth > originalHeight)
                            {
                                // Landscape orientation
                                newWidth = maximum;
                                newHeight = (int)((double)originalHeight / originalWidth * maximum);
                            }
                            else
                            {
                                // Portrait or square orientation
                                newHeight = maximum;
                                newWidth = (int)((double)originalWidth / originalHeight * maximum);
                            }
                            using (Image<Rgba32> rgbaImage = image.CloneAs<Rgba32>())
                            {
                                // Calculate the scaling factor for resizing
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
                                // Resize the image                              

                                using (Image<Rgba32> resizedImage = rgbaImage.Clone(x => x.Resize(scaledWidth, scaledHeight)))
                                {
                                    // Save the resized image to the output path
                                    image.Dispose();
                                    inputStream.Dispose();
                                    resizedImage.Save(s); // Change the format if needed
                                }
                            }
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
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
            }
            return resize;
        }

        public Bitmap CropImage(Bitmap img, System.Drawing.Rectangle cropArea)
        {
            Bitmap croppedImage = img.Clone(cropArea, img.PixelFormat);
            return croppedImage;
        }
        public Bitmap ChangeResolution(Bitmap img, float newDpi)
        {
            Bitmap newImage = new Bitmap(img.Width, img.Height);
            newImage.SetResolution(newDpi, newDpi);
            using (Graphics g = Graphics.FromImage(newImage))
            {
                g.DrawImage(img, 0, 0);
            }
            return newImage;
        }

        public string ChangeResolutionSmall(string inputPath, string outputPath, float targetDpi)
        {
            using (Bitmap original = new Bitmap(inputPath))
            {
                float scaleFactor = targetDpi / original.HorizontalResolution;

                int newWidth = (int)(original.Width * scaleFactor);
                int newHeight = (int)(original.Height * scaleFactor);

                using (Bitmap resized = new Bitmap(original.Width, original.Height))
                {
                    resized.SetResolution(targetDpi, targetDpi);

                    using (Graphics graphics = Graphics.FromImage(resized))
                    {
                        graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                        graphics.DrawImage(original, 0, 0, original.Width, original.Height);
                    }

                    resized.Save(outputPath, System.Drawing.Imaging.ImageFormat.Png);
                }
            }
            return outputPath;
        }

        public List<AllinoneBalloon.Entities.Common.ResizeImageSize> ResizeImage(List<AllinoneBalloon.Entities.Common.ResizeImageSize> size, string inputPath, string outputPath, int maxWidth, int maxHeight)
        {
            // List<AllinoneBalloon.Entities.Common.ResizeImageSize> size = new List<AllinoneBalloon.Entities.Common.ResizeImageSize>();
            using (System.Drawing.Image originalImage = System.Drawing.Image.FromFile(inputPath))
            {
                // Get original dimensions
                int originalWidth = originalImage.Width;
                int originalHeight = originalImage.Height;

                // Check if resizing is needed
                if (originalWidth <= maxWidth && originalHeight <= maxHeight)
                {
                    // Save as PNG for lossless quality (critical for OCR accuracy)
                    originalImage.Save(outputPath, System.Drawing.Imaging.ImageFormat.Png);
                    size.Add(new AllinoneBalloon.Entities.Common.ResizeImageSize { Width = originalWidth, Height = originalHeight });
                    return size;
                }

                // Calculate the scaling factor
                double widthRatio = (double)maxWidth / originalWidth;
                double heightRatio = (double)maxHeight / originalHeight;
                double scaleFactor = Math.Min(widthRatio, heightRatio);

                // Calculate the new dimensions
                int newWidth = (int)(originalWidth * scaleFactor);
                int newHeight = (int)(originalHeight * scaleFactor);

                // Create a new bitmap with the new dimensions
                using (Bitmap resizedImage = new Bitmap(newWidth, newHeight))
                {
                    // Draw the resized image
                    using (Graphics graphics = Graphics.FromImage(resizedImage))
                    {
                        graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
                        graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                        graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;

                        graphics.DrawImage(originalImage, 0, 0, newWidth, newHeight);
                    }

                    // Save as PNG for lossless quality (critical for OCR accuracy)
                    resizedImage.Save(outputPath, System.Drawing.Imaging.ImageFormat.Png);
                }
                size.Add(new AllinoneBalloon.Entities.Common.ResizeImageSize { Width = newWidth, Height = newHeight });
                return size;
            }
        }
        public async Task<bool> RotateImagefile(string ImageFile, int angle)
        {
            return await Task.Run(() =>
            {
                if (angle != 0)
                {
                    System.Drawing.Image orimage = System.Drawing.Image.FromFile(ImageFile);
                    RotateFlipType r;
                    switch (angle)
                    {
                        case 90:
                            r = RotateFlipType.Rotate90FlipNone;
                            orimage.RotateFlip(r);

                            break;
                        case 180:
                            r = RotateFlipType.Rotate180FlipNone;
                            orimage.RotateFlip(r);
                            break;
                        case 270:
                            r = RotateFlipType.Rotate270FlipNone;
                            orimage.RotateFlip(r);
                            break;
                    }
                    orimage.Save(ImageFile);
                    orimage.Dispose();

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
            using (Bitmap bitmap = new Bitmap(width, height))
            {
                using (Graphics g = Graphics.FromImage(bitmap))
                {
                    g.Clear(System.Drawing.Color.White);
                    using (System.Drawing.Font font = new System.Drawing.Font("Arial", 20))
                    {
                        System.Drawing.SizeF textSize = g.MeasureString(text, font);
                        g.DrawString(text, font, Brushes.Black, (width - textSize.Width) / 2, (height - textSize.Height) / 2);
                    }
                }
                bitmap.Save(sourceDir + $"{text}.png", System.Drawing.Imaging.ImageFormat.Png);
            }
            return path;
        }

        #endregion
    }
}

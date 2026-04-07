using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;

namespace AllinoneBalloon.Common
{

    public class ImageIOHelper
    {


        /// <summary>
        /// Get image(s) from file
        /// </summary>
        /// <param name="imageFile">file name</param>
        /// <returns>list of images</returns>
        public static IList<Image> GetImageList(FileInfo imageFile)
        {
            string workingTiffFileName = null;

            Image image = null;

            try
            {
                using (var bmpTemp = new Bitmap(imageFile.FullName))
                {
                    image = new Bitmap(bmpTemp);
                }
                // read in the image
                //image = Image.FromFile(imageFile.FullName);

                IList<Image> images = new List<Image>();

                int count;
                if (image.RawFormat.Equals(ImageFormat.Gif))
                {
                    count = image.GetFrameCount(FrameDimension.Time);
                }
                else
                {
                    count = image.GetFrameCount(FrameDimension.Page);
                }

                for (int i = 0; i < count; i++)
                {
                    // save each frame to a bytestream
                    using (MemoryStream byteStream = new MemoryStream())
                    {
                        image.SelectActiveFrame(FrameDimension.Page, i);
                        image.Save(byteStream, ImageFormat.Png);

                        // and then create a new Image from it
                        images.Add(Image.FromStream(byteStream));
                    }
                }
                return images;
            }
            catch (OutOfMemoryException e)
            {
                throw new ApplicationException(e.Message, e);
            }
            catch (System.Runtime.InteropServices.ExternalException e)
            {
                throw new ApplicationException(e.Message + "\nIt might have run out of memory due to handling too many images or too large a file.", e);
            }
            finally
            {
                if (image != null)
                {
                    image.Dispose();
                }

                if (workingTiffFileName != null && File.Exists(workingTiffFileName))
                {
                    File.Delete(workingTiffFileName);
                }
            }
        }

        /// <summary>
        /// Merge multiple images into one TIFF image.
        /// </summary>
        /// <param name="inputImages"></param>
        /// <param name="outputTiff"></param>
        public static void MergeTiff(string[] inputImages, string outputTiff)
        {
            //get the codec for tiff files
            ImageCodecInfo info = null;

            foreach (ImageCodecInfo ice in ImageCodecInfo.GetImageEncoders())
            {
                if (ice.MimeType == "image/tiff")
                {
                    info = ice;
                }
            }

            //use the save encoder
            System.Drawing.Imaging.Encoder enc = System.Drawing.Imaging.Encoder.SaveFlag;
            EncoderParameters ep = new EncoderParameters(2);
            ep.Param[0] = new EncoderParameter(enc, (long)EncoderValue.MultiFrame);
            System.Drawing.Imaging.Encoder enc1 = System.Drawing.Imaging.Encoder.Compression;
            ep.Param[1] = new EncoderParameter(enc1, (long)EncoderValue.CompressionNone);
            Bitmap pages = null;

            try
            {
                int frame = 0;

                foreach (string inputImage in inputImages)
                {
                    if (frame == 0)
                    {
                        pages = (Bitmap)Image.FromFile(inputImage);
                        //save the first frame
                        pages.Save(outputTiff, info, ep);
                    }
                    else
                    {
                        //save the intermediate frames
                        ep.Param[0] = new EncoderParameter(enc, (long)EncoderValue.FrameDimensionPage);
                        Bitmap bm = null;
                        try
                        {
                            bm = (Bitmap)Image.FromFile(inputImage);
                            pages.SaveAdd(bm, ep);
                        }
                        catch (System.Runtime.InteropServices.ExternalException e)
                        {
                            throw new ApplicationException(e.Message + "\nIt might have run out of memory due to handling too many images or too large a file.", e);
                        }
                        finally
                        {
                            if (bm != null)
                            {
                                bm.Dispose();
                            }
                        }
                    }

                    if (frame == inputImages.Length - 1)
                    {
                        //flush and close
                        ep.Param[0] = new EncoderParameter(enc, (long)EncoderValue.Flush);
                        pages.SaveAdd(ep);
                    }
                    frame++;
                }
            }
            finally
            {
                if (pages != null)
                {
                    pages.Dispose();
                }
            }
        }
    }
}

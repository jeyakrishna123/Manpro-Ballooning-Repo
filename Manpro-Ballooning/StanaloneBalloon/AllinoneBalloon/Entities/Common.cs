using AllinoneBalloon.Models;
using System.Diagnostics.CodeAnalysis;

namespace AllinoneBalloon.Entities
{
    #region class 
    public class Common
    {
        #region KeyValuesClass
        public class KeyValuesClass
        {
            private string a_key;
            private string a_value;
            public KeyValuesClass(string a_key, string a_value)
            {
                this.a_key = a_key;
                this.a_value = a_value;
            }
            public string Key
            {
                get { return a_key; }
                set { a_key = value; }
            }
            public string Value
            {
                get { return a_value; }
                set { a_value = value; }
            }
        }
        #endregion

        #region SearchForm
        public class SearchForm
        {
            public string drawingNo { get; set; }
            public string revNo { get; set; }
            public string baseUrl { get; set; }
            public string sessionUserId { get; set; }
        }
        #endregion

        #region AutoBalloon
        public class AutoBalloon
        {
            public string CdrawingNo { get; set; }
            public double aspectRatio { get; set; }
            public double bgImgW { get; set; }
            public double bgImgH { get; set; }
            public double bgImgX { get; set; }
            public double bgImgY { get; set; }
            public string selectedRegion { get; set; }
            public List<OCRResults> drawingRegions { get; set; }
            public List<OCRResults> balloonRegions { get; set; }
            public List<OCRResults> originalRegions { get; set; }
            public List<OCRResults> annotation { get; set; }
            public string rotate { get; set; }
            public int bgImgRotation { get; set; }
            public string drawingDetails { get; set; }
            public int ItemView { get; set; }
            public string CrevNo { get; set; }
            public string routingNo { get; set; }
            public int Quantity { get; set; }
            public int pageNo { get; set; }
            public int totalPage { get; set; }
            public List<Origin> origin { get; set; }

            public AllinoneBalloon.Models.Settings Settings { get; set; }
            public bool accurateGDT { get; set; }
        }
        public class Origin
        {
            public int count { get; set; }
            public int fullHeight { get; set; }
            public int fullWidth { get; set; }
            public int item { get; set; }
            public int x { get; set; }
            public int y { get; set; }
            public int height { get; set; }
            public int width { get; set; }
            public string src { get; set; }
            public float scale { get; set; }
        }
        #endregion

        #region ResetBalloon
        public class ResetBalloon
        {
            public string CdrawingNo { get; set; }
            public string CrevNo { get; set; }
            public string Routerno { get; set; }
            public int pageNo { get; set; }
            public int totalPage { get; set; }
            public long GroupId { get; set; }
            public List<OCRResults> originalRegions { get; set; }
        }
        #endregion

        #region CreateBalloon
        public class CreateBalloon
        {
            public string drawingNo { get; set; }
            public string revNo { get; set; }
            public int pageNo { get; set; }
            public int totalPage { get; set; }
            public List<OCRResults> ballonDetails { get; set; }
            public List<selectedcc> controllCopy { get; set; }
            public string rotate { get; set; }
            public string Routerno { get; set; }
            public string username { get; set; }
            public int MaterialQty { get; set; }
            public string session_UserId { get; set; }
            public long GroupId { get; set; }
            public List<string> convertStagesToImages { get; set; }
            public AllinoneBalloon.Models.Settings Settings { get; set; }
        }
        #endregion

        #region DeleteBalloon
        public class DeleteBalloon
        {
            public string drawingNo { get; set; }
            public string revNo { get; set; }
            public string Routerno { get; set; }
            public string pageNo { get; set; }
            public string totalPage { get; set; }
            public List<long> deleteItem { get; set; }
            public long GroupId { get; set; }
        }
        #endregion

        #region RotateBalloon
        public class RotateBalloon
        {
            public string drawingNo { get; set; }
            public string revNo { get; set; }
            public string pageNo { get; set; }
            public string totalPage { get; set; }
            public string drawingDetails { get; set; }
            public int ItemView { get; set; }
            public int rotation { get; set; }
            public string sessionUserId { get; set; }
        }
        #endregion

        #region OCRResults
        public class OCRResults
        {
            public long BaloonDrwID { get; set; }
            public string BaloonDrwFileID { get; set; }
            public string ProductionOrderNumber { get; set; }
            public string Part_Revision { get; set; }
            public int Page_No { get; set; }
            public string DrawingNumber { get; set; }
            public string Revision { get; set; }
            public string Balloon { get; set; }
            public string Spec { get; set; }
            public string Nominal { get; set; }
            public string Minimum { get; set; }
            public string Maximum { get; set; }
            public string MeasuredBy { get; set; }
            [MaybeNull]
            public DateTime MeasuredOn { get; set; }
            public int Measure_X_Axis { get; set; }
            public int Measure_Y_Axis { get; set; }
            public int Circle_X_Axis { get; set; }
            public int Circle_Y_Axis { get; set; }
            public int Circle_Width { get; set; }
            public int Circle_Height { get; set; }
            [MaybeNull]
            public int Balloon_Thickness { get; set; }
            [MaybeNull]
            public int Balloon_Text_FontSize { get; set; }
            [MaybeNull]
            public string BalloonShape { get; set; }
            public decimal ZoomFactor { get; set; }
            public int Crop_X_Axis { get; set; }
            public int Crop_Y_Axis { get; set; }
            public int Crop_Width { get; set; }
            public int Crop_Height { get; set; }
            public string Type { get; set; }
            public string SubType { get; set; }
            public string Unit { get; set; }
            public string Serial_No { get; set; }
            public long Quantity { get; set; }
            public string ToleranceType { get; set; }
            public string PlusTolerance { get; set; }
            public string MinusTolerance { get; set; }
            public string MaxTolerance { get; set; }
            public string MinTolerance { get; set; }
            public byte[] CropImage { get; set; }
            public string CreatedBy { get; set; }
            [MaybeNull]
            public DateTime CreatedDate { get; set; }
            public string ModifiedBy { get; set; }
            [MaybeNull]
            public DateTime ModifiedDate { get; set; }
            [MaybeNull]
            public bool? IsCritical { get; set; }

            public string Actual { get; set; }
            public string Decision { get; set; }
            public string BalloonColor { get; set; }
            public string Characteristics { get; set; }
            public bool isSaved { get; set; }
            public bool convert { get; set; }
            public string converted { get; set; }
            public List<Dictionary<string, Dictionary<string, string>>> ActualDecision { get; set; }
            public string id { get; set; }
            public int x { get; set; }
            public int y { get; set; }
            public int width { get; set; }
            public int height { get; set; }
            public string selectedRegion { get; set; }
            public bool isballooned { get; set; }


        }
        #endregion

        #region Specification
        public class Specification
        {
            public string spec { get; set; }
            public List<OCRResults> originalRegions { get; set; }

            public string plusTolerance { get; set; }
            public string toleranceType { get; set; }

            public string minusTolerance { get; set; }
            public string maximum { get; set; }
            public string minimum { get; set; }
        }
        #endregion

        #region PartialImage
        public class PartialImage
        {
            public int item { get; set; }
            public int count { get; set; }
            public int x { get; set; }
            public int y { get; set; }
            public int width { get; set; }
            public int fullWidth { get; set; }
            public int height { get; set; }
            public int fullHeight { get; set; }
            public string src { get; set; }
            public float scale { get; set; }
        }
        #endregion

        #region Circle_AutoBalloon
        public class Circle_AutoBalloon
        {
            public SixLabors.ImageSharp.RectangleF Bounds { get; set; }
        }
        #endregion

        #region AutoBalloon_OCR
        public class AutoBalloon_OCR
        {
            public int X_Axis { get; set; }
            public int Y_Axis { get; set; }
            public int Width { get; set; }
            public int Height { get; set; }
            public string Ocr_Text { get; set; }
            public int Qty { get; set; }
            public int No { get; set; }
            public int parent { get; set; }
            public bool subballoon { get; set; }
        }
        #endregion

        #region AG_OCR
        public class AG_OCR
        {

            public int GroupID { get; set; }
            public int cx { get; set; }
            public int nx { get; set; }
            public int cy { get; set; }
            public string text { get; set; }
            public int x { get; set; }
            public int y { get; set; }
            public int w { get; set; }
            public int h { get; set; }
            public override string ToString()
            {
                return $"Text: {text}, X: {x}, Y: {y}, Width: {w}, Height: {h}, GroupID: {GroupID}";
            }
            public string TrimText()
            {
                text = text.Trim();
                return text;
            }

        }
        public class AGF_OCR
        {

            public int GroupID { get; set; }
            public int parentID { get; set; }
            public string text { get; set; }
            public int x { get; set; }
            public int y { get; set; }
            public int w { get; set; }
            public int h { get; set; }

        }
        #endregion

        #region WordInfo
        class WordInfo
        {
            public string Text { get; set; }
            public OpenCvSharp.Rect BoundingBox { get; set; }
            public int Id { get; set; }
        }
        #endregion

        #region Lov class
        public class ToleranceType
        {
            public int ID { get; set; }
            public string Name { get; set; }
        }
        public class MeasureType
        {
            public int type_ID { get; set; }
            public string type_Name { get; set; }
        }
        public class MeasureSubType
        {
            public int subType_ID { get; set; }
            public string subType_Name { get; set; }
        }
        public class UnitType
        {
            public int ID { get; set; }
            public string Units { get; set; }
        }
        public class CharacteristicsType
        {
            public int ID { get; set; }
            public string Characteristics { get; set; }
        }
        public class TemplateType
        {
            public int id { get; set; }
            public string name { get; set; }
        }
        #endregion

        public class RectSize { 
            public int x { get; set; }
            public int y { get; set; }
            public int w { get; set; }
            public int h { get; set; }
        }

        public class Projects
        {
            public string DrawingNumber { get; set; }
            public string Revision { get; set; }
            public string Image { get; set; }

            public bool isClosed { get; set; }
            public long BaloonDrwID { get; set; }
            public DateTime? CreatedDate { get; set; }
            public List<TblBaloonDrawingHeader> ProjectItem { get; set; }
        }


        public class ResizeImageSize
        {
            public int Width { get; set; }
            public int Height { get; set; }
        }
        public class GenerateBalloon
        {
            public string routingNo { get; set; }
            public byte[] ImageFile { get; set; }
            public string drawingNo { get; set; }
            public string revNo { get; set; }
            public int pageNo { get; set; }
            public string desFile { get; set; }
            public string Balloon { get; set; }
            public string BalloonShape { get; set; }
            public string ocrtext { get; set; }
            public string Nominal { get; set; }
            public string Min { get; set; }
            public string Max { get; set; }
            public AutoBalloon searchForm { get; set; }
            public long ocr_X { get; set; }
            public long ocr_Y { get; set; }
            public long ocr_W { get; set; }
            public long ocr_H { get; set; }
            public string Type { get; set; }
            public string SubType { get; set; }
            public string Unit { get; set; }
            public int Num_Qty { get; set; }
            public string ToleranceType { get; set; }
            public string PlusTolerance { get; set; }
            public string MinusTolerance { get; set; }
            public bool isplmin { get; set; }
            public string isplmin_mintol { get; set; }
            public string isplmin_pltol { get; set; }
            public string isplmin_spec { get; set; }
            public bool convert { get; set; }
            public string converted { get; set; }
        }
        public class Item
        {
            public int X { get; set; }
            public int Y { get; set; }
            public int W { get; set; }
            public int H { get; set; }
            public string Text { get; set; }
            public bool isBallooned { get; set; }
            public override string ToString()
            {
                return $"Text: {Text}, X: {X}, Y: {Y}, Width: {W}, Height: {H}, isBallooned: {isBallooned}";
            }
        }
        public class ActiveItems
        {
            public int X { get; set; }
            public int Y { get; set; }
            public int W { get; set; }
            public int H { get; set; }
            public int NH { get; set; }
            public int GroupID { get; set; }
            public string Text { get; set; }
            public bool isBallooned { get; set; }
            public override string ToString()
            {
                return $"Text: {Text}, X: {X}, Y: {Y}, Width: {W}, Height: {H}, NH: {NH}, GroupID: {GroupID}";
            }
        }
        public class Rect
        {
            public string Text { get; set; }
            public int X { get; set; }
            public int Y { get; set; }
            public int Width { get; set; }
            public int Height { get; set; }

            public override string ToString()
            {
                return $"Text: {Text}, X: {X}, Y: {Y}, Width: {Width}, Height: {Height}";
            }
        }
        // Custom comparer for Rect objects
        public class RectSequenceEqualComparer : IEqualityComparer<Rect>
        {
            public bool Equals(Rect x, Rect y)
            {
                return x.Text == y.Text && x.X == y.X && x.Y == y.Y &&
                       x.Width == y.Width && x.Height == y.Height;
            }

            public int GetHashCode(Rect obj)
            {
                return HashCode.Combine(obj.Text, obj.X, obj.Y, obj.Width, obj.Height);
            }
        }

    }
    #endregion

}

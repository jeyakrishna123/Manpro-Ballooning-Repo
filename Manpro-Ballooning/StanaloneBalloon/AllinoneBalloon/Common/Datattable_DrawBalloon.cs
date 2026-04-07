using System.Data;

namespace AllinoneBalloon.Common
{
    public class Datattable_DrawBalloon
    {
        ErrorLog objErrorLog = new ErrorLog();
        public string ErrorlogPath = string.Empty;
        //Store Values in DataTable 
        public DataTable InitializeDrawBalloonInline()
        {
            DataTable dtDrawBalloonInline = new DataTable();
            try
            {
                //dtDrawBalloonInline.Columns.Add("DrawLineID", typeof(Int64));
                dtDrawBalloonInline.Columns.Add("BaloonDrwID", typeof(long));
                dtDrawBalloonInline.Columns.Add("BaloonDrwFileID", typeof(string));
                dtDrawBalloonInline.Columns.Add("ProductionOrderNumber", typeof(string));
                dtDrawBalloonInline.Columns.Add("Part_Revision", typeof(string));
                dtDrawBalloonInline.Columns.Add("Page_No", typeof(int));
                dtDrawBalloonInline.Columns.Add("DrawingNumber", typeof(string));
                dtDrawBalloonInline.Columns.Add("Revision", typeof(string));
                dtDrawBalloonInline.Columns.Add("Balloon", typeof(string));
                dtDrawBalloonInline.Columns.Add("Spec", typeof(string));
                dtDrawBalloonInline.Columns.Add("Nominal", typeof(string));
                dtDrawBalloonInline.Columns.Add("Minimum", typeof(string));
                dtDrawBalloonInline.Columns.Add("Maximum", typeof(string));
                dtDrawBalloonInline.Columns.Add("MeasuredBy", typeof(string));
                dtDrawBalloonInline.Columns.Add("MeasuredOn", typeof(DateTime));
                dtDrawBalloonInline.Columns["MeasuredOn"].AllowDBNull = true;
                dtDrawBalloonInline.Columns.Add("Circle_X_Axis", typeof(int));
                dtDrawBalloonInline.Columns.Add("Circle_Y_Axis", typeof(int));
                dtDrawBalloonInline.Columns.Add("Circle_Width", typeof(int));
                dtDrawBalloonInline.Columns.Add("Circle_Height", typeof(int));
                dtDrawBalloonInline.Columns.Add("Balloon_Thickness", typeof(decimal));
                dtDrawBalloonInline.Columns.Add("Balloon_Text_FontSize", typeof(decimal));
                dtDrawBalloonInline.Columns.Add("ZoomFactor", typeof(decimal));
                dtDrawBalloonInline.Columns.Add("Crop_X_Axis", typeof(int));
                dtDrawBalloonInline.Columns.Add("Crop_Y_Axis", typeof(int));
                dtDrawBalloonInline.Columns.Add("Crop_Width", typeof(int));
                dtDrawBalloonInline.Columns.Add("Crop_Height", typeof(int));
                dtDrawBalloonInline.Columns.Add("Type", typeof(string));
                dtDrawBalloonInline.Columns.Add("SubType", typeof(string));
                dtDrawBalloonInline.Columns.Add("Unit", typeof(string));
                dtDrawBalloonInline.Columns.Add("Quantity", typeof(int));
                dtDrawBalloonInline.Columns.Add("ToleranceType", typeof(string));
                dtDrawBalloonInline.Columns.Add("PlusTolerance", typeof(string));
                dtDrawBalloonInline.Columns.Add("MinusTolerance", typeof(string));
                dtDrawBalloonInline.Columns.Add("MaxTolerance", typeof(string));
                dtDrawBalloonInline.Columns.Add("MinTolerance", typeof(string));
                dtDrawBalloonInline.Columns.Add("CropImage", typeof(byte[]));
                dtDrawBalloonInline.Columns.Add("CreatedBy", typeof(string));
                dtDrawBalloonInline.Columns.Add("CreatedDate", typeof(DateTime));
                dtDrawBalloonInline.Columns.Add("ModifiedBy", typeof(string));
                dtDrawBalloonInline.Columns.Add("ModifiedDate", typeof(DateTime));
            }
            catch (Exception ex)
            {
                objErrorLog.WriteErrorToText(ex);
            }

            return dtDrawBalloonInline;
        }
    }
}

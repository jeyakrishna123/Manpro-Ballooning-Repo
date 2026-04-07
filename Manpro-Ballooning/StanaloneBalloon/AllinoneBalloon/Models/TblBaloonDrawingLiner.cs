using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AllinoneBalloon.Models;

public partial class TblBaloonDrawingLiner
{
    [Key]
    public long DrawLineID { get; set; }

    public long? BaloonDrwID { get; set; }

    public string BaloonDrwFileID { get; set; } = string.Empty;

    public string ProductionOrderNumber { get; set; } = string.Empty;

    public string Part_Revision { get; set; } = string.Empty;

    public int? Page_No { get; set; }

    public string DrawingNumber { get; set; } = string.Empty;

    public string Revision { get; set; } = string.Empty;

    public string Balloon { get; set; } = string.Empty;

    public string Spec { get; set; } = string.Empty;

    public string Nominal { get; set; } = string.Empty;

    public string Minimum { get; set; } = string.Empty;

    public string Maximum { get; set; } = string.Empty;

    public string MeasuredBy { get; set; } = string.Empty;

    public DateTime? MeasuredOn { get; set; }

    public int? Measure_X_Axis { get; set; }
    public int? Measure_Y_Axis { get; set; }
    public int? Circle_X_Axis { get; set; }

    public int? Circle_Y_Axis { get; set; }

    public int? Circle_Width { get; set; }

    public int? Circle_Height { get; set; }

    public int? Balloon_Thickness { get; set; }

    public int? Balloon_Text_FontSize { get; set; }

    public string BalloonShape { get; set; }
    public decimal? ZoomFactor { get; set; }

    public int? Crop_X_Axis { get; set; }

    public int? Crop_Y_Axis { get; set; }

    public int? Crop_Width { get; set; }

    public int? Crop_Height { get; set; }

    public string Type { get; set; } = string.Empty;

    public string SubType { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;
    public string Serial_No { get; set; } = string.Empty;
    public string Characteristics { get; set; } = string.Empty;
    
    public long? Quantity { get; set; }

    public string ToleranceType { get; set; } = string.Empty;

    public string PlusTolerance { get; set; } = string.Empty;

    public string MinusTolerance { get; set; } = string.Empty;

    public string MaxTolerance { get; set; } = string.Empty;

    public string MinTolerance { get; set; } = string.Empty;

    public byte[] CropImage { get; set; }

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? CreatedDate { get; set; }

    public string ModifiedBy { get; set; } = string.Empty;

    public DateTime? ModifiedDate { get; set; }

    public bool? IsCritical { get; set; }
    public bool? convert { get; set; }
    public string converted { get; set; } = string.Empty;
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AllinoneBalloon.Models;

public partial class TblBaloonDrawingHeader
{
    [Key]
    public long BaloonDrwID { get; set; }

    public string ProductionOrderNumber { get; set; } = string.Empty;

    public string DrawingNumber { get; set; } = string.Empty;
    public string Quantity { get; set; } = string.Empty; 
    public int? Total_Page_No { get; set; }

    public string Revision { get; set; } = string.Empty;

    public string Part_Revision { get; set; } = string.Empty;

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? CreatedDate { get; set; }

    public string ModifiedBy { get; set; } = string.Empty;

    public DateTime? ModifiedDate { get; set; }

    public string RotateProperties { get; set; } = string.Empty;
    public long GroupId { get; set; }
    public bool isClosed { get; set; }
    public string FilePath { get; set; } = string.Empty;
}


public class CreateHeader
{
    public string DrawingNo { get; set; } = string.Empty;
    public string RevisionNo { get; set; } = string.Empty;
    public string Routerno { get; set; } = string.Empty;
    public string Quantity { get; set; } = string.Empty;
    public int? Total { get; set; }
    public string rotate { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Session { get; set; } = string.Empty;
    public long GroupId { get; set; }
    public bool isClosed { get; set; }
    public string FilePath { get; set; } = string.Empty;

}
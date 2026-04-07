using System;
using System.Collections.Generic;

namespace AllinoneBalloon.Models;
public partial class TblDimensionInputLiner
{
    public long DrawLineId { get; set; }

    public long? BaloonDrwID { get; set; }

    public int? Page_No { get; set; }

    public string Balloon { get; set; }

    public string Actual_OP { get; set; }
    public string Actual_LI { get; set; }
    public string Actual_FI { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

}

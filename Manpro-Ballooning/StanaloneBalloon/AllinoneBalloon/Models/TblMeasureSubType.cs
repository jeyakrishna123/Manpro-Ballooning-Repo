using System;
using System.Collections.Generic;

namespace AllinoneBalloon.Models;

public partial class TblMeasureSubType
{
    public int SubType_ID { get; set; }

    public int? TypeId { get; set; }

    public string SubTypeName { get; set; }

    public string CreatedBy { get; set; }

    public DateTime? CreatedDate { get; set; }

    public string ModifiedBy { get; set; }

    public DateTime? ModifiedDate { get; set; }
}

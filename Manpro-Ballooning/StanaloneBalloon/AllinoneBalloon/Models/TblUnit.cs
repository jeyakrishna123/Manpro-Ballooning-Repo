using System;
using System.Collections.Generic;

namespace AllinoneBalloon.Models;

public partial class TblUnit
{
    public int ID { get; set; }

    public string Units { get; set; }

}

public partial class TblUnitInstrument
{
    public int ID { get; set; }

    public int Unit { get; set; }
    public string Name { get; set; }
    public bool? Status { get; set; }
    public string CreatedBy { get; set; }

    public DateTime? CreatedDate { get; set; }

    public string ModifiedBy { get; set; }

    public DateTime? ModifiedDate { get; set; }

}

public class UniqueNumber
{
    public int ID { get; set; }
    public int Number { get; set; }
}


public partial class TblToleranceType
{
    public int ID { get; set; }

    public string TypeName { get; set; }

    public string CreatedBy { get; set; }

    public DateTime? CreatedDate { get; set; }

    public string ModifiedBy { get; set; }

    public DateTime? ModifiedDate { get; set; }
}


public class TblTemplate
{
    public int ID { get; set; }
    public string Name { get; set; }
    public string File { get; set; }
    public string group_name { get; set; }
}
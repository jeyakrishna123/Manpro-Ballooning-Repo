using System;
using System.Collections.Generic;

namespace AllinoneBalloon.Models;

public partial class TblDbconfiguration
{
    public int Id { get; set; }

    public string Datasource { get; set; }

    public string Dbname { get; set; }

    public string Authendication { get; set; }

    public string UserId { get; set; }

    public string Password { get; set; }

    public string Environment { get; set; }

    public string CreatedBy { get; set; }

    public DateTime? CreatedDate { get; set; }

    public string ModifiedBy { get; set; }

    public DateTime? ModifiedDate { get; set; }
}

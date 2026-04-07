using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AllinoneBalloon.Models;

public partial class TblConfiguration
{
    [Key]
    public int Id { get; set; }

    public string Key { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Value { get; set; } = string.Empty;

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? CreatedDate { get; set; }

    public string ModifiedBy { get; set; } = string.Empty;

    public DateTime? ModifiedDate { get; set; }
}

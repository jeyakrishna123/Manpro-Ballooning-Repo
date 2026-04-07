using System;
using System.Collections.Generic;

namespace AllinoneBalloon.Models;

public partial class TblBaloonDrawingSetting
{

    public long SettingsID { get; set; }

    public long? BaloonDrwId { get; set; }

    public string DefaultBalloon { get; set; }
    public string ErrorBalloon { get; set; }
    public string SuccessBalloon { get; set; }
    
    public string BalloonShape { get; set; }
    public string MinMaxOneDigit { get; set; }
    public string MinMaxTwoDigit { get; set; }
    public string MinMaxThreeDigit { get; set; }
    public string MinMaxFourDigit { get; set; }
    public string MinMaxAngles { get; set; }
    public Boolean convert { get; set; }
    public string fontScale { get; set; }


}

public class Settings
{
    public string DefaultBalloon { get; set; }
    public string ErrorBalloon { get; set; }
    public string SuccessBalloon { get; set; }

    public string BalloonShape { get; set; }
    public string MinMaxOneDigit { get; set; }
    public string MinMaxTwoDigit { get; set; }
    public string MinMaxThreeDigit { get; set; }
    public string MinMaxFourDigit { get; set; }
    public string MinMaxAngles { get; set; }
    public string Routerno { get; set; }
    public string DrawingNo { get; set; }
    public string RevNo { get; set; }
    public int MaterialQty { get; set; }
    public bool convert { get; set; }
    public string fontScale { get; set; }
}



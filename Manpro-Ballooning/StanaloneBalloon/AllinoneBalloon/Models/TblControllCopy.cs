namespace AllinoneBalloon.Models
{
    public class TblControllCopy
    {
        public long ControlledID { get; set; }
        public long? BaloonDrwID { get; set; }
        public string drawingNo { get; set; }
        public string revNo { get; set; }
        public string routerno { get; set; }
        public int? pageNo { get; set; }
        public string origin { get; set; }
        public bool textGroupPlaced { get; set; }
    }

    public class selectedcc
    {
        public bool textGroupPlaced { get; set; }
        public string drawingNo { get; set; }
        public string revNo { get; set; }
        public string routerno { get; set; }
        public int? pageNo { get; set; }
        public Dictionary<string, string> origin { get; set; }
    }
}

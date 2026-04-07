namespace AllinoneBalloon.Services
{
    public class OcrWordResult
    {
        public string Text { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public float Confidence { get; set; }
    }

    public interface IOcrService
    {
        Task<List<OcrWordResult>> RecognizeWordsAsync(string imagePath);
        Task<List<OcrWordResult>> RecognizeWordsFastAsync(string imagePath);
        Task<bool> IsAvailableAsync();
        string EngineName { get; }
    }
}

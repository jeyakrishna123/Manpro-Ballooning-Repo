using static AllinoneBalloon.Entities.Common;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region File Processing

        /// <summary>
        /// Copies a file using FileStream with sharing flags to handle locked files.
        /// </summary>
        private static async Task CopyFileSafe(string source, string dest)
        {
            const int maxRetries = 3;
            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                try
                {
                    using var sourceStream = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                    using var destStream = new FileStream(dest, FileMode.Create, FileAccess.Write, FileShare.Read);
                    await sourceStream.CopyToAsync(destStream);
                    return;
                }
                catch (IOException) when (attempt < maxRetries - 1)
                {
                    await Task.Delay(200 * (attempt + 1));
                }
            }
        }

        public async Task<List<string>> StandaloneFileCopy(List<IFormFile> files, List<string> addedfiles, string workingDir, string clientPath, string sourceDir, AllinoneBalloon.Models.Settings settings)
        {
            var imgExt = new List<string> { ".png", ".jpeg", ".jpg" };
            var pdfExt = new List<string> { ".pdf" };
            int i = 1;
            string Fname = settings.DrawingNo.Trim().ToUpper().ToString() + "-" + settings.RevNo.Trim().ToUpper().ToString();
            string backupDir = System.IO.Path.Combine(sourceDir, Fname);
            if (!Directory.Exists(backupDir))
            {
                Directory.CreateDirectory(backupDir);
            }
            else
            {
                try { await DeleteFiles(backupDir); } catch { /* ignore locked files during cleanup */ }
            }
            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    FileInfo fi = new FileInfo(file.FileName);
                    string extension = fi.Extension.ToLower();
                    // Normalize .jpeg → .jpg for consistent naming
                    string normalizedExt = extension == ".jpeg" ? ".jpg" : extension;

                    // Use file index i for multi-file uploads so each gets unique page number
                    string FileName = string.Format("{0}-{1:000}{2}", Fname, i, normalizedExt);
                    if (imgExt.Contains(extension))
                    {
                        int count = 1;
                        var CheckfilePath = System.IO.Path.Combine(workingDir, FileName);
                        while (System.IO.File.Exists(CheckfilePath))
                        {
                            FileName = string.Format("{0}-{1:000}({2}){3}", Fname, i, count++, normalizedExt);
                            CheckfilePath = System.IO.Path.Combine(workingDir, FileName);
                        }
                        var filePath = System.IO.Path.Combine(workingDir, FileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        addedfiles.Add(filePath);
                        string ImageFile = System.IO.Path.Combine(clientPath, FileName);
                        string BackupFile = System.IO.Path.Combine(backupDir, FileName);
                        await Task.WhenAll(
                            CopyFileSafe(filePath, ImageFile),
                            CopyFileSafe(filePath, BackupFile)
                        );
                    }
                    else if (pdfExt.Contains(extension))
                    {
                        // PDF: convert each page to PNG via Ghostscript.NET
                        var filePath = System.IO.Path.Combine(workingDir, file.FileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        List<string> pdfPath = pdftoImage(filePath, workingDir, settings);
                        if (pdfPath == null || pdfPath.Count == 0)
                        {
                            // PDF conversion failed — skip this file (returns no pages)
                            continue;
                        }
                        foreach (var f in pdfPath)
                        {
                            addedfiles.Add(f);
                            FileInfo pfi = new FileInfo(f);
                            string ImageFile = System.IO.Path.Combine(clientPath, pfi.Name);
                            string BackupFile = System.IO.Path.Combine(backupDir, pfi.Name);
                            await Task.WhenAll(
                                CopyFileSafe(f, ImageFile),
                                CopyFileSafe(f, BackupFile)
                            );
                        }
                    }
                    // Unknown extension — silently skip; controller already validated extensions
                }
                i++;
            }
            return addedfiles;
        }
        public List<string> pdftoImage(string pdfFile, string outPath, AllinoneBalloon.Models.Settings settings)
        {
            PDF_Parsing pdf = new AllinoneBalloon.Common.PDF_Parsing();
            List<string> imgs1 = pdf.GhostscriptPDFtoImage(pdfFile, outPath, settings);
            return imgs1;
        }

        #endregion
    }
}

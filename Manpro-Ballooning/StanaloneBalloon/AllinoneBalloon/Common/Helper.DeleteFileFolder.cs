namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Delete Files/Folder
        public async Task<bool> DeleteOldFiles(string folderPath)
        {
            // Get the current time
            DateTime now = DateTime.Now;
            return await Task.Run(() =>
            {
                // Check if the directory exists
                if (Directory.Exists(folderPath))
                {
                    // 1. First delete files older than 24 hours
                    var files = Directory.GetFiles(folderPath);

                    foreach (var file in files)
                    {
                        // Get the creation time of the file
                        DateTime creationTime = File.GetCreationTime(file);

                        // Check if the file is older than 24 hours
                        if ((now - creationTime).TotalHours > 24)
                        {
                            // Delete the file
                            try
                            {
                                File.Delete(file);
                                Console.WriteLine($"Deleted: {file}");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error deleting file {file}: {ex.Message}");
                            }
                        }
                    }

                    // 2. Then, recursively process subfolders
                    var subfolders = Directory.GetDirectories(folderPath);

                    foreach (var subfolder in subfolders)
                    {
                        // Recursively clean subfolders
                        Task<bool> s = DeleteOldFiles(subfolder);
                    }

                    // 3. After files and subfolders are handled, delete the folder if it's empty and older than 24 hours
                    var folderCreationTime = Directory.GetCreationTime(folderPath);

                    // Check if the folder is empty and older than 24 hours
                    if (!Directory.EnumerateFileSystemEntries(folderPath).Any() && (now - folderCreationTime).TotalHours > 24)
                    {
                        try
                        {
                            Directory.Delete(folderPath);
                            Console.WriteLine($"Deleted empty folder: {folderPath}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error deleting folder {folderPath}: {ex.Message}");
                        }
                    }
                    return true;
                }
                else
                {
                    Console.WriteLine($"Directory {folderPath} does not exist.");
                    return false;
                }
            });
        }
        public async Task<bool> DeleteFiles(string clientPath)
        {
            return await Task.Run(() =>
            {
                System.IO.DirectoryInfo deletableClientImage = new System.IO.DirectoryInfo(clientPath);
                foreach (System.IO.FileInfo f in deletableClientImage.GetFiles())
                {
                    const int maxRetries = 5;
                    for (int attempt = 0; attempt < maxRetries; attempt++)
                    {
                        try
                        {
                            f.Delete();
                            break;
                        }
                        catch (IOException) when (attempt < maxRetries - 1)
                        {
                            System.Threading.Thread.Sleep(200 * (attempt + 1));
                        }
                        catch (IOException)
                        {
                            Console.WriteLine($"Could not delete locked file after retries: {f.FullName}");
                        }
                    }
                }
                return true;
            });
        }
        #endregion
    }
}

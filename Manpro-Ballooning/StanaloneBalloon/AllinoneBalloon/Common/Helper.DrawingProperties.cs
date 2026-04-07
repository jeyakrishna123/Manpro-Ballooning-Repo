using AllinoneBalloon.Models;
using MySql.Data.MySqlClient;
using System.Data;
using static AllinoneBalloon.Entities.Common;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region Drawing Properties
        public async Task<System.Data.DataTable> CreateDataTable(string connectionString, string tablename, System.Data.DataTable dataTable)
        {
            return await Task.Run(() =>
            {
                using (MySqlConnection connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    System.Data.DataTable schemaTable = connection.GetSchema("Columns", new string[] { null, null, tablename, null });

                    foreach (DataRow row in schemaTable.Rows)
                    {
                        dataTable.Columns.Add(row["COLUMN_NAME"].ToString());
                    }
                }
                return dataTable;
            });
        }
        public async Task<System.Data.DataTable> AddRowToDataTable<T>(T entity, System.Data.DataTable dataTable) where T : class
        {
            return await Task.Run(() =>
            {
                if (entity != null)
                {
                    var properties = typeof(T).GetProperties();
                    var newRow = dataTable.NewRow();
                    foreach (var property in properties)
                    {
                        newRow[property.Name] = property.GetValue(entity) ?? DBNull.Value;
                    }
                    dataTable.Rows.Add(newRow);
                }
                return dataTable;
            });
        }

        public async Task<bool> TableHeaderProperties(System.Data.DataTable dtFiles_Header, CreateHeader ch)
        {
            await Task.Run(() => {
                DataRow dtHrow;
                dtHrow = dtFiles_Header.NewRow();
                dtHrow["DrawingNo"] = ch.DrawingNo;
                dtHrow["Part_No"] = "1";
                dtHrow["Revision_No"] = ch.RevisionNo;
                dtHrow["PRevisionNo"] = "1";
                dtHrow["sessionId"] = ch.Session;
                dtHrow["RoutingNo"] = ch.Routerno;
                dtHrow["Quantity"] = ch.Quantity;
                dtFiles_Header.Rows.Add(dtHrow);
            });
            return true;
        }
        public async Task<bool> TableProperties(System.Data.DataTable dtFiles_Production, List<string> addedfiles, List<PartialImage> partial_image)
        {
            await Task.Run(() => {
                int sc = 0;
                dtFiles_Production.Clear();
                foreach (string s in addedfiles)
                {
                    DataRow dtFrow;
                    FileInfo fi = new FileInfo(s);
                    dtFrow = dtFiles_Production.NewRow();
                    dtFrow["FileName"] = fi.Name;
                    dtFrow["FilePath"] = fi.FullName;
                    dtFrow["resize"] = scaleImage(partial_image, fi.FullName, sc, true, objerr);
                    dtFrow["rotation"] = 0;
                    dtFrow["Annotation"] = fi.FullName;
                    dtFrow["Drawing"] = fi.Name;
                    dtFrow["CurrentPage"] = sc + 1;
                    dtFrow["TotalPage"] = addedfiles.Count;
                    dtFiles_Production.Rows.Add(dtFrow);
                    sc++;
                }
            });
            return true;
        }
        public async Task<string> Rotate(System.Data.DataTable dtFiles_Production)
        {
            string rotate = string.Empty;
            await Task.Run(() =>
            {
                rotate = "[";
                for (int rt = 0; rt < dtFiles_Production.Rows.Count; rt++)
                {
                    rotate += "0,";
                }
                rotate = rotate.Remove(rotate.Length - 1, 1);
                rotate += "]";
            });
            return rotate;
        }
        #endregion
    }
}

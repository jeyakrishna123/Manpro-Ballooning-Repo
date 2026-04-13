using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Web;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Hosting;

namespace AllinoneBalloon.Common
{
#pragma warning disable CA1846
    public class ErrorLog
    {
        private static string ErrorlineNo = string.Empty, Errormsg = string.Empty, extype = string.Empty, ErrorLocation = string.Empty;
        string Path = string.Empty; 
        
        public void WriteErrorToText(Exception ex)
        {
            if (!Directory.Exists(System.IO.Path.Combine(AppContext.BaseDirectory, "ErrorLog")))
            {
                Directory.CreateDirectory(System.IO.Path.Combine(AppContext.BaseDirectory, "ErrorLog"));
            }
            Path = System.IO.Path.Combine(AppContext.BaseDirectory, "ErrorLog") + System.IO.Path.DirectorySeparatorChar;
            var line = Environment.NewLine + Environment.NewLine;

            //ErrorlineNo = ex.StackTrace.Substring(ex.StackTrace.Length - 7, 7);
            var st = new StackTrace(ex, true);
            // Get the top stack frame
            var frame = st.GetFrame(0);
            // Get the line number from the stack frame
            var lneerror = frame.GetFileLineNumber();
            if (string.IsNullOrEmpty(ex.StackTrace.Substring(ex.StackTrace.LastIndexOf(' '))) != true)
            {
                int value;
                bool success = int.TryParse(ex.StackTrace.Substring(ex.StackTrace.LastIndexOf(' ')), out value);
                if (success)
                {
                    ErrorlineNo = Convert.ToInt32(ex.StackTrace.Substring(ex.StackTrace.LastIndexOf(' '))).ToString();
                }
                else
                    ErrorlineNo = "";
            }
            else
                ErrorlineNo = "";
            Errormsg = ex.GetType().Name.ToString();
            extype = ex.GetType().ToString();
            //exurl = HttpContext.Current.Request.Url.ToString();
            ErrorLocation = ex.Message.ToString();

            try
            {
                if (!Directory.Exists(Path))
                {
                    Directory.CreateDirectory(Path);
                }
                Path = System.IO.Path.Combine(Path, DateTime.Today.ToString("dd-MM-yy") + ".txt");
                if (!File.Exists(Path))
                {
                    File.Create(Path).Dispose();
                }
                using (StreamWriter sw = File.AppendText(Path))
                {
                    string error = "Log Written Date:" + " " + DateTime.Now.ToString() + line + "Error Line No :" + " " + ErrorlineNo + line + "Error Message:" + " " + Errormsg + line + "Exception Type:" + " " + extype + line + "Error Location :" + " " + ErrorLocation + line;
                    sw.WriteLine("-----------Exception Details on " + " " + DateTime.Now.ToString() + "-----------------");
                    sw.WriteLine("-------------------------------------------------------------------------------------");
                    sw.WriteLine(line);
                    sw.WriteLine(error);
                    sw.WriteLine("--------------------------------*End*------------------------------------------");
                    sw.WriteLine(line);
                    sw.Flush();
                    sw.Close();
                }
            }
            catch (Exception e)
            {
                ErrorLog objErrorLog = new ErrorLog();
                objErrorLog.WriteErrorToText(e);
            }
        }
        public void WriteErrorLog(string ex)
        {
            if (!Directory.Exists(System.IO.Path.Combine(AppContext.BaseDirectory, "ErrorLog")))
            {
                Directory.CreateDirectory(System.IO.Path.Combine(AppContext.BaseDirectory, "ErrorLog"));
            }
            Path = System.IO.Path.Combine(AppContext.BaseDirectory, "ErrorLog") + System.IO.Path.DirectorySeparatorChar;
            var line = Environment.NewLine + Environment.NewLine;
            //exurl = HttpContext.Current.Request.Url.ToString();
            ErrorLocation = ex.ToString();

            try
            {
                if (!Directory.Exists(Path))
                {
                    Directory.CreateDirectory(Path);
                }
                Path = System.IO.Path.Combine(Path, "Loginfo" + DateTime.Today.ToString("dd-MM-yy") + ".txt");
                if (!File.Exists(Path))
                {
                    File.Create(Path).Dispose();
                }
                using (StreamWriter sw = File.AppendText(Path))
                {
                    string error = "Log Written Date:" + " " + DateTime.Now.ToString() + line + "Error Location :" + " " + ErrorLocation + line;
                    sw.WriteLine("-----------Exception Details on " + " " + DateTime.Now.ToString() + "-----------------");
                    sw.WriteLine("-------------------------------------------------------------------------------------");
                    sw.WriteLine(line);
                    sw.WriteLine(error);
                    sw.WriteLine("--------------------------------*End*------------------------------------------");
                    sw.WriteLine(line);
                    sw.Flush();
                    sw.Close();
                }
            }
            catch (Exception e)
            {
                ErrorLog objErrorLog = new ErrorLog();
                objErrorLog.WriteErrorToText(e);
                throw new Exception();
            }
        }
    }
#pragma warning restore CA1846
}
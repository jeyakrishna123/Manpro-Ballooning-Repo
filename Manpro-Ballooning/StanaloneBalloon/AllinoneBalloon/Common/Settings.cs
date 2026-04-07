using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AllinoneBalloon.Common
{
    public class Settings
    {
        private string _DrawingFolder;

        public string DrawingFolder
        {
            get { return _DrawingFolder; }
            set { _DrawingFolder = value; }
        }

        private string _BalloonedFolder;

        public string BalloonedFolder
        {
            get { return _BalloonedFolder; }
            set { _BalloonedFolder = value; }
        }

        private string _Database;

        public string Database
        {
            get { return _Database; }
            set { _Database = value; }
        }

        private string _MPMDatabase;

        public string MPMDatabase
        {
            get { return _MPMDatabase; }
            set { _MPMDatabase = value; }
        }

        private string _QDMSInterface;

        public string QDMSInterface
        {
            get { return _QDMSInterface; }
            set { _QDMSInterface = value; }
        }

        private string _CWIInterface;

        public string CWIInterface
        {
            get { return _CWIInterface; }
            set { _CWIInterface = value; }
        }

        private string _ErrorLogFolder;

        public string ErrorLogFolder
        {
            get { return _ErrorLogFolder; }
            set { _ErrorLogFolder = value; }
        }

        private string _InspectionReportPDF_Folder;

        public string InspectionReportPDF_Folder
        {
            get { return _InspectionReportPDF_Folder; }
            set { _InspectionReportPDF_Folder = value; }
        }

        private string _InspectionImagePDF_Folder;

        public string InspectionImagePDF_Folder
        {
            get { return _InspectionImagePDF_Folder; }
            set { _InspectionImagePDF_Folder = value; }
        }

        private string _InspectionExcelReport_Folder;

        public string InspectionExcelReport_Folder
        {
            get { return _InspectionExcelReport_Folder; }
            set { _InspectionExcelReport_Folder = value; }
        }

        private string _LoginSessionTimeout;

        public string LoginSessionTimeout
        {
            get { return _LoginSessionTimeout; }
            set { _LoginSessionTimeout = value; }
        }

        private int _BalloonWidth;

        public int BalloonWidth
        {
            get { return _BalloonWidth; }
            set { _BalloonWidth = value; }
        }

        private int _BalloonHeight;

        public int BalloonHeight
        {
            get { return _BalloonHeight; }
            set { _BalloonHeight = value; }
        }

        private string _BalloonColor;

        public string BalloonColor
        {
            get { return _BalloonColor; }
            set { _BalloonColor = value; }
        }

        private string _BalloonTextColor;

        public string BalloonTextColor
        {
            get { return _BalloonTextColor; }
            set { _BalloonTextColor = value; }
        }

        private int _BallonNumberFontSize;

        public int BallonNumberFontSize
        {
            get { return _BallonNumberFontSize; }
            set { _BallonNumberFontSize = value; }
        }

        private int _BalloonFontSize;

        public int BalloonFontSize
        {
            get { return _BalloonFontSize; }
            set { _BalloonFontSize = value; }
        }

        private string _CurrentUser;

        public string CurrentUser
        {
            get { return _CurrentUser; }
            set { _CurrentUser = value; }
        }

        private string _CurrentUserName;

        public string CurrentUserName
        {
            get { return _CurrentUserName; }
            set { _CurrentUserName = value; }
        }

        private string _WorkCenter;

        public string WorkCenter
        {
            get { return _WorkCenter; }
            set { _WorkCenter = value; }
        }

        private string _CuurentUserRole;

        public string CuurentUserRole
        {
            get { return _CuurentUserRole; }
            set { _CuurentUserRole = value; }
        }

        private bool _URPlanner;

        public bool URPlanner
        {
            get { return _URPlanner; }
            set { _URPlanner = value; }
        }

        private bool _UROperator;

        public bool UROperator
        {
            get { return _UROperator; }
            set { _UROperator = value; }
        }

        private bool _URQuality;

        public bool URQuality
        {
            get { return _URQuality; }
            set { _URQuality = value; }
        }

        private bool _URAdmin;

        public bool URAdmin
        {
            get { return _URAdmin; }
            set { _URAdmin = value; }
        }

        private decimal _MinMaxOneDigit;

        public decimal MinMaxOneDigit
        {
            get { return _MinMaxOneDigit; }
            set { _MinMaxOneDigit = value; }
        }

        private decimal _MinMaxTwoDigit;

        public decimal MinMaxTwoDigit
        {
            get { return _MinMaxTwoDigit; }
            set { _MinMaxTwoDigit = value; }
        }

        private decimal _MinMaxThreeDigit;

        public decimal MinMaxThreeDigit
        {
            get { return _MinMaxThreeDigit; }
            set { _MinMaxThreeDigit = value; }
        }

        private decimal _MinMaxFourDigit;

        public decimal MinMaxFourDigit
        {
            get { return _MinMaxFourDigit; }
            set { _MinMaxFourDigit = value; }
        }

        private string _MinMaxAngles;

        public string MinMaxAngles
        {
            get { return _MinMaxAngles; }
            set { _MinMaxAngles = value; }
        }

        private string _DimensionUpdateBalloonColor;

        public string DimensionUpdateBalloonColor
        {
            get { return _DimensionUpdateBalloonColor; }
            set { _DimensionUpdateBalloonColor = value; }
        }

        private string _MPMServer;

        public string MPMServer
        {
            get { return _MPMServer; }
            set { _MPMServer = value; }
        }

        private string _MPMEnvironment;

        public string MPMEnvironment
        {
            get { return _MPMEnvironment; }
            set { _MPMEnvironment = value; }
        }

        private string _MPMAuthendication;

        public string MPMAuthendication
        {
            get { return _MPMAuthendication; }
            set { _MPMAuthendication = value; }
        }

        private string _MPMUserID;

        public string MPMUserID
        {
            get { return _MPMUserID; }
            set { _MPMUserID = value; }
        }

        private string _MPMPassword;

        public string MPMPassword
        {
            get { return _MPMPassword; }
            set { _MPMPassword = value; }
        }

        private string _QDMSEnvironment;

        public string QDMSEnvironment
        {
            get { return _QDMSEnvironment; }
            set { _QDMSEnvironment = value; }
        }

        private string _QDMSServer;

        public string QDMSServer
        {
            get { return _QDMSServer; }
            set { _QDMSServer = value; }
        }

        private string _QDMSDatabase;

        public string QDMSDatabase
        {
            get { return _QDMSDatabase; }
            set { _QDMSDatabase = value; }
        }

        private string _QDMSAuthendication;

        public string QDMSAuthendication
        {
            get { return _QDMSAuthendication; }
            set { _QDMSAuthendication = value; }
        }

        private string _QDMSUserID;

        public string QDMSUserID
        {
            get { return _QDMSUserID; }
            set { _QDMSUserID = value; }
        }

        private string _QDMSPassword;

        public string QDMSPassword
        {
            get { return _QDMSPassword; }
            set { _QDMSPassword = value; }
        }

        private string _CWIEnvironment;

        public string CWIEnvironment
        {
            get { return _CWIEnvironment; }
            set { _CWIEnvironment = value; }
        }

        private string _CWIServer;

        public string CWIServer
        {
            get { return _CWIServer; }
            set { _CWIServer = value; }
        }

        private string _CWIDatabase;

        public string CWIDatabase
        {
            get { return _CWIDatabase; }
            set { _CWIDatabase = value; }
        }

        private string _CWIAuthendication;

        public string CWIAuthendication
        {
            get { return _CWIAuthendication; }
            set { _CWIAuthendication = value; }
        }

        private string _CWIUserID;

        public string CWIUserID
        {
            get { return _CWIUserID; }
            set { _CWIUserID = value; }
        }

        private string _CWIPassword;

        public string CWIPassword
        {
            get { return _CWIPassword; }
            set { _CWIPassword = value; }
        }

        private string _DwngByProductionOrder;

        public string DwngByProductionOrder
        {
            get { return _DwngByProductionOrder; }
            set { _DwngByProductionOrder = value; }
        }

        private string _DwngByConfirmationNo;

        public string DwngByConfirmationNo
        {
            get { return _DwngByConfirmationNo; }
            set { _DwngByConfirmationNo = value; }
        }

        private string _LastWorkCenter;

        public string LastWorkCenter
        {
            get { return _LastWorkCenter; }
            set { _LastWorkCenter = value; }
        }

        private string _isEncrypt;

        public string IsEncrypt
        {
            get { return _isEncrypt; }
            set { _isEncrypt = value; }
        }
    }
}

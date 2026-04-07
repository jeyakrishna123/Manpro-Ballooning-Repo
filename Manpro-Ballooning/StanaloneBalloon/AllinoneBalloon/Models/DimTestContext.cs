using System;
using System.Collections.Generic;
using System.Reflection;
using System.Reflection.PortableExecutable;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Models.Configuration;
using DocumentFormat.OpenXml.Office2010.Excel;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AllinoneBalloon.Models;

public partial class DimTestContext : DbContext
{
   // private readonly AppSettings _appSettings;
    public DimTestContext()
    {
        //_appSettings = opt.Value;
    }
    public DimTestContext(DbContextOptions<DimTestContext> options)
        : base(options)
    {
        //_appSettings = opt.Value;
    }

    public virtual DbSet<TblBaloonDrawingHeader> TblBaloonDrawingHeaders { get; set; }
    public virtual DbSet<TblBaloonDrawingLiner> TblBaloonDrawingLiners { get; set; }
    public virtual DbSet<TblConfiguration> TblConfigurations { get; set; }
    public virtual DbSet<TblMeasureSubType> TblMeasureSubTypes { get; set; }
    public virtual DbSet<TblMeasureType> TblMeasureTypes { get; set; }
    public virtual DbSet<TblToleranceType> TblToleranceTypes { get; set; }
    public virtual DbSet<TblCharacteristic> TblCharacteristics { get; set; }
    public virtual DbSet<TblUnit> TblUnits { get; set; }
    public virtual DbSet<TblUnitInstrument> TblUnitInstruments { get; set; }
    public virtual DbSet<TblDimensionInputLiner> TblDimensionInputLiners { get; set; }
    public virtual DbSet<TblBaloonDrawingSetting> TblBaloonDrawingSettings { get; set; }
    public virtual DbSet<UniqueNumber> UniqueNumbers { get; set; }
    public virtual DbSet<TblTemplate> TblTemplates { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<UGroup> Groups { get; set; }
    public virtual DbSet<UserGroup> UserGroups { get; set; }
    public virtual DbSet<Roles> Roles { get; set; }
    public virtual DbSet<UserRole> UserRoles { get; set; }
    public virtual DbSet<Permission> Permissions { get; set; }
    public virtual DbSet<UserPermission> UserPermissions { get; set; }
    public virtual DbSet<TblControllCopy> TblControlledCopy { get; set; }
    public virtual DbSet<TblDemoThreshold> TblDemoThresholds { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        //#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
      //  optionsBuilder.UseMySQL(_appSettings.MySqlConnStr);
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TblBaloonDrawingHeader>(entity =>
        {
            entity.HasKey(e => e.BaloonDrwID).HasName("PK_tbl_Baloon_Drawing");

            entity.ToTable("tbl_baloon_drawing_header");

            entity.Property(e => e.BaloonDrwID).HasColumnName("BaloonDrwID");

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.DrawingNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Quantity)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.Part_Revision)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("Part_Revision");
            entity.Property(e => e.ProductionOrderNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Revision)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.isClosed).HasColumnName("isClosed");
            entity.Property(e => e.Total_Page_No).HasColumnName("Total_Page_No");
            entity.Property(e => e.RotateProperties).HasColumnName("RotateProperties");
            entity.Property(e => e.GroupId).HasColumnName("GroupId");
            entity.Property(e => e.FilePath).HasMaxLength(500).HasColumnName("FilePath");

            // Indexes for frequent queries
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => new { e.GroupId, e.DrawingNumber, e.Revision });
        });

        modelBuilder.Entity<TblBaloonDrawingLiner>(entity =>
        {
            entity.HasKey(e => e.DrawLineID).HasName("PK_tbl_Baloon_Drawing_Liner");

            entity.ToTable("tbl_baloon_drawing_liner");

            entity.Property(e => e.DrawLineID).HasColumnName("DrawLineID");

            entity.HasIndex(e => new { e.BaloonDrwFileID, e.DrawingNumber, e.Revision }, "tbl_baloon_drawing_liner_a1");
            entity.Property(e => e.Balloon)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Balloon_Text_FontSize).HasColumnName("Balloon_Text_FontSize");
            entity.Property(e => e.Balloon_Thickness).HasColumnName("Balloon_Thickness");
            entity.Property(e => e.BalloonShape).HasColumnName("BalloonShape");
            entity.Property(e => e.BaloonDrwFileID)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("BaloonDrwFileID");
            entity.Property(e => e.BaloonDrwID).HasColumnName("BaloonDrwID");
            entity.Property(e => e.Circle_Height).HasColumnName("Circle_Height");
            entity.Property(e => e.Circle_Width).HasColumnName("Circle_Width");
            entity.Property(e => e.Circle_X_Axis).HasColumnName("Circle_X_Axis");
            entity.Property(e => e.Circle_Y_Axis).HasColumnName("Circle_Y_Axis");
            entity.Property(e => e.Measure_X_Axis).HasColumnName("Measure_X_Axis");
            entity.Property(e => e.Measure_Y_Axis).HasColumnName("Measure_Y_Axis");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Crop_Height).HasColumnName("Crop_Height");
            entity.Property(e => e.Crop_Width).HasColumnName("Crop_Width");
            entity.Property(e => e.Crop_X_Axis).HasColumnName("Crop_X_Axis");
            entity.Property(e => e.Crop_Y_Axis).HasColumnName("Crop_Y_Axis");
            entity.Property(e => e.DrawLineID)
                .ValueGeneratedOnAdd()
                .HasColumnName("DrawLineID");
            entity.Property(e => e.DrawingNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.MaxTolerance)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Maximum)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.MeasuredBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.MeasuredOn).HasColumnType("datetime");
            entity.Property(e => e.MinTolerance)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Minimum)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.MinusTolerance)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.Nominal).IsUnicode(false);
            entity.Property(e => e.Page_No).HasColumnName("Page_No");
            entity.Property(e => e.Part_Revision)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("Part_Revision");
            entity.Property(e => e.PlusTolerance)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ProductionOrderNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Revision)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SubType)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ToleranceType)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Unit)
                .HasMaxLength(50)
                .IsUnicode(false);
            
            entity.Property(e => e.Characteristics)
                .HasMaxLength(150)
                .IsUnicode(false);
            
            entity.Property(e => e.ZoomFactor).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsCritical).HasColumnName("IsCritical");
            entity.Property(e => e.convert).HasColumnName("convert");
            entity.Property(e => e.converted).HasColumnName("converted");
            entity.Property(e => e.Serial_No).HasColumnName("Serial_No");
        });

        modelBuilder.Entity<TblControllCopy>(entity =>
        {
            entity.HasKey(e => e.ControlledID);
            entity.ToTable("tbl_baloon_drawing_cc");
            entity.Property(e => e.BaloonDrwID).HasColumnName("BaloonDrwID");
            entity.Property(e => e.drawingNo).HasColumnName("drawingNo");
            entity.Property(e => e.revNo).HasColumnName("revNo");
            entity.Property(e => e.routerno).HasColumnName("routerno");
            entity.Property(e => e.pageNo).HasColumnName("pageNo");
            entity.Property(e => e.origin).HasColumnName("origin");
            entity.Property(e => e.textGroupPlaced).HasColumnName("textGroupPlaced");
        });

        modelBuilder.Entity<TblConfiguration>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Tbl_Configuration");

            entity.ToTable("tbl_configuration");

            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Key)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.Value).IsUnicode(false);
        });

        modelBuilder.Entity<TblDbconfiguration>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Tbl_DBConfiguration");

            entity.ToTable("tbl_dbconfiguration");

            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.Authendication)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Datasource)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Dbname)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("DBName");
            entity.Property(e => e.Environment)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.Password).IsUnicode(false);
            entity.Property(e => e.UserId)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("UserID");
        });

        modelBuilder.Entity<TblMeasureSubType>(entity =>
        {
            entity.HasKey(e => e.SubType_ID);

            entity.ToTable("tbl_measure_subtype");

            entity.Property(e => e.SubType_ID).HasColumnName("SubType_ID");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.SubTypeName)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("SubType_Name");
            entity.Property(e => e.TypeId).HasColumnName("Type_ID");
        });

        modelBuilder.Entity<TblMeasureType>(entity =>
        {
            entity.HasKey(e => e.Type_ID);

            entity.ToTable("tbl_measuretype");

            entity.Property(e => e.Type_ID).HasColumnName("Type_ID");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.TypeName)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("Type_Name");
        });

        modelBuilder.Entity<TblToleranceType>(entity =>
        {
            entity.HasKey(e => e.ID);

            entity.ToTable("tbl_tolerancetype");

            entity.Property(e => e.ID).HasColumnName("ID");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
            entity.Property(e => e.TypeName)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("Type_Name");
        });

        modelBuilder.Entity<TblDimensionInputLiner>(entity =>
        {
            entity.HasKey(e => e.DrawLineId);

            entity.ToTable("tbl_baloon_drawing_input_liner");
            entity.Property(e => e.DrawLineId).HasColumnName("DrawLineID");
            entity.Property(e => e.BaloonDrwID).HasColumnName("BaloonDrwID");
            entity.Property(e => e.Page_No).HasColumnName("Page_No");

            entity.Property(e => e.Balloon)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Actual_OP).HasColumnName("Actual_OP");
            entity.Property(e => e.Actual_LI).HasColumnName("Actual_LI");
            entity.Property(e => e.Actual_FI).HasColumnName("Actual_FI");

            entity.Property(e => e.CreatedAt)
            .HasColumnType("datetime")
            .HasColumnName("created_at");
           
            entity.Property(e => e.UpdatedAt)
            .HasColumnType("datetime")
            .HasColumnName("updated_at");
        });

        modelBuilder.Entity<TblCharacteristic>(entity =>
        {
            entity.HasKey(e => e.ID);

            entity.ToTable("tbl_baloon_drawing_characteristics");

            entity.Property(e => e.Characteristics).HasColumnName("Characteristics");
        });

        modelBuilder.Entity<TblUnit>(entity =>
        {
            entity.HasKey(e => e.ID);

            entity.ToTable("tbl_baloon_drawing_units");

            entity.Property(e => e.Units).HasColumnName("Units");
        });

        modelBuilder.Entity<TblUnitInstrument>(entity =>
        {
            entity.HasKey(e => e.ID);

            entity.ToTable("tbl_unit_instruments");

            entity.Property(e => e.Unit).HasColumnName("Unit");
            entity.Property(e => e.Name).HasColumnName("Name");
            entity.Property(e => e.Status).HasColumnName("Status");
            entity.Property(e => e.CreatedBy).HasColumnName("CreatedBy");
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.ModifiedBy).HasColumnName("ModifiedBy");
            entity.Property(e => e.ModifiedDate).HasColumnType("datetime");
        });

        modelBuilder.Entity<UniqueNumber>(entity =>
        {
            entity.HasKey(e => e.ID);

            entity.ToTable("tbl_baloon_drawing_batch");

            entity.Property(e => e.Number).HasColumnName("Number");
        });
        
        modelBuilder.Entity<TblBaloonDrawingSetting>(entity =>
        {
            entity.HasKey(e => e.SettingsID);

            entity.ToTable("tbl_baloon_drawing_settings");

            entity.Property(e => e.BaloonDrwId).HasColumnName("BaloonDrwID");
            entity.Property(e => e.DefaultBalloon).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.ErrorBalloon).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.SuccessBalloon).HasMaxLength(50).IsUnicode(false);
            
            entity.Property(e => e.BalloonShape).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.MinMaxOneDigit).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.MinMaxTwoDigit).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.MinMaxThreeDigit).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.MinMaxFourDigit).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.MinMaxAngles).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.convert).HasMaxLength(50).IsUnicode(false);
        });

        modelBuilder.Entity<TblTemplate>(entity =>
        {
            entity.HasKey(e => e.ID);

            entity.ToTable("tbl_export_template");

            entity.Property(e => e.Name).HasColumnName("Name");
            entity.Property(e => e.File).HasColumnName("File");
            entity.Property(e => e.group_name).HasColumnName("group_name");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID");

            entity.ToTable("tbl_users");

            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("Name");
            entity.Property(e => e.Email).HasMaxLength(255).HasColumnName("Email");
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Password).HasMaxLength(255).HasColumnName("Password");
            entity.Property(e => e.Role).HasMaxLength(255).HasColumnName("Role");
 
            entity.Property(e => e.Status).HasColumnName("Status");
            entity.Property(e => e.Remember_token).HasColumnName("Remember_token");

            entity.Property(e => e.Created_at).HasColumnType("datetime");
            entity.Property(e => e.Updated_at).HasColumnType("datetime");
            entity.OwnsMany(e => e.RefreshTokens, ci =>
            {
                ci.ToTable("tbl_refresh_token");
                ci.HasKey(e => e.Id);
                ci.Property(e => e.Id).HasColumnName("ID");
                ci.Property(e => e.UserId).HasColumnName("UserId");

                ci.ToTable("tbl_refresh_token");

                ci.Property(e => e.Token).HasMaxLength(100).HasColumnName("Token");
                ci.Property(e => e.Expires).HasColumnType("datetime");
                ci.Property(e => e.Created).HasColumnType("datetime");
                ci.Property(e => e.CreatedByIp).HasMaxLength(50).HasColumnName("CreatedByIp");
                ci.Property(e => e.Revoked).HasColumnType("datetime");
                ci.Property(e => e.RevokedByIp).HasMaxLength(50).HasColumnName("RevokedByIp");
                ci.Property(e => e.ReplacedByToken).HasColumnName("ReplacedByToken");
            });
        });

        modelBuilder.Entity<UGroup>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.Created_at).HasColumnType("datetime");
            entity.Property(e => e.Updated_at).HasColumnType("datetime");

            entity.ToTable("tbl_group");
        });

        modelBuilder.Entity<UserGroup>(entity =>
        {
            entity.HasKey(ug => new { ug.UserId, ug.GroupId });
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.GroupId).HasColumnName("GroupId");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.Created_at).HasColumnType("datetime");
            entity.Property(e => e.Updated_at).HasColumnType("datetime");

            entity.ToTable("tbl_users_groups");
        });
        // Configuring the relationship between User and UserGroup
        modelBuilder.Entity<UserGroup>()
        .HasOne(ur => ur.User)
        .WithMany(u => u.UserGroups)
        .HasForeignKey(ur => ur.UserId);

        modelBuilder.Entity<UserGroup>()
       .HasOne(ug => ug.Group)
       .WithMany(g => g.UserGroups)
       .HasForeignKey(ug => ug.GroupId);

        modelBuilder.Entity<Roles>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.Name).HasColumnName("Name");
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.Created_at).HasColumnType("datetime");
            entity.Property(e => e.Updated_at).HasColumnType("datetime");

            entity.ToTable("tbl_role");
        });
 
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ug => new { ug.UserId, ug.RoleId });
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.RoleId).HasColumnName("RoleId");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.Created_at).HasColumnType("datetime");
            entity.Property(e => e.Updated_at).HasColumnType("datetime");

            entity.ToTable("tbl_users_roles");
        });
        
        modelBuilder.Entity<UserRole>()
            .HasOne(ug => ug.User)
           .WithMany(u => u.UserRoles)
        .HasForeignKey(ur => ur.UserId);     

        modelBuilder.Entity<UserRole>()
             .HasOne(ur => ur.Role)
             .WithMany(r => r.UserRoles)
             .HasForeignKey(ur => ur.RoleId);

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.Name).HasColumnName("Name");
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.Created_at).HasColumnType("datetime");
            entity.Property(e => e.Updated_at).HasColumnType("datetime");

            entity.ToTable("tbl_permission");
        });

        modelBuilder.Entity<UserPermission>(entity =>
        {
            entity.HasKey(ug => new { ug.UserId, ug.PermissionId });
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.PermissionId).HasColumnName("PermissionId");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.Created_at).HasColumnType("datetime");
            entity.Property(e => e.Updated_at).HasColumnType("datetime");

            entity.ToTable("tbl_users_permissions");
        });
        // Configuring the relationship between User and UserPermission

        modelBuilder.Entity<UserPermission>()
            .HasOne(up => up.User)
            .WithMany(u => u.UserPermission)
            .HasForeignKey(up => up.UserId);

        modelBuilder.Entity<UserPermission>()
            .HasOne(up => up.Permission)
            .WithMany(p => p.UserPermission)
            .HasForeignKey(up => up.PermissionId);

        modelBuilder.Entity<TblDemoThreshold>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID");

            entity.ToTable("tbl_demo_threshold");

            entity.Property(e => e.upload_count).HasColumnName("upload_count");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.Created).HasColumnName("Created");           
        });
        OnModelCreatingPartial(modelBuilder);
    }
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

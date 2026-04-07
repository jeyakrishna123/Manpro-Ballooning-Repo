using System.Text.Json.Serialization;
using System.Collections.Generic;
using DocumentFormat.OpenXml.Office2010.Excel;
using System.ComponentModel.DataAnnotations;

namespace AllinoneBalloon.Entities
{

    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string Status { get; set; }
        public string Remember_token { get; set; }
        public DateTime Created_at { get; set; }
        public DateTime Updated_at { get; set; }
        public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();
        [JsonIgnore]
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        [JsonIgnore]
        public ICollection<UserPermission> UserPermission { get; set; } = new List<UserPermission>();

    }
    public class User
    {
        public long Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string Role { get; set; }
        public string Status { get; set; }
        public string Remember_token { get; set; }
        public DateTime Created_at { get; set; }
        public DateTime Updated_at { get; set; }

        [JsonIgnore]
        [Required]
        public string Password { get; set; }

      //  [JsonIgnore]
      //  public string Salt { get; set; }

        [JsonIgnore]
        public ICollection<RefreshToken> RefreshTokens { get; set; }

        public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();

        public ICollection<UserRole> UserRoles { get; set; }  = new List<UserRole>();
        public ICollection<UserPermission> UserPermission { get; set; }  = new List<UserPermission>();
        public bool HasPermission(string permission)
        {
            return UserPermission.Any(u => u.Permission.Name.Contains(permission)); 
        }
    }

    public class UGroup
    {
        [Key]
        public long Id { get; set; }

        public DateTime Created_at { get; set; }
        public DateTime Updated_at { get; set; }

        // Navigation property to define the many-to-many relationship
        public ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();
    }
    public class UserGroup
    {
        [Key]
        public long Id { get; set; }
        public long UserId { get; set; }
        public User User { get; set; }

        public long GroupId { get; set; }
        public UGroup Group { get; set; }

        public DateTime Created_at { get; set; }
        public DateTime Updated_at { get; set; }
    }

    public class Roles
    {
        [Key]
        public long Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime Created_at { get; set; }
        public DateTime Updated_at { get; set; }
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
    public class UserRole
    {
        [Key]
        public long Id { get; set; }
        public long UserId { get; set; }
        public long RoleId { get; set; }

        [JsonIgnore]
        public virtual Roles Role { get; set; }
        [JsonIgnore]
        public virtual User User { get; set; }
        public DateTime Created_at { get; set; }
        public DateTime Updated_at { get; set; }
    }
    public class Permission
    {
        [Key]
        public long Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime Created_at { get; set; }
        public DateTime Updated_at { get; set; }
        public ICollection<UserPermission> UserPermission { get; set; }  = new List<UserPermission>();

    }
   

    public partial class UserPermission
    {
        [Key]
        public long Id { get; set; }
        public long UserId { get; set; }
        public long PermissionId { get; set; }
 
        [JsonIgnore]
        public virtual User User { get; set; }

        [JsonIgnore]
        public Permission Permission { get; set; }
        public DateTime Created_at { get; set; }
        public DateTime Updated_at { get; set; }
    }
    public  class Role
    {
        public const string Supervisor = "Supervisor";
        public const string Admin = "Admin";
        public const string LineInspector = "Line Inspector";
        public const string Operator = "CNC Operator";
        public const string Final = "Final Operator";
    }
    public  class UserStatus
    {
        public const string Active = "active";
        public const string Inactive = "inactive";
    }
}



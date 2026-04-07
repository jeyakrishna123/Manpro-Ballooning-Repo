#region Import Libraries
using AllinoneBalloon.Common;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using AllinoneBalloon.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using Org.BouncyCastle.Asn1.Pkcs;
using System.Net.Mail;
using System.Reflection;
using System.Data.Entity;
#endregion

namespace AllinoneBalloon.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private IUserService _userService;
        private readonly IDbContextFactory<DimTestContext> _context;       
        public UsersController(IUserService userService, AutoMapper.IMapper mapper, IMailService mailService, IDbContextFactory<DimTestContext> context)
        {
            _userService = userService;
            _context = context;
        }
        #region create new user by admin API
        [Authorize(Roles = Role.Admin)]
        [HttpPost("create")]
        public async Task<IActionResult> create([FromBody] CreateRequest userParam)
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_context);
            UserHelper uhelper = new AllinoneBalloon.Common.UserHelper();
            string token = HttpContext.Request.Headers["Authorization"];
            var jwtToken = await helper.GetToken(HttpContext);
            using var context = _context.CreateDbContext();
            var gid = jwtToken.Claims.Where(c => c.Type == "groupId").Select(c => c.Value).FirstOrDefault();
            long groupId = default(long);
            bool groupExist = long.TryParse(gid, out groupId);
#nullable enable
            AllinoneBalloon.Entities.User? user = null;
            try
            {
                string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
                bool demo;
                var config = new ConfigurationBuilder()
                   .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true) // Always load base appsettings.json
                   .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true) // Optionally load environment-specific settings
                   .Build();
                demo = config.GetValue<bool>("Demo", defaultValue: false);
                if (demo)
                {
                    try
                    {
                        // Parse the email address
                        MailAddress addr = new MailAddress(userParam.UserEmail);
                        string username = addr.User;
                        string domain = addr.Host;
                    }
                    catch (FormatException ex)
                    {
                        // Handle invalid email format
                        return BadRequest(ex.Message.ToString());
                    }
                }

                User loggeduser = await helper.GetLoggedUser(HttpContext);

                if (loggeduser == null)
                {
                    return Unauthorized("You are not authorized to access this resource.");
                }

                // Validate role: only allow valid roles
                string[] validRoles = { Role.Admin, Role.Supervisor, Role.Operator, Role.LineInspector, Role.Final };
                if (!validRoles.Contains(userParam.UserRole))
                {
                    return BadRequest($"Invalid role '{userParam.UserRole}'.");
                }

                // Enforce max 3 admin limit
                if (userParam.UserRole == Role.Admin)
                {
                    int adminCount = context.Users.Count(u => u.Role == Role.Admin);
                    if (adminCount >= 3)
                    {
                        return BadRequest("Maximum of 3 Admin users allowed. Please contact the Super Admin.");
                    }

                    // Only Super Admin (manpro) can create Admin users
                    if (loggeduser.Email == null || loggeduser.Email.ToLower() != "manpro")
                    {
                        return BadRequest("Only the Super Admin can create Admin users.");
                    }
                }

                string Password = userParam.Password;
                AllinoneBalloon.Entities.User a = new AllinoneBalloon.Entities.User();
                a.Email = userParam.UserEmail;
                a.Status = UserStatus.Active;
                a.Role = userParam.UserRole;// Role.Admin;
                a.Name = userParam.UserName;//username;
                a.Created_at = DateTime.Now;
                a.Updated_at = DateTime.Now;
                a.Password = userParam.Password; // domain;
                user = _userService.Create(a, Password, _context);
                if (user == null)
                    return BadRequest("Username or password is incorrect");
            }

            catch (AppException ex)
            {
                // return error message if there was an exception
                return BadRequest(ex.Message.ToString());
            }

            var role = context.Roles.FirstOrDefault(a => a.Name == userParam.UserRole);
            if (role == null)
                return BadRequest($"Role '{userParam.UserRole}' not found.");

            var RoleIds = new List<string> { "add_actual_value" };
            var permission = context.Permissions.Where(a => ((Role.Admin == userParam.UserRole) ? !RoleIds.Contains(a.Name) : RoleIds.Contains(a.Name) ) ).Select(a => a.Id).ToList();
            await uhelper.AddRoleToUserAsync(user.Id, role.Id, _context);
            await uhelper.AddPermissionToUserAsync(user.Id, permission, _context);

            // Users created by Admin join the Admin's group (same team = shared drawings)
            if (groupExist && groupId > 0)
                await uhelper.AddGroupToUserAsync(user.Id, groupId, _context);

            return StatusCode(StatusCodes.Status200OK, $"User [{user.Name}] Created successfully.");
        }
        #endregion
        // api/Users/createOwn - Only allowed in Demo mode
        [AllowAnonymous]
        [HttpPost("createOwn")]
        public async Task<IActionResult> createOwn([FromBody] AuthenticateRequest userParam)
        {
            AllinoneBalloon.Entities.User? user = null;
            try
            {
                string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
                bool demo;
                var config = new ConfigurationBuilder()
                   .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true) // Always load base appsettings.json
                   .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true) // Optionally load environment-specific settings
                   .Build();
                demo = config.GetValue<bool>("Demo", defaultValue: false);

                // Block self-registration in non-demo mode
                if (!demo)
                {
                    return BadRequest("Self-registration is disabled. Please contact your administrator.");
                }

                string username = "OCS";
                if (demo)
                {
                    try
                    {
                        // Parse the email address
                        MailAddress addr = new MailAddress(userParam.UserName);
                        username = addr.User;
                        string domain = addr.Host;
                    }
                    catch (FormatException ex)
                    {
                        // Handle invalid email format
                        return BadRequest(ex.Message.ToString());
                    }
                }
                else
                {
                    username = userParam.UserName;
                }                

                string Password = userParam.Password;
                AllinoneBalloon.Entities.User a = new AllinoneBalloon.Entities.User();
                a.Email = userParam.UserName;
                a.Status = UserStatus.Active;
                a.Role = Role.Admin;
                a.Name = username;
                a.Created_at = DateTime.Now;
                a.Updated_at = DateTime.Now;
                a.Password = userParam.UserName;
                user = _userService.Create(a, Password, _context);
                if (user == null)
                    return BadRequest("Username or password is incorrect");
            }
            catch (AppException ex)
            {
                // return error message if there was an exception
                return BadRequest(ex.Message.ToString());
            }
            using var context = _context.CreateDbContext();
            UserHelper uhelper = new AllinoneBalloon.Common.UserHelper();
            long groupId = await uhelper.AddGroupAsync(_context);
            var role = context.Roles.FirstOrDefault(a => a.Name == Role.Admin);
            var RoleIds = new List<string> { "add_actual_value" };
            var permission = context.Permissions.Where(a => !RoleIds.Contains(a.Name) ).Select( a=>   a.Id ).ToList();
            await uhelper.AddRoleToUserAsync(user.Id, role.Id , _context);
            await uhelper.AddPermissionToUserAsync(user.Id, permission, _context);
            await uhelper.AddGroupToUserAsync(user.Id, groupId, _context);

            return StatusCode(StatusCodes.Status200OK, $"User [{user.Name}] Created successfully.");
        }      

        [AllowAnonymous]
        [HttpOptions("login")]
        public IActionResult Options([FromBody] AuthenticateRequest userParam)
        {
            try
            {
                UserHelper uhelper = new AllinoneBalloon.Common.UserHelper();
                AuthenticateResponse? user = null;
                user = _userService.Authenticate(userParam, uhelper.ipAddress(HttpContext), _context);
                if (user == null)
                    return BadRequest("Username or password is incorrect");

                uhelper.setTokenCookie(user.RefreshToken, HttpContext);
                var RList = typeof(Role)
                .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
                .Where(f => f.IsLiteral && !f.IsInitOnly)
                .Select(f => f.GetValue(null))
                .ToList(); 
                Dictionary<string, object> res = new Dictionary<string, object>();
                res.Add("User", user);
                res.Add("Roles", RList);
                return StatusCode(StatusCodes.Status200OK, res);
            }
            catch (AppException ex)
            {
                // return error message if there was an exception
                return BadRequest(ex.Message.ToString());
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult Authenticate( [FromBody] AuthenticateRequest userParam)
        {           
            AuthenticateResponse? user = null;
            try
            {
                UserHelper helper = new AllinoneBalloon.Common.UserHelper();
                UserHelper uhelper = new AllinoneBalloon.Common.UserHelper();
                user = _userService.Authenticate(userParam, helper.ipAddress(HttpContext), _context);

                if (user == null)
                    return BadRequest("Username or password is incorrect");

                uhelper.setTokenCookie(user.RefreshToken, HttpContext);
            }
            catch (AppException ex)
            {
                // return error message if there was an exception
                return BadRequest( ex.Message.ToString() );
            }
            var RList = typeof(Role)
                .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
                .Where(f => f.IsLiteral && !f.IsInitOnly)
                .Select(f => f.GetValue(null))
                .ToList(); ;
            Dictionary<string, object> res = new Dictionary<string, object>();
            res.Add("User", user);
            res.Add("Roles", RList);
            return StatusCode(StatusCodes.Status200OK, res);
        }

        [Authorize(Roles = Role.Admin)]
        [HttpGet("getallUser")]
        public async Task<IActionResult> GetAll()
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_context);
            using var context = _context.CreateDbContext();
            string token = HttpContext.Request.Headers["Authorization"];
            var jwtToken = await helper.GetToken(HttpContext);
            long groupId = default;

            // Try to find user via refresh token
            var user = context.Users.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == jwtToken.Id));

            if (user != null)
            {
                var active = user.RefreshTokens.Where(t => t.Token == jwtToken.Id).ToList();
                if (active.Count() == 1 && active[0].IsActive == true)
                {
                    var ug = context.UserGroups.FirstOrDefault(a => a.UserId == user.Id);
                    if (ug != null) groupId = ug.GroupId;
                }
            }

            // Fallback: if refresh token lookup fails, use JWT claims to find the user
            if (groupId == default)
            {
                var gid = jwtToken.Claims.Where(c => c.Type == "groupId").Select(c => c.Value).FirstOrDefault();
                if (!string.IsNullOrEmpty(gid)) long.TryParse(gid, out groupId);

                // If still no group, try finding user by email from JWT
                if (groupId == default)
                {
                    var emailClaim = jwtToken.Claims.Where(c => c.Type == "unique_name" || c.Type == System.Security.Claims.ClaimTypes.Name).Select(c => c.Value).FirstOrDefault();
                    if (!string.IsNullOrEmpty(emailClaim))
                    {
                        var fallbackUser = context.Users.FirstOrDefault(u => u.Email == emailClaim);
                        if (fallbackUser != null)
                        {
                            var ug = context.UserGroups.FirstOrDefault(a => a.UserId == fallbackUser.Id);
                            if (ug != null) groupId = ug.GroupId;
                        }
                    }
                }
            }

            var users = _userService.GetAll(groupId, _context);
            return Ok(users);
        }

        [Authorize(Roles = Role.Admin)]
        [HttpDelete("userDelete/{id:long}")]
        public IActionResult userDelete( long id)
        {
            var user = _userService.GetById(id, _context);
            if (user == null)
                return NotFound("User not found.");
            if (user.Email != null && user.Email.ToLower() == "manpro")
                return BadRequest("Super Admin cannot be deleted.");
            if (user.Role != null && user.Role.ToLower() == "admin")
                return BadRequest("Admin users cannot be deleted.");

            _userService.Delete(id, _context);
            return Ok("User Deleted");
        }

        [Authorize(Roles = Role.Admin)]
        [HttpPut("update")]
        public IActionResult userUpdate([FromBody] UpdateRequest userParam)
        {
            long id = userParam.UserId;
            var a = _userService.GetById(id,_context);
            if (a == null)
            {
                return NotFound();
            }
            if (a.Email != null && a.Email.ToLower() == "manpro")
                return BadRequest("Super Admin cannot be modified.");
            Helper helper = new AllinoneBalloon.Common.Helper(_context);
            using var context = _context.CreateDbContext();

            // Validate role
            string[] validRoles = { Role.Admin, Role.Supervisor, Role.Operator, Role.LineInspector, Role.Final };
            if (!validRoles.Contains(userParam.UserRole))
            {
                return BadRequest($"Invalid role '{userParam.UserRole}'.");
            }

            // Enforce max 3 admin limit on role change to Admin
            if (userParam.UserRole == Role.Admin && a.Role != Role.Admin)
            {
                int adminCount = context.Users.Count(u => u.Role == Role.Admin);
                if (adminCount >= 3)
                {
                    return BadRequest("Maximum of 3 Admin users allowed.");
                }
            }

            // Check duplicate email (excluding current user)
            var existingUser = context.Users.FirstOrDefault(u => u.Email == userParam.UserEmail && u.Id != id);
            if (existingUser != null)
            {
                return BadRequest($"Username '{userParam.UserEmail}' is already taken.");
            }

            a.Status = userParam.status;
            a.Email = userParam.UserEmail;
            a.Role = userParam.UserRole;
            a.Name = userParam.UserName;
            a.Updated_at = DateTime.Now;
            if (!string.IsNullOrWhiteSpace(userParam.Password))
            {
                string passwordHash = helper.HashPassword(userParam.Password);
                a.Password = passwordHash;
            }
            context.SaveChanges();
            // _userService.Delete(id);
            return Ok("User updated");
        }

        [Authorize]
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var user = _userService.GetById(id, _context);

            if (user == null)
            {
                return NotFound();
            }
#pragma warning disable CS8602,CS8604
            // only allow admins to access other user records
            var currentUserId = int.Parse(User.Identity.Name);
            if (id != currentUserId && !User.IsInRole(Role.Admin))
            {
                return Forbid();
            }
#pragma warning restore CS8602, CS8604
            return Ok(user);
        }

    }
}

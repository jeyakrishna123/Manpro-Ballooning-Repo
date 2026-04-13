using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Unicode;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using AllinoneBalloon.Models;
using AllinoneBalloon.Models.Configuration;
using AllinoneBalloon.Entities;
using AllinoneBalloon.Common;


namespace AllinoneBalloon.Services
{

    #region User Service Interface
    public interface IUserService
    {
        AuthenticateResponse Authenticate(AuthenticateRequest model, string ipAddress, IDbContextFactory<DimTestContext> _context);
        AuthenticateResponse RefreshToken(string token, string ipAddress, IDbContextFactory<DimTestContext> _context);
        bool RevokeToken(string token, string ipAddress, IDbContextFactory<DimTestContext> _context);
        IEnumerable<User> GetAll(long id, IDbContextFactory<DimTestContext> _context);
        User GetById(long id, IDbContextFactory<DimTestContext> _context);
        User Create(User user, string password, IDbContextFactory<DimTestContext> _context);
        void Update(IDbContextFactory<DimTestContext> _context, User user, string password = null);
        void Delete(long id, IDbContextFactory<DimTestContext> _context);
    }
    #endregion

    #region user service Interface implemented
    public class UserService : IUserService
    {
        private readonly AppSettings _appSettings;
      //
        public UserService(IOptions<AppSettings> appSettings)
        {
            _appSettings = appSettings.Value;
           
        }

        #region User Service Interface Implement Authenticate
        public AuthenticateResponse  Authenticate(AuthenticateRequest model, string ipAddress, IDbContextFactory<DimTestContext> _context)
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_context);
            using (var context = _context.CreateDbContext())
            {
                string normalizedEmail = (model.UserName ?? string.Empty).Trim().ToLower();
                string inputPassword = (model.Password ?? string.Empty).Trim();

                var user = context.Users
                .Include(g => g.UserGroups)
                .ThenInclude(g => g.Group)
                .Include(g => g.UserRoles)
                .ThenInclude(g => g.Role)
                .Include(g => g.UserPermission)
                .ThenInclude(g => g.Permission)
                .AsSplitQuery()
                .FirstOrDefault(x => x.Email.ToLower() == normalizedEmail && x.Status == UserStatus.Active);

                // return null if user not found
                if (user == null) throw new AppException("Provided User is not register with our system.");
                // check if password is correct
                if (!helper.VerifyPasswordHash(user.Password, inputPassword)) throw new AppException("Invalid Password.");
                // authentication successful so generate jwt and refresh tokens
                var refreshToken = generateRefreshToken(ipAddress);
                user.RefreshTokens.Add(refreshToken);
                context.Update(user);
                context.SaveChanges();
                var jwtToken = generateJwtToken(user, refreshToken, _context);
                // save refresh token

                return new AuthenticateResponse(user, jwtToken, refreshToken.Token);
            }
        }
        #endregion

        #region User Service Interface Implement RefreshToken
        public AuthenticateResponse RefreshToken(string token, string ipAddress, IDbContextFactory<DimTestContext> _context)
        {
            using (var context = _context.CreateDbContext())
            {
                var user = context.Users.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == token));

                // return null if no user found with token
                if (user == null) return null;

                var refreshToken = user.RefreshTokens.Single(x => x.Token == token);

                // return null if token is no longer active
                if (!refreshToken.IsActive) return null;

                // replace old refresh token with a new one and save
                var newRefreshToken = generateRefreshToken(ipAddress);
                refreshToken.Revoked = DateTime.UtcNow;
                refreshToken.RevokedByIp = ipAddress;
                refreshToken.ReplacedByToken = newRefreshToken.Token;
                user.RefreshTokens.Add(newRefreshToken);
                context.Update(user);
                context.SaveChanges();

                // generate new jwt
                var jwtToken = generateJwtToken(user, newRefreshToken, _context);

                return new AuthenticateResponse(user, jwtToken, newRefreshToken.Token);
            }
        }
        #endregion

        #region User Service Interface Implement RevokeToken
        public bool RevokeToken(string token, string ipAddress, IDbContextFactory<DimTestContext> _context)
        {
            using (var context = _context.CreateDbContext())
            {
                var user = context.Users.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == token));

                // return false if no user found with token
                if (user == null) return false;

                var refreshToken = user.RefreshTokens.Single(x => x.Token == token);

                // return false if token is not active
                if (!refreshToken.IsActive) return false;

                // revoke token and save
                refreshToken.Revoked = DateTime.UtcNow;
                refreshToken.RevokedByIp = ipAddress;
                context.Update(user);
                context.SaveChanges();

                return true;
            }
        }
        #endregion

        #region User Service Interface Implement GetAll
        public IEnumerable<User> GetAll(long id, IDbContextFactory<DimTestContext> _context)
        {
            using (var context = _context.CreateDbContext())
            {
                var u = context.Users
                .Include(g => g.UserGroups)
                .ThenInclude(g => g.Group)
                .Include(g => g.UserRoles)
                .ThenInclude(g => g.Role)
                .Include(g => g.UserPermission)
                .ThenInclude(g => g.Permission)
                .Where(u => u.UserGroups.Any(ug => ug.GroupId == id))
                 .AsSplitQuery()
                .ToList();
                return u;
            }
        }
        #endregion

        #region User Service Interface Implement GetById
        public User GetById(long id, IDbContextFactory<DimTestContext> _context)
        {
            using (var context = _context.CreateDbContext())
            {
                return context.Users.Find(id);
            }
        }
        #endregion

        #region User Service Interface Implement Create
        public User Create(User user, string password, IDbContextFactory<DimTestContext> _context)
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_context);
            using (var context = _context.CreateDbContext())
            {
                // validation
                if (string.IsNullOrWhiteSpace(password))
                    throw new AppException("Password is required");

                if (context.Users.Any(x => x.Email == user.Email))
                    throw new AppException("User \"" + user.Email + "\" is already taken");


                string passwordHash = helper.HashPassword(password);

                user.Password = passwordHash;
                // user.Salt = string.Empty;

                context.Users.Add(user);
                context.SaveChanges();

                return user;
            }
        }
        #endregion

        #region User Service Interface Implement Update
        public void Update(IDbContextFactory<DimTestContext> _context, User userParam, string password = null)
        {
            Helper helper = new AllinoneBalloon.Common.Helper(_context);
            using (var context = _context.CreateDbContext())
            {
                var user = context.Users.Find(userParam.Id);

                if (user == null)
                    throw new AppException("User not found");

                if (userParam.Email != user.Email)
                {
                    // username has changed so check if the new username is already taken
                    if (context.Users.Any(x => x.Email == userParam.Email))
                        throw new AppException("User \"" + userParam.Email + " is already taken");
                }

                // update user properties
                user.Name = userParam.Name;
                user.Email = userParam.Email;

                // update password if it was entered
                if (!string.IsNullOrWhiteSpace(password))
                {
                    string passwordHash = helper.HashPassword(password);

                    user.Password = passwordHash;
                    // user.Salt = string.Empty;
                }

                context.Users.Update(user);
                context.SaveChanges();
            }
        }
        #endregion

        #region User Service Interface Implement Delete
        public void Delete(long id, IDbContextFactory<DimTestContext> _context)
        {
            using (var context = _context.CreateDbContext())
            {
                var user = context.Users.Find(id);
                if (user != null)
                {
                    context.Users.Remove(user);
                    context.SaveChanges();
                }
            }
        }
        #endregion

        #region User Service Interface Helper
        private string generateJwtToken(User user, RefreshToken rtoken, IDbContextFactory<DimTestContext> _context)
        {
            using (var context = _context.CreateDbContext())
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_appSettings.Secret);
                var issuer = _appSettings.Issuer;
                var audience = _appSettings.Issuer;
                var rttoken = context.Users.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == rtoken.Token));
                var userGroup = context.UserGroups.FirstOrDefault(a => a.UserId == user.Id);
                if (userGroup == null)
                    throw new AppException("User has no assigned group. Please contact the administrator.");
                long groupId = userGroup.GroupId;
                var permissions = context.Users
                     .Include(g => g.UserPermission)
                .ThenInclude(g => g.Permission)
                     .Where(u => u.UserGroups.Any(ug => ug.GroupId == groupId) && u.Id == user.Id)
                        .SelectMany(r => r.UserPermission)
                        .Select(p => p.Permission.Name)
                        .AsSplitQuery()
                        .ToList();
                ClaimsIdentity claimsIdentity = new ClaimsIdentity();

                // Add items to the custom claim
                foreach (var item in permissions)
                {
                    claimsIdentity.AddClaim(new Claim("Permission", item.ToString()));
                }
                claimsIdentity.AddClaim(new Claim("groupId", groupId.ToString()));
                claimsIdentity.AddClaim(new Claim(ClaimTypes.Name, user.Id.ToString()));
                claimsIdentity.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));
                claimsIdentity.AddClaim(new Claim(JwtRegisteredClaimNames.Sub, user.Name.ToString()));
                claimsIdentity.AddClaim(new Claim(JwtRegisteredClaimNames.Email, user.Email.ToString()));
                claimsIdentity.AddClaim(new Claim(JwtRegisteredClaimNames.Jti, rtoken.Token.ToString()));
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = claimsIdentity,
                    Expires = DateTime.UtcNow.AddHours(8),
                    Issuer = issuer,
                    Audience = audience,
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };
                var token = tokenHandler.CreateToken(tokenDescriptor);
                return tokenHandler.WriteToken(token);
            }
        }

        private RefreshToken generateRefreshToken(string ipAddress)
        {
            byte[] randomBytes = new byte[64]; // Array to hold the random bytes
            using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes); // Fill the array with random bytes
                string token = BitConverter.ToString(randomBytes).Replace("-", "");
                return new RefreshToken
                {
                    Token = Convert.ToBase64String(randomBytes),
                    Expires = DateTime.UtcNow.AddDays(1),
                    Created = DateTime.UtcNow,
                    CreatedByIp = ipAddress
                };
            }
        }
        #endregion
    }
    #endregion
}


#region The handler will check if the user has the required permission.
public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }
    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.HasClaim(c => c.Type == "Permission" && c.Value == requirement.Permission))
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
#endregion

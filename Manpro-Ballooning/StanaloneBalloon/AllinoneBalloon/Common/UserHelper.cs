using AllinoneBalloon.Entities;
using AllinoneBalloon.Models;
using Org.BouncyCastle.Asn1.Ocsp;
using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace AllinoneBalloon.Common
{
    public class UserHelper
    {
        public async Task<long> AddRoleToUserAsync(long uid, long rid, IDbContextFactory<DimTestContext> _context)
        {
            var role = new UserRole
            {
                UserId = (long)uid,
                RoleId = (long)rid,
                Updated_at = DateTime.Now,
                Created_at = DateTime.Now,
            };
            using var context = _context.CreateDbContext();
            context.UserRoles.Add(role);
            await context.SaveChangesAsync();
            return role.Id;
        }
        public async Task<bool> AddPermissionToUserAsync(long uid, List<long> rid, IDbContextFactory<DimTestContext> _context)
        {
            List<UserPermission> lnr = new List<UserPermission>();
            foreach (var i in rid)
            {
                lnr.Add(new UserPermission
                {
                    UserId = (long)uid,
                    PermissionId = (long)i,
                    Updated_at = DateTime.Now,
                    Created_at = DateTime.Now,
                });
            }
            using var context = _context.CreateDbContext();
            context.UserPermissions.AddRange(lnr);
            await context.SaveChangesAsync();
            return true;
        }
        public async Task AddGroupToUserAsync(long userId, long groupId, IDbContextFactory<DimTestContext> _context)
        {
            var userGroup = new UserGroup
            {
                UserId = userId,
                GroupId = groupId,
                Updated_at = DateTime.Now,
                Created_at = DateTime.Now,
            };
            using var context = _context.CreateDbContext();
            context.UserGroups.Add(userGroup);
            await context.SaveChangesAsync();
        }
        public async Task<long> AddGroupAsync(IDbContextFactory<DimTestContext> _context)
        {
            using var context = _context.CreateDbContext();
            var lastCreatedId = context.Groups.OrderByDescending(g => g.Id).FirstOrDefault();
            long lastUpdatedId = default(long);
            if (lastCreatedId == null)
            {
                lastUpdatedId = 1;
            }
            else
            {
                lastUpdatedId = lastCreatedId.Id + 1;
            }

            var group = new UGroup
            {
                Id = (long)lastUpdatedId,
                Updated_at = DateTime.Now,
                Created_at = DateTime.Now,
            };
            context.Groups.Add(group);
            await context.SaveChangesAsync();
            return group.Id;
        }
        public void setTokenCookie(string token, HttpContext httpContext)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            httpContext.Response.Cookies.Append("refreshToken", token, cookieOptions);
        }
        public static List<object> GetConstants<T>()
        {
#pragma warning disable CS8619
            return typeof(T)
                .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
                .Where(f => f.IsLiteral && !f.IsInitOnly)
                .Select(f => f.GetValue(null))
                .ToList();
#pragma warning restore CS8619
        }
#pragma warning disable CS8602, CS8603, CS8604
        public string ipAddress(HttpContext httpContext)
        {
            if (httpContext.Request.Headers.ContainsKey("X-Forwarded-For"))
                return httpContext.Request.Headers["X-Forwarded-For"];
            else
                return httpContext.Connection.RemoteIpAddress.MapToIPv4().ToString();
        }
#pragma warning restore CS8602, CS8603, CS8604
    }
}

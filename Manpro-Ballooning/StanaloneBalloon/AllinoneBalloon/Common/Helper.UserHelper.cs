using AllinoneBalloon.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;

namespace AllinoneBalloon.Common
{
    public partial class Helper
    {
        #region User Helper
        public string HashPassword(string password)
        {
            if (password == null)
                throw new AppException("Required Password");

            byte[] salt = new byte[0x10];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
                rng.GetBytes(salt);

            byte[] buffer2;
            using (var bytes = new Rfc2898DeriveBytes(password, salt, 0x3e8, System.Security.Cryptography.HashAlgorithmName.SHA256))
                buffer2 = bytes.GetBytes(0x20);

            byte[] dst = new byte[0x31];
            dst[0] = 0x01; // version marker: 0x01 = SHA256
            Buffer.BlockCopy(salt, 0, dst, 1, 0x10);
            Buffer.BlockCopy(buffer2, 0, dst, 0x11, 0x20);
            return Convert.ToBase64String(dst);
        }

        public bool VerifyPasswordHash(string hashedPassword, string password)
        {
            if (hashedPassword == null) return false;
            if (password == null) throw new AppException("Required Password");

            byte[] src;
            try { src = Convert.FromBase64String(hashedPassword); }
            catch { return false; }

            if (src.Length != 0x31) return false;

            byte[] salt = new byte[0x10];
            Buffer.BlockCopy(src, 1, salt, 0, 0x10);
            byte[] storedHash = new byte[0x20];
            Buffer.BlockCopy(src, 0x11, storedHash, 0, 0x20);

            byte[] computedHash;
            // version 0x01 = SHA256, version 0x00 = legacy SHA1
            var algorithm = src[0] == 0x01
                ? System.Security.Cryptography.HashAlgorithmName.SHA256
                : System.Security.Cryptography.HashAlgorithmName.SHA1;

            using (var bytes = new Rfc2898DeriveBytes(password, salt, 0x3e8, algorithm))
                computedHash = bytes.GetBytes(0x20);

            return ByteArraysEqual(storedHash, computedHash);
        }
        public async Task<JwtSecurityToken> GetToken(HttpContext httpContext)
        {
            string token = httpContext.Request.Headers["Authorization"];
            var tokenHandler = new JwtSecurityTokenHandler();

            string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            var config = new ConfigurationBuilder()
               .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true) // Always load base appsettings.json
               .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true) // Optionally load environment-specific settings
               .Build();

            var SecretKey = config.GetSection("AppSettings").GetValue<string>("Secret");
            var issuer = config.GetSection("AppSettings").GetValue<string>("Issuer");
            var key = Encoding.ASCII.GetBytes(SecretKey);
            string jwt = token.Replace("Bearer ", string.Empty);

            tokenHandler.ValidateToken(jwt, new TokenValidationParameters
            {
                ValidIssuer = issuer,
                ValidAudience = issuer,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = false,
                ClockSkew = TimeSpan.Zero,
                ValidateIssuerSigningKey = true
            }, out SecurityToken validatedToken);
            var jwtToken = (JwtSecurityToken)validatedToken;
            return await Task.Run(() =>
            {
                return jwtToken;
            });
        }

        public async Task<User> GetLoggedUser(HttpContext httpContext)
        {
            try
            {
                string token = httpContext.Request.Headers["Authorization"];
                using var context = _dbcontext.CreateDbContext();
                var jwtToken = await GetToken(httpContext);
                var user = context.Users.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == jwtToken.Id));
                if (user == null)
                    return null;
                var active = user.RefreshTokens.Where(t => t.Token == jwtToken.Id).ToList();
                if (active.Count() == 1 && active[0].IsActive == true)
                {
                    return user;
                }
                return null;
            }
            catch (Exception ex)
            {
                objerr.WriteErrorToText(ex);
                return null;
            }
        }

        #endregion
    }
}

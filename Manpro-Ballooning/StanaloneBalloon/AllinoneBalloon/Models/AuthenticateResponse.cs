using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using AllinoneBalloon.Entities;


namespace AllinoneBalloon.Models
{
    
    public class AuthenticateResponse
    {
        public long Id { get; set; }
        public string UserName { get; set; }
        public string Role { get; set; }
        public List<string> Permission { get; set; }
        public string JwtToken { get; set; }

        [JsonIgnore] // refresh token is returned in http only cookie
        public string RefreshToken { get; set; }

        public AuthenticateResponse(User user, string jwtToken, string refreshToken)
        {
            Id = user.Id;
            UserName = user.Name;
            Role = user.Role;
            JwtToken = jwtToken;
            Permission = user.UserPermission 
                    .Select(p => p.Permission.Name)
                    .ToList(); ;
            RefreshToken = refreshToken;
        }
    }
}

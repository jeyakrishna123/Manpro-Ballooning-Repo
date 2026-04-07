using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Org.BouncyCastle.Asn1.Ocsp;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text;
using System.Net;

namespace AllinoneBalloon.Common
{
    public class BasicAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public BasicAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock)
            : base(options, logger, encoder, clock)
        {
        }
        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            ErrorLog objerr = new AllinoneBalloon.Common.ErrorLog();
            objerr.WriteErrorLog("BasicAuthenticationHandler ");
            if (!Request.Headers.ContainsKey("Authorization"))
                return await Task.Run(() =>
                {
                    return AuthenticateResult.Fail("Missing Authorization Header");
                });
            try
            {
                string authHeader1 = Request.Headers["Authorization"];
                
                objerr.WriteErrorLog("BasicAuthenticationHandler " + authHeader1);
                if (authHeader1 != null && authHeader1.StartsWith("Basic "))
                {
                    var authHeader = AuthenticationHeaderValue.Parse(Request.Headers["Authorization"]);
                    var credentialsBytes = Convert.FromBase64String(authHeader.Parameter);
                    var credentials = Encoding.UTF8.GetString(credentialsBytes).Split(':', 2);
                    var username = credentials[0];
                    var password = credentials[1];

                    // Validate the username and password here
                    // Replace with your custom logic, e.g., validate against a database or hardcoded credentials
                    if (username != "11193446" || password != "60-dayfreetrial")
                    {
                        return await Task.Run(() =>
                        {
                            return AuthenticateResult.Fail("Invalid Username or Password");
                        });
                    }

                    // Create a set of claims for the authenticated user
                    var claims = new[] {
                new Claim(ClaimTypes.Name, username)
            };
                    var identity = new ClaimsIdentity(claims, Scheme.Name);
                    var principal = new ClaimsPrincipal(identity);
                    var ticket = new AuthenticationTicket(principal, Scheme.Name);
                    return await Task.Run(() =>
                    {
                        return AuthenticateResult.Success(ticket);
                    });
                }
                else
                {
                    return await Task.Run(() =>
                    {
                        // Create a set of claims for the authenticated user
                        var claims = new[] {
                new Claim(ClaimTypes.Name, "11193446")
            };
                        var identity = new ClaimsIdentity(claims, Scheme.Name);
                        var principal = new ClaimsPrincipal(identity);
                        var ticket = new AuthenticationTicket(principal, Scheme.Name);
                        return AuthenticateResult.Success(ticket);
                    });
                }
            }
            catch
            {
                return await Task.Run(() =>
                {
                    return AuthenticateResult.Fail("Invalid Authorization Header");
                });
            }
        }
    }
}

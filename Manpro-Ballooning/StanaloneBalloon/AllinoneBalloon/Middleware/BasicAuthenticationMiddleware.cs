using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using AllinoneBalloon.Common;
using System.Net;
using System.Text;

namespace AllinoneBalloon.Middleware
{
    // You may need to install the Microsoft.AspNetCore.Http.Abstractions package into your project
    public class BasicAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
      

        public BasicAuthenticationMiddleware(RequestDelegate next)
        {
            _next = next;

        }
        public async Task Invoke(HttpContext context)
        {
            ErrorLog objerr = new AllinoneBalloon.Common.ErrorLog();
            string UserName = "11193446";
            string Password = "60-dayfreetrial";
            string authHeader = context.Request.Headers["Authorization"];
            objerr.WriteErrorLog("BasicAuthenticationMiddleware " + authHeader);
            objerr.WriteErrorLog("BasicAuthenticationMiddleware " + context.User.Identity.IsAuthenticated);
            // if (!context.User.Identity.IsAuthenticated)
            // {

            if (authHeader != null && authHeader.StartsWith("basic ", StringComparison.OrdinalIgnoreCase))
            {
                // Get the encoded username and password
                var encodedUsernamePassword = authHeader.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries)[1]?.Trim();

                // Decode from Base64 to string
                var decodedUsernamePassword = Encoding.UTF8.GetString(Convert.FromBase64String(encodedUsernamePassword));

                // Split username and password
                var username = decodedUsernamePassword.Split(':', 2)[0];
                var password = decodedUsernamePassword.Split(':', 2)[1];

                // Check if login is correct
                if (UserName == username && Password == password)
                {
                    objerr.WriteErrorLog(username + "" + password);
                    await _next(context);

                }
            }
            else
            {

                // Return authentication type (causes browser to show login dialog)
                context.Response.Headers["WWW-Authenticate"] = "Basic realm=\"my.net\"";
                objerr.WriteErrorLog("BasicAuthenticationMiddleware " + "Unauthorized");
                // Return unauthorized
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            }
          //  }
          //  else
          //  {
          //      objerr.WriteErrorLog("BasicAuthenticationMiddleware " + "Noauthorized");
           //     await _next(context);
          //  }
        }
    }

    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class BasicAuthenticationMiddlewareExtensions
    {
        public static IApplicationBuilder UseBasicAuthenticationMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<BasicAuthenticationMiddleware>();
        }
    }
}

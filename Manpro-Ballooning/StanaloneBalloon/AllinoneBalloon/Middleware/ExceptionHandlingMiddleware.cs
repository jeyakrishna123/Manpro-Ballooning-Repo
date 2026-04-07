using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System;
using System.Net;
using System.Runtime.Serialization;
using System.Threading.Tasks;

namespace AllinoneBalloon.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;

        }
        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleException(context, ex);
            }
        }
        private static Task HandleException(HttpContext context, Exception ex)
        {
            var errorMessage = JsonConvert.SerializeObject(new { Message = ex.Message , Code = "GE" });
           // Console.WriteLine(context);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            return context.Response.WriteAsync(errorMessage);
        }


    }

    public class DomainValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly List<string> _allowedDomains;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public DomainValidationMiddleware(RequestDelegate next, IConfiguration configuration, IWebHostEnvironment webHostEnvironment)
        {
            _next = next;
            _webHostEnvironment = webHostEnvironment;
            string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            var config = new ConfigurationBuilder()
               .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true) // Always load base appsettings.json
               .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true) // Optionally load environment-specific settings
               .Build();
            var corsPolicies = config.GetSection("AppSettings:CorsPolicies").GetChildren();
            // Add allowed domains here
            _allowedDomains = new List<string>();
            if (_webHostEnvironment.IsDevelopment()) {
                _allowedDomains.Add("localhost");
            }
            
            foreach (var policy in corsPolicies)
            {
                var origins = policy.GetSection("Origins");
                foreach (var origin in origins.GetChildren())
                {
                    string corsurl = origin.Value;
                    _allowedDomains.Add(corsurl);
                }
            }
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var referer = context.Request.Headers["Referer"].ToString();
            var origin = context.Request.Headers["Origin"].ToString();

            if (!string.IsNullOrEmpty(referer) || !string.IsNullOrEmpty(origin))
            {
                var requestDomain = new Uri(!string.IsNullOrEmpty(referer) ? referer : origin).Host;

                if (!_allowedDomains.Contains(requestDomain))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    var errorMessage = JsonConvert.SerializeObject(new { Message = "Requested Domain not allowed.", Code = "Forbidden" });
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(errorMessage);
                    return;
                }
            }

            await _next(context);
        }
    }

    public class UserAgentValidationMiddleware
    {
        private readonly RequestDelegate _next;

        public UserAgentValidationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var userAgent = context.Request.Headers["User-Agent"].ToString();

            // Block specific tools or allow only specific user agents
            if (userAgent.Contains("Postman") || string.IsNullOrEmpty(userAgent))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                var errorMessage = JsonConvert.SerializeObject(new { Message = "Requested source not allowed.", Code = "Forbidden" });
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(errorMessage);
                return;
            }

            await _next(context);
        }
    }

}

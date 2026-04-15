using Microsoft.AspNetCore.Mvc.Formatters;
using System.Reflection;
using Microsoft.AspNetCore.Session;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
//using Microsoft.Extensions.Logging;
//using Microsoft.Extensions.Logging.Log4Net.AspNetCore;
using System;
using System.Net.Sockets;
using Emgu.CV.Ocl;
using System.Net;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting.Internal;
using AllinoneBalloon.Controllers;
using Microsoft.EntityFrameworkCore;
using AllinoneBalloon;
using AllinoneBalloon.Middleware;
using AllinoneBalloon.Models.Configuration;
using AllinoneBalloon.Models;
//using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using System.Configuration;
using System.Text;
using AllinoneBalloon.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using AllinoneBalloon.Common;
using System.Diagnostics;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.AspNetCore.Authentication;
using System.Data.SqlClient;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);
    int timespan = 20;
   var corsPolicies = builder.Configuration.GetSection("AppSettings:CorsPolicies").GetChildren();
string SwaggerTitle = "Standalone AutoBallooning API";
// builder.Logging.AddLog4Net();
// Add the memory cache services
// Add services to the container.
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
        options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
        options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
    });
    builder.Services.AddMemoryCache();
    builder.Services.AddRazorPages().AddSessionStateTempDataProvider();
    builder.Services.AddControllersWithViews().AddSessionStateTempDataProvider();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Version = "1.0",
                Title = SwaggerTitle,
                Description = "Create Auto Balloon & Export as Excel for the provided (PNG/JPEG/PDF) Drawing files ",
                Contact = new Microsoft.OpenApi.Models.OpenApiContact
                {
                    Name = "Rajasekar Jeyakumar",
                    Email = "rajasekar.j@whiteox.in",
                    Url = new Uri("https://whiteox.in"),
                }              
            });
           c.OperationFilter<AddAuthorizationHeaderOperationFilter>();
            // Add Security Definition for JWT Authorization
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter 'Bearer {token}'"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
 
    var connectionString = builder.Configuration.GetSection("AppSettings:MySqlConnStr").Value;
    builder.Services.AddDbContextFactory<DimTestContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
 
builder.Services.AddAutoMapper(Assembly.GetEntryAssembly());
    // configure strongly typed settings objects
    var appSettingsSection = builder.Configuration.GetSection("AppSettings");
    builder.Services.Configure<AppSettings>(appSettingsSection);
    string env = builder.Environment.EnvironmentName; // "Development", "Production", etc.
    var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
    string ClientAppUrl = builder.Configuration.GetSection("AppSettings:ClientAppUrl").Value ?? string.Empty;
    bool isDev = builder.Environment.IsDevelopment();

    // Collect all configured CORS origins from appsettings.{Environment}.json
    var configuredOrigins = new List<string>();
    #pragma warning disable CS8600, CS8602, CS8604
    foreach (var policy in corsPolicies)
    {
        var origins = policy.GetSection("Origins");
        foreach (var origin in origins.GetChildren())
        {
            if (!string.IsNullOrWhiteSpace(origin.Value))
                configuredOrigins.Add(origin.Value.TrimEnd('/'));
        }
    }
    #pragma warning restore CS8600, CS8602, CS8604
    // Include ClientAppUrl if not already in the list
    if (!string.IsNullOrWhiteSpace(ClientAppUrl) && !configuredOrigins.Contains(ClientAppUrl.TrimEnd('/')))
        configuredOrigins.Add(ClientAppUrl.TrimEnd('/'));

    builder.Services.AddCors(options =>
    {
        options.AddPolicy(name: MyAllowSpecificOrigins, policyBuilder =>
        {
            if (isDev)
            {
                // In development, allow all localhost origins dynamically
                policyBuilder.SetIsOriginAllowed(origin =>
                {
                    var host = new Uri(origin).Host;
                    return host == "localhost" || host == "127.0.0.1" || configuredOrigins.Contains(origin.TrimEnd('/'));
                });
            }
            else
            {
                // In production, only allow explicitly configured origins
                policyBuilder.WithOrigins(configuredOrigins.ToArray());
            }

            policyBuilder
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials()
                .WithExposedHeaders("Content-Disposition");
        });
    });
// configure jwt authentication
var appSettings = appSettingsSection.Get<AppSettings>();
    var key = Encoding.ASCII.GetBytes(appSettings.Secret);
    var Issuer = appSettings.Issuer;
    builder.Services.AddScoped<IUserService, UserService>();

// Identity still requires the DbContext to be available for the stores.register it as scoped too, or create a custom implementation that leverages the factory.
builder.Services.AddScoped<DimTestContext>(provider =>
    provider.GetRequiredService<IDbContextFactory<DimTestContext>>().CreateDbContext());

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(o =>
    {
        //o.SecurityTokenValidators.Add(new CustomValidator());
        o.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                #pragma warning disable CS8600, CS8602, CS8604
                ErrorLog objerr = new AllinoneBalloon.Common.ErrorLog();
                var userService = context.HttpContext.RequestServices.GetRequiredService<IUserService>();
                var dbContextFactory = context.HttpContext.RequestServices.GetRequiredService<IDbContextFactory<DimTestContext>>();
                var userId = long.Parse(context.Principal.Identity.Name);
                using (var dbContext = dbContextFactory.CreateDbContext())
                {
                    var user =  dbContext.Users.Find(userId);
                    //objerr.WriteErrorLog("AddJwtBearer " + context.Principal.Identity.Name);
                    if (user == null)
                    {
                        // return unauthorized if user no longer exists
                        context.Fail("Unauthorized");
                    }
                    return Task.CompletedTask;
                }
                #pragma warning restore CS8600, CS8602, CS8604
            }
        };

        o.RequireHttpsMetadata = false; // Set to true when production has SSL/HTTPS configured
        o.SaveToken = true;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = Issuer,
            ValidAudience = Issuer,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),
            ValidateIssuerSigningKey = true
        };
    });
// Add Basic Authentication
//builder.Services.AddAuthentication("Basic").AddScheme<AuthenticationSchemeOptions, BasicAuthenticationHandler>("Basic", null);

builder.Services.AddAuthorization();
builder.Services.AddControllers()
        .AddNewtonsoftJson(options =>
        {
            options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        })
        .ConfigureApiBehaviorOptions(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var result = new UnprocessableEntityObjectResult(context.ModelState);
                result.ContentTypes.Add("application/json");
                return result;
            };
        });
        builder.Services.Configure<MailSettings>(builder.Configuration.GetSection("MailSettings"));
        builder.Services.AddTransient<IMailService, MailService>();

    // OCR Services
    builder.Services.AddHttpClient<PaddleOcrService>();
    builder.Services.AddScoped<IOcrServiceFactory, OcrServiceFactory>();
    // Auto-start PaddleOCR Python service when backend starts
    builder.Services.AddHostedService<PaddleOcrHostedService>();

    builder.Services.AddEndpointsApiExplorer();

    // Step 1 to use session  
    builder.Services.AddDistributedMemoryCache();
    var sessionTimeout = builder.Configuration.GetValue<int>("AppSettings:SessionTimeout", 10);
    builder.Services.AddSession(options =>
    {
        options.IdleTimeout = TimeSpan.FromMinutes(sessionTimeout);
        options.Cookie.Name = "bubble";
        options.Cookie.HttpOnly = true;
        options.Cookie.IsEssential = true;
        options.Cookie.SecurePolicy = isDev ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    });

    builder.Services.Configure<CookiePolicyOptions>(options =>
    {
        options.CheckConsentNeeded = context => false;
        options.MinimumSameSitePolicy = SameSiteMode.None;

        var env = builder.Environment;
        options.Secure = env.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    });

    builder.Services.AddHttpContextAccessor();
 
    builder.WebHost.ConfigureKestrel(c =>
    {
        c.Limits.MaxRequestBodySize = 52428800; // 50 MB — matches upload validation in FileUploadController
        c.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(timespan);
        c.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(1);
    });

// builder.Services.AddLogging(builder => builder.AddConsole());
// builder.WebHost.UseKestrel();
if (builder.Environment.IsDevelopment())
{
    builder.Logging.SetMinimumLevel(LogLevel.Debug);
    builder.Logging.AddConsole();
}
builder.WebHost.UseIISIntegration();
var app = builder.Build();
    //ILogger logger = app.Logger;
    string ErrorLog = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ErrorLog");
    string serverDrawing = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ClientApp", "src", "drawing");
    string serverDrawingsample = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ClientApp", "src", "drawing", "sample");
string WorkingDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Drawed Images");
    string SourceDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SourceDrawings");

    // Create folders if they do not exist
    if (!Directory.Exists(ErrorLog))
    {
        Directory.CreateDirectory(ErrorLog);
    }

    if (!Directory.Exists(serverDrawing))
    {
        Directory.CreateDirectory(serverDrawing);
    }
    if (!Directory.Exists(serverDrawingsample))
    {
        Directory.CreateDirectory(serverDrawingsample);
    }
if (!Directory.Exists(WorkingDir))
    {
        Directory.CreateDirectory(WorkingDir);
    }
if (!Directory.Exists(SourceDir))
{
    Directory.CreateDirectory(SourceDir);
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }
    else
    {
        app.UseExceptionHandler("/Home/Error");
    }

    app.Use(async (context, next) =>
    {
        try
        {
            if (context.Request.Method == "OPTIONS")
            {
                var origin = context.Request.Headers["Origin"].ToString();
                bool isAllowed = false;

                if (!string.IsNullOrEmpty(origin))
                {
                    if (isDev)
                    {
                        var host = new Uri(origin).Host;
                        isAllowed = host == "localhost" || host == "127.0.0.1" || configuredOrigins.Contains(origin.TrimEnd('/'));
                    }
                    else
                    {
                        isAllowed = configuredOrigins.Contains(origin.TrimEnd('/'));
                    }
                }

                if (isAllowed)
                {
                    context.Response.Headers.Add("Access-Control-Allow-Origin", origin);
                    context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
                    context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
                    context.Response.Headers.Add("Access-Control-Allow-Credentials", "true");
                }
                context.Response.StatusCode = 200;
                return;
            }
            await next();
        }
        catch (Exception ex)
        {
            string Path = string.Empty;
            string ErrorlineNo = string.Empty;
            string Errormsg = string.Empty;
            string extype = string.Empty;
            string ErrorLocation = string.Empty;
            string ErrorLog = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ErrorLog");
            Path = ErrorLog;
            var line = Environment.NewLine + Environment.NewLine;
            if (!Directory.Exists(Path))
            {
                Directory.CreateDirectory(Path);
            }
            Path = System.IO.Path.Combine(Path, DateTime.Today.ToString("dd-MM-yy") + ".txt");   //Text File Name
            if (!File.Exists(Path))
            {
                File.Create(Path).Dispose();
            }
            var st = new StackTrace(ex, true);
            var frame = st.GetFrame(0);
            if (frame != null)
            {
                ErrorlineNo = frame.GetFileLineNumber().ToString();
            }
            if (string.IsNullOrEmpty(ErrorlineNo) || ErrorlineNo == "0")
            {
                // Fallback: try to extract line number from stack trace string
                if (!string.IsNullOrEmpty(ex.StackTrace))
                {
                    int value;
                    bool success = int.TryParse(ex.StackTrace.Substring(ex.StackTrace.LastIndexOf(' ')).Trim(), out value);
                    if (success)
                        ErrorlineNo = value.ToString();
                    else
                        ErrorlineNo = "";
                }
                else
                    ErrorlineNo = "";
            }
            Errormsg = ex.GetType().Name.ToString();
            extype = ex.GetType().ToString();
            //exurl = HttpContext.Current.Request.Url.ToString();
            ErrorLocation = ex.Message.ToString();
            using (StreamWriter sw = File.AppendText(Path))
            {
                string error = "Log Written Date:" + " " + DateTime.Now.ToString() + line + "Error Line No :" + " " + ErrorlineNo + line + "Error Message:" + " " + Errormsg + line + "Exception Type:" + " " + extype + line + "Error Location :" + " " + ErrorLocation + line;
                sw.WriteLine("-----------Exception Details on " + " " + DateTime.Now.ToString() + "-----------------");
                sw.WriteLine("-------------------------------------------------------------------------------------");
                sw.WriteLine(line);
                sw.WriteLine(error);
                sw.WriteLine("--------------------------------*End*------------------------------------------");
                sw.WriteLine(line);
                sw.Flush();
                sw.Close();
            }
            // Log exception
            throw;
        }
    });
// app.UseHttpsRedirection();
app.UseResponseCompression();
//app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
               Path.Combine(builder.Environment.ContentRootPath, "ClientApp")),
        RequestPath = "/StaticFiles"
    });
    app.UseStatusCodePages();
    app.UseCookiePolicy();
    // Use the CORS policy
    app.UseSwagger();
    // Enable middleware to serve Swagger-UI (HTML, JS, CSS, etc.),
    // specifying the Swagger JSON endpoint.
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", SwaggerTitle);
        if (!builder.Environment.IsDevelopment())
        {
            c.RoutePrefix = string.Empty;  // Set Swagger UI at the root in production
        }
    });
 
    // use Middleware
    app.UseMiddleware(typeof(ExceptionHandlingMiddleware));
    app.UseMiddleware<DomainValidationMiddleware>();
    app.UseMiddleware<UserAgentValidationMiddleware>();
    // app.UseMiddleware<BasicAuthenticationMiddleware>();

    app.UseRouting();

    app.UseCors(MyAllowSpecificOrigins);

    app.UseAuthentication();
    app.UseAuthorization();
    app.UseSession();
//app.UseCors("CorsPolicy");
 
//app.UseMiddleware<RequestTimeoutMiddleware>(TimeSpan.FromMinutes(timespan));
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
  //  endpoints.MapHub<SocketHub>("/socket");
});
//app.MapControllers();
    app.MapRazorPages();
    app.MapControllerRoute(
        name: "default",
        pattern: "{controller}/{action=Index}/{id?}");

    app.MapFallbackToFile("index.html");
    if (!app.Environment.IsDevelopment())
    {
        #pragma warning disable CS8602,CS8604 // Dereference of a possibly null reference.
    //var company = Assembly.GetEntryAssembly()
      //     .GetCustomAttribute<SpaRootAttribute>()
        //   .Company;
    // Get the current assembly
    var assembly = Assembly.GetExecutingAssembly();
    // Get the current assembly

    var versionInfo = FileVersionInfo.GetVersionInfo(Assembly.GetEntryAssembly().Location);
    string policykey = string.Empty;
    StringBuilder FWords = new StringBuilder();
    foreach (var policy in corsPolicies)
    {
        policykey = policy.Key;
        
        var origins = policy.GetSection("Origins");
        foreach (var origin in origins.GetChildren())
        {
            string corsurl = origin.Value;
            FWords.AppendLine(corsurl);
        }
    }
        var companyName = versionInfo.CompanyName;
        #pragma warning restore CS8602,CS8604 // Dereference of a possibly null reference.
    app.MapGet("/info", () => $"Welcome to {companyName}-{env}-{ClientAppUrl}");
    }

    app.Run();

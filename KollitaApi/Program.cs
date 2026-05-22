using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using KollitaApi.Data;
using KollitaApi.Data.Collections;
using KollitaApi.Data.Repositories;
using KollitaApi.Hubs;
using KollitaApi.Services;
using KollitaApi.Services.Implementations;
using KollitaApi.Services.Interfaces;
using Microsoft.AspNetCore.HttpOverrides;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ── JWT Authentication ────────────────────────────────────
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
             ?? builder.Configuration["Jwt:Key"]
             ?? "KollitaPro_SuperSecretKey_2025_MinLength32Chars!";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                ?? builder.Configuration["Jwt:Issuer"]
                ?? "KollitaApi";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                  ?? builder.Configuration["Jwt:Audience"]
                  ?? "KollitaPro";

builder.Services.AddSingleton(new TokenService(jwtKey, jwtIssuer, jwtAudience));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1)
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/kollita"))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Secretario", policy => policy.RequireRole("Secretario", "Encargado", "Supervisor", "Omega", "Senior", "AdminMovil"));
    options.AddPolicy("Admin", policy => policy.RequireRole("Omega", "Senior", "AdminMovil"));
    options.AddPolicy("Cliente", policy => policy.RequireRole("Cliente", "Secretario", "Encargado", "Supervisor", "Omega", "Senior", "AdminMovil"));
});

// ── SignalR ─────────────────────────────────────────────
builder.Services.AddSignalR();

// ── Rate Limiting ──────────────────────────────────────────
builder.Services.AddRateLimiter(options => {
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString()
                          ?? httpContext.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 300,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
    options.RejectionStatusCode = 429;

    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 20,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// ── Base de datos: Supabase REST (no requiere password DB) ─
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IUsuarioRepository, SupabaseRestRepository>();
// Repos EF Core legacy (para pedidos/pendientes/cierres)
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") ?? "Host=localhost;Database=postgres;Username=postgres;Password=;SSL Mode=Prefer";
builder.Services.AddDbContext<KollitaDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── Repository Pattern ─────────────────────────────────
builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();
builder.Services.AddScoped<IPendienteRepository, PendienteRepository>();
builder.Services.AddScoped<ICierreRepository, CierreRepository>();
builder.Services.AddScoped<IConfigSucursalRepository, ConfigSucursalRepository>();

// ── Service Layer ──────────────────────────────────────
builder.Services.AddScoped<IPedidoService, PedidoService>();
builder.Services.AddScoped<IPendienteService, PendienteService>();
builder.Services.AddScoped<ICierreService, CierreService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IConfigService, ConfigService>();

// ── Data Structures ────────────────────────────────────
builder.Services.AddSingleton<KitchenOrderQueue>();

// ── CORS ───────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("KollitaCors", policy =>
    {
        policy.WithOrigins(
                "https://kollita-movil-public.vercel.app",
                "https://kollita-pro-bice.vercel.app",
                "https://kollita-pro.vercel.app",
                "https://kollita.vercel.app",
                "http://localhost:5500",
                "http://localhost:3000",
                "http://127.0.0.1:5500"
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    var start = DateTime.UtcNow;
    await next();
    var elapsed = DateTime.UtcNow - start;
    if (elapsed.TotalMilliseconds > 1000)
        Console.WriteLine($"[SLOW] {context.Request.Method} {context.Request.Path} - {elapsed.TotalMilliseconds:F0}ms");
});

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Xss-Protection", "1; mode=block");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
    app.UseHsts();
// app.UseHttpsRedirection(); // Desactivado: Render maneja TLS

app.UseRateLimiter();
app.UseCors("KollitaCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "KollitaApi",
    version = "3.0.0",
    auth = "JWT Bearer",
    ts = DateTime.UtcNow
}));

app.MapGet("/", () => Results.Ok(new
{
    name = "Kollita Pro API",
    version = "3.0.0",
    status = "running",
    auth = "JWT Bearer",
    docs = "/health"
}));

app.UseExceptionHandler(err => {
    err.Run(async context => {
        var ex = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var msg = ex?.Error?.Message ?? "Unknown error";
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync($"{{\"error\":\"{msg.Replace("\"", "'").Replace("\n", " ")}\"}}");
    });
});

app.MapHub<KollitaHub>("/hubs/kollita");

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");

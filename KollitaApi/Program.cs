using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using KollitaApi.Data;
using KollitaApi.Data.Collections;
using KollitaApi.Data.Repositories;
using KollitaApi.Hubs;
using KollitaApi.Messaging;
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

// ── Redis Message Broker (pub/sub + SignalR backplane) ────
var redisConnection = Environment.GetEnvironmentVariable("REDIS_URL")
                      ?? "localhost:6379";

try
{
    var broker = new RedisMessageBroker(redisConnection);
    var eventBus = new EventBus(broker);

    builder.Services.AddSingleton<IMessageBroker>(broker);
    builder.Services.AddSingleton<IEventBus>(eventBus);

    builder.Services.AddSignalR()
        .AddStackExchangeRedis(redisConnection, options =>
        {
            options.Configuration.ChannelPrefix = "KollitaSignalR";
        });
}
catch
{
    // Fallback: sin Redis, usar SignalR en memoria
    builder.Services.AddSignalR();
}

// ── Rate Limiting ──────────────────────────────────────────
builder.Services.AddRateLimiter(options => {
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString()
                          ?? httpContext.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit        = 300,
                QueueLimit         = 0,
                Window             = TimeSpan.FromMinutes(1)
            }));
    options.RejectionStatusCode = 429;

    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit        = 20,
                QueueLimit         = 0,
                Window             = TimeSpan.FromMinutes(1)
            }));
});

// ── Base de datos: PostgreSQL Supabase ─────────────────────
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")!;
builder.Services.AddDbContext<KollitaDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── Repository Pattern (OOP: encapsulamiento) ──────────────
builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();
builder.Services.AddScoped<IPendienteRepository, PendienteRepository>();
builder.Services.AddScoped<ICierreRepository, CierreRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IConfigSucursalRepository, ConfigSucursalRepository>();

// ── Service Layer (OOP: polimorfismo via interfaces) ───────
builder.Services.AddScoped<IPedidoService, PedidoService>();
builder.Services.AddScoped<IPendienteService, PendienteService>();
builder.Services.AddScoped<ICierreService, CierreService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IConfigService, ConfigService>();

// ── Data Structures (OOP: colecciones propias) ─────────────
builder.Services.AddSingleton<KitchenOrderQueue>();
builder.Services.AddSingleton<UndoManager<object>>();

// ── CORS: Permitir Vercel + localhost ──────────────────────
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
builder.Services.AddResponseCaching();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// ── Request logging ─────────────────────────────────────
app.Use(async (context, next) =>
{
    var start = DateTime.UtcNow;
    await next();
    var elapsed = DateTime.UtcNow - start;
    if (elapsed.TotalMilliseconds > 1000)
        Console.WriteLine($"[SLOW] {context.Request.Method} {context.Request.Path} — {elapsed.TotalMilliseconds:F0}ms");
});

// ── Seguridad: Headers HTTP ─────────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options",        "DENY");
    context.Response.Headers.Append("X-Xss-Protection",      "1; mode=block");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy",        "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy",     "geolocation=(), microphone=()");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'");
    await next();
});

app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
    app.UseHsts();
app.UseHttpsRedirection();

app.UseRateLimiter();
app.UseCors("KollitaCors");
app.UseAuthentication();
app.UseAuthorization();
app.UseResponseCaching();
app.MapControllers();

// ── Health Check ────────────────────────────────────────
app.MapGet("/health", () => Results.Ok(new {
    status  = "healthy",
    service = "KollitaApi",
    version = "3.0.0",
    auth    = "JWT Bearer",
    redis   = Environment.GetEnvironmentVariable("REDIS_URL") != null ? "connected" : "unavailable",
    region  = "Render — São Paulo adjacent",
    ts      = DateTime.UtcNow
}));

app.MapGet("/", () => Results.Ok(new {
    name    = "Kollita Pro API",
    version = "3.0.0",
    status  = "running",
    auth    = "JWT Bearer",
    docs    = "/health"
}));

// ── Event Bus subscriptions ─────────────────────────────
var eventBus = app.Services.GetRequiredService<IEventBus>();
var broker = app.Services.GetRequiredService<IMessageBroker>();

await eventBus.SubscribeAsync("signalr", async msg =>
{
    Console.WriteLine($"[EVENT] {msg.Channel}/{msg.Type} from {msg.OriginService}");
    await Task.CompletedTask;
});

await eventBus.SubscribeAsync("pedidos", async msg =>
{
    Console.WriteLine($"[PEDIDO] {msg.Type} — {msg.Timestamp:HH:mm:ss}");
    await Task.CompletedTask;
});

await eventBus.SubscribeAsync("pendientes", async msg =>
{
    Console.WriteLine($"[PENDIENTE] {msg.Type} — {msg.Timestamp:HH:mm:ss}");
    await Task.CompletedTask;
});

app.UseExceptionHandler("/error");
app.MapGet("/error", () => Results.Problem("An internal error occurred", statusCode: 500));

app.MapHub<KollitaHub>("/hubs/kollita");

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");

using Microsoft.EntityFrameworkCore;
using KollitaApi.Data;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ── Rate Limiting (Seguridad anti-DDoS) ─────────────────────
builder.Services.AddRateLimiter(options => {
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString()
                          ?? httpContext.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit        = 120,
                QueueLimit         = 0,
                Window             = TimeSpan.FromMinutes(1)
            }));
    options.RejectionStatusCode = 429;
});

// ── Base de datos: PostgreSQL Supabase ───────────────────────
var connectionString =
    Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("KollitaDb");

builder.Services.AddDbContext<KollitaDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── CORS: Permitir Vercel + localhost ────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("KollitaCors", policy =>
    {
        policy.WithOrigins(
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

// ── SignalR (tiempo real) ────────────────────────────────────
builder.Services.AddSignalR();

var app = builder.Build();

// ── Seguridad: Headers HTTP ──────────────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options",        "DENY");
    context.Response.Headers.Append("X-Xss-Protection",      "1; mode=block");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy",        "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy",     "geolocation=(), microphone=()");
    await next();
});

// ── HSTS en producción ───────────────────────────────────────
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
app.UseHttpsRedirection();

app.UseRateLimiter();
app.UseCors("KollitaCors");
app.UseAuthorization();
app.MapControllers();

// ── Health Check (Render lo usa para verificar el servicio) ──
app.MapGet("/health", () => Results.Ok(new {
    status  = "healthy",
    service = "KollitaApi",
    version = "1.0.0",
    region  = "Render — São Paulo adjacent",
    ts      = DateTime.UtcNow
}));

app.MapGet("/", () => Results.Ok(new {
    name    = "Kollita Pro API",
    version = "1.0.0",
    status  = "running",
    docs    = "/health"
}));

// ── Migraciones automáticas al inicio ───────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<KollitaDbContext>();
    try   { db.Database.Migrate(); }
    catch { db.Database.EnsureCreated(); }
}

// Render inyecta PORT como variable de entorno
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");

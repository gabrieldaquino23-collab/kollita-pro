using System.Text.Json;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Data.Repositories;

public class SupabaseRestRepository : IUsuarioRepository
{
    private readonly HttpClient _http;
    private readonly string _srKey;
    private const string MgmtApiBase = "https://api.supabase.com/v1/projects/wsqhzatsuymjoebzfhpg/database/query";

    public SupabaseRestRepository(HttpClient http, IConfiguration config)
    {
        _http = http;
        _srKey = config["SUPABASE_SR_KEY"] ?? Environment.GetEnvironmentVariable("SUPABASE_SR_KEY") ?? "";
    }

    private System.Net.Http.HttpRequestMessage SqlReq(string sql) =>
        new(HttpMethod.Post, MgmtApiBase) {
            Headers = { { "Authorization", $"Bearer {_srKey}" } },
            Content = JsonContent.Create(new { query = sql })
        };

    private async Task<List<Dictionary<string, object>>> ExecuteSql(string sql)
    {
        var req = SqlReq(sql);
        var res = await _http.SendAsync(req);
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json) ?? new();
    }

    private static Models.Usuario MapUser(Dictionary<string, object> row)
    {
        static long ToLong(object v) => v is JsonElement je && je.ValueKind == JsonValueKind.Number ? je.GetInt64() : Convert.ToInt64(v);
        static string ToStr(object v) => v?.ToString() ?? "";
        static bool ToBool(object v) => v is JsonElement je ? (je.ValueKind == JsonValueKind.True || (je.ValueKind == JsonValueKind.String && je.GetString() == "true")) : Convert.ToBoolean(v);
        static DateTime? ToDate(object v) => v == null ? null : v is JsonElement je && je.ValueKind == JsonValueKind.String ? DateTime.Parse(je.GetString()!) : null;

        return new Models.Usuario
        {
            Id = ToLong(row["id"]),
            Email = ToStr(row["email"]),
            PasswordHash = ToStr(row["password_hash"]),
            Nombre = ToStr(row["nombre"]),
            Rol = ToStr(row["rol"]),
            Sucursal = ToStr(row["sucursal"]),
            Activo = ToBool(row["activo"]),
            UltimoAcceso = ToDate(row.GetValueOrDefault("ultimo_acceso"))
        };
    }

    public async Task<Models.Usuario?> GetByEmailAsync(string email)
    {
        var rows = await ExecuteSql($"SELECT * FROM usuarios WHERE email = '{email.Replace("'", "''")}' LIMIT 1");
        return rows.FirstOrDefault() is { } r ? MapUser(r) : null;
    }

    public async Task<Models.Usuario?> GetActivoByEmailAsync(string email)
    {
        var rows = await ExecuteSql($"SELECT * FROM usuarios WHERE email = '{email.Replace("'", "''")}' AND activo = true LIMIT 1");
        return rows.FirstOrDefault() is { } r ? MapUser(r) : null;
    }

    public async Task<Models.Usuario?> GetByIdAsync(long id)
    {
        var rows = await ExecuteSql($"SELECT * FROM usuarios WHERE id = {id} LIMIT 1");
        return rows.FirstOrDefault() is { } r ? MapUser(r) : null;
    }

    public Task<IEnumerable<Models.Usuario>> GetAllAsync(int limit = 500)
        => throw new NotImplementedException();

    public async Task<Models.Usuario> AddAsync(Models.Usuario entity)
    {
        var sql = $"INSERT INTO usuarios (email, password_hash, nombre, rol, sucursal, activo) VALUES ('{entity.Email.Replace("'", "''")}', '{entity.PasswordHash.Replace("'", "''")}', '{entity.Nombre.Replace("'", "''")}', '{entity.Rol}', '{entity.Sucursal}', {entity.Activo.ToString().ToLower()}) RETURNING *";
        var rows = await ExecuteSql(sql);
        return MapUser(rows.First());
    }

    public async Task<Models.Usuario> UpdateAsync(Models.Usuario entity)
    {
        var sql = $"UPDATE usuarios SET email = '{entity.Email.Replace("'", "''")}', password_hash = '{entity.PasswordHash.Replace("'", "''")}', nombre = '{entity.Nombre.Replace("'", "''")}', rol = '{entity.Rol}', sucursal = '{entity.Sucursal}', activo = {entity.Activo.ToString().ToLower()}, ultimo_acceso = {(entity.UltimoAcceso.HasValue ? $"'{entity.UltimoAcceso.Value:O}'" : "NULL")} WHERE id = {entity.Id}";
        await ExecuteSql(sql);
        return entity;
    }

    public async Task DeleteAsync(long id)
    {
        await ExecuteSql($"DELETE FROM usuarios WHERE id = {id}");
    }

    public Task<int> SaveChangesAsync() => Task.FromResult(0);
}

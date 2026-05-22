using System.Text.Json;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Data.Repositories;

public class SupabaseRestRepository : IUsuarioRepository
{
    private readonly HttpClient _http;
    private readonly string _srKey;
    private const string BaseUrl = "https://wsqhzatsuymjoebzfhpg.supabase.co/rest/v1";

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };

    public SupabaseRestRepository(HttpClient http, IConfiguration config)
    {
        _http = http;
        _srKey = config["SUPABASE_SR_KEY"] ?? Environment.GetEnvironmentVariable("SUPABASE_SR_KEY") ?? "";
    }

    private System.Net.Http.HttpRequestMessage NewReq(HttpMethod method, string path) =>
        new(method, $"{BaseUrl}/{path}") {
            Headers = {
                { "apikey", _srKey },
                { "Authorization", $"Bearer {_srKey}" },
                { "Prefer", "return=representation" }
            }
        };

    public async Task<Models.Usuario?> GetByEmailAsync(string email)
    {
        var req = NewReq(HttpMethod.Get, $"usuarios?email=eq.{Uri.EscapeDataString(email)}&limit=1");
        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return null;
        var list = await JsonSerializer.DeserializeAsync<List<Models.Usuario>>(await res.Content.ReadAsStreamAsync(), JsonOpts);
        return list?.FirstOrDefault();
    }

    public async Task<Models.Usuario?> GetActivoByEmailAsync(string email)
    {
        var req = NewReq(HttpMethod.Get, $"usuarios?email=eq.{Uri.EscapeDataString(email)}&activo=eq.true&limit=1");
        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return null;
        var list = await JsonSerializer.DeserializeAsync<List<Models.Usuario>>(await res.Content.ReadAsStreamAsync(), JsonOpts);
        return list?.FirstOrDefault();
    }

    public async Task<Models.Usuario?> GetByIdAsync(long id)
    {
        var req = NewReq(HttpMethod.Get, $"usuarios?id=eq.{id}&limit=1");
        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return null;
        var list = await JsonSerializer.DeserializeAsync<List<Models.Usuario>>(await res.Content.ReadAsStreamAsync(), JsonOpts);
        return list?.FirstOrDefault();
    }

    public Task<IEnumerable<Models.Usuario>> GetAllAsync(int limit = 500) =>
        throw new NotImplementedException();

    public async Task<Models.Usuario> AddAsync(Models.Usuario entity)
    {
        var req = NewReq(HttpMethod.Post, "usuarios");
        req.Content = JsonContent.Create(entity, options: JsonOpts);
        var res = await _http.SendAsync(req);
        res.EnsureSuccessStatusCode();
        var list = await JsonSerializer.DeserializeAsync<List<Models.Usuario>>(await res.Content.ReadAsStreamAsync(), JsonOpts);
        return list!.First();
    }

    public async Task<Models.Usuario> UpdateAsync(Models.Usuario entity)
    {
        var req = NewReq(HttpMethod.Patch, $"usuarios?id=eq.{entity.Id}");
        req.Content = JsonContent.Create(entity, options: JsonOpts);
        var res = await _http.SendAsync(req);
        res.EnsureSuccessStatusCode();
        return entity;
    }

    public async Task DeleteAsync(long id)
    {
        var req = NewReq(HttpMethod.Delete, $"usuarios?id=eq.{id}");
        await _http.SendAsync(req);
    }

    public Task<int> SaveChangesAsync() => Task.FromResult(0);
}

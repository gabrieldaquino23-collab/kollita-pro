using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KollitaApi.Data;
using KollitaApi.Models;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly KollitaDbContext _db;

    public ConfigController(KollitaDbContext db)
    {
        _db = db;
    }

    [HttpGet("sucursales")]
    public async Task<IActionResult> GetSucursales()
    {
        var sucursales = new[]
        {
            "3 Pasos", "Cuchilla", "G77 Av. Cambodromo", "Km8 Doble Vía La Guardia",
            "4to Anillo Canal Isuto", "Av. Paurito", "Virgen de Cotoca"
        };

        var configs = await _db.ConfigSucursales.ToListAsync();
        var resultado = sucursales.Select(suc =>
        {
            var cfg = configs.FirstOrDefault(c => c.Sucursal == suc);
            return new
            {
                nombre = suc,
                consulta = cfg?.Consulta ?? true,
                rapido = cfg?.Rapido ?? true
            };
        });

        return Ok(resultado);
    }

    [HttpPut("sucursales/{sucursal}")]
    public async Task<IActionResult> UpdateSucursal(string sucursal, [FromBody] ConfigSucursalDto dto)
    {
        var cfg = await _db.ConfigSucursales.FirstOrDefaultAsync(c => c.Sucursal == sucursal);
        if (cfg == null)
        {
            cfg = new ConfigSucursal { Sucursal = sucursal };
            _db.ConfigSucursales.Add(cfg);
        }

        if (dto.Consulta.HasValue) cfg.Consulta = dto.Consulta.Value;
        if (dto.Rapido.HasValue) cfg.Rapido = dto.Rapido.Value;

        await _db.SaveChangesAsync();
        return Ok(cfg);
    }
}

public class ConfigSucursalDto
{
    public bool? Consulta { get; set; }
    public bool? Rapido { get; set; }
}

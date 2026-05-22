using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KollitaApi.Models;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfigService _service;

    public ConfigController(IConfigService service)
    {
        _service = service;
    }

    [HttpGet("sucursales")]
    public async Task<IActionResult> GetSucursales()
    {
        var sucursales = await _service.GetSucursalesAsync();
        return Ok(sucursales);
    }

    [Authorize(Policy = "Admin")]
    [HttpPut("sucursales/{sucursal}")]
    public async Task<IActionResult> UpdateSucursal(string sucursal, [FromBody] ConfigSucursalDto dto)
    {
        var cfg = await _service.UpdateSucursalAsync(sucursal, dto.Consulta, dto.Rapido);
        return Ok(cfg);
    }
}

public class ConfigSucursalDto
{
    public bool? Consulta { get; set; }
    public bool? Rapido { get; set; }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KollitaApi.Models;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Cliente")]
public class PendientesController : ControllerBase
{
    private readonly IPendienteService _service;

    public PendientesController(IPendienteService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pendientes = await _service.GetPendientesAsync();
        return Ok(pendientes);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Pendiente pendiente)
    {
        var created = await _service.CreateAsync(pendiente);
        return Ok(created);
    }

    [HttpPut("{id}/preparar")]
    public async Task<IActionResult> MarcarPreparado(long id, [FromBody] MarcarPreparadoDto dto)
    {
        var pedido = await _service.MarcarPreparadoAsync(id, dto.Secretario, dto.NumeroNota);
        if (pedido == null) return NotFound(new { error = "Pendiente no encontrado" });
        return Ok(pedido);
    }
}

public class MarcarPreparadoDto
{
    public string? Secretario { get; set; }
    public string? NumeroNota { get; set; }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KollitaApi.Models;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PedidosController : ControllerBase
{
    private readonly IPedidoService _service;

    public PedidosController(IPedidoService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pedidos = await _service.GetAllAsync(500);
        return Ok(pedidos);
    }

    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
    {
        var resumen = await _service.GetResumenAsync();
        return Ok(resumen);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var pedido = await _service.GetByIdAsync(id);
        if (pedido == null) return NotFound(new { error = "Pedido no encontrado" });
        return Ok(pedido);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Pedido pedido)
    {
        var created = await _service.CreateAsync(pedido);
        return Ok(created);
    }

    [HttpPut("{id}/entregar")]
    public async Task<IActionResult> MarcarEntregado(long id, [FromBody] EntregaDto dto)
    {
        var pedido = await _service.MarcarEntregadoAsync(id, dto.MetodoPago,
            dto.TotalEntregado, dto.SaldoCobrado, dto.EfectivoPagado, dto.QrPagado);
        if (pedido == null) return NotFound(new { error = "Pedido no encontrado" });
        return Ok(pedido);
    }

    [HttpPost("{id}/producto")]
    public async Task<IActionResult> AgregarProducto(long id, [FromBody] ItemPedido item)
    {
        var pedido = await _service.AgregarProductoAsync(id, item);
        if (pedido == null) return NotFound(new { error = "Pedido no encontrado" });
        return Ok(pedido);
    }
}

public class EntregaDto
{
    public string MetodoPago { get; set; } = "EFECTIVO";
    public decimal TotalEntregado { get; set; }
    public decimal SaldoCobrado { get; set; }
    public decimal EfectivoPagado { get; set; }
    public decimal QrPagado { get; set; }
}

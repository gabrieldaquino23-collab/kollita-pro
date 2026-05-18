using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using KollitaApi.Data;
using KollitaApi.Hubs;
using KollitaApi.Models;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PedidosController : ControllerBase
{
    private readonly KollitaDbContext _db;
    private readonly IHubContext<KollitaHub> _hub;

    public PedidosController(KollitaDbContext db, IHubContext<KollitaHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pedidos = await _db.Pedidos.Include(p => p.Items).OrderByDescending(p => p.Id).Take(500).ToListAsync();
        return Ok(pedidos);
    }

    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
    {
        var hoy = DateTime.Now.ToString("yyyy-MM-dd");
        var mes = DateTime.Now.Month;
        var año = DateTime.Now.Year;

        var todos = await _db.Pedidos.Include(p => p.Items).ToListAsync();
        var delMes = todos.Where(p => DateTime.Parse(p.FechaID).Month == mes && DateTime.Parse(p.FechaID).Year == año).ToList();
        var entregadosMes = delMes.Where(p => p.Estado == "ENTREGADO").ToList();
        var entregadosHoy = todos.Where(p => p.Estado == "ENTREGADO" && (p.FechaIDEntrega ?? p.FechaID) == hoy).ToList();
        var preparados = todos.Where(p => p.Estado == "PREPARADO").ToList();
        var pendientes = await _db.Pendientes.CountAsync(p => p.Estado == "PENDIENTE");

        var totMes = entregadosMes.Sum(p => p.SaldoCobrado ?? p.TotalEntregado ?? p.Total);
        var totHoy = entregadosHoy.Sum(p => p.SaldoCobrado ?? p.TotalEntregado ?? p.Total);

        return Ok(new
        {
            totalPedidos = todos.Count,
            pedidosMes = delMes.Count,
            entregadosMes = entregadosMes.Count,
            totalEntregadoMes = totMes,
            ventasHoy = totHoy,
            entregasHoy = entregadosHoy.Count,
            preparados = preparados.Count,
            pendientes
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var pedido = await _db.Pedidos.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (pedido == null) return NotFound();
        return Ok(pedido);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Pedido pedido)
    {
        pedido.Estado ??= "PREPARADO";
        _db.Pedidos.Add(pedido);
        await _db.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("PedidoCreado", pedido);
        return Ok(pedido);
    }

    [HttpPut("{id}/entregar")]
    public async Task<IActionResult> MarcarEntregado(long id, [FromBody] EntregaDto dto)
    {
        var pedido = await _db.Pedidos.FindAsync(id);
        if (pedido == null) return NotFound();

        pedido.Estado = "ENTREGADO";
        pedido.MetodoPago = dto.MetodoPago;
        pedido.TotalEntregado = dto.TotalEntregado;
        pedido.SaldoCobrado = dto.SaldoCobrado;
        pedido.EfectivoPagado = dto.EfectivoPagado;
        pedido.QrPagado = dto.QrPagado;
        pedido.FechaEntrega = DateTime.Now.ToString("dd/MM/yyyy");
        pedido.HoraEntrega = DateTime.Now.ToString("HH:mm:ss");
        pedido.FechaIDEntrega = DateTime.Now.ToString("yyyy-MM-dd");

        await _db.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("PedidoActualizado", pedido);
        return Ok(pedido);
    }

    [HttpPost("{id}/producto")]
    public async Task<IActionResult> AgregarProducto(long id, [FromBody] ItemPedido item)
    {
        var pedido = await _db.Pedidos.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (pedido == null) return NotFound();

        item.PedidoId = id;
        pedido.Items.Add(item);
        pedido.Subtotal = pedido.Items.Sum(i => i.Cantidad * i.Precio);
        pedido.Total = pedido.Subtotal - pedido.Descuento;

        await _db.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("PedidoActualizado", pedido);
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

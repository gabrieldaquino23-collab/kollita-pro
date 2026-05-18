using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using KollitaApi.Data;
using KollitaApi.Hubs;
using KollitaApi.Models;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PendientesController : ControllerBase
{
    private readonly KollitaDbContext _db;
    private readonly IHubContext<KollitaHub> _hub;

    public PendientesController(KollitaDbContext db, IHubContext<KollitaHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pendientes = await _db.Pendientes.Include(p => p.Items)
            .Where(p => p.Estado == "PENDIENTE")
            .OrderByDescending(p => p.CreadoEn)
            .ToListAsync();
        return Ok(pendientes);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Pendiente pendiente)
    {
        pendiente.Estado = "PENDIENTE";
        pendiente.CreadoEn = DateTime.UtcNow;
        _db.Pendientes.Add(pendiente);
        await _db.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("NuevoPendiente", pendiente);
        return Ok(pendiente);
    }

    [HttpPut("{id}/preparar")]
    public async Task<IActionResult> MarcarPreparado(long id, [FromBody] MarcarPreparadoDto dto)
    {
        var pendiente = await _db.Pendientes.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (pendiente == null) return NotFound();

        pendiente.Estado = "PREPARADO";

        // Crear el pedido en la tabla de pedidos
        var pedido = new Pedido
        {
            Cliente = pendiente.Client,
            Subtotal = pendiente.Subtotal,
            Descuento = pendiente.Discount,
            Total = pendiente.Total,
            Fecha = DateTime.Now.ToString("dd/MM/yyyy"),
            FechaID = DateTime.Now.ToString("yyyy-MM-dd"),
            Hora = DateTime.Now.ToString("HH:mm:ss"),
            Estado = "PREPARADO",
            Origen = "movil",
            PedidoMovilId = pendiente.Id,
            NotaMovil = pendiente.Note,
            SucursalMovil = pendiente.Branch,
            Secretario = dto.Secretario ?? "SISTEMA",
            NumeroNota = dto.NumeroNota ?? "PEN-" + id.ToString().PadLeft(5, '0'),
            Items = pendiente.Items.Select(i => new ItemPedido
            {
                Nombre = i.Nombre,
                Cantidad = i.Cantidad,
                Precio = i.Precio
            }).ToList()
        };

        _db.Pedidos.Add(pedido);
        await _db.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("PendientePreparado", new { id, pedido });
        return Ok(pedido);
    }
}

public class MarcarPreparadoDto
{
    public string? Secretario { get; set; }
    public string? NumeroNota { get; set; }
}

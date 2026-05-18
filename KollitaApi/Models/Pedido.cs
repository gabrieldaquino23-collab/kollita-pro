namespace KollitaApi.Models;

public class Pedido
{
    public long Id { get; set; }
    public string NumeroNota { get; set; } = string.Empty;
    public string Secretario { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Total { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string FechaID { get; set; } = string.Empty;
    public string Hora { get; set; } = string.Empty;
    public string? MetodoPago { get; set; }
    public decimal PorcentajeDescuento { get; set; }
    public string Estado { get; set; } = "PREPARADO";

    // Delivery
    public bool EsDelivery { get; set; }
    public decimal MontoDelivery { get; set; }
    public string? RepartidorDelivery { get; set; }

    // Entrega
    public decimal? TotalEntregado { get; set; }
    public decimal? SaldoCobrado { get; set; }
    public decimal? EfectivoPagado { get; set; }
    public decimal? QrPagado { get; set; }
    public string? FechaEntrega { get; set; }
    public string? HoraEntrega { get; set; }
    public string? FechaIDEntrega { get; set; }
    public string? SecretarioEntrega { get; set; }
    public string? EntregadoPor { get; set; }
    public string? TurnoEntrega { get; set; }

    // Anticipo
    public decimal Anticipo { get; set; }
    public string? MetodoAnticipo { get; set; }

    // Origen
    public string? Origen { get; set; }
    public long? PedidoMovilId { get; set; }
    public string? NotaMovil { get; set; }
    public string? SucursalMovil { get; set; }

    // Items
    public List<ItemPedido> Items { get; set; } = new();
}

public class ItemPedido
{
    public long Id { get; set; }
    public long PedidoId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal Precio { get; set; }

    public Pedido? Pedido { get; set; }
}

namespace KollitaApi.Models;

public class Pendiente
{
    public long Id { get; set; }
    public string Client { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string? BranchTel { get; set; }
    public string Method { get; set; } = string.Empty;
    public string? Note { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public string Time { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string FechaISO { get; set; } = string.Empty;
    public string Estado { get; set; } = "PENDIENTE";
    public string Origen { get; set; } = "movil";
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public List<ItemPendiente> Items { get; set; } = new();
}

public class ItemPendiente
{
    public long Id { get; set; }
    public long PendienteId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal Precio { get; set; }

    public Pendiente? Pendiente { get; set; }
}

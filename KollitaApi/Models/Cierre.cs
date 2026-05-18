namespace KollitaApi.Models;

public class Cierre
{
    public long Id { get; set; }
    public string Secretario { get; set; } = string.Empty;
    public string Turno { get; set; } = string.Empty;
    public string FechaCierre { get; set; } = string.Empty;
    public string HoraCierre { get; set; } = string.Empty;
    public int CantidadVentas { get; set; }
    public decimal TotalGeneral { get; set; }
    public decimal TotalEfectivo { get; set; }
    public decimal TotalQR { get; set; }
    public decimal TotalMixtoEfectivo { get; set; }
    public decimal TotalMixtoQR { get; set; }
    public decimal TotalAnticipos { get; set; }
    public decimal TotalDescuentos { get; set; }
    public string? Sucursal { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
}

namespace KollitaApi.Models;

public class ConfigSucursal
{
    public int Id { get; set; }
    public string Sucursal { get; set; } = string.Empty;
    public bool Consulta { get; set; } = true;
    public bool Rapido { get; set; } = true;
}

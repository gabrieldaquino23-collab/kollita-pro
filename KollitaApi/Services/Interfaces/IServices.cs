using KollitaApi.Models;

namespace KollitaApi.Services.Interfaces;

public interface IPedidoService
{
    Task<List<Pedido>> GetAllAsync(int limit = 500);
    Task<Pedido?> GetByIdAsync(long id);
    Task<Pedido> CreateAsync(Pedido pedido);
    Task<Pedido?> MarcarEntregadoAsync(long id, string metodoPago, decimal totalEntregado, decimal saldoCobrado, decimal efectivoPagado, decimal qrPagado);
    Task<Pedido?> AgregarProductoAsync(long pedidoId, ItemPedido item);
    Task<object> GetResumenAsync();
}

public interface IPendienteService
{
    Task<List<Pendiente>> GetPendientesAsync();
    Task<Pendiente> CreateAsync(Pendiente pendiente);
    Task<Pedido?> MarcarPreparadoAsync(long id, string? secretario, string? numeroNota);
}

public interface ICierreService
{
    Task<List<Cierre>> GetAllAsync(int limit = 200);
    Task<Cierre> CreateAsync(Cierre cierre);
}

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task<string?> CambiarPasswordAsync(long userId, string nuevaPassword);
    Task<Usuario?> GetUserByIdAsync(long userId);
}

public interface IConfigService
{
    Task<List<object>> GetSucursalesAsync();
    Task<ConfigSucursal> UpdateSucursalAsync(string sucursal, bool? consulta, bool? rapido);
}

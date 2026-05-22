using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using KollitaApi.Data;
using KollitaApi.Hubs;
using KollitaApi.Messaging;
using KollitaApi.Models;
using KollitaApi.Services;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Services.Implementations;

public class PedidoService : IPedidoService
{
    private readonly IPedidoRepository _repo;
    private readonly IHubContext<KollitaHub> _hub;
    private readonly IEventBus _eventBus;

    public PedidoService(IPedidoRepository repo, IHubContext<KollitaHub> hub, IEventBus eventBus)
    {
        _repo = repo;
        _hub = hub;
        _eventBus = eventBus;
    }

    public async Task<List<Pedido>> GetAllAsync(int limit = 500) =>
        await _repo.GetWithItemsAsync(limit);

    public async Task<Pedido?> GetByIdAsync(long id) =>
        await _repo.GetByIdWithItemsAsync(id);

    public async Task<Pedido> CreateAsync(Pedido pedido)
    {
        pedido.Estado ??= "PREPARADO";
        await _repo.AddAsync(pedido);
        await _repo.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("PedidoCreado", pedido);
        await _eventBus.PublishAsync("pedidos", "PedidoCreado", pedido);
        return pedido;
    }

    public async Task<Pedido?> MarcarEntregadoAsync(long id, string metodoPago, decimal totalEntregado,
        decimal saldoCobrado, decimal efectivoPagado, decimal qrPagado)
    {
        var pedido = await _repo.GetByIdAsync(id);
        if (pedido == null) return null;

        pedido.Estado = "ENTREGADO";
        pedido.MetodoPago = metodoPago;
        pedido.TotalEntregado = totalEntregado;
        pedido.SaldoCobrado = saldoCobrado;
        pedido.EfectivoPagado = efectivoPagado;
        pedido.QrPagado = qrPagado;
        pedido.FechaEntrega = DateTime.UtcNow.ToString("dd/MM/yyyy");
        pedido.HoraEntrega = DateTime.UtcNow.ToString("HH:mm:ss");
        pedido.FechaIDEntrega = DateTime.UtcNow.ToString("yyyy-MM-dd");

        await _repo.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("PedidoActualizado", pedido);
        await _eventBus.PublishAsync("pedidos", "PedidoEntregado", new { id, totalEntregado });
        return pedido;
    }

    public async Task<Pedido?> AgregarProductoAsync(long pedidoId, ItemPedido item)
    {
        var pedido = await _repo.GetByIdWithItemsAsync(pedidoId);
        if (pedido == null) return null;

        item.PedidoId = pedidoId;
        pedido.Items.Add(item);
        pedido.Subtotal = pedido.Items.Sum(i => i.Cantidad * i.Precio);
        pedido.Total = pedido.Subtotal - pedido.Descuento;

        await _repo.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("PedidoActualizado", pedido);
        return pedido;
    }

    public async Task<object> GetResumenAsync()
    {
        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var mesPrefijo = $"{DateTime.UtcNow.Year}-{DateTime.UtcNow.Month:D2}";
        var pedidos = await _repo.GetWithItemsAsync(500);

        var totalPedidos = pedidos.Count;
        var pedidosMes = pedidos.Count(p => p.FechaID.StartsWith(mesPrefijo));
        var entregadosMes = pedidos.Count(p => p.Estado == "ENTREGADO" && p.FechaID.StartsWith(mesPrefijo));
        var entregadosHoy = pedidos.Count(p => p.Estado == "ENTREGADO" && p.FechaIDEntrega == hoy);
        var preparados = pedidos.Count(p => p.Estado == "PREPARADO");
        var totMes = pedidos.Where(p => p.Estado == "ENTREGADO" && p.FechaID.StartsWith(mesPrefijo))
            .Sum(p => p.SaldoCobrado ?? p.TotalEntregado ?? p.Total);
        var totHoy = pedidos.Where(p => p.Estado == "ENTREGADO" && p.FechaIDEntrega == hoy)
            .Sum(p => p.SaldoCobrado ?? p.TotalEntregado ?? p.Total);

        return new
        {
            totalPedidos, pedidosMes, entregadosMes = entregadosMes,
            totalEntregadoMes = totMes, ventasHoy = totHoy,
            entregasHoy = entregadosHoy, preparados,
            pendientes = 0
        };
    }
}

public class PendienteService : IPendienteService
{
    private readonly IPendienteRepository _pendienteRepo;
    private readonly IPedidoRepository _pedidoRepo;
    private readonly IHubContext<KollitaHub> _hub;
    private readonly IEventBus _eventBus;

    public PendienteService(IPendienteRepository pendienteRepo, IPedidoRepository pedidoRepo,
        IHubContext<KollitaHub> hub, IEventBus eventBus)
    {
        _pendienteRepo = pendienteRepo;
        _pedidoRepo = pedidoRepo;
        _hub = hub;
        _eventBus = eventBus;
    }

    public async Task<List<Pendiente>> GetPendientesAsync() =>
        await _pendienteRepo.GetPendientesWithItemsAsync();

    public async Task<Pendiente> CreateAsync(Pendiente pendiente)
    {
        pendiente.Estado = "PENDIENTE";
        pendiente.CreadoEn = DateTime.UtcNow;
        await _pendienteRepo.AddAsync(pendiente);
        await _pendienteRepo.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("NuevoPendiente", pendiente);
        await _eventBus.PublishAsync("pendientes", "NuevoPendiente", pendiente);
        return pendiente;
    }

    public async Task<Pedido?> MarcarPreparadoAsync(long id, string? secretario, string? numeroNota)
    {
        var pendiente = await _pendienteRepo.GetByIdWithItemsAsync(id);
        if (pendiente == null) return null;

        pendiente.Estado = "PREPARADO";

        var pedido = new Pedido
        {
            Cliente = pendiente.Client,
            Subtotal = pendiente.Subtotal,
            Descuento = pendiente.Discount,
            Total = pendiente.Total,
            Fecha = DateTime.UtcNow.ToString("dd/MM/yyyy"),
            FechaID = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Hora = DateTime.UtcNow.ToString("HH:mm:ss"),
            Estado = "PREPARADO",
            Origen = "movil",
            PedidoMovilId = pendiente.Id,
            NotaMovil = pendiente.Note,
            SucursalMovil = pendiente.Branch,
            Secretario = secretario ?? "SISTEMA",
            NumeroNota = numeroNota ?? "PEN-" + id.ToString().PadLeft(5, '0'),
            Items = pendiente.Items.Select(i => new ItemPedido
            {
                Nombre = i.Nombre, Cantidad = i.Cantidad, Precio = i.Precio
            }).ToList()
        };

        await _pedidoRepo.AddAsync(pedido);
        await _pendienteRepo.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("PendientePreparado", new { id, pedido });
        await _eventBus.PublishAsync("pendientes", "PendientePreparado", new { id, pedidoId = pedido.Id });
        return pedido;
    }
}

public class CierreService : ICierreService
{
    private readonly ICierreRepository _repo;
    public CierreService(ICierreRepository repo) => _repo = repo;

    public async Task<List<Cierre>> GetAllAsync(int limit = 200) =>
        (await _repo.GetAllAsync(limit)).ToList();

    public async Task<Cierre> CreateAsync(Cierre cierre)
    {
        await _repo.AddAsync(cierre);
        await _repo.SaveChangesAsync();
        return cierre;
    }
}

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _repo;
    private readonly TokenService _tokenService;

    public AuthService(IUsuarioRepository repo, TokenService tokenService)
    {
        _repo = repo;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var usuario = await _repo.GetActivoByEmailAsync(request.Email);
        if (usuario == null)
            throw new UnauthorizedAccessException("Credenciales inválidas");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas");

        var cambioContrasena = request.Password == "cambio1234";

        usuario.UltimoAcceso = DateTime.UtcNow;
        await _repo.SaveChangesAsync();

        var token = _tokenService.GenerateToken(usuario, cambioContrasena);

        return new LoginResponse
        {
            Token = token, Nombre = usuario.Nombre, Rol = usuario.Rol,
            Sucursal = usuario.Sucursal, Expira = DateTime.UtcNow.AddHours(8),
            CambioContrasena = cambioContrasena
        };
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
    {
        var existe = await _repo.GetByEmailAsync(request.Email);
        if (existe != null)
            throw new InvalidOperationException("El email ya está registrado");

        var usuario = new Usuario
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
            Nombre = request.Nombre, Rol = request.Rol, Sucursal = request.Sucursal,
            Activo = true, CreadoEn = DateTime.UtcNow
        };

        await _repo.AddAsync(usuario);
        await _repo.SaveChangesAsync();

        var token = _tokenService.GenerateToken(usuario, false);

        return new LoginResponse
        {
            Token = token, Nombre = usuario.Nombre, Rol = usuario.Rol,
            Sucursal = usuario.Sucursal, Expira = DateTime.UtcNow.AddHours(8),
            CambioContrasena = false
        };
    }

    public async Task<string?> CambiarPasswordAsync(long userId, string nuevaPassword)
    {
        var usuario = await _repo.GetByIdAsync(userId);
        if (usuario == null) return null;

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(nuevaPassword, 12);
        await _repo.SaveChangesAsync();

        return _tokenService.GenerateToken(usuario, false);
    }

    public async Task<Usuario?> GetUserByIdAsync(long userId) =>
        await _repo.GetByIdAsync(userId);
}

public class ConfigService : IConfigService
{
    private readonly IConfigSucursalRepository _repo;

    public ConfigService(IConfigSucursalRepository repo) => _repo = repo;

    public async Task<List<object>> GetSucursalesAsync()
    {
        var sucursales = new[]
        {
            "3 Pasos", "Cuchilla", "G77 Av. Cambodromo", "Km8 Doble Vía La Guardia",
            "4to Anillo Canal Isuto", "Av. Paurito", "Virgen de Cotoca"
        };

        var configs = await _repo.GetAllAsync();
        return sucursales.Select(suc =>
        {
            var cfg = configs.FirstOrDefault(c => c.Sucursal == suc);
            return (object)new
            {
                nombre = suc,
                consulta = cfg?.Consulta ?? true,
                rapido = cfg?.Rapido ?? true
            };
        }).ToList();
    }

    public async Task<ConfigSucursal> UpdateSucursalAsync(string sucursal, bool? consulta, bool? rapido)
    {
        var cfg = await _repo.GetBySucursalAsync(sucursal);
        if (cfg == null)
        {
            cfg = new ConfigSucursal { Sucursal = sucursal };
            await _repo.AddAsync(cfg);
        }

        if (consulta.HasValue) cfg.Consulta = consulta.Value;
        if (rapido.HasValue) cfg.Rapido = rapido.Value;

        await _repo.SaveChangesAsync();
        return cfg;
    }
}

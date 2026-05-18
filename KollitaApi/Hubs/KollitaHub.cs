using Microsoft.AspNetCore.SignalR;

namespace KollitaApi.Hubs;

public class KollitaHub : Hub
{
    public async Task NotificarNuevoPendiente(object pendiente)
    {
        await Clients.All.SendAsync("NuevoPendiente", pendiente);
    }

    public async Task NotificarPendientePreparado(object data)
    {
        await Clients.All.SendAsync("PendientePreparado", data);
    }

    public async Task NotificarPedidoActualizado(object pedido)
    {
        await Clients.All.SendAsync("PedidoActualizado", pedido);
    }

    public override async Task OnConnectedAsync()
    {
        await Clients.All.SendAsync("UsuarioConectado", Context.ConnectionId);
        await base.OnConnectedAsync();
    }
}

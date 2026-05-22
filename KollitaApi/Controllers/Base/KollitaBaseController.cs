using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using KollitaApi.Hubs;
using KollitaApi.Messaging;

namespace KollitaApi.Controllers.Base;

[ApiController]
[Authorize]
public abstract class KollitaBaseController : ControllerBase
{
    protected readonly IHubContext<KollitaHub> _hub;
    protected readonly IEventBus _eventBus;

    protected KollitaBaseController(IHubContext<KollitaHub> hub, IEventBus eventBus)
    {
        _hub = hub;
        _eventBus = eventBus;
    }

    protected string? GetUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    protected string? GetUserRol() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

    protected string? GetUserSucursal() =>
        User.FindFirst("sucursal")?.Value;

    protected async Task BroadcastAsync(string method, object data)
    {
        await _hub.Clients.All.SendAsync(method, data);
        await _eventBus.PublishAsync("signalr", method, System.Text.Json.JsonSerializer.Serialize(data));
    }

    protected OkObjectResult OkResponse(object data) => Ok(data);
    protected NotFoundObjectResult NotFoundResponse(string message = "Recurso no encontrado") =>
        NotFound(new { error = message });
    protected BadRequestObjectResult BadRequestResponse(string message) =>
        BadRequest(new { error = message });
}

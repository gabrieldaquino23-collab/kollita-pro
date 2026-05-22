namespace KollitaApi.Messaging;

public class EventMessage
{
    public string Type { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string OriginService { get; set; } = "KollitaApi";
}

public interface IEventBus
{
    Task PublishAsync(string channel, string type, object data);
    Task SubscribeAsync(string channel, Func<EventMessage, Task> handler);
    Task UnsubscribeAsync(string channel);
}

public interface IMessageBroker : IDisposable
{
    bool IsConnected { get; }
    Task ConnectAsync();
    Task PublishAsync(string channel, string message);
    Task SubscribeAsync(string channel, Action<string> handler);
}

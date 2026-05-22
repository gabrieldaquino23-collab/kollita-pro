using System.Text.Json;
using StackExchange.Redis;

namespace KollitaApi.Messaging;

public class RedisMessageBroker : IMessageBroker
{
    private readonly string _connectionString;
    private ConnectionMultiplexer? _redis;
    private ISubscriber? _subscriber;

    public bool IsConnected => _redis?.IsConnected ?? false;

    public RedisMessageBroker(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task ConnectAsync()
    {
        if (_redis != null) return;
        _redis = await ConnectionMultiplexer.ConnectAsync(_connectionString);
        _subscriber = _redis.GetSubscriber();
    }

    public async Task PublishAsync(string channel, string message)
    {
        if (_subscriber == null) await ConnectAsync();
        await _subscriber!.PublishAsync(new RedisChannel(channel, RedisChannel.PatternMode.Auto), message);
    }

    public async Task SubscribeAsync(string channel, Action<string> handler)
    {
        if (_subscriber == null) await ConnectAsync();
        await _subscriber!.SubscribeAsync(new RedisChannel(channel, RedisChannel.PatternMode.Auto),
            (_, value) => handler(value!));
    }

    public void Dispose()
    {
        _redis?.Dispose();
    }
}

public class EventBus : IEventBus
{
    private readonly IMessageBroker _broker;
    private readonly Dictionary<string, List<Func<EventMessage, Task>>> _handlers;

    public EventBus(IMessageBroker broker)
    {
        _broker = broker;
        _handlers = new Dictionary<string, List<Func<EventMessage, Task>>>();
    }

    public async Task PublishAsync(string channel, string type, object data)
    {
        var msg = new EventMessage
        {
            Type = type,
            Channel = channel,
            Data = JsonSerializer.Serialize(data),
            Timestamp = DateTime.UtcNow,
            OriginService = "KollitaApi"
        };

        var json = JsonSerializer.Serialize(msg);
        await _broker.PublishAsync(channel, json);

        if (_handlers.TryGetValue(channel, out var handlers))
        {
            foreach (var handler in handlers) await handler(msg);
        }
    }

    public async Task SubscribeAsync(string channel, Func<EventMessage, Task> handler)
    {
        if (!_handlers.ContainsKey(channel))
            _handlers[channel] = new List<Func<EventMessage, Task>>();

        _handlers[channel].Add(handler);

        await _broker.SubscribeAsync(channel, async (json) =>
        {
            try
            {
                var msg = JsonSerializer.Deserialize<EventMessage>(json);
                if (msg != null)
                {
                    if (_handlers.TryGetValue(channel, out var handlers))
                    {
                        foreach (var h in handlers) await h(msg);
                    }
                }
            }
            catch { }
        });
    }

    public Task UnsubscribeAsync(string channel)
    {
        _handlers.Remove(channel);
        return Task.CompletedTask;
    }
}

namespace KollitaApi.Microservices.Shared;

public class MicroserviceConfig
{
    public string ServiceName { get; set; } = "unknown";
    public string ServiceId { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public int Port { get; set; } = 8080;
    public string Environment { get; set; } = "development";
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
}

public class HealthResponse
{
    public string Status { get; set; } = "healthy";
    public string Service { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0.0";
    public string ServiceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

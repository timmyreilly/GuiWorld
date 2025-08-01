using Microsoft.AspNetCore.SignalR.Client;
using ServerWorld3D.Models;
using System.Text.Json;

namespace ServerWorld3D.Services;

public interface IServerMonitoringService
{
    Task<List<ServerState>> GetAllServerStatesAsync();
    Task<ServerState?> GetServerStateAsync(string serverId);
    Task<bool> UpdateServerConfigurationAsync(string serverId, Dictionary<string, object> config);
    event EventHandler<ServerState>? ServerStateUpdated;
    Task StartRealtimeUpdatesAsync();
    Task StopRealtimeUpdatesAsync();
}

public class ServerMonitoringService : IServerMonitoringService, IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ServerMonitoringService> _logger;
    private HubConnection? _hubConnection;
    private readonly JsonSerializerOptions _jsonOptions;

    public event EventHandler<ServerState>? ServerStateUpdated;

    public ServerMonitoringService(HttpClient httpClient, ILogger<ServerMonitoringService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    public async Task<List<ServerState>> GetAllServerStatesAsync()
    {
        try
        {
            // First try REST API
            var response = await _httpClient.GetAsync("/api/servers");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var servers = JsonSerializer.Deserialize<List<ServerState>>(json, _jsonOptions);
                return servers ?? new List<ServerState>();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch servers via REST API, falling back to mock data");
        }

        // Fallback to mock data for demo
        return GenerateMockServerStates();
    }

    public async Task<ServerState?> GetServerStateAsync(string serverId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/servers/{serverId}");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<ServerState>(json, _jsonOptions);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch server {ServerId} via REST API", serverId);
        }

        // Fallback to mock data
        var mockServers = GenerateMockServerStates();
        return mockServers.FirstOrDefault(s => s.Id == serverId);
    }

    public async Task<bool> UpdateServerConfigurationAsync(string serverId, Dictionary<string, object> config)
    {
        try
        {
            var json = JsonSerializer.Serialize(config, _jsonOptions);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PutAsync($"/api/servers/{serverId}/config", content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update server configuration for {ServerId}", serverId);
            return false;
        }
    }

    public async Task StartRealtimeUpdatesAsync()
    {
        try
        {
            _hubConnection = new HubConnectionBuilder()
                .WithUrl("/serverHub")
                .Build();

            _hubConnection.On<string>("ServerStateUpdated", (serverJson) =>
            {
                try
                {
                    var serverState = JsonSerializer.Deserialize<ServerState>(serverJson, _jsonOptions);
                    if (serverState != null)
                    {
                        ServerStateUpdated?.Invoke(this, serverState);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to deserialize server state update");
                }
            });

            await _hubConnection.StartAsync();
            _logger.LogInformation("SignalR connection started successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start SignalR connection");
        }
    }

    public async Task StopRealtimeUpdatesAsync()
    {
        if (_hubConnection != null)
        {
            await _hubConnection.DisposeAsync();
            _hubConnection = null;
        }
    }

    private List<ServerState> GenerateMockServerStates()
    {
        var random = new Random();
        var servers = new List<ServerState>();

        // Create a grid of servers in 3D space
        for (int x = 0; x < 4; x++)
        {
            for (int z = 0; z < 3; z++)
            {
                var serverId = $"server-{x}-{z}";
                var server = new ServerState
                {
                    Id = serverId,
                    Name = $"Server-{x + 1}-{z + 1}",
                    Status = (ServerStatus)random.Next(1, 6),
                    CpuUsage = Math.Round(random.NextDouble() * 100, 2),
                    MemoryUsage = Math.Round(random.NextDouble() * 100, 2),
                    DiskUsage = Math.Round(random.NextDouble() * 100, 2),
                    NetworkIn = Math.Round(random.NextDouble() * 1000, 2),
                    NetworkOut = Math.Round(random.NextDouble() * 1000, 2),
                    LastUpdated = DateTime.UtcNow.AddSeconds(-random.Next(1, 300)),
                    Position = new Vector3(x * 10, 0, z * 10)
                };

                // Add some alerts based on status
                if (server.Status == ServerStatus.Warning)
                {
                    server.ActiveAlerts.Add("High CPU usage");
                }
                else if (server.Status == ServerStatus.Critical)
                {
                    server.ActiveAlerts.Add("Critical memory usage");
                    server.ActiveAlerts.Add("Disk space low");
                }

                // Add custom metrics
                server.CustomMetrics["uptime"] = TimeSpan.FromDays(random.Next(1, 365)).ToString();
                server.CustomMetrics["temperature"] = $"{random.Next(35, 85)}°C";
                server.CustomMetrics["powerDraw"] = $"{random.Next(100, 400)}W";

                servers.Add(server);
            }
        }

        return servers;
    }

    public void Dispose()
    {
        _hubConnection?.DisposeAsync();
        _httpClient?.Dispose();
    }
}

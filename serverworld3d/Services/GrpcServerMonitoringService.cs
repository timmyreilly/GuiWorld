using Grpc.Net.Client;
using ServerWorld3D.Grpc;
using ServerWorld3D.Models;

namespace ServerWorld3D.Services;

public interface IGrpcServerMonitoringService
{
    Task<List<ServerState>> GetServerStatesAsync(List<string>? serverIds = null);
    Task<ServerState?> GetServerStateAsync(string serverId);
    IAsyncEnumerable<ServerState> StreamServerUpdatesAsync(List<string>? serverIds = null, int intervalSeconds = 5);
    Task<bool> UpdateServerConfigurationAsync(string serverId, Dictionary<string, object> config);
}

public class GrpcServerMonitoringService : IGrpcServerMonitoringService, IDisposable
{
    private readonly GrpcChannel _channel;
    private readonly ServerWorld3D.Grpc.ServerMonitoringService.ServerMonitoringServiceClient _client;
    private readonly ILogger<GrpcServerMonitoringService> _logger;

    public GrpcServerMonitoringService(IConfiguration configuration, ILogger<GrpcServerMonitoringService> logger)
    {
        _logger = logger;
        var grpcEndpoint = configuration.GetConnectionString("GrpcServerMonitoring") ?? "https://localhost:5001";
        
        _channel = GrpcChannel.ForAddress(grpcEndpoint);
        _client = new ServerMonitoringService.ServerMonitoringServiceClient(_channel);
    }

    public async Task<List<ServerState>> GetServerStatesAsync(List<string>? serverIds = null)
    {
        try
        {
            var request = new GetServerStatesRequest
            {
                IncludeMetrics = true
            };

            if (serverIds != null)
            {
                request.ServerIds.AddRange(serverIds);
            }

            var response = await _client.GetServerStatesAsync(request);
            return response.Servers.Select(ConvertFromGrpcMessage).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get server states via gRPC");
            return new List<ServerState>();
        }
    }

    public async Task<ServerState?> GetServerStateAsync(string serverId)
    {
        try
        {
            var request = new GetServerStateRequest
            {
                ServerId = serverId,
                IncludeMetrics = true
            };

            var response = await _client.GetServerStateAsync(request);
            return ConvertFromGrpcMessage(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get server state for {ServerId} via gRPC", serverId);
            return null;
        }
    }

    public async IAsyncEnumerable<ServerState> StreamServerUpdatesAsync(List<string>? serverIds = null, int intervalSeconds = 5)
    {
        var request = new StreamServerUpdatesRequest
        {
            UpdateIntervalSeconds = intervalSeconds
        };

        if (serverIds != null)
        {
            request.ServerIds.AddRange(serverIds);
        }

        using var call = _client.StreamServerUpdates(request);

        await foreach (var update in call.ResponseStream.ReadAllAsync())
        {
            yield return ConvertFromGrpcMessage(update);
        }
    }

    public async Task<bool> UpdateServerConfigurationAsync(string serverId, Dictionary<string, object> config)
    {
        try
        {
            var serverConfig = new ServerConfigMessage
            {
                Name = config.GetValueOrDefault("name", "")?.ToString() ?? "",
                MonitoringEnabled = config.GetValueOrDefault("monitoringEnabled", true) as bool? ?? true
            };

            // Handle position if provided
            if (config.TryGetValue("position", out var positionObj) && positionObj is Vector3 position)
            {
                serverConfig.Position = new Vector3Message
                {
                    X = position.X,
                    Y = position.Y,
                    Z = position.Z
                };
            }

            // Handle alert thresholds
            if (config.TryGetValue("alertThresholdCpu", out var cpuThreshold))
            {
                serverConfig.AlertThresholdCpu = Convert.ToInt32(cpuThreshold);
            }

            if (config.TryGetValue("alertThresholdMemory", out var memoryThreshold))
            {
                serverConfig.AlertThresholdMemory = Convert.ToInt32(memoryThreshold);
            }

            if (config.TryGetValue("alertThresholdDisk", out var diskThreshold))
            {
                serverConfig.AlertThresholdDisk = Convert.ToInt32(diskThreshold);
            }

            var request = new UpdateServerConfigRequest
            {
                ServerId = serverId,
                Config = serverConfig
            };

            var response = await _client.UpdateServerConfigurationAsync(request);
            return response.Success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update server configuration for {ServerId} via gRPC", serverId);
            return false;
        }
    }

    private static ServerState ConvertFromGrpcMessage(ServerStateMessage message)
    {
        return new ServerState
        {
            Id = message.Id,
            Name = message.Name,
            Status = (ServerStatus)(int)message.Status,
            CpuUsage = message.CpuUsage,
            MemoryUsage = message.MemoryUsage,
            DiskUsage = message.DiskUsage,
            NetworkIn = message.NetworkIn,
            NetworkOut = message.NetworkOut,
            LastUpdated = DateTimeOffset.FromUnixTimeSeconds(message.LastUpdated).DateTime,
            Position = message.Position != null 
                ? new Vector3(message.Position.X, message.Position.Y, message.Position.Z)
                : new Vector3(),
            ActiveAlerts = message.ActiveAlerts.ToList(),
            CustomMetrics = message.CustomMetrics.ToDictionary(
                kvp => kvp.Key, 
                kvp => (object)kvp.Value)
        };
    }

    public void Dispose()
    {
        _channel?.Dispose();
    }
}

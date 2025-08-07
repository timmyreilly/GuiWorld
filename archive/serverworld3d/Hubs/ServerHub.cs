using Microsoft.AspNetCore.SignalR;
using ServerWorld3D.Models;
using ServerWorld3D.Services;
using System.Text.Json;

namespace ServerWorld3D.Hubs;

public class ServerHub : Hub
{
    private readonly IServerMonitoringService _serverMonitoringService;
    private readonly ILogger<ServerHub> _logger;

    public ServerHub(IServerMonitoringService serverMonitoringService, ILogger<ServerHub> logger)
    {
        _serverMonitoringService = serverMonitoringService;
        _logger = logger;
    }

    public async Task JoinServerGroup(string serverId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"server-{serverId}");
        _logger.LogInformation("Client {ConnectionId} joined server group {ServerId}", Context.ConnectionId, serverId);
    }

    public async Task LeaveServerGroup(string serverId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"server-{serverId}");
        _logger.LogInformation("Client {ConnectionId} left server group {ServerId}", Context.ConnectionId, serverId);
    }

    public async Task UpdateCharacterPosition(string positionJson)
    {
        try
        {
            var position = JsonSerializer.Deserialize<Vector3>(positionJson);
            if (position != null)
            {
                // Broadcast character position to all connected clients
                await Clients.Others.SendAsync("CharacterPositionUpdated", Context.ConnectionId, positionJson);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update character position");
        }
    }

    public async Task RequestServerStates()
    {
        try
        {
            var servers = await _serverMonitoringService.GetAllServerStatesAsync();
            var serversJson = JsonSerializer.Serialize(servers);
            await Clients.Caller.SendAsync("ServerStatesReceived", serversJson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to request server states");
        }
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client {ConnectionId} connected", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client {ConnectionId} disconnected", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}

public interface IServerHubClient
{
    Task ServerStateUpdated(string serverStateJson);
    Task CharacterPositionUpdated(string connectionId, string positionJson);
    Task ServerStatesReceived(string serversJson);
    Task AlertTriggered(string serverId, string alertMessage);
}

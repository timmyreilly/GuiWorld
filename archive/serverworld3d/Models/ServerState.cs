using System.ComponentModel.DataAnnotations;

namespace ServerWorld3D.Models;

public class ServerState
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ServerStatus Status { get; set; } = ServerStatus.Unknown;
    public double CpuUsage { get; set; }
    public double MemoryUsage { get; set; }
    public double DiskUsage { get; set; }
    public double NetworkIn { get; set; }
    public double NetworkOut { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    public Vector3 Position { get; set; } = new();
    public List<string> ActiveAlerts { get; set; } = new();
    public Dictionary<string, object> CustomMetrics { get; set; } = new();
}

public class Vector3
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }

    public Vector3() { }
    
    public Vector3(float x, float y, float z)
    {
        X = x;
        Y = y;
        Z = z;
    }
}

public enum ServerStatus
{
    Unknown = 0,
    Healthy = 1,
    Warning = 2,
    Critical = 3,
    Offline = 4,
    Maintenance = 5
}

public class CharacterState
{
    public Vector3 Position { get; set; } = new();
    public Vector3 Rotation { get; set; } = new();
    public float MovementSpeed { get; set; } = 5.0f;
    public float RotationSpeed { get; set; } = 2.0f;
    public bool IsMoving { get; set; }
    public DateTime LastMoved { get; set; } = DateTime.UtcNow;
}

public class Dashboard3D
{
    public string Id { get; set; } = string.Empty;
    public string ServerId { get; set; } = string.Empty;
    public Vector3 Position { get; set; } = new();
    public Vector3 Rotation { get; set; } = new();
    public Vector3 Scale { get; set; } = new(1, 1, 1);
    public DashboardType Type { get; set; } = DashboardType.Overview;
    public bool IsVisible { get; set; } = true;
    public bool IsInteractive { get; set; } = true;
    public Dictionary<string, object> DisplayData { get; set; } = new();
}

public enum DashboardType
{
    Overview = 0,
    Performance = 1,
    Network = 2,
    Storage = 3,
    Alerts = 4,
    Logs = 5
}

using ServerWorld3D.Components;
using ServerWorld3D.Services;
using ServerWorld3D.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Add SignalR
builder.Services.AddSignalR();

// Add HTTP client for REST API communication
builder.Services.AddHttpClient<IServerMonitoringService, ServerMonitoringService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration.GetConnectionString("ServerMonitoringApi") ?? "https://localhost:5001");
    client.DefaultRequestHeaders.Add("User-Agent", "ServerWorld3D/1.0");
});

// Add gRPC client service
builder.Services.AddScoped<IGrpcServerMonitoringService, GrpcServerMonitoringService>();

// Add logging
builder.Services.AddLogging();

// Add CORS for development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

// Use CORS
app.UseCors();

app.UseStaticFiles();
app.UseAntiforgery();

// Map SignalR hub
app.MapHub<ServerHub>("/serverHub");

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();

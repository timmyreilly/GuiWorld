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

// Add Content Security Policy middleware
app.Use(async (context, next) =>
{
    // Generate a nonce for this request
    var nonce = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(16));
    context.Items["csp-nonce"] = nonce;
    
    var cspPolicy = app.Environment.IsDevelopment()
        ? // Development: More permissive for debugging but still secure
          "default-src 'self'; " +
          $"script-src 'self' 'nonce-{nonce}' 'wasm-unsafe-eval' 'unsafe-hashes' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
          "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
          "img-src 'self' data: blob: https:; " +
          "font-src 'self' data: https:; " +
          "connect-src 'self' ws: wss: https:; " +
          "frame-src 'none'; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self';"
        : // Production: Strict policy
          "default-src 'self'; " +
          $"script-src 'self' 'nonce-{nonce}' 'unsafe-hashes' https://unpkg.com https://cdn.jsdelivr.net; " +
          "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data: https:; " +
          "connect-src 'self' ws: wss:; " +
          "frame-src 'none'; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self';";
    
    context.Response.Headers.Append("Content-Security-Policy", cspPolicy);
    await next();
});

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

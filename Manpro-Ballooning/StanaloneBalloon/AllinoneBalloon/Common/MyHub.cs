using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace AllinoneBalloon.Common
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class SocketHub : Hub
    {
        // Store clients with their currently opened tokens
        private static readonly ConcurrentDictionary<string, string> ClientTokens = new();
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
        public async Task CheckConnection()
        {
            var connectionId = Context.ConnectionId;
            await Clients.Client(connectionId).SendAsync("ConnectionStatus", "Connected");
        }
        public async Task BroadcastClientInfo(string clientInfo)
        {
            await Clients.All.SendAsync("ReceiveClientInfo", clientInfo);
        }
        public async Task OpenToken(string token)
        {
            string connectionId = Context.ConnectionId;

            // Update the client's token
            ClientTokens[connectionId] = token;

            // Notify other clients about the token being opened
            await Clients.AllExcept(connectionId).SendAsync("TokenOpened", token);
        }
        public Task<List<string>> GetActiveTokens()
        {
            // Return a list of active tokens
            return Task.FromResult(ClientTokens.Values.Distinct().ToList());
        }
        public static bool IsTokenOpened(string token)
        {
            // Check if the token is already opened
            return ClientTokens.Values.Contains(token);
        }
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.Identity?.Name;
            Console.WriteLine($"Client connected: {userId}");
            await base.OnConnectedAsync();
            await CheckConnection();
        }
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await base.OnDisconnectedAsync(exception);
            await Clients.All.SendAsync("ClientDisconnected", Context.ConnectionId);
        }
    }
}

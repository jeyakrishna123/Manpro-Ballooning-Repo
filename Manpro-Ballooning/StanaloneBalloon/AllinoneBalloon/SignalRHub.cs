using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace AllinoneBalloon
{
    public class SignalRHub : Hub
    {
        public async Task SendProgressUpdate(string message)
        {
            await Clients.Caller.SendAsync("ReceiveProgressUpdate", message);
        }
    }
}

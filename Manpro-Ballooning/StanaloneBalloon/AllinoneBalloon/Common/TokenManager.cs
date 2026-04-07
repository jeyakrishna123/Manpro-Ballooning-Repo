using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AllinoneBalloon.Common
{
    public class TokenManager
    {
        private static readonly ConcurrentDictionary<string, TokenInfo> _activeTokens = new();
        private static readonly TimeSpan TokenExpiryTime = TimeSpan.FromHours(4);
        private static readonly Timer _cleanupTimer;

        static TokenManager()
        {
            // Start a timer to clean up expired tokens periodically
            _cleanupTimer = new Timer(CleanupExpiredTokens, null, TimeSpan.Zero, TimeSpan.FromMinutes(1));
        }
        private static void CleanupExpiredTokens(object state)
        {
            var now = DateTime.UtcNow;
            var expiredTokens = _activeTokens.Where(kvp => (now - kvp.Value.LastAccessTime) > TokenExpiryTime).Select(kvp => kvp.Key).ToList();

            foreach (var token in expiredTokens)
            {
                _activeTokens.TryRemove(token, out _);
            }
        }

        // Try to open a token (allows same client to re-open)
        public static bool TryOpenToken(string token, string clientId)
        {
            var now = DateTime.UtcNow;
            var tokenInfo = new TokenInfo
            {
                ClientId = clientId,
                LastAccessTime = now
            };

            // If token doesn't exist, add it
            if (_activeTokens.TryAdd(token, tokenInfo))
                return true;

            // If same client is re-opening, update and allow
            if (_activeTokens.TryGetValue(token, out var existing) && existing.ClientId == clientId)
            {
                existing.LastAccessTime = now;
                return true;
            }

            return false;
        }
        public static bool TryUpdateToken(string token, string clientId)
        {
            var now = DateTime.UtcNow;
            var tokenInfo = new TokenInfo
            {
                ClientId = clientId,
                LastAccessTime = now
            };
            _activeTokens.AddOrUpdate(token, tokenInfo, (key, oldValue) => tokenInfo );
            return true;
        }

        // Close a token
        public static bool CloseToken(string token, string clientId)
        {
            if (_activeTokens.TryGetValue(token, out var tokenInfo) && tokenInfo.ClientId == clientId)
            {
                return _activeTokens.TryRemove(token, out _);
            }
            return false;
        }

        // Check if a token is active
        public static string GetActiveClient(string token)
        {
            if (_activeTokens.TryGetValue(token, out var tokenInfo))
            {
                // Update the last access time
                tokenInfo.LastAccessTime = DateTime.UtcNow;
                return tokenInfo.ClientId;
            }
            return string.Empty;
        }
    }
    public class TokenInfo
    {
        public string ClientId { get; set; }
        public DateTime LastAccessTime { get; set; }

        public override string ToString()
        {
            return $"ClientId: {ClientId}, LastAccessTime: {LastAccessTime.ToString()}";
        }
    }
}

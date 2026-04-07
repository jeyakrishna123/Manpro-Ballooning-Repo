using Newtonsoft.Json;
using Microsoft.AspNetCore.Http;


namespace AllinoneBalloon
{
    public class SessionVariables
    {
        public const string sessionName = "sessionUserName";
        public const string sessionId = "sessionUserId";
    }
    public class sessionobj
    {
        public string sessionUserName { get; set; }
        public string sessionUserId { get; set; }
        public TimeSpan expire { get; set; }
    }
    public static class SessionExtensions
    {
        public static void SetObjectAsJson(this ISession session, string key, object value)
        {
            session.SetString(key, JsonConvert.SerializeObject(value));
        }

        public static T GetObjectFromJson<T>(this ISession session, string key)
        {
            var value = session.GetString(key);
            return value == null ? default : JsonConvert.DeserializeObject<T>(value);
        }
    }

}

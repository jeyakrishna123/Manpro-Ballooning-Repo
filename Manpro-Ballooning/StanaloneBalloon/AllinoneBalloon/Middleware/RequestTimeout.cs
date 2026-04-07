using Microsoft.AspNetCore.Http;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace AllinoneBalloon.Middleware
{
    public class RequestTimeoutMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly TimeSpan _timeout;

        public RequestTimeoutMiddleware(RequestDelegate next, TimeSpan timeout)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _timeout = timeout;
        }

        public async Task Invoke(HttpContext context)
        {
            var cts = new CancellationTokenSource();
            var originalToken = context.RequestAborted;

            // Set a combined cancellation token with a timeout
            cts.CancelAfter(_timeout);
            var linkedToken = CancellationTokenSource.CreateLinkedTokenSource(originalToken, cts.Token).Token;

            try
            {
                await _next(context);
            }
            catch (OperationCanceledException) when (linkedToken.IsCancellationRequested)
            {
                // Handle request timeout here
                context.Response.StatusCode = StatusCodes.Status408RequestTimeout;
                await context.Response.WriteAsync("Request Timeout");
            }
            finally
            {
                cts.Dispose();
            }
        }
    }
}

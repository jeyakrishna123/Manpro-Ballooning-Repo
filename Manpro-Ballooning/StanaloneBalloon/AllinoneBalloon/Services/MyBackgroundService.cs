using AllinoneBalloon.Models;
using Microsoft.EntityFrameworkCore;

namespace AllinoneBalloon.Services
{
    public class MyBackgroundService : BackgroundService
    {
        private readonly IDbContextFactory<DimTestContext> _dbContextFactory;

        public MyBackgroundService(IDbContextFactory<DimTestContext> dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
 
                using var context = _dbContextFactory.CreateDbContext();
                var data = await context.Users.ToListAsync();

                // Process data...

                await Task.Delay(1000, stoppingToken); // Wait 1 second
            
        }
    }

}

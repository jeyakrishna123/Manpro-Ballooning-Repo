using AllinoneBalloon.Common;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class BalloonController
    {
        [HttpPost("add-unit")]
        public async Task<IActionResult> AddUnit([FromBody] TblUnit unit)
        {
            if (unit == null || string.IsNullOrWhiteSpace(unit.Units))
                return BadRequest("Invalid unit.");

            using var context = _dbcontext.CreateDbContext();

            bool exists = context
                .TblUnits.AsEnumerable()
                .Any(u =>
                    u.Units.Trim().ToLower()
                    == unit.Units.Trim().ToLower()
                );

            if (exists)
                return Conflict("Unit already exists.");

            context.TblUnits.Add(unit);
            await context.SaveChangesAsync();

            var helper = new Helper(_dbcontext);
            var updatedList = helper.Load_UnitType(new ErrorLog());

            return Ok(new { inserted = unit, unitsList = updatedList });
        }
    }
}

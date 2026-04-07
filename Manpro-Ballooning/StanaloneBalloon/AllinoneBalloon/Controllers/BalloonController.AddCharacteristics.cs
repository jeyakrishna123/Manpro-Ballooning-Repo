using AllinoneBalloon.Common;
using AllinoneBalloon.Models;
using Microsoft.AspNetCore.Mvc;

namespace AllinoneBalloon.Controllers
{
    public partial class BalloonController
    {
        [HttpPost("add-characteristic")]
        public async Task<IActionResult> AddCharacteristic([FromBody] TblCharacteristic characteristic)
        {
            if (characteristic == null || string.IsNullOrWhiteSpace(characteristic.Characteristics))
                return BadRequest("Invalid characteristic.");

            using var context = _dbcontext.CreateDbContext();

            bool exists = context
                .TblCharacteristics.AsEnumerable()
                .Any(c =>
                    c.Characteristics.Trim().ToLower()
                    == characteristic.Characteristics.Trim().ToLower()
                );

            if (exists)
                return Conflict("Characteristic already exists.");

            context.TblCharacteristics.Add(characteristic);
            await context.SaveChangesAsync();

            var helper = new Helper(_dbcontext);
            var updatedList = helper.Load_CharacteristicsType(new ErrorLog());

            return Ok(new { inserted = characteristic, characteristicsList = updatedList });
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KollitaApi.Data;
using KollitaApi.Models;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CierresController : ControllerBase
{
    private readonly KollitaDbContext _db;

    public CierresController(KollitaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cierres = await _db.Cierres.OrderByDescending(c => c.Id).Take(200).ToListAsync();
        return Ok(cierres);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Cierre cierre)
    {
        _db.Cierres.Add(cierre);
        await _db.SaveChangesAsync();
        return Ok(cierre);
    }
}

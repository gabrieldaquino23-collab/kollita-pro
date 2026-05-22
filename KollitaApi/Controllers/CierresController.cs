using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KollitaApi.Models;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Secretario")]
public class CierresController : ControllerBase
{
    private readonly ICierreService _service;

    public CierresController(ICierreService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cierres = await _service.GetAllAsync(200);
        return Ok(cierres);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Cierre cierre)
    {
        var created = await _service.CreateAsync(cierre);
        return Ok(created);
    }
}

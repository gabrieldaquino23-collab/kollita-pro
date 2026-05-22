using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KollitaApi.Models;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;

    public AuthController(IAuthService service)
    {
        _service = service;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _service.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _service.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("cambiar-password")]
    public async Task<IActionResult> CambiarPassword([FromBody] CambioPasswordRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        var token = await _service.CambiarPasswordAsync(long.Parse(userIdClaim), request.NuevaPassword);
        if (token == null) return NotFound(new { error = "Usuario no encontrado" });

        return Ok(new { token, mensaje = "Contraseña actualizada correctamente" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        var usuario = await _service.GetUserByIdAsync(long.Parse(userIdClaim));
        if (usuario == null) return NotFound();

        return Ok(new
        {
            usuario.Id, usuario.Email, usuario.Nombre,
            usuario.Rol, usuario.Sucursal, usuario.UltimoAcceso
        });
    }

    [Authorize]
    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new { autenticado = true, usuario = User.Identity?.Name });
    }
}

public class CambioPasswordRequest
{
    public string NuevaPassword { get; set; } = string.Empty;
}

using Microsoft.EntityFrameworkCore;
using KollitaApi.Data;
using KollitaApi.Services.Interfaces;

namespace KollitaApi.Data.Repositories;

public class GenericRepository<T> : IRepository<T> where T : class
{
    protected readonly KollitaDbContext _db;
    protected readonly DbSet<T> _set;

    public GenericRepository(KollitaDbContext db)
    {
        _db = db;
        _set = db.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(long id) => await _set.FindAsync(id);

    public virtual async Task<IEnumerable<T>> GetAllAsync(int limit = 500) =>
        await _set.Take(limit).ToListAsync();

    public virtual async Task<T> AddAsync(T entity)
    {
        await _set.AddAsync(entity);
        return entity;
    }

    public virtual Task<T> UpdateAsync(T entity)
    {
        _set.Update(entity);
        return Task.FromResult(entity);
    }

    public virtual Task DeleteAsync(long id)
    {
        var entity = _set.Find(id);
        if (entity != null) _set.Remove(entity);
        return Task.CompletedTask;
    }

    public virtual async Task<int> SaveChangesAsync() => await _db.SaveChangesAsync();
}

public class PedidoRepository : GenericRepository<Models.Pedido>, IPedidoRepository
{
    public PedidoRepository(KollitaDbContext db) : base(db) { }

    public async Task<List<Models.Pedido>> GetWithItemsAsync(int limit = 500) =>
        await _db.Pedidos.Include(p => p.Items).OrderByDescending(p => p.Id).Take(limit).ToListAsync();

    public async Task<Models.Pedido?> GetByIdWithItemsAsync(long id) =>
        await _db.Pedidos.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);

    public async Task<List<Models.Pedido>> GetByEstadoAsync(string estado, int limit = 500) =>
        await _db.Pedidos.Include(p => p.Items).Where(p => p.Estado == estado)
            .OrderByDescending(p => p.Id).Take(limit).ToListAsync();
}

public class PendienteRepository : GenericRepository<Models.Pendiente>, IPendienteRepository
{
    public PendienteRepository(KollitaDbContext db) : base(db) { }

    public async Task<List<Models.Pendiente>> GetPendientesWithItemsAsync() =>
        await _db.Pendientes.Include(p => p.Items).Where(p => p.Estado == "PENDIENTE")
            .OrderByDescending(p => p.CreadoEn).ToListAsync();

    public async Task<Models.Pendiente?> GetByIdWithItemsAsync(long id) =>
        await _db.Pendientes.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
}

public class CierreRepository : GenericRepository<Models.Cierre>, ICierreRepository
{
    public CierreRepository(KollitaDbContext db) : base(db) { }

    public async Task<List<Models.Cierre>> GetBySecretarioAsync(string secretario, int limit = 100) =>
        await _db.Cierres.Where(c => c.Secretario == secretario)
            .OrderByDescending(c => c.Id).Take(limit).ToListAsync();

    public override async Task<IEnumerable<Models.Cierre>> GetAllAsync(int limit = 200) =>
        await _db.Cierres.OrderByDescending(c => c.Id).Take(limit).ToListAsync();
}

public class UsuarioRepository : GenericRepository<Models.Usuario>, IUsuarioRepository
{
    public UsuarioRepository(KollitaDbContext db) : base(db) { }

    public async Task<Models.Usuario?> GetByEmailAsync(string email) =>
        await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<Models.Usuario?> GetActivoByEmailAsync(string email) =>
        await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email && u.Activo);
}

public class ConfigSucursalRepository : GenericRepository<Models.ConfigSucursal>, IConfigSucursalRepository
{
    public ConfigSucursalRepository(KollitaDbContext db) : base(db) { }

    public async Task<Models.ConfigSucursal?> GetBySucursalAsync(string sucursal) =>
        await _db.ConfigSucursales.FirstOrDefaultAsync(c => c.Sucursal == sucursal);
}

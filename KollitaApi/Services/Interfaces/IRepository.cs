namespace KollitaApi.Services.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(long id);
    Task<IEnumerable<T>> GetAllAsync(int limit = 500);
    Task<T> AddAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task DeleteAsync(long id);
    Task<int> SaveChangesAsync();
}

public interface IPedidoRepository : IRepository<Models.Pedido>
{
    Task<List<Models.Pedido>> GetWithItemsAsync(int limit = 500);
    Task<Models.Pedido?> GetByIdWithItemsAsync(long id);
    Task<List<Models.Pedido>> GetByEstadoAsync(string estado, int limit = 500);
}

public interface IPendienteRepository : IRepository<Models.Pendiente>
{
    Task<List<Models.Pendiente>> GetPendientesWithItemsAsync();
    Task<Models.Pendiente?> GetByIdWithItemsAsync(long id);
}

public interface ICierreRepository : IRepository<Models.Cierre>
{
    Task<List<Models.Cierre>> GetBySecretarioAsync(string secretario, int limit = 100);
}

public interface IUsuarioRepository : IRepository<Models.Usuario>
{
    Task<Models.Usuario?> GetByEmailAsync(string email);
    Task<Models.Usuario?> GetActivoByEmailAsync(string email);
}

public interface IConfigSucursalRepository : IRepository<Models.ConfigSucursal>
{
    Task<Models.ConfigSucursal?> GetBySucursalAsync(string sucursal);
}

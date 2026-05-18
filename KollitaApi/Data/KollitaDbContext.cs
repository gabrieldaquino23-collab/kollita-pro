using Microsoft.EntityFrameworkCore;
using KollitaApi.Models;

namespace KollitaApi.Data;

public class KollitaDbContext : DbContext
{
    public KollitaDbContext(DbContextOptions<KollitaDbContext> options) : base(options) { }

    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<ItemPedido> ItemsPedido => Set<ItemPedido>();
    public DbSet<Pendiente> Pendientes => Set<Pendiente>();
    public DbSet<ItemPendiente> ItemsPendiente => Set<ItemPendiente>();
    public DbSet<Cierre> Cierres => Set<Cierre>();
    public DbSet<ConfigSucursal> ConfigSucursales => Set<ConfigSucursal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pedido>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.FechaID);
            e.HasIndex(p => p.Estado);
            e.HasIndex(p => p.Secretario);
            e.HasMany(p => p.Items).WithOne(i => i.Pedido).HasForeignKey(i => i.PedidoId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ItemPedido>(e =>
        {
            e.HasKey(i => i.Id);
        });

        modelBuilder.Entity<Pendiente>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Estado);
            e.HasIndex(p => p.FechaISO);
            e.HasMany(p => p.Items).WithOne(i => i.Pendiente).HasForeignKey(i => i.PendienteId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ItemPendiente>(e =>
        {
            e.HasKey(i => i.Id);
        });

        modelBuilder.Entity<Cierre>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.Secretario);
            e.HasIndex(c => c.FechaCierre);
        });

        modelBuilder.Entity<ConfigSucursal>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.Sucursal).IsUnique();
        });
    }
}

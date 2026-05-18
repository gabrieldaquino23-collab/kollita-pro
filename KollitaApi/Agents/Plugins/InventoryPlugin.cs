using System.ComponentModel;
using Microsoft.SemanticKernel;

namespace KollitaApi.Agents.Plugins;

/// <summary>
/// Plugin (Herramienta) que los Agentes pueden usar para consultar el inventario real.
/// </summary>
public class InventoryPlugin
{
    // Aquí luego inyectaremos el ApplicationDbContext de Entity Framework
    
    [KernelFunction("get_product_stock")]
    [Description("Obtiene el stock actual de un producto en una sucursal específica de Kollita.")]
    public string GetProductStock(
        [Description("El nombre del producto, ej. 'Coca Cola'")] string productName, 
        [Description("El nombre de la sucursal, ej. 'Sucursal Norte'")] string sucursal)
    {
        // TODO: Reemplazar con query real a la Base de Datos
        // return _dbContext.Products.Where(p => p.Name == productName)...
        
        return $"[Dato Real simulado] El producto {productName} tiene un stock de 45 unidades en la {sucursal}.";
    }

    [KernelFunction("get_price")]
    [Description("Obtiene el precio de venta al público de un producto.")]
    public string GetProductPrice([Description("El nombre del producto")] string productName)
    {
        return $"El precio de {productName} es de $15.50 Bs.";
    }
}

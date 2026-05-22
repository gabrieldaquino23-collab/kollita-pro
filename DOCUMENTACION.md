# 📚 Documentación Técnica: Kollita Pro

Kollita Pro es un sistema integral avanzado para la gestión de puntos de venta (POS) y administración de sucursales, diseñado bajo una arquitectura *Cloud-Native Headless* con soporte *Offline-First* para garantizar operaciones ininterrumpidas.

---

## 🏗️ 1. Arquitectura del Sistema

El ecosistema de Kollita Pro opera sobre tres servicios en la nube:

1. **Supabase (Base de Datos Central)**
   - Aloja la base de datos relacional PostgreSQL.
   - Gestiona el almacenamiento de datos en tiempo real mediante API REST (PostgREST).
   - Proyecto único en producción: `wsqhzatsuymjoebzfhpg` (Región: São Paulo, sa-east-1).
   - Anon Key centralizada en `recursos/js/supabase-config.js`.

2. **Vercel (Frontend Hosting)**
   - Aloja TODOS los paneles como archivos HTML estáticos con Vanilla JavaScript.
   - Rewrites definidos en `vercel.json` para URLs limpias (`/panel`, `/movil`, `/encargado`, etc.).
   - Paneles: kollita_borrador.html, kollita movil.html, admin de kollita movil.html, encargado.html, supervisor_alfa.html, supervisor_beta.html, omega.html, senior.html, coca_system_pro.html.

3. **Render (Backend API)**
   - Aloja la `KollitaApi` construida en C# / .NET (contenedor Docker).
   - Conexión directa al puerto `5432` de Supabase para operaciones complejas y procesamiento de reportes.

---

## 👥 2. Paneles y Roles de Usuario

Todos los paneles se sirven desde Vercel con URLs limpias:

| Ruta | Archivo | Rol |
|------|---------|-----|
| `/panel` | `kollita_borrador.html` | Secretario — caja, cobros, cierres de turno, inventarios |
| `/movil` | `kollita movil.html` | Cliente/Público — pedidos de machuca y bebidas |
| `/admin-movil` | `admin de kollita movil.html` | Admin — catálogo de productos, configuración de sucursales |
| `/encargado` | `encargado.html` | Encargado — supervisión de inventarios físicos, tanques, traspasos |
| `/supervisor` | `supervisor_alfa.html` | Supervisor Alfa — dashboard de alta gerencia |
| `/supervisor-beta` | `supervisor_beta.html` | Supervisor Beta — dashboard alternativo con análisis por sucursal |
| `/omega` | `omega.html` | Omega — panel ejecutivo con métricas globales |
| `/senior` | `senior.html` | Senior — panel de control avanzado |
| `/coca` | `coca_system_pro.html` | Coca System Pro — control de producción de coca |

---

## 🗄️ 3. Estructura de la Base de Datos

Las tablas están conectadas mediante **Foreign Keys** ancladas a `sucursales`, asegurando integridad referencial (CASCADE).

### Tablas Principales:
1. **`sucursales`**: Nodo central — `id` (UUID), `nombre` (ej: "G77", "Km8", "4to Anillo", "Paurito", "Cotoca", "3 Pasos", "Cuchilla").
2. **`secretarios`** y **`encargados`**: Personal operativo vinculado a sucursal.
3. **`pedidos`**: Cada orden (móvil o presencial) con `sucursal_id`, `numero_nota` (integer), `metodo_pago` (CHECK: EFECTIVO, QR, MIXTO), `estado`, `fecha_id`, items, montos.
4. **`cierres_caja`**: Cierres de turno con `sucursal_id`, ventas, arqueos, fecha.
5. **`catalogo_productos`**: Tabla global con productos (`id`, `nombre`, `precio_media`, `categorias`, `emoji`, `activo`, `orden`).
6. **`reclamos`**: Registro de reclamos/obsequios/promociones por sucursal.
7. **`coca_historial`** / **`coca_produccion`**: Control de producción e inventario de coca.

---

## 🪂 4. Tecnología de Sincronización (KollitaSync)

El sistema usa un modelo **Offline-First** con dos capas:

1. **Persistencia local (`localStorage`):**
   - `kollita_db`: Pedidos activos del secretario (PREPARADO, PENDIENTE, ENTREGADO).
   - `kollita_archivo_YYYY_MM`: Archivos mensuales históricos.
   - `kollita_pendientes`: Cola de pedidos del móvil que el secretario debe procesar.
   - `kollita_config_ticket`: Configuración de sucursal y ticket.

2. **Sincronización a Supabase:**
   - Al cerrar turno, el módulo KollitaSync (en `kollita_borrador.html`) sube pedidos en lotes a la tabla `pedidos` vía REST API.
   - El Panel Móvil envía pedidos directamente a Supabase (`POST /rest/v1/pedidos`) en tiempo real y también los guarda en `kollita_db` local.
   - El botón "Migrar Historial" permite subir todo el historial local acumulado a Supabase.
   - La función `migrarHistorialASupabase()` barre `kollita_db` y todos los archivos mensuales para subida masiva.

---

## 🔐 5. Seguridad y Mantenimiento

- **Credenciales:** El frontend usa la `Anon Key` de Supabase (definida en `recursos/js/supabase-config.js`). Render usa conexión directa con clave de servicio.
- **Login:** El panel secretario (`kollita_borrador.html`) tiene login local con contraseña y selección de sucursal. La sesión se guarda en `kollita_login_session` por 8 horas.
- **Integridad:** Foreign Keys con `ON DELETE CASCADE`/`SET NULL` evitan registros huérfanos.
- **Despliegues:** Cualquier push al repositorio de GitHub asociado a Vercel dispara el auto-despliegue en producción.

---
*Documentación actualizada en Mayo de 2026 para el ecosistema Kollita Pro.*

# 📐 Análisis de Arquitectura Producción — Kollita Pro
> Revisión completa para despliegue en Vercel, Render y Supabase (Sin tocar el HTML directamente)

---

## 1. Mapa de archivos originales (Frontend estático)

Estos archivos se mantendrán como estáticos y serán alojados en **Vercel** para tener un CDN global rápido y seguro.

| Archivo | Rol | Usuario |
|---|---|---|
| `kollita movil.html` | App de pedidos móvil (clientes/vendedores externos) | Vendedor/Repartidor |
| `admin de kollita movil.html` | Panel admin de la app móvil (precios, sucursales, config) | Administrador móvil |
| `kollita_borrador.html` | Panel secretario completo (notas de venta, historial, cierres) | Secretario de sucursal |
| `encargado.html` | Panel de producción de machuca (registros caseros, entregas) | Encargado de producción |
| `supervisor_beta.html` (Beta) | Supervisor general — configuración global del sistema | Supervisor |
| `senior.html` | Panel intermedio — encargados y catálogo | Senior/Jefe de turno |
| `omega.html` | Supervisor OMEGA — vista global de pedidos y analytics | Supervisor OMEGA |
| `supervisor_alfa.html` (Alfa) | Supervisor de pagos a caseros (coca machuca) | Supervisor Alfa |
| `coca_system_pro.html` | Sistema de notas de pago a proveedores caseros (embebido en omega via iframe) | Supervisor Alfa/Omega |

---

## 2. Nueva Topología de Producción (Stack Moderno)

Se migrará de un almacenamiento local (`localStorage`) a una arquitectura en la nube distribuida en 3 pilares:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND ESTÁTICO (Alojado en VERCEL)                    │
│    - Todos los archivos .html, .css y .js                   │
│    - Despliegues instantáneos desde GitHub                  │
└──────┬─────────────────────────────────────────────┬────────┘
       │ (Llamadas HTTP REST)                        │ (Conexión WebSocket / Realtime)
       ▼                                             ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│ 2. BACKEND API (RENDER)   │         │ 3. BASE DE DATOS & AUTH   │
│    - API REST en C# .NET  │ ──────► │    (SUPABASE)             │
│    - Lógica de negocio    │ (CRUD)  │    - PostgreSQL Database  │
│    - Reglas de validación │         │    - Supabase Realtime    │
│    - Procesos pesados     │         │    - Supabase Auth        │
└───────────────────────────┘         └───────────────────────────┘
```

---

## 3. Desglose del Stack Tecnológico

### 🚀 Frontend: Vercel
*   **Rol:** Servir los archivos originales HTML, CSS y JS sin necesidad de un servidor web complejo.
*   **Ventaja:** Rapidez extrema, SSL gratuito y conexión nativa con repositorios para actualizaciones sin tiempo de inactividad.

### ⚙️ Backend API: Render
*   **Rol:** Alojamiento de la API (posiblemente la API en **C# ASP.NET Core** que ya tienes estructurada, o una nueva en Node.js si lo decides).
*   **Ventaja:** Excelente para correr aplicaciones back-end continuamente. Actuará como intermediario para lógicas pesadas, generación de reportes masivos o reglas de negocio que no deben estar expuestas en el frontend.

### 🗄️ Base de Datos y Tiempo Real: Supabase
*   **Rol:** Sustituir todo el `localStorage` actual.
*   **Componentes:**
    *   **PostgreSQL:** Para almacenar Pedidos, Secretarios, Catálogo, Registros de Caseros, etc.
    *   **Supabase Realtime:** Para que la pantalla del secretario y del supervisor se actualice al instante cuando se crea un pedido desde `kollita movil.html`.
    *   **Supabase Auth (Opcional):** Para manejo de logins y sesiones (reemplaza contraseñas en duro como `PASS_BETA`).

---

## 4. Reemplazo del localStorage (Mapeo de Datos)

Actualmente, el sistema usa `localStorage`. Todo esto se mapeará a tablas en **Supabase** y endpoints en la API alojada en **Render**:

| Clave actual (localStorage) | Tabla en Supabase | Servicio que lo manejará |
|---|---|---|
| `kollita_pendientes` | `pedidos_pendientes` | API / Supabase Realtime |
| `kollita_db` | `notas_venta_historial` | API |
| `kollita_secretarios` | `usuarios_secretarios` | API |
| `kollita_enc_produccion`| `produccion_registros` | API |
| `kollita_enc_catalogo` | `catalogo_productos` | API |
| `cocapay_v3` / `cocaCaseros`| `proveedores_caseros` / `pagos_caseros` | API |
| `kol_adm_v3` | `config_sistema` | API |

---

## 5. Estrategia de Migración (Paso a Paso Seguro)

Para cumplir la directiva de **"no tocar el código HTML original"**, la integración se hará mediante inyección de un script adaptador:

### Fase 1: Preparación Cloud (Infraestructura)
1.  **Supabase:** Crear el proyecto, estructurar las tablas SQL basándose en los modelos JSON actuales y habilitar Realtime.
2.  **Render:** Configurar el despliegue de la API C# (`KollitaApi`), conectándola a la base de datos de Supabase (usando la cadena de conexión de PostgreSQL).
3.  **Vercel:** Desplegar la carpeta de frontend actual.

### Fase 2: El "Adaptador" (El puente mágico)
En lugar de reescribir miles de líneas en `kollita_borrador.html` o `omega.html`, crearemos un archivo `recursos/js/kollita-cloud-sync.js`. 
Este archivo:
1.  Sobrescribirá temporalmente los métodos nativos de lectura (o se llamará justo antes de la carga de datos).
2.  Traerá los datos desde la API de **Render** / **Supabase** y los colocará en el `localStorage` local para que el HTML original funcione sin darse cuenta del cambio, **O** interceptará las funciones directas.

### Fase 3: Conexión Realtime
Dentro del nuevo archivo JS, se agregará el cliente de Supabase (o SignalR hacia Render) para escuchar eventos:
*   *Cuando llega un pedido nuevo de la app móvil, el JS actualiza el panel del secretario sin tener que recargar.*

---

## 6. Siguientes Pasos (A la espera de confirmación)

**No se ha modificado ni una sola línea de código en los HTMLs.** 

Cuando me des luz verde, el orden de ataque técnico será:
1.  Definir y crear el script de base de datos SQL para **Supabase**.
2.  Ajustar el proyecto de la API C# para que se conecte a Supabase y se pueda subir a **Render**.
3.  Crear el archivo `kollita-cloud-sync.js` que conectará los HTMLs (en **Vercel**) con el backend.

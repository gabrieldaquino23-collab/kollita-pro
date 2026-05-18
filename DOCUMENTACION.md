# 📚 Documentación Técnica: Kollita Pro

Kollita Pro es un sistema integral avanzado para la gestión de puntos de venta (POS) y administración de sucursales, diseñado bajo una arquitectura *Cloud-Native Headless* con soporte *Offline-First* para garantizar operaciones ininterrumpidas.

---

## 🏗️ 1. Arquitectura del Sistema

El ecosistema de Kollita Pro opera en un "triángulo" de servicios en la nube, asegurando alta disponibilidad y rendimiento en tiempo real:

1. **Supabase (Base de Datos Central)**
   - Actúa como el "cerebro" del sistema.
   - Aloja la base de datos relacional PostgreSQL.
   - Gestiona el almacenamiento de datos en tiempo real mediante API REST.
   - Proyecto en producción: `wsqhzatsuymjoebzfhpg` (Región: São Paulo).

2. **Vercel (Frontend Hosting)**
   - Aloja las interfaces de usuario construidas en HTML, CSS y Vanilla JavaScript.
   - Proveedor del entorno público para el **Panel Móvil** (`kollita-movil-public.vercel.app`), diseñado para un acceso ágil desde cualquier dispositivo móvil.

3. **Render (Backend API)**
   - Aloja la `KollitaApi` construida en C# / .NET (contenedor Docker).
   - Se conecta directamente al puerto `5432` de Supabase para operaciones complejas, procesamiento masivo de reportes o interacciones de nivel servidor.

---

## 👥 2. Paneles y Roles de Usuario

El sistema está modularizado para diferentes niveles de acceso y responsabilidades:

- **📱 Panel Móvil (Cliente/Público):** Interfaz ágil alojada en Vercel. Permite a los usuarios elegir una sucursal, realizar pedidos de machucas y bebidas, y enviarlos directamente a Supabase sin necesidad de intermediarios.
- **💼 Panel Secretario (`kollita_borrador.html`):** Panel operativo de caja y recepción. Recibe pedidos del móvil en tiempo real, registra cobros, gestiona cierres de turno y controla inventarios.
- **🏪 Panel Encargado (`encargado.html`):** Panel para la administración local de la sucursal. Supervisa inventarios físicos (tanques, registros de coca) y aprueba traspasos de turno.
- **👑 Panel Supervisor / Omega (`supervisor_alfa.html` / `omega.html`):** Dashboards de alta gerencia para visión global. Analiza métricas de ventas cruzadas, rendimiento por sucursal y realiza auditorías a nivel empresarial.

---

## 🗄️ 3. Estructura de la Base de Datos

Las tablas están estrictamente conectadas mediante **Llaves Foráneas (Foreign Keys)** ancladas a la tabla principal `sucursales`, asegurando integridad referencial (Cascada).

### Tablas Principales:
1. **`sucursales`**: El nodo central. Contiene el nombre y configuración de cada local.
2. **`secretarios`** y **`encargados`**: Credenciales y datos del personal operativo, vinculados obligatoriamente a una sucursal.
3. **`pedidos`**: Registra cada orden (móvil o presencial), vinculada a una sucursal.
4. **`coca_pagos`**, **`produccion`**, **`cierres_caja`**, **`coca_registros`**: Control financiero e inventario diario, conectados a sus respectivas sucursales.
5. **`sync_queue`**: Tabla de control para registro de eventos de sincronización.
6. **`catalogo_productos`**: Única tabla "Global" (no conectada a sucursales), ya que estandariza los precios y productos para toda la empresa.

---

## 🪂 4. Tecnología de Sincronización (KollitaSync v3.0)

Kollita Pro cuenta con un motor avanzado de sincronización conocido como modelo **Offline-First**.

### ¿Cómo funciona?
1. **Estado Online:** Los datos (ej. un pedido) viajan instantáneamente a Supabase vía peticiones `fetch`.
2. **Estado Offline (El Paracaídas):** Si la sucursal pierde la conexión a Internet, el código intercepta el error. En lugar de detener el sistema, los datos se guardan temporalmente en el **Almacenamiento Local (`localStorage`)** del navegador bajo la llave de `kollita_pendientes`. El Secretario continúa su trabajo sin interrupción.
3. **Recuperación Automática:** Al detectarse el retorno de Internet (`navigator.onLine === true`), KollitaSync vacía la cola local y dispara todas las transacciones retenidas hacia Supabase, limpiando la memoria del dispositivo tras una validación exitosa.

---

## 🔐 5. Seguridad y Mantenimiento

- **Credenciales:** La conexión frontend a Supabase utiliza la `Anon Key`, mientras que el backend en C# (Render) utiliza conexión directa con contraseña encriptada.
- **Integridad:** Las eliminaciones en Supabase están protegidas por `ON DELETE SET NULL` u `ON DELETE CASCADE` para evitar registros huérfanos.
- **Despliegues:** Cualquier actualización en las interfaces (`.html`, `.css`, `.js`) debe ser subida (`push`) al repositorio de GitHub asociado a Vercel para su auto-despliegue en producción.

---
*Documentación generada y actualizada en Mayo de 2026 para el ecosistema Kollita Pro.*

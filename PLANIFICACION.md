# Kollita Pro — Planificación y Estructura

> Última actualización: Mayo 2026

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                   │
│                   wsqhzatsuymjoebzfhpg                       │
│  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ pedidos │ │ turnos │ │ bk_*     │ │ system_passwords │  │
│  │ sucursa-│ │ secre- │ │ clientes │ │ coca_*           │  │
│  │ les     │ │ tarios │ │ reclamos │ │ catalogo_prod    │  │
│  └─────────┘ └────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ▲              ▲              ▲              ▲
         │              │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │ESCRIBEN │    │  LEEN   │    │  LEEN   │    │  LEEN   │
    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

---

## 📊 JERARQUÍA DE PANELES

```
NIVEL 0: ADMIN Kollita App
   │
NIVEL 1: Kollita Móvil App (clientes)
   │
NIVEL 2: SECRETARIO (1 código → 7 sucursales aisladas)
   │         └── Cuchilla | 3 Pasos | G77 | Km8 | 4to Anillo | Paurito | Cotoca
   │
NIVEL 3: ENCARGADO (1 código → 7 sucursales aisladas)
   │         └── Lee datos de su propia sucursal del secretario
   │
NIVEL 4: SUPERVISOR BETA ─── Lee TODAS las sucursales ─── Configura contraseñas, secretarios, usuarios
   │
NIVEL 5: SENIOR ─── Solo lectura de encargado
   │
NIVEL 6: OMEGA ─── Lectura de secretario + encargado + CocaPay (registro pagos proveedores)
   │
NIVEL 7: ALFA ─── Lectura de secretario + encargado + omega (Propietario)
```

---

## 📁 PANELES — Detalle

### 0. ADMIN KOLLITA APP
| Propiedad | Valor |
|-----------|-------|
| Archivo | `admin de kollita movil.html` |
| URL | `/admin-movil` |
| Estado | ⏳ Por revisar |
| Rol | Configuración de la app móvil |
| Función | Gestiona productos, precios y datos que se muestran en la Kollita Móvil App |

### 1. KOLLITA MÓVIL APP
| Propiedad | Valor |
|-----------|-------|
| Archivo | `kollita movil.html` |
| URL | `/movil` |
| Estado | ✅ Funcionando |
| Rol | App para clientes |
| Función | Los clientes hacen pedidos. Los pedidos llegan al secretario como PENDIENTE |

### 2. SECRETARIO ✅
| Propiedad | Valor |
|-----------|-------|
| Archivo | `secretarios.html` |
| URL | `/panel` |
| Estado | **✅ COMPLETO** |
| Líneas | ~11,300 |
| Aislamiento | 1 código, 7 sucursales aisladas por datos |
| Cloud-first | ✅ Supabase como fuente de verdad |
| Auto-refresh | ✅ Todas las acciones sin F5 |
| Quota protection | ✅ `safeSetItem()` + `window._dbFallback` |
| Correcciones | Login cloud-first, deduplicación inteligente, auto-refresh, 12 claves limpiadas al cambiar sucursal, sin auto-turno, SUCURSAL_IDS corregido, `liberarEspacioPorFecha` arreglado, código muerto eliminado |

### 3. ENCARGADO ✅
| Propiedad | Valor |
|-----------|-------|
| Archivo | `encargado.html` |
| URL | `/encargado` |
| Estado | **✅ COMPLETO** |
| Líneas | ~1,580 |
| Aislamiento | 1 código, 7 sucursales aisladas por datos |
| Cloud-first | ✅ Lee y escribe en Supabase |
| Auto-refresh | ✅ Todas las pestañas cada 60s + instantáneo en acciones |
| Regla de negocio | Pedidos ENTREGADO en turno cerrado = bloqueados |
| Anulación | Usa `SES.pass` (misma contraseña del login) |

### 4. SUPERVISOR BETA
| Propiedad | Valor |
|-----------|-------|
| Archivo | `supervisor_beta.html` |
| URL | `/supervisor-beta` |
| Estado | 🔧 Parcial |
| Correcciones | `cfgPWSave()` sincroniza a Supabase |
| Pendiente | Revisar completo, aplicar cloud-first |

### 5. SENIOR
| Propiedad | Valor |
|-----------|-------|
| Archivo | `senior.html` |
| URL | `/senior` |
| Estado | ⏳ Por revisar |
| Rol | Supervisor sénior — solo lectura del encargado |

### 6. OMEGA
| Propiedad | Valor |
|-----------|-------|
| Archivo | `omega.html` |
| URL | `/omega` |
| Estado | 🔧 Parcial |
| Correcciones | `items→productos`, evo-chart, `doLogin`/`selUser` definidos |
| Pendiente | CocaPay datos mock → Supabase real |

### 7. ALFA (Propietario)
| Propiedad | Valor |
|-----------|-------|
| Archivo | `supervisor_alfa.html` |
| URL | `/supervisor` |
| Estado | ⏳ Por revisar |
| Rol | Propietario — máximo nivel, todos los datos |

---

## 🔄 FLUJO DE DATOS

```
CLIENTE (App Móvil) ──→ pedido PENDIENTE ──→ SECRETARIO
                                                  │
                                          acepta → PREPARADO → ENTREGADO
                                                  │
                                          sync a Supabase ←────→ ENCARGADO (su sucursal)
                                                  │                    │
                                                  │              anula / traspasa
                                                  ▼                    ▼
                                              SUPABASE ◄────── BETA (todas)
                                                  │
                                                  ▼
                                              SENIOR (lee encargado)
                                                  │
                                                  ▼
                                              OMEGA (lee + CocaPay)
                                                  │
                                                  ▼
                                              ALFA (lee todo)
```

---

## 🔐 AISLAMIENTO POR SUCURSAL

### Secretario y Encargado
```
SES.suc = "Cuchilla"
   │
   ├── pedidos? sucursal_id=eq.Cuchilla
   ├── turnos?   sucursal_id=eq.Cuchilla
   ├── bk_*?     sucursal=eq.Cuchilla
   └── 12 claves de localStorage limpiadas al cambiar sucursal
```

### Beta, Senior, Omega, Alfa — Sin filtro (ven todas)

---

## 📋 TABLAS DE SUPABASE

| Tabla | Quién escribe | Quién lee |
|-------|--------------|-----------|
| `pedidos` | Secretario, App Móvil | Todos |
| `turnos` | Secretario | Todos |
| `sucursales` | Admin | Todos |
| `system_passwords` | Beta, Secretario | Todos |
| `secretarios` | Beta | Secretario, Encargado |
| `bk_reclamos` | Secretario | Encargado, Beta |
| `bk_log_anulaciones` | Secretario, Encargado | Beta, Omega |
| `bk_clientes` | Secretario | Encargado, Beta |
| `bk_menu` | Secretario | Secretario, App Móvil |
| `bk_sabores` | Secretario | Secretario, App Móvil |
| `bk_config_ticket` | Secretario | Secretario, Encargado |
| `bk_config_descuento` | Secretario | Secretario, Encargado |
| `produccion` | Encargado | Todos |
| `catalogo_productos` | Admin, Secretario | Todos |
| `coca_registros` | Omega | Omega, Alfa |
| `coca_pagos` | Omega | Omega, Alfa |
| `coca_config` | Sistema | Omega |

---

## 🛠️ CORRECCIONES APLICADAS

### Secretario
- Login cloud-first (`secre1234` → Supabase `system_passwords`)
- `safeSetItem()` + `window._dbFallback` (quota protection)
- `actualizarResumenTurno()` (auto-refresh)
- 12 claves limpiadas al cambiar sucursal
- `SUCURSAL_IDS` → nombres completos (FK fix)
- `buildTurnoData()` con UUID `id`
- `bk_turno_actual` con `id:1` (merge-duplicates)
- Deduplicación por `numero_nota+cliente+fecha_id`
- Auto-refresh en 5 acciones (vender, entregar, anular, cerrar, anticipo)
- Sin auto-turno / sin "Gabriel" por defecto
- `liberarEspacioPorFecha` lee DOM inputs
- `guardarConfigImpresora` sync a Supabase
- ~900 líneas de código muerto eliminadas
- 2 definiciones de SUPA_KEY consolidadas (misma cuenta)

### Encargado
- Sync cloud-first (pedidos, turnos, reclamos, anulaciones, producción, catálogo, secretarios)
- Dashboard, Pedidos, Cierres filtrados por `SES.suc`
- Pedidos ENTREGADO en turno cerrado = 🔒 bloqueados
- `ventas: [{id}]` (1% tamaño, evita quota)
- `_pedidosCerrados` global + `actualizarPedidosCerrados()`
- Anulación con `SES.pass` (sin backdoor `enc1234`)
- Cierres reordenados (Efectivo, QR, Anticipo, Total)
- Incidencias sin filtro de mes por defecto
- Auto-refresh todas las pestañas
- Login cloud-first (Supabase `system_passwords`)

### Supervisor Beta
- `cfgPWSave()` sync a Supabase

### Omega
- `items→productos` mapeo
- `evo-chart` poblado

### Supabase
- `coca_config` creada
- `sucursal` agregada a 7 tablas bk_*
- `sucursales` repoblada (7 sucursales)

---

## ✅ ESTADO ACTUAL

| Panel | Estado |
|-------|--------|
| Admin Kollita App | ⏳ Pendiente |
| Kollita Móvil App | ✅ Funcionando |
| Secretario | ✅ **Completo** |
| Encargado | ✅ **Completo** |
| Supervisor Beta | 🔧 Parcial |
| Senior | ⏳ Pendiente |
| Omega | 🔧 Parcial |
| Alfa | ⏳ Pendiente |

---

## 🎯 PRÓXIMOS PASOS

1. Restaurar `encargado.html` desde git (se perdió al restaurar secretario)
2. Senior — Revisar y conectar
3. Alfa — Revisar y conectar
4. Omega — Migrar CocaPay de mock a Supabase real
5. Beta — Revisión completa + cloud-first
6. Admin Kollita App — Revisar
7. Testing multi-dispositivo para las 7 sucursales

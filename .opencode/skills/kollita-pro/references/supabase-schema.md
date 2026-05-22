# Supabase Schema — Kollita Pro

Project: `wsqhzatsuymjoebzfhpg` | Region: São Paulo (sa-east-1)
Connection: `Host=db.wsqhzatsuymjoebzfhpg.supabase.co;Port=5432;Database=postgres;Username=postgres`

## Core Tables

### pedidos
Main orders table. Primary data source for all panels.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | uuid_generate_v4() | PK |
| sucursal_id | TEXT | NO | — | FK → sucursales(nombre) |
| numero_nota | INTEGER | YES | — | |
| cliente | TEXT | NO | — | |
| telefono | TEXT | YES | — | |
| secretario | TEXT | YES | — | |
| turno | TEXT | YES | — | |
| estado | TEXT | YES | 'PREPARADO' | CHECK: PREPARADO,ENTREGADO,ANULADO,PENDIENTE |
| total | NUMERIC | YES | 0 | |
| anticipo | NUMERIC | YES | 0 | |
| saldo_cobrado | NUMERIC | YES | 0 | |
| metodo_pago | TEXT | YES | — | CHECK: EFECTIVO,QR,MIXTO |
| items | JSONB | YES | '[]' | Product list |
| productos | JSONB | YES | — | Alternative product field |
| observacion | TEXT | YES | — | |
| fecha_id | DATE | NO | CURRENT_DATE | YYYY-MM-DD format |
| fecha_entrega | DATE | YES | — | Delivery date |
| hora_entrega | TEXT | YES | — | |
| synced | BOOLEAN | YES | false | |
| offline_id | TEXT | YES | — | |
| created_at | TIMESTAMPTZ | YES | now() | |
| updated_at | TIMESTAMPTZ | YES | now() | |
| ci_nit | TEXT | YES | — | |
| descuento | NUMERIC | YES | — | |
| hora | TEXT | YES | — | |
| nombre_encargado | TEXT | YES | — | |
| porcentaje_descuento | NUMERIC | YES | — | |
| secretario_entrega | TEXT | YES | — | |
| total_entregado | NUMERIC | YES | — | |
| turno_encargado | TEXT | YES | — | |
| turno_entrega | TEXT | YES | — | |
| subtotal | NUMERIC | YES | — | |
| efectivo_pagado | NUMERIC | YES | — | |
| qr_pagado | NUMERIC | YES | — | |
| anticipo_efectivo | NUMERIC | YES | — | |
| anticipo_qr | NUMERIC | YES | — | |

### turnos
Shift opening/closing records.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | gen_random_uuid() |
| sucursal_id | TEXT | YES | — |
| secretario_nombre | TEXT | YES | — |
| tipo_turno | TEXT | YES | — |
| estado | TEXT | YES | — |
| hora_apertura | TEXT | YES | — |
| hora_cierre | TEXT | YES | — |
| total_general | NUMERIC | YES | — |
| total_efectivo | NUMERIC | YES | — |
| total_qr | NUMERIC | YES | — |
| total_mixto_efectivo | NUMERIC | YES | — |
| total_mixto_qr | NUMERIC | YES | — |
| total_descuentos | NUMERIC | YES | — |
| total_anticipos | NUMERIC | YES | — |
| cantidad_ventas | INTEGER | YES | — |
| cantidad_anulados | INTEGER | YES | — |
| datos_cierre | JSONB | YES | — |
| created_at | TIMESTAMPTZ | NO | now() |

### sucursales
Branch registry (FK target for pedidos.sucursal_id).

| id (UUID) | nombre (TEXT) |
|-----------|--------------|
| 1de9447a... | 3 Pasos |
| 91054c33... | Cuchilla |
| 13812151... | G77 |
| 0f41e5a1... | Km8 |
| 87511b72... | 4to Anillo |
| 1f8846e9... | Paurito |
| de649da5... | Cotoca |

### Other Tables
- **secretarios**: Secretary registry
- **encargados**: Branch manager registry
- **produccion**: Production records
- **cierres_caja**: Cash closing records
- **catalogo_productos**: Product catalog (global, no FK to sucursales)
- **system_passwords**: Admin/supervisor passwords
- **coca_registros**: CocaPay registrations
- **coca_pagos**: CocaPay payments
- **reclamos**: Complaints
- **sync_queue**: Sync event log

## RLS Policies (pedidos)
- `pedidos_select`: USING (true)
- `pedidos_insert`: WITH CHECK (true)
- `pedidos_update`: USING (true)
- `pedidos_delete`: USING (true)

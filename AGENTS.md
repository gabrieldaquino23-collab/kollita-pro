# AGENTS.md — Kollita Pro

## Project Identity
- **Name:** Kollita Pro
- **Type:** Cloud-native POS (Point of Sale) system
- **Stack:** Supabase (PostgreSQL) + Vercel (Static Frontend) + Render (.NET 8 API)
- **Supabase Project:** `wsqhzatsuymjoebzfhpg`

## Code Conventions
- HTML panels: Vanilla JS, no frameworks, inline scripts
- All JS uses `const`/`let`, no `var`
- localStorage keys: `kollita_*` prefix
- Supabase calls: `fetch()` with `apikey` + `Authorization: Bearer` headers
- C#: .NET 8, ASP.NET Core Minimal APIs + Controllers, Npgsql

## Critical Constraints
- **NEVER expose `service_role` key in client code** — use only ANON KEY
- **NEVER hardcode passwords** — use environment variables or localStorage
- **`sucursal_id`** must match `sucursales(nombre)` — text-based FK
- **`metodo_pago`** CHECK constraint: only `EFECTIVO`, `QR`, `MIXTO`
- **`estado`** CHECK constraint: only `PREPARADO`, `ENTREGADO`, `ANULADO`, `PENDIENTE`
- **`fecha_id`** is NOT NULL — always include it in inserts
- **`numero_nota`** is INTEGER — use `parseInt()`

## Deployment
```bash
# Vercel (all panels)
vercel --prod

# Kollita Mobile
vercel --prod (project: kollita-movil-public)

# Render (API) — auto-deploys from Dockerfile
# Docker context: root, Dockerfile: KollitaApi/Dockerfile

# Supabase — manual SQL or Management API
# Use Management API token for admin operations
```

## Testing
```bash
# Upload backup data to Supabase
node upload_backup.js

# Check Supabase tables
node check_wsqhz.js

# Check pedidos schema
node check_schema.js

# Full upload test
node test_full_upload.js
```

## Skill
Load the project skill for detailed architecture docs:
```
.opencode/skills/kollita-pro/SKILL.md
```

## ⚠️ Bugs Corregidos — Lecciones Aprendidas
**ANTES de modificar `secretarios.html` o cualquier panel, leer:**
```
.opencode/skills/kollita-pro/references/bugs-aprendidos.md
```
Contiene 15+ patrones de bugs corregidos con soluciones. Evita repetir errores.

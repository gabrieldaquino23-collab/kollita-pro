---
name: kollita-pro
description: Kollita Pro — POS system with Supabase (PostgreSQL), Vercel (frontend), Render (.NET API). Multi-branch, cloud-first architecture with offline fallback. Use when working on this project.
metadata:
  author: Kollita Team
  version: "2026.5.19"
  supersed_project: wsqhzatsuymjoebzfhpg
  platforms:
    - vercel (kollita.vercel.app, kollita-movil-public.vercel.app)
    - render (KollitaApi Docker .NET 8)
    - supabase (wsqhzatsuymjoebzfhpg, São Paulo)
  tech_stack:
    - frontend: HTML5, CSS3, Vanilla JS, SheetJS, Font Awesome
    - backend: C# .NET 8, ASP.NET Core, Npgsql, SignalR
    - database: PostgreSQL 15 (Supabase), PostgREST API
    - deployment: Vercel (static), Render (Docker), GitHub Actions
---

## Project Overview

Kollita Pro is a cloud-native POS (Point of Sale) system for multi-branch retail. It uses a **cloud-first architecture** where Supabase PostgreSQL is the single source of truth, Vercel hosts static frontend panels, and Render runs the .NET API backend for complex operations.

## Architecture

| Layer | Technology | URL |
|-------|-----------|-----|
| Database | Supabase PostgreSQL | `wsqhzatsuymjoebzfhpg.supabase.co` |
| API | .NET 8 ASP.NET Core + SignalR | Render (Docker) |
| Frontend | Static HTML/JS | Vercel CDN |
| Realtime | Supabase REST polling (5s) + SignalR | — |

## Panels

| Panel | File | Vercel URL |
|-------|------|-----------|
| Portal | index.html | [kollita.vercel.app](https://kollita.vercel.app) |
| Secretario | kollita_borrador.html | /panel |
| Móvil Público | kollita movil.html | [kollita-movil-public.vercel.app](https://kollita-movil-public.vercel.app) |
| Encargado | encargado.html | /encargado |
| Supervisor Alfa | supervisor_alfa.html | /supervisor |
| Supervisor Beta | supervisor_beta.html | /supervisor-beta |
| Omega | omega.html | /omega |
| Senior | senior.html | /senior |
| CocaPay | coca_system_pro.html | /coca |
| Admin Móvil | admin de kollita movil.html | /admin-movil |

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Supabase Schema | Tables: pedidos, turnos, sucursales, secretarios, produccion, catalogo_productos, etc. | [references/supabase-schema.md](references/supabase-schema.md) |
| Data Flow | Mobile → Supabase → Secretario (poll 5s) → Sync to all panels | [references/data-flow.md](references/data-flow.md) |
| Auth System | localStorage-based login, SUCURSAL_IDS map, session tokens | [references/auth.md](references/auth.md) |
| Sync Engine | KollitaSync IIFE, upload_backup.js, merge-duplicates strategy | [references/sync-engine.md](references/sync-engine.md) |
| API Endpoints | /api/pedidos, /api/pendientes, /api/cierres, /hubs/kollita | [references/api.md](references/api.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| Venta Rápida | Quick sale with product catalog, discount, payment methods | [references/venta-rapida.md](references/venta-rapida.md) |
| Pedidos Móviles | Customer self-service via mobile panel, WhatsApp integration | [references/pedidos-moviles.md](references/pedidos-moviles.md) |
| Cierres de Turno | Shift opening/closing with financial reconciliation | [references/cierres.md](references/cierres.md) |
| Traspasos | Inter-branch order transfer | [references/traspasos.md](references/traspasos.md) |
| CocaPay | Payment management system for distributors | [references/cocapay.md](references/cocapay.md) |
| Reportes | Dashboard, Excel export, production reports | [references/reportes.md](references/reportes.md) |

## Development

| Topic | Description | Reference |
|-------|-------------|-----------|
| Local Dev | Use Live Server on port 5500, Node.js 18+ for scripts | [references/local-dev.md](references/local-dev.md) |
| Deploy Vercel | `vercel --prod` with token | [references/deploy-vercel.md](references/deploy-vercel.md) |
| Deploy Render | Docker build from KollitaApi/Dockerfile | [references/deploy-render.md](references/deploy-render.md) |
| Supabase Management | SQL queries, RLS policies, table management | [references/supabase-admin.md](references/supabase-admin.md) |
| Testing | upload_backup.js, test_full_upload.js, check_*.js | [references/testing.md](references/testing.md) |

## Constraints

- All panels share ONE Supabase project (`wsqhzatsuymjoebzfhpg`)
- `sucursal_id` must match `sucursales(nombre)` FK constraint
- `metodo_pago` CHECK: only EFECTIVO, QR, MIXTO
- `estado` CHECK: only PREPARADO, ENTREGADO, ANULADO, PENDIENTE
- `fecha_id` is NOT NULL with default CURRENT_DATE
- All Supabase calls use ANON KEY (JWT) via Authorization header
- Never expose service_role key in client-side code

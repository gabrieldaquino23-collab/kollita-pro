# Data Flow — Kollita Pro

## Multi-Device Order Flow

```
MOBILE APP                          SUPABASE                        SECRETARIO
──────────                          ────────                        ──────────
kollita movil.html                  wsqhzatsuymjoebzfhpg           kollita_borrador.html

1. User creates order
   ├─ items Machuca extracted
   └─ POST /rest/v1/pedidos ──────► INSERT INTO pedidos ──────► pollPendientesSupabase()
      {id, sucursal_id, cliente,       (estado=PENDIENTE,          GET every 5 seconds
       items, total, estado,            origen=movil)              estado=eq.PENDIENTE&origen=eq.movil
       metodo_pago, fecha_id,
       created_at}                                               4. renderHistorial()
                                                                   shows pending order
                                                                   with "📱" badge
                                                                 
                                                                 5. User clicks ✅ PREPARADO
                                                                   ├─ PATCH pedidos (estado=PREPARADO)
                                                                   ├─ Creates local nota in kollita_db
                                                                   └─ renderHistorial() refreshes
```

## Sync Architecture

### Write Path (Secretario creates/edits pedido)
1. Save to localStorage (`kollita_db`) — immediate
2. `syncPedidoASupabase()` — POST to Supabase with `resolution=merge-duplicates`
3. On failure → queue in `kollita_sync_cola_v1` for retry

### Read Path (All panels)
1. Supabase fetch (on load + periodic 30-60s interval)
2. Store in localStorage as cache
3. Render from localStorage (with Supabase data merged in)
4. If Supabase unreachable → use localStorage cache

### Turn Close
1. `confirmarCierre()` → `guardarTurnoCerrado()`
2. POST to Supabase `turnos` table
3. Sync all ENTREGADO pedidos to Supabase

## localStorage Keys
| Key | Purpose | Source |
|-----|---------|--------|
| kollita_db | Active pedidos | Secretario writes |
| kollita_pendientes | Mobile pending orders | Mobile writes, Secretario reads |
| turnos_cerrados_kollita | Closed shifts | Secretario writes |
| turno_actual_kollita | Current shift | Secretario writes |
| kollita_config_ticket | Branch config | All panels |
| kollita_menu | Product menu | Admin writes |
| kollita_sabores | Flavors | Admin writes |
| kollita_clientes | Customer DB | Secretario writes |
| kollita_enc_produccion | Production records | Encargado writes |
| kollita_enc_catalogo | Production catalog | Encargado writes |
| kollita_encargados | Branch managers | Supervisor writes |
| kollita_secretarios | Secretaries | Supervisor writes |
| kollita_system_passwords | Admin passwords | Supervisor writes |
| cocapay_v3_omega | CocaPay data | CocaPay writes, supervisors read |
| kollita_login_session | Login session | Login module |

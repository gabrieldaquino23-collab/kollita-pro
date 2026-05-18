/**
 * ============================================================
 * KOLLITA PRO — CLOUD SYNC ENGINE v3.0
 * Supabase: wsqhzatsuymjoebzfhpg (São Paulo)
 * Sistema paracaídas: offline-first con cola de sincronización
 * ============================================================
 */

const KollitaSync = (function() {

  const QUEUE_KEY   = 'kollita_sync_queue';
  const LAST_SYNC   = 'kollita_last_sync';
  let _syncTimer    = null;
  let _isSyncing    = false;

  // ── Utilidades ──────────────────────────────────────────
  function isOnline() { return navigator.onLine; }

  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
  }
  function saveQueue(q) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  }

  // ── Encolar operación offline ────────────────────────────
  function enqueue(tabla, operacion, payload, sucursal) {
    const q = getQueue();
    q.push({
      id: 'off_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      tabla, operacion, payload, sucursal,
      ts: new Date().toISOString(),
      intentos: 0
    });
    saveQueue(q);
    console.log(`📥 [Offline] Encolado: ${operacion} en ${tabla}`);
  }

  // ── Operación universal con paracaídas ───────────────────
  async function operate(tabla, operacion, payload, sucursal) {
    if (!isOnline()) {
      enqueue(tabla, operacion, payload, sucursal);
      return { offline: true };
    }
    try {
      let result;
      switch (operacion) {
        case 'INSERT': result = await SupabaseClient.insert(tabla, payload); break;
        case 'UPDATE': result = await SupabaseClient.update(tabla, payload.id, payload); break;
        case 'UPSERT': result = await SupabaseClient.upsert(tabla, payload); break;
        case 'DELETE': result = await SupabaseClient.delete(tabla, payload.id); break;
        default: throw new Error('Operación desconocida: ' + operacion);
      }
      return { online: true, data: result };
    } catch (err) {
      console.warn(`⚠️ Error online, encolando offline: ${err.message}`);
      enqueue(tabla, operacion, payload, sucursal);
      return { offline: true, error: err.message };
    }
  }

  // ── Procesar cola offline ────────────────────────────────
  async function procesarCola() {
    if (_isSyncing || !isOnline()) return;
    const q = getQueue();
    if (!q.length) return;

    _isSyncing = true;
    const pendientes = [...q];
    const fallidas   = [];

    for (const op of pendientes) {
      try {
        switch (op.operacion) {
          case 'INSERT': await SupabaseClient.insert(op.tabla, op.payload); break;
          case 'UPDATE': await SupabaseClient.update(op.tabla, op.payload.id, op.payload); break;
          case 'UPSERT': await SupabaseClient.upsert(op.tabla, op.payload); break;
          case 'DELETE': await SupabaseClient.delete(op.tabla, op.payload.id); break;
        }
        console.log(`✅ Sincronizado: ${op.operacion} en ${op.tabla}`);
      } catch (err) {
        op.intentos = (op.intentos || 0) + 1;
        if (op.intentos < 5) fallidas.push(op);
        else console.error(`❌ Descartado tras 5 intentos: ${op.id}`);
      }
    }

    saveQueue(fallidas);
    localStorage.setItem(LAST_SYNC, new Date().toISOString());
    _isSyncing = false;

    if (fallidas.length === 0 && pendientes.length > 0) {
      console.log(`🔄 Cola offline procesada: ${pendientes.length} operaciones sincronizadas`);
      dispatchEvent(new CustomEvent('kollita:sync-complete', { detail: { count: pendientes.length } }));
    }
  }

  // ── Leer datos con fallback a localStorage ───────────────
  async function leer(tabla, filtros, localKey) {
    if (!isOnline()) {
      console.warn(`📴 Offline — usando localStorage para ${tabla}`);
      if (localKey) {
        try { return JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return []; }
      }
      return [];
    }
    try {
      const q = filtros
        ? Object.entries(filtros).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&')
        : '';
      const data = await SupabaseClient.select(tabla, q + (q ? '&' : '') + 'order=created_at.desc');
      // Guardar copia local como respaldo
      if (localKey && data.length) localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn(`⚠️ Error leyendo ${tabla}, usando cache: ${err.message}`);
      if (localKey) {
        try { return JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return []; }
      }
      return [];
    }
  }

  // ── API Pública: Pedidos ─────────────────────────────────
  async function guardarPedido(pedido, sucursal) {
    const payload = { ...pedido, sucursal };
    if (!payload.id) payload.id = 'ped_' + Date.now();
    return operate('pedidos', 'UPSERT', payload, sucursal);
  }

  async function leerPedidos(sucursal) {
    const filtros = sucursal ? { sucursal } : null;
    return leer('pedidos', filtros, 'kollita_db');
  }

  // ── API Pública: Producción ──────────────────────────────
  async function guardarProduccion(registro, sucursal) {
    const payload = { ...registro, sucursal };
    if (!payload.id) payload.id = 'prod_' + Date.now();
    return operate('produccion', 'UPSERT', payload, sucursal);
  }

  async function leerProduccion(sucursal) {
    const filtros = sucursal ? { sucursal } : null;
    return leer('produccion', filtros, 'kollita_enc_produccion');
  }

  // ── API Pública: Cierres ─────────────────────────────────
  async function guardarCierre(cierre, sucursal) {
    const payload = { ...cierre, sucursal };
    if (!payload.id) payload.id = 'cie_' + Date.now();
    return operate('cierres_caja', 'INSERT', payload, sucursal);
  }

  async function leerCierres(sucursal) {
    const filtros = sucursal ? { sucursal } : null;
    return leer('cierres_caja', filtros, 'kollita_cierres');
  }

  // ── API Pública: Contraseñas ─────────────────────────────
  async function syncPassword(panel, passHash, updatedBy) {
    return operate('system_passwords', 'UPSERT', { panel, pass_hash: passHash, updated_by: updatedBy }, null);
  }

  async function leerPasswords() {
    return leer('system_passwords', null, 'kollita_system_passwords_cloud');
  }

  // ── API Pública: Secretarios ─────────────────────────────
  async function leerSecretarios(sucursal) {
    const filtros = sucursal ? { sucursal } : null;
    return leer('secretarios', filtros, 'kollita_secretarios_cloud');
  }

  async function guardarSecretario(sec) {
    return operate('secretarios', 'UPSERT', sec, sec.sucursal);
  }

  // ── Monitoreo de conectividad ────────────────────────────
  window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada — sincronizando cola offline...');
    setTimeout(procesarCola, 1500);
  });

  window.addEventListener('offline', () => {
    console.warn('📴 Sin conexión — modo paracaídas activado');
  });

  // Sincronización automática cada 30 segundos si hay cola pendiente
  _syncTimer = setInterval(() => {
    if (isOnline() && getQueue().length > 0) procesarCola();
  }, 30000);

  // ── Info de estado ───────────────────────────────────────
  function estado() {
    const q = getQueue();
    return {
      online: isOnline(),
      pendientes: q.length,
      ultimaSync: localStorage.getItem(LAST_SYNC) || 'Nunca',
      proyecto: 'kollita-pro (São Paulo)'
    };
  }

  // ── Exponer API ──────────────────────────────────────────
  return {
    guardarPedido,
    leerPedidos,
    guardarProduccion,
    leerProduccion,
    guardarCierre,
    leerCierres,
    syncPassword,
    leerPasswords,
    leerSecretarios,
    guardarSecretario,
    procesarCola,
    enqueue,
    estado,
    isOnline
  };

})();

// Alias global para compatibilidad con código existente
window.KollitaSync = KollitaSync;

console.log('%c🔄 KollitaSync v3.0 listo — São Paulo', 'color:#f5c518;font-weight:bold');

/**
 * ============================================================
 * KOLLITA PRO — SUPABASE CONFIGURATION
 * Proyecto: kollita-pro | Región: São Paulo (sa-east-1)
 * ============================================================
 */

const SUPABASE_URL = 'https://wsqhzatsuymjoebzfhpg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcWh6YXRzdXltam9lYnpmaHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTUyMTMsImV4cCI6MjA5NDYzMTIxM30.bFCJBY9PAa8WviEwE8HdO2TjE3ytYM3sD6qFgxJ0pPM';

/**
 * Cliente Supabase liviano (sin librería npm)
 * Todas las operaciones se hacen via REST API
 */
const SupabaseClient = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,

  headers() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': 'Bearer ' + this.key,
      'Prefer': 'return=representation'
    };
  },

  /**
   * SELECT — leer registros
   * @param {string} tabla - nombre de la tabla
   * @param {string} query - parámetros de filtro en formato PostgREST (ej: "sucursal=eq.Cuchilla")
   */
  async select(tabla, query = '') {
    const url = `${this.url}/rest/v1/${tabla}${query ? '?' + query : ''}`;
    const r = await fetch(url, { headers: this.headers() });
    if (!r.ok) throw new Error(`Error SELECT ${tabla}: ${r.status}`);
    return await r.json();
  },

  /**
   * INSERT — insertar registro
   */
  async insert(tabla, data) {
    const url = `${this.url}/rest/v1/${tabla}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`Error INSERT ${tabla}: ${r.status}`);
    return await r.json();
  },

  /**
   * UPDATE — actualizar registro por id
   */
  async update(tabla, id, data) {
    const url = `${this.url}/rest/v1/${tabla}?id=eq.${id}`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`Error UPDATE ${tabla}: ${r.status}`);
    return await r.json();
  },

  /**
   * DELETE — eliminar registro por id
   */
  async delete(tabla, id) {
    const url = `${this.url}/rest/v1/${tabla}?id=eq.${id}`;
    const r = await fetch(url, {
      method: 'DELETE',
      headers: this.headers()
    });
    if (!r.ok) throw new Error(`Error DELETE ${tabla}: ${r.status}`);
    return true;
  },

  /**
   * UPSERT — insertar o actualizar
   */
  async upsert(tabla, data, onConflict = 'id') {
    const url = `${this.url}/rest/v1/${tabla}?on_conflict=${onConflict}`;
    const headers = { ...this.headers(), 'Prefer': 'resolution=merge-duplicates,return=representation' };
    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`Error UPSERT ${tabla}: ${r.status}`);
    return await r.json();
  },

  /**
   * Verificar conexión con Supabase
   */
  async ping() {
    try {
      await this.select('sucursales', 'limit=1');
      return true;
    } catch {
      return false;
    }
  }
};

// Verificación silenciosa al cargar
(async function() {
  const online = await SupabaseClient.ping();
  if (online) {
    console.log('%c✅ Kollita Pro — Supabase conectado (São Paulo)', 'color:#00e676;font-weight:bold');
  } else {
    console.warn('⚠️ Kollita Pro — Modo offline activo');
  }
})();

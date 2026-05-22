/**
 * ============================================================
 * KOLLITA PRO — SUPABASE CONFIGURATION v3.0
 * Proyecto: kollita-pro | Región: São Paulo (sa-east-1)
 * Soporta JWT para RLS + fallback a ANON KEY
 * ============================================================
 */

const SUPABASE_URL = 'https://wsqhzatsuymjoebzfhpg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcWh6YXRzdXltam9lYnpmaHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTUyMTMsImV4cCI6MjA5NDYzMTIxM30.bFCJBY9PAa8WviEwE8HdO2TjE3ytYM3sD6qFgxJ0pPM';
const KOLLITA_API = 'https://kollita-api.onrender.com';

/**
 * Cliente Supabase con soporte JWT para RLS
 */
const SupabaseClient = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,

  /**
   * Obtener token JWT del localStorage (del login via API)
   */
  getJwt() {
    try {
      const raw = localStorage.getItem('kollita_jwt_token');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj.token && Date.now() < obj.expiresAt) return obj.token;
      localStorage.removeItem('kollita_jwt_token');
      return null;
    } catch(e) { return null; }
  },

  /**
   * Decodificar payload JWT (sin verificar firma)
   */
  jwtPayload() {
    const token = this.getJwt();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(json);
    } catch(e) { return null; }
  },

  /**
   * Headers: usa JWT si existe (RLS), si no usa ANON KEY (público)
   */
  headers() {
    const jwt = this.getJwt();
    const authToken = jwt || this.anonKey;
    return {
      'Content-Type': 'application/json',
      'apikey': this.anonKey,
      'Authorization': 'Bearer ' + authToken,
      'Prefer': 'return=representation'
    };
  },

  /**
   * Headers para API de Kollita (.NET) con JWT
   */
  apiHeaders() {
    const jwt = this.getJwt();
    const h = { 'Content-Type': 'application/json' };
    if (jwt) h['Authorization'] = 'Bearer ' + jwt;
    return h;
  },

  /**
   * SELECT — leer registros (con RLS automático si hay JWT)
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
    const h = { ...this.headers(), 'Prefer': 'resolution=merge-duplicates,return=representation' };
    const r = await fetch(url, {
      method: 'POST',
      headers: h,
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
  },

  // ═══════ API KOLLITA (.NET) ═══════

  /**
   * Login contra API Kollita (devuelve JWT)
   */
  async login(email, password) {
    const r = await fetch(`${KOLLITA_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Credenciales inválidas');
    }
    const data = await r.json();
    // Guardar JWT para que los headers() lo usen automáticamente
    localStorage.setItem('kollita_jwt_token', JSON.stringify({
      token: data.token,
      user: { nombre: data.nombre, rol: data.rol, sucursal: data.sucursal },
      expiresAt: new Date(data.expira).getTime()
    }));
    return data;
  },

  /**
   * Logout — elimina JWT
   */
  logout() {
    localStorage.removeItem('kollita_jwt_token');
    localStorage.removeItem('kollita_login_session');
  },

  /**
   * Verificar si hay sesión activa
   */
  isLoggedIn() {
    return this.getJwt() !== null;
  },

  /**
   * Llamada genérica a la API Kollita
   */
  async apiCall(endpoint, method = 'GET', body = null) {
    const opts = { method, headers: this.apiHeaders() };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${KOLLITA_API}${endpoint}`, opts);
    if (r.status === 401) { this.logout(); throw new Error('Sesión expirada'); }
    return r;
  }
};

// Verificación silenciosa al cargar
(async function() {
  const online = await SupabaseClient.ping();
  if (online) {
    console.log('%c Kollita Pro — Supabase conectado (São Paulo) | JWT: ' + (SupabaseClient.isLoggedIn() ? 'activo' : 'anónimo'), 'color:#00e676;font-weight:bold');
  } else {
    console.warn('Kollita Pro — Modo offline activo');
  }
})();

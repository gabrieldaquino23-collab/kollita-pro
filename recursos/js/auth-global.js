/**
 * ============================================================
 * KOLLITA PRO — AUTH GLOBAL v3.0
 * Sistema de autenticación unificado JWT + localStorage
 * ============================================================
 */

const KOLLITA_API_URL = 'https://kollita-api.onrender.com';

/**
 * Almacenar token JWT en localStorage
 */
function kollitaSaveToken(token, user) {
  try {
    const payload = parseKollitaJwt(token);
    const expiresAt = payload && payload.exp ? payload.exp * 1000 : Date.now() + 8 * 3600000;
    localStorage.setItem('kollita_jwt_token', JSON.stringify({ token, user, expiresAt }));
  } catch(e) {}
}

/**
 * Obtener token JWT de localStorage
 */
function kollitaGetToken() {
  try {
    const raw = localStorage.getItem('kollita_jwt_token');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj.token && Date.now() < obj.expiresAt) return obj.token;
    return null;
  } catch(e) { return null; }
}

/**
 * Obtener headers con JWT si existe
 */
function kollitaAuthHeaders() {
  const token = kollitaGetToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

/**
 * Verificar si el token JWT es válido
 */
function kollitaIsAuthenticated() {
  return kollitaGetToken() !== null;
}

/**
 * Parsear payload JWT (sin verificar firma)
 */
function parseKollitaJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch(e) { return null; }
}

/**
 * Login via API JWT
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} { token, nombre, rol, sucursal, cambioContrasena }
 */
async function kollitaLogin(email, password) {
  const r = await fetch(`${KOLLITA_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciales inválidas');
  }

  const data = await r.json();
  kollitaSaveToken(data.token, { nombre: data.nombre, rol: data.rol, sucursal: data.sucursal });
  return data;
}

/**
 * Registrar nuevo usuario via API
 */
async function kollitaRegister(email, password, nombre, rol, sucursal) {
  const r = await fetch(`${KOLLITA_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nombre, rol, sucursal })
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || 'Error al registrar');
  }

  const data = await r.json();
  kollitaSaveToken(data.token, { nombre: data.nombre, rol: data.rol, sucursal: data.sucursal });
  return data;
}

/**
 * Cerrar sesión
 */
function kollitaLogout() {
  localStorage.removeItem('kollita_jwt_token');
  localStorage.removeItem('kollita_login_session');
  localStorage.removeItem('kollita_system_passwords');
}

/**
 * Llamar a la API con JWT
 */
async function kollitaApiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: kollitaAuthHeaders()
  };
  if (body) options.body = JSON.stringify(body);

  const r = await fetch(`${KOLLITA_API_URL}${endpoint}`, options);

  if (r.status === 401) {
    kollitaLogout();
    window.location.reload();
    throw new Error('Sesión expirada');
  }

  return r;
}

/**
 * Muestra modal de cambio obligatorio de contraseña.
 * Al guardar, persiste en localStorage Y sincroniza con Supabase.
 */
function mostrarModalCambioPassGlobal(panelName, onSuccessCallback) {
    var modalHtml = `
    <div id="modal-cambio-pass-global" style="position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:99999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(8px);font-family:sans-serif;">
        <div style="background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);padding:36px;border-radius:18px;width:90%;max-width:420px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:2.5em;margin-bottom:12px;">\uD83D\uDD10</div>
            <h3 style="margin:0 0 6px 0;color:#fff;font-size:1.2em;letter-spacing:.5px;">Cambio de Contraseña Obligatorio</h3>
            <p style="font-size:0.82em;color:rgba(255,255,255,0.6);margin-bottom:22px;line-height:1.5;">Por seguridad, debes cambiar la contraseña predeterminada antes de continuar.<br><span style="color:#f5c518;font-weight:bold;">Panel: ${panelName}</span></p>
            <div style="text-align:left;margin-bottom:14px;">
                <label style="display:block;font-size:0.8em;font-weight:bold;margin-bottom:6px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:.5px;">Nueva Contraseña</label>
                <input type="password" id="ac-new-pass" placeholder="Mínimo 4 caracteres" style="width:100%;padding:11px 14px;border:1px solid rgba(255,255,255,0.15);border-radius:10px;font-size:1em;box-sizing:border-box;background:rgba(255,255,255,0.08);color:#fff;outline:none;" autofocus>
            </div>
            <div style="text-align:left;margin-bottom:18px;">
                <label style="display:block;font-size:0.8em;font-weight:bold;margin-bottom:6px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:.5px;">Confirmar Contraseña</label>
                <input type="password" id="ac-conf-pass" placeholder="Repite la contraseña" style="width:100%;padding:11px 14px;border:1px solid rgba(255,255,255,0.15);border-radius:10px;font-size:1em;box-sizing:border-box;background:rgba(255,255,255,0.08);color:#fff;outline:none;">
            </div>
            <div id="ac-err" style="color:#ff6b6b;font-size:0.83em;margin-bottom:14px;display:none;font-weight:bold;background:rgba(255,45,85,0.12);padding:8px 12px;border-radius:8px;border:1px solid rgba(255,45,85,0.3);"></div>
            <button id="ac-btn-save" style="width:100%;background:linear-gradient(90deg,#00b4ff,#0066ff);color:#fff;border:none;padding:13px;border-radius:10px;font-size:1em;font-weight:bold;cursor:pointer;letter-spacing:.3px;transition:opacity .2s;">
                ✅ Guardar y Entrar
            </button>
            <div id="ac-sync-status" style="margin-top:12px;font-size:0.75em;color:rgba(255,255,255,0.4);"></div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Permitir Enter para guardar
    ['ac-new-pass', 'ac-conf-pass'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') document.getElementById('ac-btn-save').click();
        });
    });

    document.getElementById('ac-btn-save').onclick = async function() {
        var p1  = document.getElementById('ac-new-pass').value;
        var p2  = document.getElementById('ac-conf-pass').value;
        var err = document.getElementById('ac-err');
        var status = document.getElementById('ac-sync-status');
        err.style.display = 'none';

        // Validaciones
        if (p1.length < 4)          { err.textContent = '⚠️ La contraseña debe tener al menos 4 caracteres.'; err.style.display = 'block'; return; }
        if (p1 !== p2)              { err.textContent = '⚠️ Las contraseñas no coinciden.'; err.style.display = 'block'; return; }
        if (p1 === 'contra1234')    { err.textContent = '⚠️ No puedes usar la contraseña predeterminada.'; err.style.display = 'block'; return; }

        // 1. Guardar en localStorage (inmediato)
        var pws = [];
        try { pws = JSON.parse(localStorage.getItem('kollita_system_passwords') || '[]'); } catch(e) {}

        if (panelName.startsWith('Secretario ')) {
            var secs = [];
            try { secs = JSON.parse(localStorage.getItem('kollita_secretarios') || '[]'); } catch(e) {}
            var nombreSec = panelName.replace('Secretario ', '');
            var s = secs.find(function(x) { return x.nombre === nombreSec; });
            if (s) {
                s.password = p1;
                localStorage.setItem('kollita_secretarios', JSON.stringify(secs));
            }
        }

        var obj = pws.find(function(x) { return x.panel === panelName; });
        if (obj) { obj.pass = p1; } else { pws.push({ panel: panelName, user: '', pass: p1 }); }
        localStorage.setItem('kollita_system_passwords', JSON.stringify(pws));

        // 2. Sincronizar con API JWT
        status.textContent = '🔄 Sincronizando...';
        try {
            const r = await kollitaApiCall('/api/auth/cambiar-password', 'POST', { nuevaPassword: p1 });
            if (r.ok) status.textContent = '☁️ Sincronizado con la nube';
            else status.textContent = '📴 Guardado local (sync pendiente)';
        } catch (syncErr) {
            status.textContent = '📴 Guardado local (sync pendiente)';
            // Fallback: Supabase sync
            try {
                if (typeof SupabaseClient !== 'undefined') {
                    await SupabaseClient.upsert('system_passwords', {
                        panel: panelName,
                        pass_hash: p1,
                        updated_by: 'user'
                    }, 'panel');
                    status.textContent = '☁️ Sincronizado con la nube';
                }
            } catch (sbErr) {}
        }

        // 3. Cerrar modal y continuar
        setTimeout(function() {
            var modal = document.getElementById('modal-cambio-pass-global');
            if (modal) modal.remove();
            if (onSuccessCallback) onSuccessCallback();
        }, 600);
    };
}

/**
 * Lee todas las contraseñas del sistema desde localStorage.
 * Retorna un array de objetos {panel, user, pass}.
 */
function cfgLeerPasswords() {
    try {
        return JSON.parse(localStorage.getItem('kollita_system_passwords') || '[]');
    } catch(e) { return []; }
}

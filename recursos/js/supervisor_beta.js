/* ═══════════════════════════════════════════════════════════════
   SUPERVISOR BETA — JAVASCRIPT
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── DEPENDENCIES ───
// Reuses: esc(), fmt(), rnd(), fechaISO() from utilidades.js
// Reuses: SUCURSALES, SECRETARIOS, buildMockData() from datos.js

// ─── CONFIG ───
const CFG = {
  PASS_BETA: 'beta2024',
  MAX_ROWS: 200,
  REFRESH_PEND: 5000,
  REFRESH_STATS: 10000,
};

// ─── STATE ───
let DATA = null;
let _incItems = [];
let _pedAnular = null;
let _sucAnular = null;
let _encEditSuc = null;
let _encEditIdx = -1;
let _betaIntervalPend = null;
let _betaIntervalStats = null;
let _betaSync = null;

const CFG_DESC = { activo: true, porcentaje: 30, montoMinimo: 100 };
let CFG_SECS = [];
let CFG_ENCS = [];

// ─── BOOT ───
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initTabs();
  initModals();
  try { _betaSync = new BroadcastChannel('kollita_sync'); } catch(e) {}
  if (_betaSync) {
    _betaSync.onmessage = (e) => {
      if (e.data && /nuevo_pendiente|pendiente_preparado/.test(e.data.type)) _betaCargarPendientes();
    };
  }
  window.addEventListener('kollita_sync', (e) => {
    if (e.detail && /nuevo_pendiente|pendiente_preparado/.test(e.detail.type)) _betaCargarPendientes();
  });
});

// ═══════════════════════════════════════
// LOGIN / LOGOUT
// ═══════════════════════════════════════

function initLogin() {
  const input = document.getElementById('lg-pass');
  if (!input) return;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('login-btn')?.addEventListener('click', doLogin);
}

function doLogin() {
  const pass = document.getElementById('lg-pass').value;
  const err = document.getElementById('lg-err');
  err.style.display = 'none';
  if (pass !== CFG.PASS_BETA) {
    err.textContent = 'Contraseña incorrecta.';
    err.style.display = 'block';
    return;
  }
  DATA = buildMockData();
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('tb-fecha').textContent = new Date().toLocaleDateString('es-BO', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  poblarFiltros();
  renderDashPedidos();
  renderConfig();
  startPolling();
}

function doLogout() {
  DATA = null;
  stopPolling();
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('lg-pass').value = '';
}

function startPolling() {
  _betaIntervalPend = setInterval(_betaCargarPendientes, CFG.REFRESH_PEND);
  _betaIntervalStats = setInterval(_betaRealStats, CFG.REFRESH_STATS);
  setTimeout(_betaCargarPendientes, 500);
  setTimeout(_betaRealStats, 600);
}

function stopPolling() {
  clearInterval(_betaIntervalPend);
  clearInterval(_betaIntervalStats);
  _betaIntervalPend = null;
  _betaIntervalStats = null;
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════

function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => goTab(tab.dataset.tab));
  });
}

function goTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + tabId));
  const map = {
    dashboard: renderDashPedidos,
    pedidos: renderPedidos,
    cierres: renderCierres,
    incidencias: renderInc,
    clientes: renderClientes,
    config: renderConfig,
  };
  map[tabId]?.();
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function timeAgo(fechaStr) {
  if (!fechaStr) return '—';
  try {
    const [y, m, d] = fechaStr.split('-').map(Number);
    if (!y || !m || !d) return '—';
    const diff = Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86400000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    if (diff < 7) return diff + 'd';
    return Math.floor(diff / 7) + 's';
  } catch { return '—'; }
}

function getActiveEstado(containerId) {
  const active = document.querySelector(`#${containerId} .filter-tab.active`);
  return active?.dataset?.est || '';
}

function setActiveEstado(containerId, estado) {
  document.querySelectorAll(`#${containerId} .filter-tab`).forEach(b =>
    b.classList.toggle('active', b.dataset.est === estado)
  );
}

function poblarFiltros() {
  ['ped-suc','cie-suc','inc-suc','cli-suc'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    SUCURSALES.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      sel.appendChild(o);
    });
  });
  const anSuc = document.getElementById('an-suc');
  if (anSuc) {
    SUCURSALES.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      anSuc.appendChild(o);
    });
  }
  const now = new Date().toISOString().slice(0, 7);
  const cieMes = document.getElementById('cie-mes');
  const incMes = document.getElementById('inc-mes');
  if (cieMes) cieMes.value = now;
  if (incMes) incMes.value = now;
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════

function filtrarDashEstado(btn) {
  const estado = btn.dataset.est;
  setActiveEstado('dash-estado-tabs', estado);
  renderDashPedidos();
}

function renderDashPedidos() {
  if (!DATA) return;
  const estF = getActiveEstado('dash-estado-tabs') || 'PENDIENTE';
  const q = (document.getElementById('dash-q')?.value || '').toLowerCase();
  const tbody = document.getElementById('dash-ped-tbody');
  if (!tbody) return;

  let rows = [];
  SUCURSALES.forEach(suc => {
    (DATA[suc].pedidos || []).forEach(p => rows.push({ ...p, sucursal: suc }));
  });

  rows = rows.filter(p => {
    const estado = (p.estado || 'PREPARADO').toUpperCase();
    if (estF && estado !== estF) return false;
    if (q && !esc(p.cliente).toLowerCase().includes(q) && !String(p.numeroNota || '').includes(q) && !esc(p.secretario).toLowerCase().includes(q)) return false;
    return true;
  });

  rows.sort((a, b) => (b.fechaID || b.fecha || '').localeCompare(a.fechaID || a.fecha || '') || (b.numeroNota || 0) - (a.numeroNota || 0));
  rows = rows.slice(0, CFG.MAX_ROWS);

  if (!rows.length) {
    tbody.innerHTML = emptyRow(9, 'Sin pedidos');
    return;
  }

  const bc = { PENDIENTE: 'badge--orange', PREPARADO: 'badge--orange', ENTREGADO: 'badge--green', ANULADO: 'badge--red' };
  tbody.innerHTML = rows.map(p => {
    const est = (p.estado || 'PREPARADO').toUpperCase();
    const itemsTxt = formatItemsPreview(p.items);
    return `<tr>
      <td><button class="btn btn--ghost btn--small" onclick="verPedido('${esc(p.sucursal)}','${p.id}')">👁️</button></td>
      <td class="fw-700 text-beta nowrap">Nº ${esc(p.numeroNota || '—')}</td>
      <td class="text-beta nowrap" style="font-size:0.8em">${esc(p.sucursal)}</td>
      <td><div class="truncate">${esc(p.cliente)}</div><div class="truncate text-muted" style="font-size:0.72em">${esc(itemsTxt)}</div></td>
      <td class="truncate">${esc(p.secretario)}</td>
      <td class="nowrap" style="font-size:0.8em">${esc(p.fecha || '—')}</td>
      <td class="fw-700 text-right nowrap">${fmt(p.total)}</td>
      <td class="nowrap"><span class="badge ${bc[est] || 'badge--orange'}">${est}</span></td>
      <td class="text-center nowrap">${renderActions(p, est)}</td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════
// PEDIDOS
// ═══════════════════════════════════════

function filtrarEstado(btn) {
  setActiveEstado('estado-tabs', btn.dataset.est);
  renderPedidos();
}

function renderPedidos() {
  if (!DATA) return;
  const sucF = document.getElementById('ped-suc')?.value || '';
  const q = (document.getElementById('ped-q')?.value || '').toLowerCase();
  const estF = getActiveEstado('estado-tabs') || 'PENDIENTE';
  const tbody = document.getElementById('ped-tbody');
  if (!tbody) return;

  let rows = [];
  (sucF ? [sucF] : SUCURSALES).forEach(suc => {
    (DATA[suc].pedidos || []).forEach(p => {
      if (estF && (p.estado || 'PREPARADO').toUpperCase() !== estF) return;
      if (q && !esc(p.cliente).toLowerCase().includes(q) && !String(p.numeroNota || '').includes(q) && !esc(p.secretario).toLowerCase().includes(q)) return;
      rows.push({ ...p, sucursal: suc });
    });
  });

  rows.sort((a, b) => (b.fechaID || b.fecha || '').localeCompare(a.fechaID || a.fecha || '') || (b.numeroNota || 0) - (a.numeroNota || 0));
  rows = rows.slice(0, CFG.MAX_ROWS);

  if (!rows.length) {
    tbody.innerHTML = emptyRow(9, 'Sin resultados');
    return;
  }

  const bc = { PREPARADO: 'badge--orange', ENTREGADO: 'badge--green', PENDIENTE: 'badge--orange', ANULADO: 'badge--red' };
  tbody.innerHTML = rows.map(p => {
    const est = (p.estado || 'PREPARADO').toUpperCase();
    const itemsTxt = formatItemsPreview(p.items);
    return `<tr>
      <td><button class="btn btn--ghost btn--small" onclick="verPedido('${esc(p.sucursal)}','${p.id}')">👁️</button></td>
      <td class="fw-700 text-beta nowrap">Nº ${esc(String(p.numeroNota || '—'))}</td>
      <td class="text-beta nowrap" style="font-size:0.8em">${esc(p.sucursal)}</td>
      <td><div class="truncate">${esc(p.cliente)}</div><div class="truncate text-muted" style="font-size:0.72em">${esc(itemsTxt)}</div></td>
      <td class="truncate">${esc(p.secretario)}</td>
      <td class="nowrap" style="font-size:0.8em">${esc(p.fecha || '—')}</td>
      <td class="fw-700 text-right nowrap">${fmt(p.total)}</td>
      <td class="nowrap"><span class="badge ${bc[est] || 'badge--orange'}">${est}</span></td>
      <td class="text-center nowrap">${renderActions(p, est)}</td>
    </tr>`;
  }).join('');
}

function formatItemsPreview(items) {
  if (!items?.length) return '';
  const txt = items.slice(0, 2).map(it => `${it.c}x ${it.n}`).join(', ');
  return items.length > 2 ? txt + ` +${items.length - 2}` : txt;
}

function renderActions(p, est) {
  if (est === 'PENDIENTE' || est === 'PREPARADO') {
    return `<button class="btn btn--danger btn--small" onclick="abrirAnularPed('${esc(p.sucursal)}','${p.id}')">❌ Anular</button>`;
  }
  if (est === 'ENTREGADO') {
    return `<span style="display:inline-flex;gap:6px">
      <button class="btn btn--danger btn--small" onclick="abrirAnularPed('${esc(p.sucursal)}','${p.id}')">❌ Anular</button>
      <button class="btn btn--success btn--small" onclick="traspasarAPreparado('${esc(p.sucursal)}','${p.id}')">🔄 Preparado</button>
    </span>`;
  }
  if (est === 'ANULADO') {
    return `<button class="btn btn--ghost btn--small" onclick="reactivarPedido('${esc(p.sucursal)}','${p.id}')">♻️ Reactivar</button>`;
  }
  return '';
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" class="empty-state" style="padding:30px">
    <div class="empty-state__icon">📭</div>
    <div class="empty-state__title">${esc(msg)}</div>
  </td></tr>`;
}

// ═══════════════════════════════════════
// PEDIDO DETAIL
// ═══════════════════════════════════════

function verPedido(suc, id) {
  const p = (DATA[suc]?.pedidos || []).find(x => String(x.id) === String(id));
  if (!p) return;
  const title = document.getElementById('ped-modal-title');
  const body = document.getElementById('ped-modal-body');
  if (title) title.innerHTML = `Pedido Nº ${esc(p.numeroNota || '—')} — ${esc(suc)} <button class="modal__close" onclick="closeModal('modal-ped')">✕</button>`;

  const items = (p.items || []).map(it =>
    `<tr><td>${esc(it.n)}</td><td class="text-center">${it.c}</td><td class="text-right">${fmt(it.p)}</td><td class="text-right fw-700">${fmt(it.c * it.p)}</td></tr>`
  ).join('');

  const badgeClass = p.estado === 'ENTREGADO' ? 'badge--green' : p.estado === 'ANULADO' ? 'badge--red' : 'badge--orange';

  body.innerHTML = `
    <div class="config-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:0.85em">
      <div><span class="text-muted">Cliente: </span><strong>${esc(p.cliente)}</strong></div>
      <div><span class="text-muted">Secretario: </span><strong>${esc(p.secretario)}</strong></div>
      <div><span class="text-muted">Fecha: </span><strong>${esc(p.fecha || '—')}</strong></div>
      <div><span class="text-muted">Estado: </span><span class="badge ${badgeClass}">${p.estado || 'PREPARADO'}</span></div>
      ${p.metodoPago ? `<div><span class="text-muted">Pago: </span><strong>${esc(p.metodoPago)}</strong></div>` : ''}
      ${(p.anticipo || 0) > 0 ? `<div class="text-purple"><span class="text-muted">Anticipo: </span><strong>${fmt(p.anticipo)}</strong></div>` : ''}
    </div>
    <div class="table-wrap"><div class="table-responsive"><table>
      <thead><tr><th>Producto</th><th class="text-center">Cant.</th><th class="text-right">Precio</th><th class="text-right">Subtotal</th></tr></thead>
      <tbody>${items}</tbody>
    </table></div></div>
    <div class="config-row" style="justify-content:space-between">
      <span class="fw-700 text-muted">TOTAL</span>
      <span class="fw-900 text-green" style="font-size:1.4em">${fmt(p.total)}</span>
    </div>`;
  openModal('modal-ped');
}

// ═══════════════════════════════════════
// CIERRES
// ═══════════════════════════════════════

function renderCierres() {
  if (!DATA) return;
  const sucF = document.getElementById('cie-suc')?.value || '';
  const mesF = document.getElementById('cie-mes')?.value || '';
  const kpis = document.getElementById('cie-kpis');
  const tbody = document.getElementById('cie-tbody');
  if (!kpis || !tbody) return;

  let rows = [];
  (sucF ? [sucF] : SUCURSALES).forEach(suc => {
    (DATA[suc].cierres || []).forEach(c => rows.push({ ...c, sucursal: suc }));
  });
  if (mesF) rows = rows.filter(c => (c.fechaCierreFormato || '').startsWith(mesF));
  rows.sort((a, b) => (b.fechaCierreFormato || '').localeCompare(a.fechaCierreFormato || ''));

  const tG = rows.reduce((s, c) => s + (c.totalGeneral || 0), 0);
  const tE = rows.reduce((s, c) => s + (c.totalEfectivo || 0), 0);
  const tQ = rows.reduce((s, c) => s + (c.totalQR || 0), 0);

  kpis.innerHTML = [
    { l: 'Total recaudado', v: fmt(tG), a: 'var(--green)' },
    { l: 'Efectivo', v: fmt(tE), a: 'var(--orange)' },
    { l: 'QR', v: fmt(tQ), a: 'var(--purple)' },
    { l: 'Cierres', v: rows.length, a: 'var(--beta)' },
  ].map(c => `<div class="stat-card" style="--accent:${c.a}"><div class="stat-card__label">${c.l}</div><div class="stat-card__value" style="font-size:1.3em">${c.v}</div></div>`).join('');

  if (!rows.length) {
    tbody.innerHTML = emptyRow(10, 'Sin cierres');
    return;
  }

  tbody.innerHTML = rows.map(c => {
    const tot = c.totalGeneral || 0;
    const indice = tot > 3000 ? '🟢 Alto' : tot > 1500 ? '🟡 Medio' : '🔴 Bajo';
    return `<tr>
      <td class="text-beta fw-700">${esc(c.sucursal)}</td>
      <td class="fw-700">${esc(c.secretario)}</td>
      <td>${c.turno}</td>
      <td style="font-size:0.78em">${esc(c.fechaCierreFormato)} ${esc(c.horaCierreFormato)}</td>
      <td class="text-center">${c.cantidadVentas || 0}</td>
      <td class="text-purple">${(c.totalAnticipos || 0) > 0 ? fmt(c.totalAnticipos) : '—'}</td>
      <td class="text-green fw-700">${fmt(c.totalGeneral)}</td>
      <td>${(c.totalEfectivo || 0) > 0 ? fmt(c.totalEfectivo) : '—'}</td>
      <td>${(c.totalQR || 0) > 0 ? fmt(c.totalQR) : '—'}</td>
      <td style="font-size:0.82em">${indice}</td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════
// INCIDENCIAS
// ═══════════════════════════════════════

function renderInc() {
  if (!DATA) return;
  const sucF = document.getElementById('inc-suc')?.value || '';
  const tipoF = (document.getElementById('inc-tipo')?.value || '').toUpperCase();
  const mesF = document.getElementById('inc-mes')?.value || '';
  const q = (document.getElementById('inc-q')?.value || '').toLowerCase();
  const kpis = document.getElementById('inc-kpis');
  const tbody = document.getElementById('inc-tbody');
  if (!kpis || !tbody) return;

  let items = [];
  (sucF ? [sucF] : SUCURSALES).forEach(suc => {
    (DATA[suc].reclamos || []).forEach(r => items.push({
      tipo: r.tipo, suc: suc, cli: r.cliente, desc: r.descripcion,
      monto: r.monto || 0, sec: r.secretario, fecha: r.fecha, fFmt: r.fechaFormato
    }));
    (DATA[suc].anulaciones || []).forEach(a => items.push({
      tipo: 'ANULACION', suc, cli: a.nota?.cliente || '—',
      desc: `Nota Nº${a.nota?.numeroNota || '?'} — ${a.motivo || 'sin motivo'}`,
      monto: a.nota?.total || 0, sec: a.supervisor,
      fecha: a.fecha ? a.fecha.split('/').reverse().join('-') : '', fFmt: a.fecha
    }));
  });

  items = items.filter(it => {
    if (tipoF && it.tipo.toUpperCase() !== tipoF) return false;
    if (mesF && it.fecha) {
      try {
        const f = new Date(it.fecha);
        const ym = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
        if (ym !== mesF) return false;
      } catch { /* ignore */ }
    }
    if (q && !(it.cli || '').toLowerCase().includes(q) && !it.desc.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  const cnt = tp => items.filter(i => i.tipo.toUpperCase() === tp).length;
  const map = { RECLAMO: 'badge--red', OBSEQUIO: 'badge--green', REPOSICION: 'badge--blue', PROMOCION: 'badge--orange', ANULACION: 'badge--red' };

  kpis.innerHTML = [
    { l: 'Total incidencias', v: items.length, a: 'var(--beta)' },
    { l: 'Reclamos', v: cnt('RECLAMO'), a: 'var(--red)' },
    { l: 'Obsequios', v: cnt('OBSEQUIO'), a: 'var(--green)' },
    { l: 'Reposiciones', v: cnt('REPOSICION') + cnt('REPOSICIÓN'), a: 'var(--blue)' },
    { l: 'Anulaciones', v: cnt('ANULACION'), a: 'var(--purple)' },
  ].map(c => `<div class="stat-card" style="--accent:${c.a}"><div class="stat-card__label">${c.l}</div><div class="stat-card__value">${c.v}</div></div>`).join('');

  _incItems = items;

  if (!items.length) {
    tbody.innerHTML = emptyRow(7, 'Sin incidencias');
    return;
  }

  tbody.innerHTML = items.map((it, i) => `
    <tr style="cursor:pointer" onclick="verDetalleInc(${i})">
      <td><span class="badge ${map[it.tipo.toUpperCase()] || 'badge--orange'}">${esc(it.tipo)}</span></td>
      <td class="text-beta" style="font-size:0.8em">${esc(it.suc)}</td>
      <td>${esc(it.cli)}</td>
      <td style="font-size:0.82em">${esc(it.desc)}</td>
      <td>${it.monto > 0 ? fmt(it.monto) : '—'}</td>
      <td>${esc(it.sec || '—')}</td>
      <td class="text-muted" style="font-size:0.78em">${esc(it.fFmt || '—')}</td>
    </tr>
  `).join('');
}

function verDetalleInc(idx) {
  const it = _incItems[idx];
  if (!it) return;
  const map = { RECLAMO: 'badge--red', OBSEQUIO: 'badge--green', REPOSICION: 'badge--blue', PROMOCION: 'badge--orange', ANULACION: 'badge--red' };
  const title = document.getElementById('ped-modal-title');
  const body = document.getElementById('ped-modal-body');
  if (title) title.innerHTML = `⚠️ Detalle de Incidencia <button class="modal__close" onclick="closeModal('modal-ped')">✕</button>`;
  body.innerHTML = `
    <div class="config-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:0.85em">
      <div><span class="text-muted">Tipo: </span><span class="badge ${map[it.tipo.toUpperCase()] || 'badge--orange'}">${esc(it.tipo)}</span></div>
      <div><span class="text-muted">Sucursal: </span><strong>${esc(it.suc || '—')}</strong></div>
      <div><span class="text-muted">Cliente: </span><strong>${esc(it.cli || '—')}</strong></div>
      <div><span class="text-muted">Monto: </span><strong class="text-green">${it.monto > 0 ? fmt(it.monto) : '—'}</strong></div>
      <div><span class="text-muted">Registrado por: </span><strong>${esc(it.sec || '—')}</strong></div>
      <div><span class="text-muted">Fecha: </span><strong>${esc(it.fFmt || '—')}</strong></div>
    </div>
    <div class="config-row" style="flex-direction:column;align-items:flex-start">
      <div class="fw-700 text-muted" style="margin-bottom:6px">📝 Descripción</div>
      <div style="font-size:0.85em">${esc(it.desc || '—')}</div>
    </div>`;
  openModal('modal-ped');
}

// ═══════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════

function renderClientes() {
  if (!DATA) return;
  const sucF = document.getElementById('cli-suc')?.value || '';
  const q = (document.getElementById('cli-q')?.value || '').toLowerCase();
  const stats = document.getElementById('cli-stats');
  const tbody = document.getElementById('cli-tbody');
  if (!stats || !tbody) return;

  let pedidos = [], anulaciones = [], incidencias = [];
  (sucF ? [sucF] : SUCURSALES).forEach(suc => {
    (DATA[suc].pedidos || []).filter(p => p.estado === 'ENTREGADO').forEach(p => pedidos.push({ ...p, sucursal: suc }));
    (DATA[suc].anulaciones || []).forEach(a => anulaciones.push({ ...a, sucursal: suc }));
    (DATA[suc].reclamos || []).forEach(r => incidencias.push({ ...r, sucursal: suc }));
  });

  const mapa = {};
  pedidos.forEach(p => {
    const k = (p.cliente || '—').toLowerCase();
    if (!mapa[k]) mapa[k] = { nombre: p.cliente, sucursales: new Set(), total: 0, count: 0, anulaciones: 0, incidencias: 0 };
    mapa[k].sucursales.add(p.sucursal);
    mapa[k].total += (p.saldoCobrado || p.total || 0);
    mapa[k].count++;
  });
  anulaciones.forEach(a => { const k = (a.nota?.cliente || '—').toLowerCase(); if (mapa[k]) mapa[k].anulaciones++; });
  incidencias.forEach(r => { const k = (r.cliente || '—').toLowerCase(); if (mapa[k]) mapa[k].incidencias++; });

  let cli = Object.values(mapa).filter(c => !q || c.nombre.toLowerCase().includes(q)).sort((a, b) => b.total - a.total);

  stats.innerHTML = [
    { l: 'Clientes únicos', v: cli.length, a: 'var(--beta)' },
    { l: 'Multi-sucursal', v: cli.filter(c => c.sucursales.size > 1).length, a: 'var(--purple)' },
    { l: 'Con incidencias', v: cli.filter(c => c.incidencias > 0 || c.anulaciones > 0).length, a: 'var(--red)' },
    { l: 'Total gastado', v: fmt(cli.reduce((s, c) => s + c.total, 0)).replace(' Bs', ''), a: 'var(--green)' },
  ].map(c => `<div class="stat-card" style="--accent:${c.a}"><div class="stat-card__label">${c.l}</div><div class="stat-card__value" style="font-size:1.3em">${c.v}</div></div>`).join('');

  if (!cli.length) {
    tbody.innerHTML = emptyRow(7, 'Sin clientes');
    return;
  }

  tbody.innerHTML = cli.slice(0, 100).map(c => `<tr>
    <td class="fw-700">${esc(c.nombre)}</td>
    <td class="text-muted" style="font-size:0.78em">${[...c.sucursales].map(s => s.split(' ')[0]).join(', ')}</td>
    <td class="text-center">${c.count}</td>
    <td class="text-center ${c.anulaciones > 0 ? 'text-red fw-700' : ''}">${c.anulaciones || '—'}</td>
    <td class="text-center ${c.incidencias > 0 ? 'text-orange fw-700' : ''}">${c.incidencias || '—'}</td>
    <td class="text-green fw-700">${fmt(c.total)}</td>
    <td><button class="btn btn--ghost btn--small" onclick="verCliente('${esc(c.nombre)}')">👁️ Ver</button></td>
  </tr>`).join('');
}

function verCliente(nombre) {
  if (!DATA) return;
  let pedidos = [], anulaciones = [], incidencias = [];
  SUCURSALES.forEach(suc => {
    (DATA[suc].pedidos || []).filter(p => p.cliente === nombre).forEach(p => pedidos.push({ ...p, sucursal: suc }));
    (DATA[suc].anulaciones || []).filter(a => a.nota?.cliente === nombre).forEach(a => anulaciones.push({ ...a, sucursal: suc }));
    (DATA[suc].reclamos || []).filter(r => r.cliente === nombre).forEach(r => incidencias.push({ ...r, sucursal: suc }));
  });

  const entregados = pedidos.filter(p => p.estado === 'ENTREGADO');
  const totalGastado = entregados.reduce((s, p) => s + (p.saldoCobrado || p.total || 0), 0);
  const prodMap = {};
  entregados.forEach(p => (p.items || []).forEach(it => { prodMap[it.n] = (prodMap[it.n] || 0) + it.c; }));
  const topProd = Object.entries(prodMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const title = document.getElementById('cli-modal-title');
  const body = document.getElementById('cli-modal-body');
  if (title) title.innerHTML = `👤 ${esc(nombre)} <button class="modal__close" onclick="closeModal('modal-cli')">✕</button>`;

  body.innerHTML = `
    <div class="stat-grid" style="margin-bottom:18px">
      <div class="stat-card" style="--accent:var(--green)"><div class="stat-card__label">Pedidos entregados</div><div class="stat-card__value">${entregados.length}</div><div class="stat-card__sub">${fmt(totalGastado)}</div></div>
      <div class="stat-card" style="--accent:var(--orange)"><div class="stat-card__label">Preparados activos</div><div class="stat-card__value">${pedidos.filter(p => (p.estado || 'PREPARADO') === 'PREPARADO').length}</div></div>
      <div class="stat-card" style="--accent:var(--red)"><div class="stat-card__label">Anulaciones</div><div class="stat-card__value">${anulaciones.length}</div></div>
      <div class="stat-card" style="--accent:var(--beta)"><div class="stat-card__label">Incidencias</div><div class="stat-card__value">${incidencias.length}</div></div>
    </div>
    ${topProd.length ? `<div class="sec-title">🏆 Productos favoritos</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">
      ${topProd.map(([n, v]) => `<span class="badge badge--ghost"><span>${esc(n)}</span> <span class="text-green fw-700">${v}u</span></span>`).join('')}
    </div>` : ''}
    <div class="sec-title">📋 Historial de pedidos</div>
    <div class="table-wrap"><div class="table-responsive"><table>
      <thead><tr><th>Sucursal</th><th>Nota</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
      <tbody>
        ${pedidos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 15).map(p => `<tr>
          <td class="text-beta" style="font-size:0.78em">${esc(p.sucursal)}</td>
          <td class="fw-700 text-blue">Nº ${esc(String(p.numeroNota || '—'))}</td>
          <td style="font-size:0.8em">${esc(p.fecha || '—')}</td>
          <td class="fw-700">${fmt(p.total)}</td>
          <td><span class="badge ${p.estado === 'ENTREGADO' ? 'badge--green' : p.estado === 'ANULADO' ? 'badge--red' : 'badge--orange'}">${p.estado || 'PREPARADO'}</span></td>
        </tr>`).join('') || emptyRow(5, 'Sin pedidos')}
      </tbody>
    </table></div></div>
    ${anulaciones.length ? `<div class="sec-title">❌ Anulaciones del cliente</div>
    <div class="table-wrap"><div class="table-responsive"><table>
      <thead><tr><th>Sucursal</th><th>Nota</th><th>Motivo</th><th>Fecha</th></tr></thead>
      <tbody>
        ${anulaciones.map(a => `<tr>
          <td class="text-beta">${esc(a.sucursal)}</td>
          <td class="fw-700">Nº ${esc(String(a.nota?.numeroNota || '—'))}</td>
          <td style="font-size:0.82em">${esc(a.motivo || '—')}</td>
          <td class="text-muted" style="font-size:0.78em">${esc(a.fecha || '—')}</td>
        </tr>`).join('')}
      </tbody>
    </table></div></div>` : ''}`;
  openModal('modal-cli');
}

// ═══════════════════════════════════════
// ANULACIÓN
// ═══════════════════════════════════════

function abrirAnular() {
  _pedAnular = null; _sucAnular = null;
  ['an-nota', 'an-motivo', 'an-pass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('an-prev').style.display = 'none';
  document.getElementById('an-err').style.display = 'none';
  document.getElementById('an-suc-wrap').style.display = 'none';
  openModal('modal-anular');
}

function abrirAnularPed(suc, id) {
  _sucAnular = suc;
  const p = (DATA[suc]?.pedidos || []).find(x => String(x.id) === String(id));
  if (!p) { toast('No encontrado', true); return; }
  _pedAnular = p;
  document.getElementById('an-nota').value = p.numeroNota || '';
  ['an-motivo', 'an-pass'].forEach(i => { const el = document.getElementById(i); if (el) el.value = ''; });
  document.getElementById('an-err').style.display = 'none';
  mostrarPrevAnular(suc, p);
  openModal('modal-anular');
}

function buscarNotaB(v) {
  if (!v) { document.getElementById('an-prev').style.display = 'none'; _pedAnular = null; return; }
  let encontrado = null, sucEnc = null;
  for (const suc of SUCURSALES) {
    const p = (DATA[suc]?.pedidos || []).filter(x => (x.estado || 'PREPARADO') === 'PREPARADO').find(x => String(x.numeroNota) === v.trim());
    if (p) { encontrado = p; sucEnc = suc; break; }
  }
  if (!encontrado) {
    document.getElementById('an-suc-wrap').style.display = 'block';
    document.getElementById('an-prev').innerHTML = '<span class="text-muted">No encontrado automáticamente. Selecciona la sucursal.</span>';
    document.getElementById('an-prev').style.display = 'block';
    buscarNotaEnSuc();
    return;
  }
  _pedAnular = encontrado; _sucAnular = sucEnc;
  document.getElementById('an-suc-wrap').style.display = 'none';
  mostrarPrevAnular(sucEnc, encontrado);
}

function buscarNotaEnSuc() {
  const suc = document.getElementById('an-suc')?.value;
  const nota = document.getElementById('an-nota')?.value?.trim();
  if (!suc || !nota) return;
  const p = (DATA[suc]?.pedidos || []).filter(x => (x.estado || 'PREPARADO') === 'PREPARADO').find(x => String(x.numeroNota) === nota);
  if (!p) {
    document.getElementById('an-prev').innerHTML = '<span class="text-muted">Pedido preparado no encontrado en esa sucursal.</span>';
    _pedAnular = null; return;
  }
  _pedAnular = p; _sucAnular = suc;
  mostrarPrevAnular(suc, p);
}

function mostrarPrevAnular(suc, p) {
  const prev = document.getElementById('an-prev');
  prev.innerHTML = `<div class="fw-700 text-beta" style="margin-bottom:6px">Nº ${esc(String(p.numeroNota || '—'))} · ${esc(suc)}</div>
    <div class="text-muted" style="font-size:0.82em">Cliente: ${esc(p.cliente)} · Total: <span class="text-orange fw-700">${fmt(p.total)}</span></div>`;
  prev.style.display = 'block';
}

function confirmarAnular() {
  const motivo = document.getElementById('an-motivo').value.trim();
  const pass = document.getElementById('an-pass').value;
  const err = document.getElementById('an-err');
  err.style.display = 'none';
  if (!_pedAnular) { err.textContent = 'Busca primero el pedido.'; err.style.display = 'block'; return; }
  if (!motivo) { err.textContent = 'El motivo es obligatorio.'; err.style.display = 'block'; return; }
  if (pass !== CFG.PASS_BETA) { err.textContent = 'Contraseña incorrecta.'; err.style.display = 'block'; return; }

  if (!confirm(`¿Confirmar anulación?\n\nNota Nº ${_pedAnular.numeroNota}\nCliente: ${_pedAnular.cliente}\nSucursal: ${_sucAnular}\nTotal: ${_pedAnular.total}\n\nMotivo: ${motivo}`)) return;

  const ahora = new Date();
  DATA[_sucAnular].anulaciones.unshift({
    id: Date.now(), motivo, supervisor: 'Supervisor Beta',
    fecha: `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`,
    hora: ahora.toLocaleTimeString('es-BO'),
    nota: { numeroNota: _pedAnular.numeroNota, cliente: _pedAnular.cliente, total: _pedAnular.total, secretario: _pedAnular.secretario },
    sucursal: _sucAnular
  });
  const idx = DATA[_sucAnular].pedidos.findIndex(x => x.id === _pedAnular.id);
  if (idx !== -1) DATA[_sucAnular].pedidos[idx].estado = 'ANULADO';
  toast(`Nota Nº ${_pedAnular.numeroNota} anulada`);
  closeModal('modal-anular');
  _pedAnular = null; _sucAnular = null;
  renderPedidos(); renderInc();
}

function traspasarAPreparado(suc, id) {
  if (!DATA) return;
  const p = (DATA[suc]?.pedidos || []).find(x => String(x.id) === String(id));
  if (!p || p.estado !== 'ENTREGADO') { toast('Pedido no encontrado o no es ENTREGADO', true); return; }
  if (!confirm(`¿Deseas traspasar el pedido Nº ${p.numeroNota} (${p.cliente}) de ENTREGADO a PREPARADO?`)) return;
  p.estado = 'PREPARADO';
  delete p.metodoPago;
  delete p.saldoCobrado;
  delete p.efectivoPagado;
  delete p.qrPagado;
  p.totalEntregado = 0;
  toast(`Pedido Nº ${p.numeroNota} traspasado a PREPARADO`);
  renderPedidos();
}

function reactivarPedido(suc, id) {
  if (!DATA) return;
  const p = (DATA[suc]?.pedidos || []).find(x => String(x.id) === String(id));
  if (!p || p.estado !== 'ANULADO') { toast('Pedido no encontrado o no está ANULADO', true); return; }
  if (!confirm(`¿Deseas reactivar el pedido Nº ${p.numeroNota} (${p.cliente}) de ANULADO a PREPARADO?`)) return;
  p.estado = 'PREPARADO';
  const anulaciones = DATA[suc].anulaciones || [];
  const idxAnul = anulaciones.findIndex(a => a.nota && String(a.nota.numeroNota) === String(p.numeroNota));
  if (idxAnul !== -1) anulaciones.splice(idxAnul, 1);
  toast(`Pedido Nº ${p.numeroNota} reactivado a PREPARADO`);
  renderPedidos(); renderInc();
}

// ═══════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════

function cfgLeerTodo() {
  try { const d = JSON.parse(localStorage.getItem('kollita_config_descuento') || 'null'); if (d) Object.assign(CFG_DESC, d); } catch(e) {}
  try { const s = JSON.parse(localStorage.getItem('kollita_secretarios') || '[]'); if (Array.isArray(s)) CFG_SECS = s; } catch(e) { CFG_SECS = []; }
  try { const e = JSON.parse(localStorage.getItem('kollita_encargados') || '[]'); if (Array.isArray(e)) CFG_ENCS = e; } catch(e) { CFG_ENCS = []; }
}

function cfgGuardarTodo() {
  localStorage.setItem('kollita_config_descuento', JSON.stringify(CFG_DESC));
  localStorage.setItem('kollita_secretarios', JSON.stringify(CFG_SECS));
  localStorage.setItem('kollita_encargados', JSON.stringify(CFG_ENCS));
}

function renderConfig() {
  cfgLeerTodo();
  cfgRenderDesc();
  cfgRenderCasas();
}

function cfgToggleDesc() {
  CFG_DESC.activo = !CFG_DESC.activo;
  cfgRenderDesc();
}

function cfgRenderDesc() {
  const toggle = document.getElementById('cfg-toggle-desc');
  const label = document.getElementById('cfg-toggle-label');
  const pct = document.getElementById('cfg-desc-pct');
  const min = document.getElementById('cfg-desc-min');
  const status = document.getElementById('cfg-desc-status');

  if (toggle) toggle.className = 'toggle' + (CFG_DESC.activo ? ' on' : '');
  if (label) { label.textContent = CFG_DESC.activo ? 'Activo' : 'Inactivo'; label.style.color = CFG_DESC.activo ? 'var(--green)' : 'var(--text2)'; }
  if (pct && !pct.dataset.edited) pct.value = CFG_DESC.porcentaje;
  if (min && !min.dataset.edited) min.value = CFG_DESC.montoMinimo || '';
  if (status) {
    status.innerHTML = CFG_DESC.activo
      ? '<span class="text-green">✅ Descuento activo — los secretarios verán el descuento aplicable</span>'
      : '<span class="text-red">⚠️ Descuento inactivo — no se mostrará en el panel del secretario</span>';
  }
  cfgPreviewDesc();
}

function cfgPreviewDesc() {
  const pctVal = parseInt(document.getElementById('cfg-desc-pct')?.value) || CFG_DESC.porcentaje;
  const minVal = parseFloat(document.getElementById('cfg-desc-min')?.value) || CFG_DESC.montoMinimo || 0;
  const prev = document.getElementById('cfg-desc-preview');
  if (prev) prev.innerHTML = `<span>Ej: pedido de <strong>${fmt(minVal + 50)}</strong> → desc. <strong class="text-beta">${minVal + 50} x ${pctVal}% = ${fmt((minVal + 50) * pctVal / 100)}</strong></span>`;
}

function cfgGuardarDesc() {
  const pct = parseInt(document.getElementById('cfg-desc-pct')?.value) || CFG_DESC.porcentaje;
  const min = parseFloat(document.getElementById('cfg-desc-min')?.value) || CFG_DESC.montoMinimo || 0;
  CFG_DESC.porcentaje = pct;
  CFG_DESC.montoMinimo = min;
  cfgGuardarTodo();
  toast(`✅ Descuentos guardados: ${pct}% — mínimo ${fmt(min)}`);
}

function cfgRenderCasas() {
  const grid = document.getElementById('cfg-casas');
  if (!grid) return;
  grid.innerHTML = SUCURSALES.map(suc => {
    const secs = CFG_SECS.filter(s => s.sucursal === suc);
    const encs = CFG_ENCS.filter(e => e.sucursal === suc);
    const safeSuc = suc.replace(/\s+/g, '_');

    const encsHtml = encs.length === 0
      ? `<div class="manager-row manager-row--empty" onclick="cfgAbrirEnc('${esc(suc)}')"><span>🔑 Sin encargados — click para agregar</span></div>`
      : encs.map((enc, i) => `
        <div class="manager-row">
          <div><span class="manager__name">🔑 ${esc(enc.nombre)}</span><span class="manager__pass">pass: ${esc(enc.password)}</span></div>
          <div style="display:flex;gap:4px">
            <button class="btn btn--ghost btn--small" onclick="cfgEditarEnc('${esc(suc)}',${i})">✏️</button>
            <button class="btn btn--danger btn--small" onclick="cfgEliminarEnc('${esc(suc)}',${i})">🗑️</button>
          </div>
        </div>
      `).join('') + `
        <div class="manager-row manager-row--empty" style="border-style:dashed" onclick="cfgAbrirEnc('${esc(suc)}')">
          <span class="text-blue">➕ Agregar encargado</span>
        </div>`;

    const secsHtml = secs.length === 0
      ? '<div class="text-muted" style="font-size:0.75em;text-align:center;padding:8px 0">Sin secretarios asignados</div>'
      : secs.map(s => {
          const idx = CFG_SECS.indexOf(s);
          return `<div class="sec-row">
            <span class="sec-row__name">👤 ${esc(s.nombre)}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn--ghost btn--small" onclick="cfgEditarSec(${idx},'${esc(suc)}')">✏️</button>
              <button class="btn btn--danger btn--small" onclick="cfgEliminarSec(${idx})">🗑️</button>
            </div>
          </div>`;
        }).join('');

    return `<div class="house-card">
      <div class="house-card__header">
        <div class="house-card__name"><span>🏪</span>${esc(suc)}</div>
        <span class="house-card__count">${secs.length} secretario${secs.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="house-card__body">
        ${encsHtml}
        <div style="margin-bottom:8px">${secsHtml}</div>
        <div class="add-row">
          <input type="text" class="add-row__input" id="casa-inp-${safeSuc}" placeholder="Nombre del secretario..."
            onkeydown="if(event.key==='Enter')cfgAgregarSec('${esc(suc)}')">
          <button class="btn btn--primary btn--small" onclick="cfgAgregarSec('${esc(suc)}')">➕ Agregar</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function cfgAgregarSec(suc) {
  const inp = document.getElementById('casa-inp-' + suc.replace(/\s+/g, '_'));
  const nombre = (inp?.value || '').trim();
  if (!nombre) { toast('Ingresa el nombre del secretario', true); return; }
  if (CFG_SECS.some(s => s.nombre.toLowerCase() === nombre.toLowerCase() && s.sucursal === suc)) {
    toast('Ese secretario ya existe en ' + suc, true); return;
  }
  CFG_SECS.push({ id: Date.now(), nombre, sucursal: suc, fechaCreacion: new Date().toISOString() });
  cfgGuardarTodo();
  if (inp) inp.value = '';
  toast(`✅ Secretario "${nombre}" agregado en ${suc}`);
  cfgRenderCasas();
}

function cfgEditarSec(idx, suc) {
  const s = CFG_SECS[idx];
  if (!s) return;
  const nuevo = prompt('Editar nombre del secretario:', s.nombre);
  if (!nuevo || !nuevo.trim()) return;
  const clean = nuevo.trim();
  if (clean !== s.nombre && CFG_SECS.some(x => x !== s && x.nombre.toLowerCase() === clean.toLowerCase() && x.sucursal === s.sucursal)) {
    toast('Ya existe un secretario con ese nombre en ' + s.sucursal, true); return;
  }
  s.nombre = clean;
  cfgGuardarTodo();
  toast(`✅ Secretario renombrado a "${clean}"`);
  cfgRenderCasas();
}

function cfgEliminarSec(idx) {
  const s = CFG_SECS[idx];
  if (!s) return;
  if (!confirm(`¿Eliminar al secretario "${s.nombre}" de ${s.sucursal}?`)) return;
  CFG_SECS.splice(idx, 1);
  cfgGuardarTodo();
  toast(`🗑️ Secretario "${s.nombre}" eliminado`);
  cfgRenderCasas();
}

function cfgAbrirEnc(suc) {
  _encEditSuc = suc; _encEditIdx = -1;
  document.getElementById('enc-nombre').value = '';
  document.getElementById('enc-pass').value = '';
  document.getElementById('enc-err').style.display = 'none';
  document.getElementById('enc-modal-title').innerHTML = `👤 Nuevo Encargado — ${esc(suc)} <button class="modal__close" onclick="closeModal('modal-enc')">✕</button>`;
  openModal('modal-enc');
}

function cfgEditarEnc(suc, idx) {
  const encs = CFG_ENCS.filter(e => e.sucursal === suc);
  const enc = encs[idx];
  if (!enc) return;
  _encEditSuc = suc;
  _encEditIdx = CFG_ENCS.indexOf(enc);
  document.getElementById('enc-nombre').value = enc.nombre;
  document.getElementById('enc-pass').value = enc.password;
  document.getElementById('enc-err').style.display = 'none';
  document.getElementById('enc-modal-title').innerHTML = `👤 Editar Encargado — ${esc(suc)} <button class="modal__close" onclick="closeModal('modal-enc')">✕</button>`;
  openModal('modal-enc');
}

function cfgGuardarEnc() {
  const nombre = document.getElementById('enc-nombre').value.trim();
  const pass = document.getElementById('enc-pass').value.trim();
  const err = document.getElementById('enc-err');
  err.style.display = 'none';
  if (!nombre) { err.textContent = 'Ingresa el nombre del encargado'; err.style.display = 'block'; return; }
  if (!pass || pass.length < 4) { err.textContent = 'La contraseña debe tener al menos 4 caracteres'; err.style.display = 'block'; return; }
  const duplicado = CFG_ENCS.some((e, i) => e.sucursal === _encEditSuc && e.nombre.toLowerCase() === nombre.toLowerCase() && i !== _encEditIdx);
  if (duplicado) { err.textContent = 'Ya existe un encargado con ese nombre en esta sucursal'; err.style.display = 'block'; return; }

  if (_encEditIdx >= 0) {
    CFG_ENCS[_encEditIdx].nombre = nombre;
    CFG_ENCS[_encEditIdx].password = pass;
  } else {
    CFG_ENCS.push({ sucursal: _encEditSuc, nombre, password: pass });
  }
  cfgGuardarTodo();
  toast(`🔑 Encargado "${nombre}" configurado para ${_encEditSuc}`);
  closeModal('modal-enc');
  _encEditSuc = null; _encEditIdx = -1;
  cfgRenderCasas();
}

function cfgEliminarEnc(suc, idx) {
  const encs = CFG_ENCS.filter(e => e.sucursal === suc);
  const enc = encs[idx];
  if (!enc) return;
  if (!confirm(`¿Quitar al encargado "${enc.nombre}" de ${suc}?\n\nEsto eliminará sus credenciales de acceso.`)) return;
  CFG_ENCS = CFG_ENCS.filter(e => !(e.sucursal === suc && e.nombre === enc.nombre && e.password === enc.password));
  cfgGuardarTodo();
  toast(`🗑️ Encargado "${enc.nombre}" de ${suc} eliminado`);
  cfgRenderCasas();
}

// ═══════════════════════════════════════
// MOBILE SYNC / PENDING ORDERS
// ═══════════════════════════════════════

function _betaCargarPendientes() {
  try {
    const p = JSON.parse(localStorage.getItem('kollita_pendientes') || '[]');
    const c = document.getElementById('beta-pendientes');
    if (!c) return;
    if (!p.length) { c.innerHTML = '<div class="empty-state" style="padding:14px;font-size:0.78em"><div class="empty-state__desc">Sin pedidos pendientes</div></div>'; return; }

    const total = p.reduce((s, x) => s + (x.total || 0), 0);
    let h = `<div class="pending-banner">
      <span class="pending-banner__count">🟡 ${p.length} PENDIENTE${p.length !== 1 ? 'S' : ''}</span>
      <span class="pending-banner__total">Total: ${total.toFixed(2)} Bs</span>
    </div>`;
    p.forEach(x => {
      const cant = (x.items || []).reduce((a, i) => a + (i.c || 1), 0);
      const tags = (x.items || []).slice(0, 4).map(i => `<span class="pending-item__tag">${esc(i.n)} x${i.c}</span>`).join(' ');
      h += `<div class="pending-item">
        <div class="pending-item__info">
          <div class="pending-item__client">📱 ${esc(x.client || 'CLIENTE')} <span style="color:var(--orange);font-size:0.75em">PENDIENTE</span></div>
          <div class="pending-item__meta">${esc(x.branch || '')} · ${cant} items · ${esc(x.time || '')}</div>
          <div class="pending-item__tags">${tags}${(x.items || []).length > 4 ? ` <span class="text-muted" style="font-size:0.68em">+${x.items.length - 4} más</span>` : ''}</div>
        </div>
        <div class="pending-item__total">${(x.total || 0).toFixed(2)} Bs</div>
      </div>`;
    });
    c.innerHTML = h;
  } catch(e) { /* silent */ }
}

function _betaRealStats() {
  try {
    const db = JSON.parse(localStorage.getItem('kollita_db') || '[]');
    const hoy = new Date();
    const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const ma = hoy.getMonth(), aa = hoy.getFullYear();
    const enMes = p => { const f = new Date(p.fechaID || p.fecha || p.id); return f.getMonth() === ma && f.getFullYear() === aa; };
    const mes = db.filter(enMes);
    const entMes = mes.filter(p => p.estado === 'ENTREGADO');
    const entHoy = db.filter(p => p.estado === 'ENTREGADO' && (p.fechaIDEntrega || p.fechaID) === hoyISO);
    const prep = db.filter(p => (p.estado || 'PREPARADO') === 'PREPARADO');
    const pend = JSON.parse(localStorage.getItem('kollita_pendientes') || '[]');
    const totMes = entMes.reduce((s, p) => s + (p.saldoCobrado != null ? p.saldoCobrado : (p.totalEntregado || p.total || 0)), 0);
    const totHoy = entHoy.reduce((s, p) => s + (p.saldoCobrado != null ? p.saldoCobrado : (p.totalEntregado || p.total || 0)), 0);
    const c = document.getElementById('beta-real-stats');
    if (!c) return;
    c.innerHTML = [
      { l: '📋 Pedidos mes', v: mes.length, a: 'var(--blue)' },
      { l: '✅ Entregados mes', v: `${entMes.length} · ${totMes.toFixed(0)} Bs`, a: 'var(--green)' },
      { l: '💵 Ventas HOY', v: `${totHoy.toFixed(0)} Bs`, a: 'var(--yellow)' },
      { l: '🍽️ Preparados', v: prep.length, a: 'var(--orange)' },
      { l: '🟡 Pendientes', v: pend.length, a: 'var(--orange)' },
      { l: '📦 Total BD', v: db.length, a: 'var(--purple)' },
    ].map(k => `<div class="stat-card" style="--accent:${k.a}"><div class="stat-card__label">${k.l}</div><div class="stat-card__value">${k.v}</div></div>`).join('');
  } catch(e) { /* silent */ }
}

// ═══════════════════════════════════════
// MODALS
// ═══════════════════════════════════════

function initModals() {
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(m => closeModal(m.id));
  });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  if (!document.querySelector('.modal.open')) document.body.style.overflow = '';
}

// ═══════════════════════════════════════
// TOAST (enhanced)
// ═══════════════════════════════════════

function toast(msg, isError) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = 'toast' + (isError ? ' toast--error' : ' toast--success');
  t.innerHTML = `<span>${isError ? '⚠️' : '✅'}</span><span>${esc(msg)}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; setTimeout(() => t.remove(), 300); }, 3000);
}

/* ═══════════════════════════════════════════════════════════
   UTILIDADES COMPARTIDAS — KOLLITA PRO
   ═══════════════════════════════════════════════════════════ */

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(n) { return (n || 0).toFixed(2) + ' Bs'; }
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndF(min, max) { return +(Math.random() * (max - min) + min).toFixed(2); }
function fechaISO(daysAgo) { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().split('T')[0]; }
function cM(id) { document.getElementById(id).classList.remove('open'); }

function toast(m, e) {
  var t = document.createElement('div');
  t.className = 'toast' + (e ? ' err' : '');
  t.textContent = m;
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 3200);
}

function renderBar(items, color) {
  if (!items || !items.length)
    return '<div style="color:var(--text2);text-align:center;padding:16px;font-size:.85em;">Sin datos</div>';
  var mx = items[0][1] || 1;
  return items.map(function (nc) {
    var v = nc[1];
    return '<div class="bar-item"><div class="bar-label" title="' + esc(nc[0]) + '">' + esc(nc[0]) +
      '</div><div class="bar-track"><div class="bar-fill" style="width:' + Math.round(v / mx * 100) +
      '%;background:' + (color || 'var(--blue)') + ';"></div></div><div class="bar-val">' +
      (typeof v === 'number' && v % 1 !== 0 ? fmt(v) : v) + '</div></div>';
  }).join('');
}

function renderBarEnhanced(items, color) {
  if (!items || !items.length)
    return '<div style="color:var(--text2);text-align:center;padding:16px;font-size:.82em;">Sin datos</div>';
  var mx = items[0][1] || 1;
  return items.map(function (nc) {
    var v = nc[1];
    return '<div class="mini-bar-row"><div class="mini-bar-lbl" title="' + esc(nc[0]) + '">' + esc(nc[0]) +
      '</div><div class="mini-bar-track"><div class="mini-bar-fill" style="width:' + Math.round(v / mx * 100) +
      '%;background:' + (color || 'var(--blue)') + ';"></div></div><div class="mini-bar-val">' + v + '</div></div>';
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   DATOS COMPARTIDOS — KOLLITA PRO
   ═══════════════════════════════════════════════════════════ */

var SUCURSALES = ['3 Pasos','Cuchilla','G77 Av. Cambodromo','Km8 Doble Vía La Guardia','4to Anillo Canal Isuto','Av. Paurito','Virgen de Cotoca'];
var SECRETARIOS = ['María López','Juan Pérez','Ana García','Carlos Mendoza','Lucía Flores','Roberto Chávez','Elena Torres','Miguel Ríos'];
var PRODUCTOS = ['CHICLE CAFE','YOGOBULL CAFE','REDBULL CAFE','MARACUYA CAFE','SANDIA CAFE','BICO ESTEVIA NESCAFE','YOGURT MORA CAFE','3 POLVO CAFE','QUITA HEMBRA CAFE','BICO'];
var SABORES_PROD = ['CHICLE CAFE','YOGOBULL CAFE','REDBULL CAFE','MARACUYA CAFE','SANDIA CAFE','BICO ESTEVIA NESCAFE','YOGURT MORA CAFE','BICO'];

var MES_ACTUAL = new Date().toISOString().slice(0, 7);

function generarPedidos(suc, n) {
  n = n || 80;
  var pedidos = [];
  for (var i = 0; i < n; i++) {
    var dias = rnd(0, 29);
    var total = rnd(80, 800);
    var estado = i < 5 ? 'PREPARADO' : (Math.random() < 0.05 ? 'ANULADO' : 'ENTREGADO');
    var ant = estado === 'PREPARADO' && Math.random() < 0.3 ? rnd(50, Math.floor(total / 2)) : 0;
    var items = PRODUCTOS.slice(0, rnd(1, 4)).map(function (p) { return { n: p, c: rnd(1, 10), p: rnd(10, 25) }; });
    pedidos.push({
      id: Date.now() - i * 1000000 - rnd(0, 999999),
      numeroNota: String(i + 1).padStart(3, '0'),
      cliente: ['María','Juan','Ana','Carlos','Lucía','Roberto','Elena','Miguel','Pedro','Rosa'][rnd(0, 9)] + ' ' + ['García','López','Mendoza','Pérez','Flores'][rnd(0, 4)],
      secretario: SECRETARIOS[rnd(0, SECRETARIOS.length - 1)],
      fecha: fechaISO(dias), fechaID: fechaISO(dias),
      items: items, subtotal: total, total: total,
      estado: estado, metodoPago: ['EFECTIVO','QR','MIXTO'][rnd(0, 2)],
      totalEntregado: estado === 'ENTREGADO' ? total - ant : 0,
      saldoCobrado: estado === 'ENTREGADO' ? total - ant : 0,
      anticipo: ant, sucursal: suc
    });
  }
  return pedidos;
}

function generarCierres(suc, n) {
  n = n || 20;
  var cierres = [];
  for (var i = 0; i < n; i++) {
    var tot = rnd(800, 4500);
    cierres.push({
      id: Date.now() - i * 2000000,
      secretario: SECRETARIOS[rnd(0, SECRETARIOS.length - 1)],
      turno: ['DÍA','TARDE','NOCHE'][rnd(0, 2)],
      fechaCierreFormato: fechaISO(i),
      horaCierreFormato: rnd(6, 23).toString().padStart(2, '0') + ':' + rnd(0, 59).toString().padStart(2, '0'),
      cantidadVentas: rnd(10, 40),
      totalGeneral: tot,
      totalEfectivo: Math.floor(tot * 0.55),
      totalQR: Math.floor(tot * 0.35),
      totalMixtoEfectivo: Math.floor(tot * 0.05),
      totalMixtoQR: Math.floor(tot * 0.05),
      totalAnticipos: rnd(0, 300),
      totalDescuentos: rnd(0, 150),
      sucursal: suc
    });
  }
  return cierres;
}

function generarProduccion(suc, n) {
  n = n || 30;
  var regs = [];
  for (var i = 0; i < n; i++) {
    var datos = {};
    ['TRADICIONAL','ESPECIAL','PREMIUM'].forEach(function (cat) {
      datos[cat] = {};
      SABORES_PROD.slice(0, rnd(3, 6)).forEach(function (s) {
        var m = rnd(0, 8) * 20, c = rnd(0, 4) * 20;
        if (m || c) datos[cat][s] = { media: m, cuartilla: c, total: m + c };
      });
    });
    regs.push({ fecha: fechaISO(i), turno: ['DIA','TARDE','NOCHE'][rnd(0, 2)], encargado: 'Encargado ' + suc, suc: suc, datos: datos });
  }
  return regs;
}

function generarReclamos(suc, n) {
  n = n || 15;
  var tipos = ['RECLAMO','OBSEQUIO','REPOSICIÓN','PROMOCIÓN'];
  return Array.from({ length: n }, function (_, i) {
    return {
      id: Date.now() - i * 500000,
      tipo: tipos[rnd(0, 3)],
      cliente: ['María García','Juan López','Ana Mendoza','Carlos Pérez'][rnd(0, 3)],
      descripcion: ['Producto en mal estado','Regalo por compra mayor','Faltó sabor','Promoción aplicada'][rnd(0, 3)],
      monto: rnd(0, 1) ? rnd(10, 50) : 0,
      secretario: SECRETARIOS[rnd(0, SECRETARIOS.length - 1)],
      fecha: new Date(Date.now() - i * 86400000).toISOString(),
      fechaFormato: fechaISO(rnd(0, 20)),
      horaFormato: rnd(8, 20) + ':' + rnd(0, 59).toString().padStart(2, '0'),
      sucursal: suc
    };
  });
}

function generarAnulaciones(suc, n) {
  n = n || 8;
  return Array.from({ length: n }, function (_, i) {
    return {
      id: Date.now() - i * 700000,
      motivo: ['Error en pedido','Cliente canceló','Duplicado'][rnd(0, 2)],
      supervisor: SECRETARIOS[rnd(0, 3)],
      fecha: fechaISO(rnd(0, 20)),
      hora: rnd(8, 20) + ':' + rnd(0, 59).toString().padStart(2, '0'),
      nota: { numeroNota: String(rnd(1, 99)).padStart(3, '0'), cliente: 'Cliente ' + rnd(1, 20), total: rnd(80, 500), secretario: SECRETARIOS[rnd(0, 3)] },
      sucursal: suc
    };
  });
}

function buildMockData() {
  var data = {};
  SUCURSALES.forEach(function (suc) {
    data[suc] = {
      pedidos: generarPedidos(suc, 80),
      cierres: generarCierres(suc, 20),
      produccion: generarProduccion(suc, 30),
      reclamos: generarReclamos(suc, 15),
      anulaciones: generarAnulaciones(suc, 8)
    };
  });
  return data;
}

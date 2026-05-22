const fs = require('fs');

async function main() {
    console.log('--- INICIANDO MIGRACION DE COPIA DE SEGURIDAD ---');
    const SUPABASE_URL = 'https://wsqhzatsuymjoebzfhpg.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcWh6YXRzdXltam9lYnpmaHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTUyMTMsImV4cCI6MjA5NDYzMTIxM30.bFCJBY9PAa8WviEwE8HdO2TjE3ytYM3sD6qFgxJ0pPM';

    const sucursalId = 'Cuchilla'; // Nombre en texto
    console.log('Sucursal (Texto):', sucursalId);

    async function postSupabase(table, dataArray) {
        if (!dataArray || dataArray.length === 0) return;
        
        // Chunk array into pieces of 20 to avoid payload too large
        const chunkSize = 20;
        for (let i = 0; i < dataArray.length; i += chunkSize) {
            const chunk = dataArray.slice(i, i + chunkSize);
            console.log(`Subiendo chunk ${Math.floor(i/chunkSize) + 1} de ${Math.ceil(dataArray.length/chunkSize)} para la tabla ${table}...`);
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(chunk)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Error en ${table}: ${res.status} ${text}`);
            }
        }
    }

    // 1. CARGAR Y SUBIR PEDIDOS
    let todosLosPedidos = [];

    // Pedidos activos (kollita_db)
    if (fs.existsSync('backup_extracted/kollita-backup/kollita_db.json')) {
        const db = JSON.parse(fs.readFileSync('backup_extracted/kollita-backup/kollita_db.json', 'utf8'));
        console.log(`Cargados ${db.length} pedidos recientes.`);
        todosLosPedidos = todosLosPedidos.concat(db);
    }

    // Archivos historicos
    const files = fs.readdirSync('backup_extracted/kollita-backup/');
    for (const f of files) {
        if (f.startsWith('kollita_archivo_')) {
            const hist = JSON.parse(fs.readFileSync(`backup_extracted/kollita-backup/${f}`, 'utf8'));
            console.log(`Cargados ${hist.length} pedidos del archivo ${f}.`);
            todosLosPedidos = todosLosPedidos.concat(hist);
        }
    }

    // Mapear pedidos (campos alineados al schema real de Supabase)
    const hoy = new Date().toISOString().split('T')[0];
    const pedidosMap = todosLosPedidos.map(v => ({
        id:                   String(v._id_local || v.id || v.numeroNota || Math.random().toString(36).substr(2,9)),
        sucursal_id:          sucursalId,
        numero_nota:          parseInt(v.numeroNota) || parseInt(v.id) || 0,
        cliente:              v.cliente || 'CONSUMIDOR FINAL',
        ci_nit:               v.ci_nit  || '',
        productos:            v.productos || v.items || [],
        subtotal:             parseFloat(v.subtotal) || parseFloat(v.total) || 0,
        descuento:            parseFloat(v.descuento) || 0,
        porcentaje_descuento: parseFloat(v.porcentajeDescuento) || 0,
        total:                parseFloat(v.total) || 0,
        estado:               (v.estado || 'PREPARADO').toUpperCase(),
        metodo_pago:          v.metodoPago  || v.metodo_pago || 'EFECTIVO',
        efectivo_pagado:      parseFloat(v.efectivoPagado)  || 0,
        qr_pagado:            parseFloat(v.qrPagado)        || 0,
        total_entregado:      parseFloat(v.totalEntregado)  || parseFloat(v.total) || 0,
        saldo_cobrado:        parseFloat(v.saldoCobrado)    || parseFloat(v.total) || 0,
        anticipo:             parseFloat(v.anticipo)         || 0,
        anticipo_efectivo:    parseFloat(v.anticipoEfectivo) || 0,
        anticipo_qr:          parseFloat(v.anticipoQR)       || 0,
        secretario:           v.secretario || v.secretario_entrega || 'Sistema',
        turno:                v.turno || 'N/A',
        turno_entrega:        v.turnoEntrega     || null,
        secretario_entrega:   v.secretarioEntrega || null,
        fecha_entrega:        v.fechaIDEntrega || null,
        hora_entrega:         v.horaEntrega      || null,
        turno_encargado:      v.turnoEncargado   || null,
        nombre_encargado:     v.nombreEncargado  || null,
        fecha_id:             v.fechaID || hoy,
        hora:                 v.hora || '',
        created_at:           new Date().toISOString()
    }));

    if (pedidosMap.length > 0) {
        console.log(`Subiendo un total de ${pedidosMap.length} pedidos a Supabase...`);
        await postSupabase('pedidos', pedidosMap);
        console.log('✅ Pedidos subidos correctamente.');
    } else {
        console.log('No hay pedidos para subir.');
    }

    // 2. CARGAR Y SUBIR TURNOS
    if (fs.existsSync('backup_extracted/kollita-backup/turnos_cerrados_kollita.json')) {
        const turnosStr = fs.readFileSync('backup_extracted/kollita-backup/turnos_cerrados_kollita.json', 'utf8');
        if (turnosStr.trim().length > 0) {
            const turnos = JSON.parse(turnosStr);
            const turnosMap = turnos.map(cierre => {
                const tipoRaw = (cierre.turno || 'DÍA').toUpperCase();
                const tipoMap = { 'DIA': 'DÍA', 'MAÑANA': 'DÍA', 'MANANA': 'DÍA', 'DÍA': 'DÍA', 'TARDE': 'TARDE', 'NOCHE': 'NOCHE' };
                return {
                sucursal_id:        sucursalId,
                secretario_nombre:  cierre.secretario,
                tipo_turno:         tipoMap[tipoRaw] || 'DÍA',
                estado:             'CERRADO',
                hora_apertura:      cierre.inicio,
                hora_cierre:        cierre.cierre,
                total_general:      cierre.totalGeneral       || 0,
                total_efectivo:     cierre.totalEfectivo      || 0,
                total_qr:           cierre.totalQR            || 0,
                total_mixto_efectivo: cierre.totalMixtoEfectivo || 0,
                total_mixto_qr:     cierre.totalMixtoQR       || 0,
                total_descuentos:   cierre.totalDescuentos    || 0,
                total_anticipos:    cierre.totalAnticipos     || 0,
                cantidad_ventas:    cierre.cantidadVentas     || 0,
                cantidad_anulados:  cierre.cantidadAnulados   || 0,
                datos_cierre:       cierre
            };
            });

            console.log(`Subiendo ${turnosMap.length} turnos a Supabase...`);
            await postSupabase('turnos', turnosMap);
            console.log('✅ Turnos subidos correctamente.');
        } else {
            console.log('El archivo de turnos esta vacio.');
        }
    }

    console.log('\n======================================================');
    console.log('🎉 MIGRACION COMPLETADA CON EXITO');
    console.log('======================================================\n');
}

main().catch(err => {
    console.error('ERROR GRAVE:', err);
});

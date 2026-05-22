const fs = require('fs');
const path = require('path');

const SUPA_URL = 'https://wsqhzatsuymjoebzfhpg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcWh6YXRzdXltam9lYnpmaHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTUyMTMsImV4cCI6MjA5NDYzMTIxM30.bFCJBY9PAa8WviEwE8HdO2TjE3ytYM3sD6qFgxJ0pPM';

async function main() {
    const backupDir = 'backup_extracted/kollita-backup';
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('kollita_archivo_') || f === 'kollita_db.json');
    
    let allPedidos = [];
    for (const f of files) {
        try {
            const raw = fs.readFileSync(path.join(backupDir, f), 'utf8');
            const data = JSON.parse(raw);
            allPedidos = allPedidos.concat(data);
        } catch(e) {}
    }
    
    console.log(`Encontrados ${allPedidos.length} pedidos en backup local.`);
    
    const hoy = new Date().toISOString().split('T')[0];
    const pedidosMap = allPedidos.map(v => {
        let safeDate = new Date().toISOString();
        try {
            if (v.id) {
                const d = new Date(v.id);
                if (!isNaN(d.getTime())) safeDate = d.toISOString();
                else {
                    const ms = parseInt(v.id);
                    if (!isNaN(ms) && ms > 1000000000000) safeDate = new Date(ms).toISOString();
                }
            }
        } catch(e) {}

        return {
            id:                   String(v._id_local || v.id || v.numeroNota || Math.random().toString(36).substr(2,9)),
            sucursal_id:          'Cuchilla',
            numero_nota:          parseInt(v.numeroNota) || 0,
            cliente:              v.cliente || 'CONSUMIDOR FINAL',
            ci_nit:               v.ci_nit  || '',
            productos:            v.productos || v.items || [],
            subtotal:             parseFloat(v.subtotal) || parseFloat(v.total) || 0,
            descuento:            parseFloat(v.descuento) || 0,
            porcentaje_descuento: parseFloat(v.porcentajeDescuento) || 0,
            total:                parseFloat(v.total) || 0,
            estado:               (v.estado     || 'PREPARADO').toUpperCase(),
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
            hora:                 v.hora || '',
            fecha_id:             v.fechaID || hoy,
            created_at:           safeDate
        };
    });

    const lote = 20;
    let errores = 0;
    let subidos = 0;
    
    for(let i=0; i<pedidosMap.length; i+=lote) {
        const chunk = pedidosMap.slice(i, i+lote);
        const res = await fetch(SUPA_URL + '/rest/v1/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + SUPA_KEY,
                'Prefer': 'return=minimal,resolution=ignore-duplicates'
            },
            body: JSON.stringify(chunk)
        });
        
        if (!res.ok) {
            errores += chunk.length;
            const txt = await res.text();
            console.log('Error en batch', i, txt);
        } else {
            subidos += chunk.length;
        }
    }
    console.log(`Proceso terminado: ${subidos} subidos, ${errores} errores.`);
}

main();

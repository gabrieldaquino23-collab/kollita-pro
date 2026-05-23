# Lecciones Aprendidas — Errores y Bugs Corregidos

> **Regla de oro**: Antes de modificar cualquier función en `secretarios.html`, leer esta lista. El 90% de los bugs son repeticiones de estos patrones.

---

## 1. NUNCA usar `classList.toggle` para mostrar/ocultar paneles

**Bug**: El detalle de cierres no se expandía al hacer clic.
**Causa**: `toggleCierreDetalle()` usaba `classList.toggle('activo')` que depende de la cascada CSS. Si cualquier estilo sobreescribe `.cierre-detalle.activo`, falla.
**Solución**: Usar SIEMPRE `style.display` inline:
```javascript
// ✅ CORRECTO
detalle.style.display = visible ? 'none' : 'block';

// ❌ INCORRECTO (NO USAR)
detalle.classList.toggle('activo');
```
**Patrón del sistema**: `toggleDet()`, `toggleDetallePerfil()`, y todas las demás usan `style.display`. Seguir ese patrón.

---

## 2. `buscarNotaEnTodosLados()` — SIEMPRE buscar en múltiples fuentes

**Bug**: Botones de acción (marcar entregado, modificar, eliminar) no respondían. La consola mostraba "Nota no encontrada".
**Causa**: Las funciones de acción solo buscaban en `kollita_db`, pero los pedidos visibles en el historial vienen de 3 fuentes:
1. `kollita_db` (localStorage)
2. Archivos mensuales (`kollita_archivo_YYYY_MM`)
3. Cache de Supabase (`window._supaHistorialCache`)

**Solución**: Usar `buscarNotaEnTodosLados(id)` que busca en las 3 fuentes y auto-importa a `kollita_db`.
**NUNCA** hacer `h.find(n => n.id == id)` directamente en funciones de acción. Siempre usar el helper.

---

## 3. `localStorage` quota — nunca guardar objetos completos

**Bug**: `QuotaExceededError` al sincronizar desde Supabase. `turnos_cerrados_kollita` excedía 5 MB.
**Causa**: Cada cierre guardaba el array `ventas` completo (objetos de 30+ campos × 20+ órdenes por turno × 30 turnos).
**Solución**: Función `_ventasLite()` que reduce cada orden a solo 10 campos esenciales. De ~2 KB a ~200 bytes por orden.
**Regla**: Al guardar en localStorage o Supabase, siempre comprimir arrays grandes. Usar funciones `_lite()` para reducir payload.

---

## 4. `innerHTML` — siempre con try/catch

**Bug**: Si el template literal fallaba (por datos corruptos o undefined), toda la página se rompía.
**Causa**: `document.getElementById('h-lista').innerHTML = templateLiteralConDatos` — si cualquier variable en el template es `undefined.method()`, crashea todo.
**Solución**: Envolver la asignación `innerHTML` en try/catch:
```javascript
try {
    el.innerHTML = html;
} catch(e) {
    console.error(e);
    el.innerHTML = '<div style="color:red">Error al cargar</div>';
}
```

---

## 5. `JSON.stringify` en atributos HTML → usar `escAttrJson()`

**Bug**: Botones de imprimir/WhatsApp no funcionaban con nombres de cliente que tenían `'`, `&`, o `<`.
**Causa**: El viejo `JSON.stringify(n).replace(/'/g, "\'")` no escapaba `&`, `<`, `>`.
**Solución**: Usar `escAttrJson(obj)`:
```javascript
function escAttrJson(obj) {
    return JSON.stringify(obj)
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
```
Usar en TODOS los `onclick='...${JSON.stringify(...)}'`.

---

## 6. `window._pendientesSupabase` — sincronizar con `window`

**Bug**: Pedidos móviles de Supabase nunca aparecían en el panel.
**Causa**: `_pendientesSupabase` se declaraba como `let` local, pero los guards usaban `window._pendientesSupabase` (siempre `undefined`).
**Solución**: Siempre que un módulo externo necesite acceder a una variable, asignarla a `window`:
```javascript
let _pendientesSupabase = [];
window._pendientesSupabase = _pendientesSupabase;
// Y sincronizar al final del poll:
window._pendientesSupabase = _pendientesSupabase;
```

---

## 7. Resumen de caja — NO vincular al filtro de fechas

**Bug**: Al cambiar el filtro de fechas en el historial, el "Resumen de Caja - Turno Actual" cambiaba (se iba a 0 si la fecha no coincidía).
**Causa**: `ventasTurnoActual` se derivaba de `entregadosFiltrados` que YA estaba filtrado por fecha.
**Solución**: El resumen debe usar `obtenerVentasTurno()` que lee TODOS los pedidos del turno activo sin filtro de fechas.
**Regla**: El filtro de fechas (`h-fecha-desde`/`h-fecha-hasta`) SOLO afecta la LISTA de pedidos visibles, NUNCA el resumen de caja.

---

## 8. Fechas por defecto — VACÍAS, no "hoy"

**Bug**: Al abrir el historial, solo se veían pedidos de hoy. Los de días anteriores quedaban ocultos.
**Causa**: `h-fecha-desde` y `h-fecha-hasta` se inicializaban con la fecha de hoy.
**Solución**: Dejar los filtros de fecha VACÍOS por defecto. Si están vacíos, mostrar TODOS los pedidos. El usuario pone fechas solo cuando quiere buscar algo específico.

---

## 9. `desbloquear()` — NO limpiar datos persistentes en login

**Bug**: Al hacer login se borraban `kollita_reclamos` y `kollita_log_anulaciones`. Los datos de obsequios/reclamos desaparecían.
**Causa**: `desbloquear()` hacía `localStorage.removeItem()` sobre esas keys.
**Solución**: Solo limpiar datos que DEBEN refrescarse al cambiar de sucursal (`kollita_db`, `kollita_pendientes`, `kollita_clientes`). Datos de reclamos, anulaciones, y configuración NO se borran.

---

## 10. Supabase sync — nunca hardcodear arrays vacíos

**Bug**: Al recargar la página, los detalles de cierre perdían `ventas` y `pedidosAnulados`.
**Causa**: Los mapeos `fallbackMap` y `map` en `cargarBackupDesdeSupabase` tenían `ventas: []` y `pedidosAnulados: []` hardcodeados.
**Solución**: Leer los datos reales de Supabase:
```javascript
// ✅ CORRECTO
ventas: _ventasLite(dc.ventas || r.ventas || [])

// ❌ INCORRECTO
ventas: []
```

---

## 11. Sintaxis — una llave `}` de más rompe TODO

**Bug**: 13 errores en consola, `verTab is not defined`, `getSucursalNombre is not defined`. NADA funcionaba.
**Causa**: Una sola `}` extra en `anularPedido()` rompió el parsing de TODO el script. Como el error es de sintaxis, el navegador no ejecuta NINGUNA función del script.
**Regla**: Después de cualquier edición que toque llaves `{}`, verificar que abran y cierren correctamente. Un solo caracter mal puesto rompe toda la aplicación.

---

## 12. Items de Supabase — compatibilidad de nombres de campo

**Bug**: Al abrir "Eliminar producto", la lista aparecía vacía.
**Causa**: Los items de órdenes locales usan `{n, c, p}`, pero los de Supabase pueden usar `{nombre, cantidad, precio}`.
**Solución**: Siempre usar fallbacks al acceder campos de items:
```javascript
var nombre = it.n || it.nombre || 'Producto';
var cant = it.c || it.cantidad || 0;
var precio = it.p || it.precio || 0;
```

---

## 13. `confirmarEntrega` y `findIndex` — usar `String()` en IDs

**Bug**: `confirmarEntrega()` no encontraba la nota y fallaba silenciosamente.
**Causa**: El ID en el onclick viene como string (`'${n.id}'`), pero `n.id` en el array es número. Con `===`, la comparación falla.
**Solución**: Usar `String()` en AMBOS lados:
```javascript
// ✅ CORRECTO
const index = h.findIndex(n => String(n.id) === String(nota.id));

// ❌ INCORRECTO (puede fallar)
const index = h.findIndex(n => n.id === nota.id);
```

---

## 14. Modales — usar `style.display = 'flex'`, NO clases CSS

**Bug**: A veces los modales no se mostraban.
**Causa**: `abrirModal()` usa `document.getElementById(id).style.display = 'flex'`. Si alguien cambia el CSS de `.modal`, el inline style tiene prioridad y funciona igual.
**Regla**: Siempre usar `abrirModal(id)` y `cerrarModal(id)`. NUNCA manipular `classList` para mostrar/ocultar modales.

---

## 15. `clicSeguro` — es síncrono, no asíncrono

**Dato importante**: `clicSeguro(fn, tiempo)` ejecuta `fn()` **inmediatamente** (síncrono). El `setTimeout` solo limpia el flag anti-doble-click. Esto significa que el orden de ejecución dentro de `clicSeguro` es el mismo que si llamaras a `fn()` directamente. No hay race conditions por este wrapper.

---

## Checklist rápida antes de modificar `secretarios.html`

- [ ] ¿Usa `buscarNotaEnTodosLados(id)` en vez de buscar solo en `kollita_db`?
- [ ] ¿Usa `escAttrJson(obj)` para JSON en atributos HTML?
- [ ] ¿Usa `style.display` en vez de `classList.toggle`?
- [ ] ¿Usa `String(id)` para comparar IDs?
- [ ] ¿El `innerHTML` está envuelto en try/catch?
- [ ] ¿Los arrays grandes están comprimidos (`_lite()`)?
- [ ] ¿Las fechas por defecto están vacías, no en "hoy"?
- [ ] ¿Los mapeos de Supabase leen datos reales, no arrays vacíos hardcodeados?
- [ ] ¿Los nombres de campo tienen fallbacks (`it.n || it.nombre`)?
- [ ] ¿Conté las llaves `{}` después de editar?

// Exportar el partido como planillas CSV (se abren en Excel o Google Sheets).
import { store } from '../almacen.js';
import { describe, teamName } from '../modelos/eventos.js';
import { fmt } from './formato.js';

function csvCell(v) {
  v = String(v == null ? '' : v);
  return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function aCSV(rows) { return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\n'); }

export function eventsCSV(s) {
  const rows = [['n', 'reloj', 'punto', 'tipo', 'descripcion']];
  s.log.forEach(function (l, i) { rows.push([i + 1, fmt(l.e.t || 0), l.point, l.e.type, describe(l.e)]); });
  return aCSV(rows);
}

export function statsCSV(s) {
  const rows = [['numero', 'nombre', 'genero', 'puntos', 'minutos', 'goles', 'asistencias', 'pases_completos', 'recepciones', 'throwaways', 'drops', 'stalls', 'blocks',
    'pulls', 'pulls_dentro', 'pulls_fuera', 'vuelo_promedio_s']];
  store.roster.forEach(function (p) {
    const x = s.stats[p.id]; if (!x) return;
    rows.push([p.num, p.name, p.g === 'F' ? 'M' : 'H', x.pts, Math.round((x.ms || 0) / 60000), x.goals, x.ast, x.comp, x.catches, x.thr, x.drop, x.stall, x.blk,
      x.pulls, x.pullIn, x.pullOut, x.hangN ? (x.hangMs / x.hangN / 1000).toFixed(2) : '']);
  });
  // Totales de pulls por equipo (incluye los pulls sin jugador registrado).
  rows.push([]);
  rows.push(['equipo', 'pulls', 'pulls_dentro', 'pulls_fuera', 'vuelo_promedio_s']);
  ['us', 'them'].forEach(function (t) {
    const ps = s.pulls.filter(function (p) { return p.team === t; });
    const dentro = ps.filter(function (p) { return p.inBounds; }).length;
    const med = ps.filter(function (p) { return p.hang != null; });
    rows.push([teamName(t), ps.length, dentro, ps.length - dentro,
      med.length ? (med.reduce(function (a, p) { return a + p.hang; }, 0) / med.length / 1000).toFixed(2) : '']);
  });
  return aCSV(rows);
}

// Descarga el archivo. Si el navegador no lo permite, llama a siNoSePuede
// para mostrar el texto y que se pueda copiar a mano.
export function exportFile(name, text, siNoSePuede) {
  // Dentro de una página incrustada (por ejemplo, la copia publicada en Claude)
  // las descargas están bloqueadas: se muestra el texto para copiarlo.
  if (window.self !== window.top) { siNoSePuede(name, text); return false; }
  try {
    // El carácter ﻿ al inicio hace que Excel lea bien las tildes y la ñ.
    const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    return true;
  } catch (e) {
    siNoSePuede(name, text);
    return false;
  }
}

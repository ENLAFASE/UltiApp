// Exportar el partido como planillas CSV (se abren en Excel o Google Sheets).
import { store } from '../almacen.js';
import { describe } from '../modelos/eventos.js';
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
  const rows = [['numero', 'nombre', 'genero', 'puntos', 'goles', 'asistencias', 'pases_completos', 'recepciones', 'throwaways', 'drops', 'stalls', 'blocks']];
  store.roster.forEach(function (p) {
    const x = s.stats[p.id]; if (!x) return;
    rows.push([p.num, p.name, p.g, x.pts, x.goals, x.ast, x.comp, x.catches, x.thr, x.drop, x.stall, x.blk]);
  });
  return aCSV(rows);
}

// Descarga el archivo. Si el navegador no lo permite, llama a siNoSePuede
// para mostrar el texto y que se pueda copiar a mano.
export function exportFile(name, text, siNoSePuede) {
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

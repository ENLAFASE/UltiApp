// Pestaña "Dashboard": resumen del partido en curso y análisis de los partidos
// guardados (récord, holds/breaks, tendencia, ranking de jugadores).
import { store, EQUIPOS } from '../almacen.js';
import { ui } from '../ui.js';
import { esc } from '../util/formato.js';
import { encabezado } from './encabezado.js';
import { viewSummary } from './resumen.js';
import { lista, agregar, deriveDe, holdBreak, nombreEquipo } from '../modelos/historial.js';

function fecha(ms) {
  try { return new Date(ms).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: '2-digit' }); } catch (e) { return ''; }
}
function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '—'; }
function nombreJug(j) { return j.info && (j.info.name || (j.info.num ? '#' + j.info.num : '')) || '?'; }
function resultado(us, them) { return us > them ? 'G' : us < them ? 'P' : 'E'; }

// Selector "Este partido / Historial" (solo si hay un partido creado).
function modos() {
  if (!store.game) return '';
  const m = ui.dash || 'actual';
  return '<div class="seg" role="tablist">' +
    '<button role="tab" data-a="dashModo" data-v="actual" aria-selected="' + (m === 'actual') + '">Este partido</button>' +
    '<button role="tab" data-a="dashModo" data-v="historial" aria-selected="' + (m === 'historial') + '">Historial</button></div>';
}

function filtros() {
  const f = ui.dashEq || 'todos', h = lista();
  const opciones = [['todos', 'Todos']].concat(Object.keys(EQUIPOS).map(function (k) { return [k, EQUIPOS[k].corto]; }));
  if (h.some(function (r) { return !EQUIPOS[r.equipo]; })) opciones.push(['otro', 'Otros']);
  return '<div class="chips">' + opciones.map(function (o) {
    const n = o[0] === 'todos' ? h.length : h.filter(function (r) { return (EQUIPOS[r.equipo] ? r.equipo : 'otro') === o[0]; }).length;
    return '<button class="chip sq" data-a="dashEq" data-v="' + o[0] + '" aria-pressed="' + (f === o[0]) + '">' + o[1] + ' <span class="muted">' + n + '</span></button>';
  }).join('') + '</div>';
}

function filtrados() {
  const f = ui.dashEq || 'todos';
  return lista().filter(function (r) { return f === 'todos' || (EQUIPOS[r.equipo] ? r.equipo : 'otro') === f; })
    .sort(function (a, b) { return a.fecha - b.fecha; });
}

function kpi(lbl, valor, sub, clase) {
  return '<div class="kpi' + (clase ? ' ' + clase : '') + '"><span class="muted">' + lbl + '</span><span class="kpi-v num-d">' + valor + '</span>' +
    (sub ? '<span class="kpi-s">' + sub + '</span>' : '') + '</div>';
}

// Barras de diferencia de puntos por partido (arriba = ganado, abajo = perdido).
function tendencia(partidos) {
  const ult = partidos.slice(-12);
  const max = Math.max(3, Math.max.apply(null, ult.map(function (x) { return Math.abs(x.s.us - x.s.them); })));
  let h = '<div class="tend" role="img" aria-label="Diferencia de puntos de los últimos ' + ult.length + ' partidos">';
  ult.forEach(function (x) {
    const d = x.s.us - x.s.them, alto = Math.round(Math.abs(d) / max * 100);
    h += '<button class="tend-c" data-a="dashVer" data-v="' + x.rec.id + '" title="' + esc(x.rec.rival) + ' ' + x.s.us + '-' + x.s.them + '">' +
      '<span class="tend-up">' + (d > 0 ? '<i class="pos" style="height:' + alto + '%"></i>' : '') + '</span>' +
      '<span class="tend-dn">' + (d < 0 ? '<i class="neg" style="height:' + alto + '%"></i>' : '') + '</span>' +
      '<span class="tend-l">' + (d > 0 ? '+' : '') + d + '</span></button>';
  });
  return h + '</div>';
}

const RANKS = { goals: 'Goles', ast: 'Asistencias', blk: 'Blocks', pts: 'Puntos jugados' };

function tablaJugadores(jug) {
  const k = ui.dashRank || 'goals';
  const filas = Object.keys(jug).map(function (id) { return jug[id]; })
    .sort(function (a, b) { return (b[k] - a[k]) || (b.goals + b.ast - a.goals - a.ast); });
  let h = '<div class="chips">' + Object.keys(RANKS).map(function (r) {
    return '<button class="chip sq" data-a="dashRank" data-v="' + r + '" aria-pressed="' + (k === r) + '">' + RANKS[r] + '</button>';
  }).join('') + '</div>';
  h += '<div class="tbl-wrap fija"><table><thead><tr><th>Jugador</th><th>PJ</th><th>Pts</th><th>Gol</th><th>Ast</th><th>Blk</th><th>Turn</th></tr></thead><tbody>';
  filas.forEach(function (j) {
    h += '<tr><td>' + esc(nombreJug(j)) + (j.info.num ? ' <span class="muted">#' + esc(j.info.num) + '</span>' : '') + '</td><td>' + j.pj + '</td><td>' + j.pts + '</td><td>' + j.goals + '</td><td>' + j.ast + '</td><td>' + j.blk + '</td><td>' + j.turn + '</td></tr>';
  });
  return h + '</tbody></table></div><p class="muted" style="margin:0">PJ = partidos jugados · Pts = puntos en cancha · Turn = throwaways, drops y stalls.</p>';
}

function viewHistorial() {
  let h = filtros();
  const recs = filtrados();
  if (!recs.length) {
    return h + '<div class="card stack vacio"><span class="prep-h disp">Sin partidos guardados</span>' +
      '<span class="muted">Cada partido queda guardado aquí al terminar (al llegar a los puntos o con "Finalizar partido"). ' +
      'También al cerrarlo desde Ajustes si ya tenía puntos.</span></div>';
  }
  const t = agregar(recs);
  const dif = t.pf - t.pc;
  h += '<div class="kpis">' +
    kpi('Partidos', t.g + '–' + t.p, t.pj + (t.pj === 1 ? ' jugado' : ' jugados') + (t.pj - t.g - t.p ? ' · ' + (t.pj - t.g - t.p) + ' empate' : ''), 'k-rec') +
    kpi('Puntos', (dif > 0 ? '+' : '') + dif, t.pf + ' a favor · ' + t.pc + ' en contra') +
    kpi('Hold', pct(t.hold, t.atq), t.hold + ' de ' + t.atq + ' partiendo en ataque') +
    kpi('Break', pct(t.brk, t.def), t.brk + ' de ' + t.def + ' partiendo en defensa') + '</div>';

  h += '<h2 class="h2 disp">Tendencia</h2>' + tendencia(t.partidos);

  h += '<h2 class="h2 disp">Partidos</h2><div class="stack" style="gap:6px">';
  t.partidos.slice().reverse().forEach(function (x) {
    const r = resultado(x.s.us, x.s.them);
    h += '<button class="item partido-i" data-a="dashVer" data-v="' + x.rec.id + '">' +
      '<span class="pi-res res-' + r + '">' + r + '</span>' +
      '<span class="grow stack" style="gap:0"><b>vs ' + esc(x.rec.rival) + '</b><span class="muted">' + fecha(x.rec.fecha) + ' · ' + esc(nombreEquipo(x.rec)) + (x.rec.terminado ? '' : ' · cerrado antes del final') + '</span></span>' +
      '<span class="pi-sc num-d">' + x.s.us + '–' + x.s.them + '</span></button>';
  });
  h += '</div>';

  h += '<h2 class="h2 disp">Jugadores</h2>' + tablaJugadores(t.jug);
  return h;
}

// Detalle de un partido guardado.
function viewDetalle(id) {
  const rec = lista().find(function (r) { return String(r.id) === String(id); });
  if (!rec) { ui.dashVer = null; return viewHistorial(); }
  const s = deriveDe(rec), hb = holdBreak(s), r = resultado(s.us, s.them);
  let h = '<button class="btn sm volver" data-a="dashVolver">← Historial</button>';
  h += '<div class="card det-h"><span class="muted">' + fecha(rec.fecha) + ' · ' + esc(nombreEquipo(rec)) + '</span>' +
    '<div class="det-sc"><span>' + esc(rec.club) + '</span><b class="num-d">' + s.us + '–' + s.them + '</b><span>' + esc(rec.rival) + '</span></div>' +
    '<span class="pi-res res-' + r + '">' + { G: 'Ganado', P: 'Perdido', E: 'Empate' }[r] + '</span></div>';
  h += '<div class="kpis">' +
    kpi('Hold', pct(hb.hold, hb.atq), hb.hold + ' de ' + hb.atq) +
    kpi('Break', pct(hb.brk, hb.def), hb.brk + ' de ' + hb.def) + '</div>';
  // Progresión del marcador punto a punto.
  h += '<h2 class="h2 disp">Punto a punto</h2><div class="prog">';
  let a = 0, b = 0;
  s.pointLog.forEach(function (p) {
    if (p.winner === 'us') a++; else b++;
    h += '<span class="prog-p ' + (p.winner === 'us' ? 'w' : 'l') + (p.offense === 'us' ? '' : ' brk') + '" title="' + a + '-' + b + '">' + a + '-' + b + '</span>';
  });
  h += '</div><p class="muted" style="margin:0">Naranjo = punto nuestro; con borde, ganado partiendo en defensa (break).</p>';
  // Jugadores del partido.
  const ids = Object.keys(s.stats).sort(function (x, y) { return (s.stats[y].goals + s.stats[y].ast) - (s.stats[x].goals + s.stats[x].ast); });
  h += '<h2 class="h2 disp">Jugadores</h2><div class="tbl-wrap fija"><table><thead><tr><th>Jugador</th><th>Pts</th><th>Gol</th><th>Ast</th><th>Pases</th><th>Blk</th><th>Turn</th></tr></thead><tbody>';
  ids.forEach(function (pid) {
    const x = s.stats[pid], j = rec.jugadores[pid] || {};
    h += '<tr><td>' + esc(j.name || ('#' + (j.num || '?'))) + '</td><td>' + x.pts + '</td><td>' + x.goals + '</td><td>' + x.ast + '</td><td>' + x.comp + '</td><td>' + x.blk + '</td><td>' + (x.thr + x.drop + x.stall) + '</td></tr>';
  });
  h += '</tbody></table></div>';
  const pu = s.pulls.filter(function (p) { return p.team === 'us'; }), dentro = pu.filter(function (p) { return p.inBounds; }).length;
  h += '<div class="kpis">' + kpi('Pulls dentro', pu.length ? dentro + '/' + pu.length : '—', 'nuestros pulls') +
    kpi('Llamados', s.calls.length, s.calls.filter(function (c) { return c.team === 'us'; }).length + ' nuestros') + '</div>';
  h += '<button class="btn danger full" data-a="askBorrarHist" data-id="' + rec.id + '">Borrar del historial</button>';
  return h;
}

export function viewDashboard() {
  const m = store.game ? (ui.dash || 'actual') : 'historial';
  if (m === 'actual') return viewSummary(modos());
  const f = ui.dashEq || 'todos';
  let h = encabezado('Dashboard', f === 'todos' ? 'Todos los equipos' : f === 'otro' ? 'Otros equipos' : EQUIPOS[f].nombre) + '<div class="pad stack">';
  h += modos();
  h += ui.dashVer ? viewDetalle(ui.dashVer) : viewHistorial();
  return h + '</div>';
}

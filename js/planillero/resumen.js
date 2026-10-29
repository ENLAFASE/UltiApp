// Pestaña "Resumen": estadísticas por jugador, pulls, llamados y exportar.
import { store, cfg } from '../almacen.js';
import { derive } from '../modelos/partido.js';
import { RES, RES_SHORT, teamName } from '../modelos/eventos.js';
import { label, short, porNumero } from '../modelos/jugador.js';
import { esc, fmt } from '../util/formato.js';
import { header } from './marcador.js';
import { escudo } from './encabezado.js';

export function viewSummary() {
  if (!store.game) return '<div class="empty">' + escudo('crest-xl') + '<h2 class="h2 disp">Sin datos todavía</h2><p class="muted" style="margin:0">El resumen aparece cuando empieza un partido.</p></div>';
  const s = derive(), c = cfg();
  let h = header(s) + '<div class="pad stack">';

  // jugadores
  h += '<h2 class="h2 disp">Jugadores</h2>';
  const rows = porNumero(store.roster.filter(function (p) { return s.stats[p.id]; }));
  if (!rows.length) h += '<p class="muted">Aún no hay estadísticas de jugadores.</p>';
  else {
    // Destacados: quién lidera en goles, asistencias y blocks.
    function lider(campo) {
      let mejor = null;
      rows.forEach(function (p) { const v = s.stats[p.id][campo]; if (v > 0 && (!mejor || v > mejor.v)) mejor = { p: p, v: v }; });
      return mejor;
    }
    const dest = [['goals', 'Goles'], ['ast', 'Asistencias'], ['blk', 'Blocks']];
    h += '<div class="dest">' + dest.map(function (d) {
      const m = lider(d[0]);
      return '<div class="dest-i"><span class="muted">' + d[1] + '</span>' +
        (m ? '<span class="dest-v num-d">' + m.v + '</span><span class="dest-n">' + esc(short(m.p.id)) + '</span>' : '<span class="dest-v num-d">—</span><span class="dest-n muted">Nadie aún</span>') + '</div>';
    }).join('') + '</div>';
    h += '<div class="tbl-wrap fija"><table><thead><tr><th>Jugador</th><th>Pts</th><th>Min</th><th>Gol</th><th>Ast</th><th>Pases</th><th>Turn</th><th>Blk</th></tr></thead><tbody>';
    rows.forEach(function (p) {
      const x = s.stats[p.id];
      h += '<tr><td>' + esc(label(p.id)) + '</td><td>' + x.pts + '</td><td>' + Math.round((x.ms || 0) / 60000) + '</td><td>' + x.goals + '</td><td>' + x.ast + '</td><td>' + x.comp + '</td><td>' + (x.thr + x.drop + x.stall) + '</td><td>' + x.blk + '</td></tr>';
    });
    h += '</tbody></table></div><p class="muted" style="margin:0">Turn suma throwaways, drops y stalls.</p>';
  }

  // pulls: por equipo (dentro, fuera, vuelo promedio) y por jugador de mi equipo
  h += '<h2 class="h2 disp">Pulls</h2>';
  ['us', 'them'].forEach(function (t) {
    const ps = s.pulls.filter(function (p) { return p.team === t; });
    const inN = ps.filter(function (p) { return p.inBounds; }).length;
    const timed = ps.filter(function (p) { return p.hang != null; });
    const avg = timed.length ? (timed.reduce(function (a, p) { return a + p.hang; }, 0) / timed.length / 1000).toFixed(2) + ' s' : '—';
    h += '<div class="card stack" style="gap:6px"><span><span class="pill ' + (t === 'us' ? 'us' : 'th') + '">' + esc(teamName(t)) + '</span> ' + ps.length + ' pulls</span>' +
      '<div class="counter"><div><div class="muted">Dentro</div><div class="v disp">' + inN + '</div></div>' +
      '<div><div class="muted">Fuera</div><div class="v disp' + (ps.length - inN ? ' warn' : '') + '">' + (ps.length - inN) + '</div></div>' +
      '<div><div class="muted">Vuelo prom.</div><div class="v disp">' + avg + '</div></div></div>' +
      (t === 'us' && timed.length ? '<span class="muted">Promedio de ' + timed.length + ' pull' + (timed.length === 1 ? '' : 's') + ' cronometrado' + (timed.length === 1 ? '' : 's') + '.</span>' : '') +
      (t === 'them' ? '<span class="muted">Los pulls del rival no se cronometran.</span>' : '') + '</div>';
  });
  const pulladores = porNumero(store.roster.filter(function (p) { return (s.stats[p.id] || {}).pulls; }));
  if (pulladores.length) {
    h += '<div class="tbl-wrap"><table><thead><tr><th>Quién saca</th><th>Pulls</th><th>Dentro</th><th>Fuera</th><th>Vuelo prom.</th></tr></thead><tbody>';
    pulladores.forEach(function (p) {
      const x = s.stats[p.id];
      h += '<tr><td>' + esc(label(p.id)) + '</td><td>' + x.pulls + '</td><td>' + x.pullIn + '</td><td>' + x.pullOut + '</td><td>' + (x.hangN ? (x.hangMs / x.hangN / 1000).toFixed(2) + ' s' : '—') + '</td></tr>';
    });
    h += '</tbody></table></div>';
  }
  const sinQuien = s.pulls.filter(function (p) { return p.team === 'us' && !p.player; }).length;
  if (sinQuien) h += '<p class="muted" style="margin:0">' + sinQuien + ' pull' + (sinQuien === 1 ? '' : 's') + ' de ' + esc(c.club) + ' sin registrar quién lo sacó (cuentan en el total del equipo).</p>';

  // llamados
  h += '<h2 class="h2 disp">Llamados</h2>';
  const nUs = s.calls.filter(function (x) { return x.team === 'us'; }).length, nTh = s.calls.length - nUs;
  h += '<div class="counter"><div><div class="muted">Total</div><div class="v disp">' + s.calls.length + '</div></div>' +
    '<div><div class="muted">' + esc(c.club) + '</div><div class="v disp" style="color:var(--us)">' + nUs + '</div></div>' +
    '<div><div class="muted">' + esc(c.rival) + '</div><div class="v disp" style="color:var(--them)">' + nTh + '</div></div></div>';
  if (s.calls.length) {
    h += '<div class="stack" style="gap:8px">';
    Object.keys(RES).forEach(function (r) {
      const n = s.calls.filter(function (x) { return x.res === r; }).length;
      h += '<div class="bar"><span class="k">' + RES_SHORT[r] + '</span><div class="track"><div class="fillb" style="width:' + Math.round(n / s.calls.length * 100) + '%"></div></div><span class="n">' + n + '</span></div>';
    });
    h += '</div><div class="stack" style="gap:6px">';
    s.calls.slice().reverse().forEach(function (x) {
      h += '<div class="item"><div class="stack" style="gap:2px"><span class="row" style="gap:8px"><span class="pill ' + (x.team === 'us' ? 'us' : 'th') + '">' + esc(teamName(x.team)) + '</span><strong>' + esc(x.kind) +
        (x.player ? ' ' + esc(x.team === 'us' ? short(x.player) : '#' + x.player) : '') + '</strong></span><span class="muted">Punto ' + x.point + ', ' + fmt(x.t || 0) + '</span></div>' +
        '<span class="pill" style="border:1px solid var(--ink)">' + RES_SHORT[x.res] + '</span></div>';
    });
    h += '</div>';
  } else h += '<p class="muted" style="margin:0">No se han registrado llamados.</p>';

  h += '<h2 class="h2 disp">Exportar</h2><div class="grid2"><button class="btn fill" data-a="expStats">Estadísticas CSV</button><button class="btn" data-a="expEvents">Eventos CSV</button></div>';
  h += '</div>';
  return h;
}

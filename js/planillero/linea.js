// Pantalla para elegir los 7 jugadores del punto, respetando la proporción mixta.
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { ratioFor, reqCounts, ratioText } from '../modelos/partido.js';
import { P, label, porNumero } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';
import { lastLine } from './marcador.js';

// Proporción que toca en este punto (o la contraria si se tocó "Cambiar").
export function currentRatio(s) {
  let r = ratioFor(s.point - 1); if (!r) return null;
  if (ui.ratioSwap) r = (r === '4M3F' ? '3M4F' : '4M3F');
  return r;
}

// Completa la línea dando prioridad a quien no jugó el punto anterior
// y a quien lleva menos puntos jugados.
export function suggestLine(s) {
  const c = cfg(), sel = ui.sel.slice(), req = c.mixed ? reqCounts(currentRatio(s)) : null;
  const cand = store.roster.filter(function (p) { return sel.indexOf(p.id) < 0; }).sort(function (a, b) {
    const la = s.lastLine.indexOf(a.id) >= 0 ? 1 : 0, lb = s.lastLine.indexOf(b.id) >= 0 ? 1 : 0;
    if (la !== lb) return la - lb;
    const pa = (s.stats[a.id] || {}).pts || 0, pb = (s.stats[b.id] || {}).pts || 0;
    if (pa !== pb) return pa - pb;
    return (+a.num || 0) - (+b.num || 0);
  });
  if (req) {
    ['M', 'F'].forEach(function (gd) {
      let have = sel.filter(function (id) { const p = P(id); return p && p.g === gd; }).length;
      cand.filter(function (p) { return p.g === gd; }).forEach(function (p) {
        if (have < req[gd] && sel.length < 7) { sel.push(p.id); have++; }
      });
    });
  }
  cand.forEach(function (p) { if (sel.length < 7 && sel.indexOf(p.id) < 0 && !req) sel.push(p.id); });
  ui.sel = sel;
}

export function viewLine(s) {
  const c = cfg();
  if (ui.selFor !== s.point) { ui.selFor = s.point; ui.sel = []; ui.ratioSwap = false; }
  const r = currentRatio(s), req = r ? reqCounts(r) : null;
  let selM = 0, selF = 0;
  ui.sel.forEach(function (id) { const p = P(id); if (p && p.g === 'F') selF++; else selM++; });
  const roster = porNumero(store.roster);
  let h = '<div class="pad stack">';
  h += '<div class="row"><h2 class="h2 disp grow">Línea del punto ' + s.point + '</h2><span class="pill ' + (s.offense === 'us' ? 'us' : 'th') + '">' + (s.offense === 'us' ? 'Recibimos' : 'Sacamos') + '</span></div>';
  h += '<div class="counter"><div><div class="muted">En línea</div><div class="v disp' + (ui.sel.length > 7 ? ' warn' : '') + '">' + ui.sel.length + ' / 7</div></div>';
  if (req) {
    h += '<div><div class="muted">Masc.</div><div class="v disp' + (selM !== req.M ? ' warn' : '') + '">' + selM + ' / ' + req.M + '</div></div>';
    h += '<div><div class="muted">Fem.</div><div class="v disp' + (selF !== req.F ? ' warn' : '') + '">' + selF + ' / ' + req.F + '</div></div>';
  }
  h += '</div>';
  if (r) h += '<div class="row"><span class="muted grow">Proporción: ' + ratioText(r) + (c.abba ? ' (ABBA)' : '') + '</span><button class="chip" data-a="swapRatio">Cambiar</button></div>';
  if (!roster.length) h += '<div class="card stack"><span>No hay jugadores en el plantel.</span><button class="btn fill" data-a="tab" data-v="settings">Agregar jugadores</button></div>';
  h += '<div class="stack" style="gap:6px">';
  roster.forEach(function (p) {
    const on = ui.sel.indexOf(p.id) >= 0, pts = (s.stats[p.id] || {}).pts || 0, rep = s.lastLine.indexOf(p.id) >= 0;
    h += '<button class="pbtn" aria-pressed="' + on + '" data-a="selP" data-id="' + p.id + '"><span class="n">' + esc(label(p.id)) + '</span><span class="meta">' +
      (c.mixed ? (p.g === 'F' ? 'Fem.' : 'Masc.') + ', ' : '') + pts + ' pts' + (rep ? ', jugó el anterior' : '') + '</span></button>';
  });
  h += '</div>';
  h += '<div class="grid2"><button class="btn" data-a="suggest">Completar sugerida</button><button class="btn" data-a="clearSel">Limpiar</button></div>';
  h += '<button class="btn big fill disp full" data-a="confirmLine"' + (ui.sel.length ? '' : ' disabled') + '>Confirmar línea</button>';
  if (store.game.events.length) h += '<button class="btn full" data-a="undo">Deshacer último evento</button>';
  h += lastLine(s) + '</div>';
  return h;
}

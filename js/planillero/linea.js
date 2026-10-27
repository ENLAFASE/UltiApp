// Pantalla para elegir los 7 jugadores del punto, respetando la proporción mixta.
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { ratioFor, reqCounts, ratioText, tiempoCumplido } from '../modelos/partido.js';
import { P, porNumero } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';
import { recomendarLinea, MODOS, modoActual } from '../coach/recomendador.js';

export const EN_CANCHA = 7;

// Proporción que toca en este punto (o la contraria si se tocó "cambiar").
export function currentRatio(s) {
  let r = ratioFor(s.point - 1); if (!r) return null;
  if (ui.ratioSwap) r = (r === '4M3F' ? '3M4F' : '4M3F');
  return r;
}

function contarGeneros(ids) {
  let M = 0, F = 0;
  ids.forEach(function (id) { const p = P(id); if (p && p.g === 'F') F++; else M++; });
  return { M: M, F: F };
}

// Completa la línea hasta 7 con el recomendador del coach y guarda la
// explicación para mostrarla ("¿Por qué?").
export function suggestLine(s) {
  const r = currentRatio(s), req = r ? reqCounts(r) : null;
  const rec = recomendarLinea(s, req, ui.sel);
  ui.sel = rec.ids;
  ui.sug = Object.assign({ point: s.point }, rec);
}

// Avisos antes de confirmar: menos de 7 o proporción distinta a la que toca.
export function revisarLinea(s) {
  const avisos = [], n = ui.sel.length;
  if (n < EN_CANCHA) avisos.push('La línea tiene ' + n + (n === 1 ? ' jugador' : ' jugadores') + '. En un punto juegan 7.');
  const r = currentRatio(s);
  if (r) {
    const req = reqCounts(r), t = contarGeneros(ui.sel);
    if (n === EN_CANCHA && (t.M !== req.M || t.F !== req.F)) {
      avisos.push('La proporción es ' + t.M + ' masc. / ' + t.F + ' fem., pero corresponde ' + ratioText(r));
    }
  }
  return avisos;
}

// Ventana "¿Por qué esta línea?": el criterio y el motivo de cada jugador.
export function modalPorQue() {
  const k = ui.sug; if (!k) return '';
  let h = '<h2 class="h2 disp">¿Por qué esta línea?</h2><p style="margin:0"><b>' + esc(k.resumen) + '</b></p><div class="stack" style="gap:6px">';
  k.ids.forEach(function (id) {
    const p = P(id);
    h += '<div class="item"><span><b>#' + esc(p ? p.num : '?') + ' ' + esc(p ? p.name : '') + '</b><br><span class="muted">' + esc(k.motivos[id] || '') + '</span></span></div>';
  });
  h += '</div>';
  if (k.sinEvaluar) h += '<p class="muted" style="margin:0">' + k.sinEvaluar + ' jugador(es) sin evaluar cuentan como nivel 3. Evalúalos en Ajustes → Plantel.</p>';
  return h + '<button class="btn full" data-a="closeModal">Cerrar</button>';
}

function ratioCorto(r) { return r === '4M3F' ? '4M · 3F' : '3M · 4F'; }

// Columnas según el tamaño del plantel, para que todos quepan sin desplazar.
function columnas(n) { return n <= 8 ? 2 : n <= 15 ? 3 : n <= 24 ? 4 : 5; }

export function viewLine(s) {
  const c = cfg();
  if (ui.selFor !== s.point) { ui.selFor = s.point; ui.sel = []; ui.ratioSwap = false; ui.sug = null; }
  const r = currentRatio(s), req = r ? reqCounts(r) : null, t = contarGeneros(ui.sel);
  const roster = porNumero(store.roster), ataque = s.offense === 'us', n = ui.sel.length;
  let h = '<div class="scr">';

  // Lo más importante para el coach: ataque o defensa, y la proporción.
  h += '<div class="lin-top' + (r ? '' : ' uno') + '">' +
    '<div class="modo ' + (ataque ? 'at' : 'df') + '"><span class="disp">' + (ataque ? 'ATAQUE' : 'DEFENSA') + '</span><small>' + (ataque ? 'Recibimos el pull' : 'Sacamos el pull') + '</small></div>';
  if (r) h += '<button class="modo ratio" data-a="swapRatio" aria-label="Cambiar proporción"><span class="disp">' + ratioCorto(r) + '</span><small>' + (ui.ratioSwap ? 'Cambiada a mano' : (c.abba ? 'Regla ABBA' : 'Proporción fija')) + ' · tocar para cambiar</small></button>';
  h += '</div>';

  if (s.half && s.halfPoint === s.point) h += '<div class="aviso">Medio tiempo. Empieza la segunda mitad.</div>';
  if (tiempoCumplido()) h += '<div class="aviso"><span>Se cumplió el tiempo del partido.</span><button class="btn sm danger" data-a="askEnd">Finalizar</button></div>';

  h += '<div class="cuenta">Línea del punto ' + s.point + ': <b class="' + (n === EN_CANCHA ? 'ok' : 'warn') + '">' + n + ' / 7</b>' +
    (req ? ' · Masc. <b class="' + (t.M === req.M ? 'ok' : 'warn') + '">' + t.M + ' / ' + req.M + '</b> · Fem. <b class="' + (t.F === req.F ? 'ok' : 'warn') + '">' + t.F + ' / ' + req.F + '</b>' : '') + '</div>';

  if (ui.sug) {
    h += '<button class="aviso info why" data-a="openWhy"><span>' + esc(ui.sug.resumen) + '</span><b>¿Por qué?</b></button>';
  }

  if (!roster.length) {
    h += '<div class="card stack"><span>No hay jugadores en el plantel.</span><button class="btn fill" data-a="tab" data-v="settings">Agregar jugadores</button></div>';
  } else {
    h += '<div class="pgrid" style="--cols:' + columnas(roster.length) + '">';
    roster.forEach(function (p) {
      const on = ui.sel.indexOf(p.id) >= 0, pts = (s.stats[p.id] || {}).pts || 0, rep = s.lastLine.indexOf(p.id) >= 0;
      h += '<button class="pb' + (rep ? ' rep' : '') + '" aria-pressed="' + on + '" data-a="selP" data-id="' + p.id + '">' +
        '<span class="num disp">#' + esc(p.num) + '</span><span class="nom">' + esc(p.name || '') + '</span>' +
        '<span class="meta">' + pts + ' pts' + (rep ? ' · jugó' : '') + '</span>' +
        (c.mixed ? '<span class="g">' + (p.g === 'F' ? 'F' : 'M') + '</span>' : '') + '</button>';
    });
    h += '</div>';
  }

  h += '<div class="mini"><button class="btn" data-a="undo"' + (store.game.events.length ? '' : ' disabled') + '>Deshacer</button>' +
    '<button class="btn" data-a="clearSel"' + (n ? '' : ' disabled') + '>Limpiar</button>' +
    '<button class="btn" data-a="openTO">Timeout</button></div>';
  h += '<div class="grid2"><button class="btn big soft disp sug" data-a="suggest"' + (n >= EN_CANCHA ? ' disabled' : '') + '>Sugerir<small>' + MODOS[modoActual()].nombre + '</small></button>' +
    '<button class="btn big fill disp" data-a="confirmLine"' + (n ? '' : ' disabled') + '>Confirmar línea</button></div>';
  h += '</div>';
  return h;
}

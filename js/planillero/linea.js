// Pantalla para elegir los 7 jugadores del punto, respetando la proporción mixta.
// Solo se muestran los jugadores convocados (pestaña Plantel).
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { ratioFor, reqCounts, ratioText, tiempoCumplido } from '../modelos/partido.js';
import { P, label, porNumero, htmlBoton } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';
import { recomendarLinea, convocados, MODOS, modoActual } from '../criterio/recomendador.js';
import { metricasLinea, nivelPunto, n1 } from '../criterio/metricas.js';
import { zonaDelMarcador, ZONAS } from '../criterio/zonas.js';

export const EN_CANCHA = 7;

// Proporción que toca en este punto (o la contraria si se cambió a mano).
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

// Completa la línea hasta 7 con el recomendador y guarda la explicación ("¿Por qué?").
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
      avisos.push('La proporción es ' + t.M + ' hombres / ' + t.F + ' mujeres, pero corresponde ' + ratioText(r));
    }
  }
  return avisos;
}

// Ventana "¿Por qué esta línea?": el criterio y el motivo de cada jugador.
export function modalPorQue() {
  const k = ui.sug; if (!k) return '';
  let h = '<h2 class="h2 disp">¿Por qué esta línea?</h2><p style="margin:0"><b>' + esc(k.resumen) + '</b></p>';
  if (k.zona) h += '<p class="muted" style="margin:0">' + esc(ZONAS[k.zona].ayuda) + '</p>';
  h += '<div class="stack" style="gap:6px">';
  k.ids.forEach(function (id) {
    h += '<div class="item"><span><b>' + esc(label(id)) + '</b><br><span class="muted">' + esc(k.motivos[id] || '') + '</span></span></div>';
  });
  h += '</div>';
  if (k.sinEvaluar) h += '<p class="muted" style="margin:0">' + k.sinEvaluar + ' convocado(s) sin evaluar cuentan como nivel 3. Evalúalos en la pestaña Plantel.</p>';
  return h + '<button class="btn full" data-a="closeModal">Cerrar</button>';
}

/* ---------- información de la línea marcada ---------- */
function minutos(ms) { return Math.round((ms || 0) / 60000); }

// Tarjeta compacta que reemplaza al botón "Sugerir" cuando hay 7 marcados.
function tarjetaLinea(s, ataque) {
  const jug = ui.sel.map(P).filter(Boolean), m = metricasLinea(jug, s, ataque);
  if (!m) return '';
  const rol = function (k, txt) { const v = m.mejor[k], ok = v >= 4; return '<span class="' + (ok ? 'ok' : 'warn') + '">' + txt + ' ' + v + '</span>'; };
  return '<button class="btn big soft linfo' + (m.sinManejo ? ' alerta' : '') + '" data-a="openLineInfo" aria-label="Información de la línea">' +
    '<span class="li-1"><b class="disp">' + n1(m.nivel) + '</b> nivel ' + (ataque ? 'ataque' : 'defensa') + '</span>' +
    '<span class="li-2">' + rol('man', 'Man') + ' ' + rol('av', 'Av') + ' ' + rol('gol', 'Gol') + '</span>' +
    '<span class="li-3">' + (m.seguidos ? m.seguidos + ' repiten · ' : '') + n1(m.pts) + ' pts · ' + minutos(m.min * 60000) + '\' prom.</span></button>';
}

// Ventana con el detalle de la línea marcada.
export function modalInfoLinea(s) {
  const ataque = s.offense === 'us', jug = ui.sel.map(P).filter(Boolean), m = metricasLinea(jug, s, ataque);
  if (!m) return '';
  let h = '<h2 class="h2 disp">Línea marcada</h2>';
  h += '<p style="margin:0">Nivel promedio en ' + (ataque ? 'ataque' : 'defensa') + ': <b>' + n1(m.nivel) + '</b> · Mejor manejo ' + m.mejor.man + ' · avance ' + m.mejor.av + ' · gol ' + m.mejor.gol + ' · defensa ' + m.mejor.def + '</p>';
  if (m.sinManejo) h += '<div class="aviso">Ojo: nadie en la línea tiene manejo 3 o más.</div>';
  else if (m.faltan.length) h += '<div class="aviso">Sin nota 4+ en: ' + m.faltan.map(function (k) { return { man: 'manejo', av: 'corte de avance', gol: 'corte de gol' }[k]; }).join(', ') + '.</div>';
  h += '<p class="muted" style="margin:0">Desgaste: ' + m.seguidos + ' jugaron el punto anterior · ' + n1(m.pts) + ' puntos y ' + minutos(m.min * 60000) + ' min en promedio' + (m.rachaMax >= 2 ? ' · racha máxima ' + m.rachaMax + ' puntos seguidos' : '') + '.</p>';
  h += '<div class="tbl-wrap"><table><thead><tr><th>Jugador</th><th>Nivel</th><th>Pts</th><th>Min</th><th>Seguidos</th></tr></thead><tbody>';
  jug.forEach(function (p) {
    const st = s.stats[p.id] || {};
    h += '<tr><td>' + esc(label(p.id)) + '</td><td>' + n1(nivelPunto(p, ataque)) + '</td><td>' + (st.pts || 0) + '</td><td>' + minutos(st.ms) + '</td><td>' + ((s.racha || {})[p.id] || 0) + '</td></tr>';
  });
  h += '</tbody></table></div>';
  return h + '<button class="btn full" data-a="closeModal">Cerrar</button>';
}

// Proporción en pantalla, con el género que predomina primero.
// (Internamente '4M3F' = 4 hombres y 3 mujeres.)
function ratioCorto(r) { return r === '4M3F' ? '4H · 3M' : '4M · 3H'; }
function ratioPredomina(r) { return r === '4M3F' ? 'hom' : 'muj'; }

// Columnas según la cantidad de convocados, para que todos quepan sin desplazar.
function columnas(n) { return n <= 8 ? 2 : n <= 15 ? 3 : n <= 24 ? 4 : 5; }

export function viewLine(s) {
  const c = cfg();
  if (ui.selFor !== s.point) { ui.selFor = s.point; ui.sel = []; ui.ratioSwap = false; ui.sug = null; }
  const lista = porNumero(convocados());
  // Si alguien marcado pasó a no convocado, se quita de la línea.
  ui.sel = ui.sel.filter(function (id) { return lista.some(function (p) { return p.id === id; }); });
  const r = currentRatio(s), req = r ? reqCounts(r) : null, t = contarGeneros(ui.sel);
  const ataque = s.offense === 'us', n = ui.sel.length;
  let h = '<div class="scr">';

  // Lo más importante para el coach: ataque o defensa, y la proporción (compacto).
  h += '<div class="lin-top' + (r ? '' : ' uno') + '">' +
    '<div class="modo ' + (ataque ? 'at' : 'df') + '"><span class="disp">' + (ataque ? 'ATAQUE' : 'DEFENSA') + '</span><small>' + (ataque ? 'Recibimos' : 'Sacamos') + '</small></div>';
  if (r) {
    h += '<button class="modo ratio ' + ratioPredomina(r) + '" data-a="swapRatio" aria-label="Proporción ' + ratioText(r) + '. Mantén presionado 1 segundo para cambiar">' +
      '<span class="disp">' + ratioCorto(r) + '</span><small>' + (ui.ratioSwap ? 'a mano' : (c.abba ? 'ABBA' : 'fija')) + ' · mantén 1 s</small></button>';
  }
  h += '</div>';

  if (s.half && s.halfPoint === s.point) h += '<div class="aviso">Medio tiempo. Empieza la segunda mitad.</div>';
  if (tiempoCumplido()) h += '<div class="aviso"><span>Se cumplió el tiempo del partido.</span><button class="btn sm danger" data-a="askEnd" data-v="tiempo">Finalizar</button></div>';

  // Zona del marcador (solo en Competencia) y conteo de la línea.
  let zonaTxt = '';
  if (modoActual() === 'competencia') {
    const z = zonaDelMarcador(s.us, s.them, c);
    zonaTxt = ' · <span class="zona-tag ' + ZONAS[z.id].clase + '">' + ZONAS[z.id].corto + '</span>';
  }
  h += '<div class="cuenta">Punto ' + s.point + ': <b class="' + (n === EN_CANCHA ? 'ok' : 'warn') + '">' + n + '/7</b>' +
    (req ? ' · <span class="gH">H</span> <b class="' + (t.M === req.M ? 'ok' : 'warn') + '">' + t.M + '/' + req.M + '</b> · <span class="gM">M</span> <b class="' + (t.F === req.F ? 'ok' : 'warn') + '">' + t.F + '/' + req.F + '</b>' : '') + zonaTxt + '</div>';

  if (ui.sug) {
    h += '<button class="aviso info why" data-a="openWhy"><span>' + esc(ui.sug.resumen) + '</span><b>¿Por qué?</b></button>';
  }

  if (!lista.length) {
    h += '<div class="card stack"><span>No hay jugadores convocados.</span><button class="btn fill" data-a="tab" data-v="roster">Ir al plantel</button></div>';
  } else {
    h += '<div class="pgrid" style="--cols:' + columnas(lista.length) + '">';
    lista.forEach(function (p) {
      const on = ui.sel.indexOf(p.id) >= 0, st = s.stats[p.id] || {}, rep = s.lastLine.indexOf(p.id) >= 0;
      // Desgaste a la vista: puntos y minutos jugados. Borde punteado = jugó el punto anterior.
      h += '<button class="pb' + (rep ? ' rep' : '') + '" aria-pressed="' + on + '" data-a="selP" data-id="' + p.id + '" aria-label="' + esc(label(p.id)) + '">' +
        htmlBoton(p, (st.pts || 0) + 'p ' + minutos(st.ms) + '\'', c.mixed) + '</button>';
    });
    h += '</div>';
  }

  h += '<div class="mini"><button class="btn" data-a="undo"' + (store.game.events.length ? '' : ' disabled') + '>Deshacer</button>' +
    '<button class="btn" data-a="clearSel"' + (n ? '' : ' disabled') + '>Limpiar</button>' +
    '<button class="btn" data-a="openTO">Timeout</button></div>';
  // Con 7 marcados, el espacio de "Sugerir" muestra la información de la línea.
  h += '<div class="grid2">' + (n >= EN_CANCHA
    ? tarjetaLinea(s, ataque)
    : '<button class="btn big soft disp sug" data-a="suggest">Sugerir<small>' + MODOS[modoActual()].nombre + '</small></button>') +
    '<button class="btn big fill disp" data-a="confirmLine"' + (n ? '' : ' disabled') + '>Confirmar línea</button></div>';
  h += '</div>';
  return h;
}

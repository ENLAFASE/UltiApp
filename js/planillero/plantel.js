// Pestaña "Plantel": visión de la evaluación, jugadores convocados y no
// convocados, edición de cada jugador y carga por texto.
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { label, porNumero, letraGenero, nombreGenero } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';
import { HABILIDADES, ev, evaluado, resumenEv, filasEvaluacion } from '../coach/evaluacion.js';
import { ROLES, analizarPlantel, nivelGeneral, n1 } from '../criterio/metricas.js';
import { PARAM } from '../criterio/parametros.js';
import { encabezado } from './encabezado.js';

/* ---------- texto del plantel: "36 Enzo H man5 av5 gol3 def3" ---------- */
// Lee una línea de texto. Devuelve { num, name, g, ev } o null si no tiene número.
// g: 'M' = hombre, 'F' = mujer (como se guarda internamente). H = hombre, M o F = mujer.
export function leerLineaPlantel(linea) {
  const partes = linea.trim().split(/[\s,;]+/).filter(Boolean);
  if (!partes.length || !/^\d+$/.test(partes[0])) return null;
  const res = { num: partes[0], name: '', g: null, ev: {} }, nombre = [];
  partes.slice(1).forEach(function (t) {
    const hab = t.match(/^(man|av|gol|def)[:=]?([1-5])$/i);
    if (hab) { res.ev[hab[1].toLowerCase()] = +hab[2]; return; }
    if (/^[HhMmFf]$/.test(t)) { res.g = t.toUpperCase() === 'H' ? 'M' : 'F'; return; }
    nombre.push(t);
  });
  res.name = nombre.join(' ');
  return res;
}

// Un jugador como línea de texto (sirve de respaldo y para pasar el plantel a otro teléfono).
export function lineaPlantel(p) {
  let t = p.num + (p.name ? ' ' + p.name : '') + ' ' + letraGenero(p);
  if (evaluado(p)) {
    const e = p.ev;
    HABILIDADES.forEach(function (h) { if (e[h.k]) t += ' ' + h.k + e[h.k]; });
  }
  return t;
}

/* ---------- edición de un jugador ---------- */
function botonesGenero(g, accion, id) {
  const dataId = id ? ' data-id="' + id + '"' : '';
  return '<div class="grid2"><button class="chip" aria-pressed="' + (g !== 'F') + '" data-a="' + accion + '" data-v="M"' + dataId + '>Hombre (H)</button>' +
    '<button class="chip" aria-pressed="' + (g === 'F') + '" data-a="' + accion + '" data-v="F"' + dataId + '>Mujer (M)</button></div>';
}

// Ventana para editar un jugador: datos, convocatoria, evaluación y quitar.
// Los cambios se guardan al instante.
export function modalJugador(id) {
  const p = store.roster.find(function (x) { return x.id === id; });
  if (!p) return '';
  let h = '<h2 class="h2 disp">' + esc(label(id)) + '</h2>';
  h += '<div class="row"><div class="field" style="width:90px"><label class="muted" for="pe_num">Número</label><input id="pe_num" inputmode="numeric" data-pe="num" data-id="' + id + '" value="' + esc(p.num) + '"></div>' +
    '<div class="field grow"><label class="muted" for="pe_name">Nombre</label><input id="pe_name" data-pe="name" data-id="' + id + '" value="' + esc(p.name || '') + '"></div></div>';
  h += botonesGenero(p.g, 'peG', id);
  h += '<button class="btn full ' + (p.noConv ? 'fill' : '') + '" data-a="convP" data-id="' + id + '">' + (p.noConv ? 'Convocar para el partido' : 'Pasar a no convocados') + '</button>';
  h += '<span class="lbl" style="margin-top:6px">Evaluación privada' + (evaluado(p) ? '' : ' · <b class="txt-warn">sin evaluar</b>') + '</span>';
  h += filasEvaluacion(p);
  const orden = porNumero(store.roster), i = orden.findIndex(function (x) { return x.id === id; });
  const sig = orden[i + 1];
  h += '<div class="grid2"><button class="btn" data-a="closeModal">Listo</button>' +
    (sig ? '<button class="btn fill" data-a="editP" data-id="' + sig.id + '">Siguiente: ' + esc(label(sig.id)) + '</button>' : '<span></span>') + '</div>';
  h += '<button class="btn danger full" data-a="askDelP" data-id="' + id + '">Quitar del plantel</button>';
  return h;
}

/* ---------- vista ---------- */
function filaJugador(p, c) {
  const ok = evaluado(p);
  return '<button class="item plantel' + (ok ? '' : ' sin-ev') + (p.noConv ? ' no-conv' : '') + '" data-a="editP" data-id="' + p.id + '" data-swipe="' + p.id + '">' +
    '<span class="grow"><b>' + esc(label(p.id)) + '</b> <span class="g ' + letraGenero(p) + '">' + nombreGenero(p) + '</span>' +
    '<br>' + (ok ? '<span class="muted">' + resumenEv(p) + '</span>' : '<span class="pill warn">Sin evaluar</span>') + '</span>' +
    (ok ? '<span class="nivel disp" title="Nivel general">' + n1(nivelGeneral(p)) + '</span>' : '') +
    '<span class="muted">›</span></button>';
}

// Barra horizontal de 1 a 5.
function barra(valor, clase) {
  const pct = Math.max(0, Math.min(100, (valor - 1) / 4 * 100));
  return '<span class="barra"><span class="relleno ' + (clase || '') + '" style="width:' + pct + '%"></span></span>';
}

function visionPlantel(lista, c) {
  if (!lista.length) return '';
  const a = analizarPlantel(lista, c.mixed);
  const sinEv = lista.filter(function (p) { return !evaluado(p); }).length;
  let h = '<h2 class="h2 disp">Visión del plantel</h2>';
  h += '<p class="muted" style="margin:0">Revisa que estos números coincidan con lo que tú ves en la cancha: el motor de juego se basa en ellos.</p>';
  h += '<div class="card vision"><div class="row"><span class="grow"><span class="lbl">Puntaje del plantel convocado</span><br>' +
    '<span class="disp vision-num">' + n1(a.global) + '</span><span class="muted"> / 5 · ' + Math.round((a.global - 1) / 4 * 100) + ' de 100</span></span>' +
    '<span class="muted" style="text-align:right">' + lista.length + ' convocados<br>' + (sinEv ? '<b class="txt-warn">' + sinEv + ' sin evaluar</b>' : 'todos evaluados') + '</span></div>' + barra(a.global) + '</div>';

  h += '<div class="grid2">';
  ROLES.forEach(function (r) {
    const x = a.porRol[r.k];
    h += '<div class="card rol"><span class="lbl">' + r.nombre + '</span><span class="disp vision-rol">' + n1(x.prom) + '</span>' + barra(x.prom) +
      '<span class="muted">Buenos (' + PARAM.NOTA_BUENA + '+): <b>' + x.buenos + '</b>' +
      (c.mixed ? ' · <span class="gH">H</span> ' + x.buenosH + ' · <span class="gM">M</span> ' + x.buenosM : '') + '</span></div>';
  });
  h += '</div>';
  a.alertas.forEach(function (t) { h += '<div class="aviso">' + esc(t) + '</div>'; });

  // Ranking por posición
  const rol = ui.rankRol || 'man';
  const opciones = ROLES.map(function (r) { return { k: r.k, n: r.nombre }; }).concat([{ k: 'gen', n: 'General' }]);
  h += '<span class="lbl">Ranking por posición</span><div class="chips">';
  opciones.forEach(function (o) { h += '<button class="chip sq" aria-pressed="' + (rol === o.k) + '" data-a="rankRol" data-v="' + o.k + '">' + o.n + '</button>'; });
  h += '</div><div class="ranking">';
  const valor = function (p) { return rol === 'gen' ? nivelGeneral(p) : ev(p)[rol]; };
  lista.slice().sort(function (x, y) { return valor(y) - valor(x); }).forEach(function (p, i) {
    const v = valor(p);
    h += '<div class="rk' + (evaluado(p) ? '' : ' sin') + '"><span class="rk-n">' + (i + 1) + '</span><span class="rk-nom">' + esc(label(p.id)) +
      (c.mixed ? ' <span class="g ' + letraGenero(p) + '">' + letraGenero(p) + '</span>' : '') + '</span>' +
      barra(v, v >= PARAM.NOTA_BUENA ? 'bueno' : '') + '<span class="rk-v">' + (rol === 'gen' ? n1(v) : v) + '</span></div>';
  });
  h += '</div>';
  if (sinEv) h += '<p class="muted" style="margin:0">Los sin evaluar aparecen con nota ' + PARAM.NIVEL_SIN_EVALUAR + ' (en gris).</p>';
  return h;
}

export function viewPlantel() {
  const c = cfg();
  const conv = porNumero(store.roster.filter(function (p) { return !p.noConv; }));
  const fuera = porNumero(store.roster.filter(function (p) { return p.noConv; }));
  let h = encabezado('Plantel', store.roster.length ? conv.length + ' convocados de ' + store.roster.length : 'Sin jugadores todavía') + '<div class="pad stack">';
  const vacio = !store.roster.length;
  if (vacio) {
    // Primer uso: lo único que sirve es agregar jugadores, así que va primero.
    h += '<div class="card stack vacio"><span class="prep-h disp">Arma tu plantel</span>' +
      '<span class="muted">Agrega jugadores uno por uno o pega la lista completa más abajo (una línea por jugador: número, nombre y H o M). La evaluación es opcional: la completas después tocando a cada jugador.</span></div>';
  } else {

  h += visionPlantel(conv, c);

  h += '<h2 class="h2 disp">Convocados (' + conv.length + ')</h2>';
  if (store.roster.length) {
    h += '<p class="muted" style="margin:0">Toca un jugador para editarlo o evaluarlo. <b>Desliza hacia la derecha</b> para pasarlo a no convocados (y al revés).</p>';
  }
  h += '<div class="stack" style="gap:6px">';
  conv.forEach(function (p) { h += filaJugador(p, c); });
  h += '</div>';

  h += '<h2 class="h2 disp">No convocados (' + fuera.length + ')</h2>';
  if (!fuera.length) h += '<p class="muted" style="margin:0">Todos convocados.</p>';
  else {
    if (c.division !== 'mixto') h += '<p class="muted" style="margin:0">En partido ' + (c.division === 'femenino' ? 'femenino' : 'open') + ' se marcan solos según el género. Puedes convocarlos de nuevo.</p>';
    h += '<div class="stack" style="gap:6px">';
    fuera.forEach(function (p) { h += filaJugador(p, c); });
    h += '</div>';
  }
  }

  const np = ui.newP;
  h += '<h2 class="h2 disp">Agregar jugadores</h2>';
  h += '<div class="card stack"><span class="lbl">Agregar uno</span><div class="row">' +
    '<div class="field" style="width:80px"><label class="muted" for="np_num">Número</label><input id="np_num" inputmode="numeric" data-in="npNum" value="' + esc(np.num) + '"></div>' +
    '<div class="field grow"><label class="muted" for="np_name">Nombre</label><input id="np_name" data-in="npName" value="' + esc(np.name) + '"></div></div>' +
    botonesGenero(np.g, 'npG', '') +
    '<button class="btn fill" data-a="addP">Agregar</button></div>';
  h += '<div class="card stack"><label class="lbl" for="bulk">Agregar o actualizar varios: una línea por jugador</label>' +
    '<span class="muted">Número, nombre, H (hombre) o M (mujer) y, si quieres, la evaluación: <code>man</code> manejo, <code>av</code> corte de avance, <code>gol</code> corte de gol, <code>def</code> defensa (1 a 5). Si el número y el nombre ya existen, se actualiza ese jugador.</span>' +
    '<textarea id="bulk" rows="' + (vacio ? 8 : 4) + '" data-in="bulk" placeholder="36 Enzo H man5 av5 gol3 def3&#10;12 Ana M man4 av3 gol4 def5">' + esc(ui.bulk) + '</textarea><button class="btn" data-a="addBulk">Agregar lista</button></div>';
  if (!vacio) {
    // Copiar como texto: elegir qué parte del plantel (sirve de respaldo o para compartir la convocatoria).
    const que = ui.copiaQue || 'todos';
    const opciones = { todos: 'Plantel completo (' + store.roster.length + ')', conv: 'Convocados (' + conv.length + ')', noconv: 'No convocados (' + fuera.length + ')' };
    h += '<div class="card stack"><label class="lbl" for="copiaQue">Copiar como texto</label>' +
      '<div class="field"><select id="copiaQue" data-ui="copiaQue">' +
      Object.keys(opciones).map(function (k) { return '<option value="' + k + '"' + (k === que ? ' selected' : '') + '>' + opciones[k] + '</option>'; }).join('') +
      '</select></div>' +
      '<button class="btn full" data-a="copyRoster"' + ((que === 'conv' && !conv.length) || (que === 'noconv' && !fuera.length) ? ' disabled' : '') + '>Copiar</button>' +
      '<span class="muted">Mismo formato que "Agregar varios": sirve de respaldo o para pasar el plantel a otro teléfono.</span></div>';
  }
  h += '</div>';
  return h;
}

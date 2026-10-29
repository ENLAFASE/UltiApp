// Pestaña "Ajustes": preparar el partido (lista de pasos), reglas, criterio de sugerencia
// y empezar/terminar el partido. Las secciones avanzadas se abren y cierran (ui.abiertos).
// (El plantel tiene su propia pestaña: plantel.js.)
import { store, cfg, EQUIPOS, ramasDe } from '../almacen.js';
import { porNumero, letraGenero } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';
import { MODOS, modoActual } from '../criterio/recomendador.js';
import { ZONAS, MODALIDADES, zonaDelMarcador, margenes } from '../criterio/zonas.js';
import { derive } from '../modelos/partido.js';
import { ui } from '../ui.js';
import { evaluado } from '../coach/evaluacion.js';
import { encabezado } from './encabezado.js';

function numField(key, lbl, hint) {
  const v = cfg()[key];
  return '<div class="field"><label class="lbl" for="f_' + key + '">' + lbl + '</label><input id="f_' + key + '" type="number" min="0" inputmode="numeric" data-cfg="' + key + '" value="' + esc(v) + '">' + (hint ? '<span class="muted">' + hint + '</span>' : '') + '</div>';
}
function selectField(key, lbl, opciones, hint) {
  const v = cfg()[key];
  return '<div class="field"><label class="lbl" for="f_' + key + '">' + lbl + '</label><select id="f_' + key + '" data-cfg="' + key + '">' +
    Object.keys(opciones).map(function (k) { return '<option value="' + k + '"' + (String(v) === k ? ' selected' : '') + '>' + opciones[k] + '</option>'; }).join('') +
    '</select>' + (hint ? '<span class="muted">' + hint + '</span>' : '') + '</div>';
}

// Mapa de zonas: para cada marcador posible (nosotros en filas, rival en
// columnas), qué modalidad aplica el motor con los ajustes actuales.
function mapaZonas(c) {
  const meta = Math.min(c.pointsToWin || 15, 21);
  let actual = null;
  if (store.game) { const s = derive(); if (!s.ended) actual = s.us + '-' + s.them; }
  let h = '<div class="mapa" style="--n:' + (meta + 1) + '"><span class="mapa-esq">N\\R</span>';
  for (let r = 0; r < meta; r++) h += '<span class="mapa-eje">' + r + '</span>';
  for (let u = 0; u < meta; u++) {
    h += '<span class="mapa-eje">' + u + '</span>';
    for (let r = 0; r < meta; r++) {
      const z = zonaDelMarcador(u, r, c);
      h += '<span class="mapa-c ' + ZONAS[z.id].clase + (actual === u + '-' + r ? ' actual' : '') + '" title="' + u + '-' + r + ': ' + ZONAS[z.id].nombre + '"></span>';
    }
  }
  h += '</div><div class="leyenda">';
  Object.keys(ZONAS).forEach(function (k) { h += '<span><i class="mapa-c ' + ZONAS[k].clase + '"></i>' + ZONAS[k].corto + '</span>'; });
  h += '</div>';
  return h;
}

// Sección que se abre y cierra. "resumen" muestra en una línea lo que hay adentro.
function seccion(id, titulo, resumen, contenido) {
  const abierta = !!ui.abiertos[id];
  return '<section class="secc' + (abierta ? ' open' : '') + '">' +
    '<button class="secc-h" data-a="secc" data-v="' + id + '" aria-expanded="' + abierta + '">' +
    '<span class="secc-t"><b class="disp">' + titulo + '</b><small>' + resumen + '</small></span><span class="chev" aria-hidden="true"></span></button>' +
    (abierta ? '<div class="secc-c stack">' + contenido + '</div>' : '') + '</section>';
}

// Selector del equipo del club (Mix, Open, Husarex u otro). Se usa en Partido,
// Plantel y Ajustes, para elegir el equipo ANTES de armar el plantel.
export function selectorEquipo() {
  const c = cfg();
  let h = '<div class="equipos" role="group" aria-label="Equipo">';
  Object.keys(EQUIPOS).forEach(function (k) {
    const e = EQUIPOS[k];
    h += '<button class="eq" data-a="equipo" data-v="' + k + '" aria-pressed="' + (c.equipo === k) + '"' + (store.game && c.equipo !== k ? ' disabled' : '') + '>' +
      '<b class="disp">' + esc(e.corto) + '</b><small>' + esc(e.detalle) + '</small></button>';
  });
  h += '</div><button class="eq-otro" data-a="equipo" data-v="otro" aria-pressed="' + (c.equipo === 'otro') + '"' + (store.game && c.equipo !== 'otro' ? ' disabled' : '') + '>' +
    (c.equipo === 'otro' ? 'Otro equipo (nombre libre)' : 'Otro equipo…') + '</button>';
  if (c.equipo === 'otro') {
    h += '<div class="grid2"><div class="field"><label class="lbl" for="f_club">Nombre del equipo</label><input id="f_club" data-cfg="club" value="' + esc(c.club) + '"></div>' +
      selectField('division', 'Categoría', DIV) + '</div>';
  }
  return h;
}

// Elegir quiénes juegan: los jugadores de la rama del equipo y, si hace falta, de otras ramas.
function convocatoria(c) {
  if (!store.roster.length) return '<button class="btn sm fill" data-a="tab" data-v="roster">Armar plantel</button>';
  const eq = EQUIPOS[c.equipo];
  const todos = porNumero(store.roster);
  const deRama = eq ? todos.filter(function (p) { return ramasDe(p).indexOf(c.equipo) >= 0; }) : todos;
  const otros = eq ? todos.filter(function (p) { return ramasDe(p).indexOf(c.equipo) < 0; }) : [];
  function boton(p) {
    const g = letraGenero(p);
    return '<button class="conv-b" data-a="convSel" data-id="' + p.id + '" aria-pressed="' + !p.noConv + '">' +
      '<b>' + esc(p.name || '#' + p.num) + '</b><small>#' + esc(p.num) + ' · <span class="g ' + g + '">' + g + '</span></small></button>';
  }
  let h = '';
  if (eq) h += '<span class="lbl">' + esc(eq.nombre) + ' (' + deRama.length + ')</span>';
  h += deRama.length ? '<div class="conv-grid">' + deRama.map(boton).join('') + '</div>' : '<span class="muted">Nadie del plantel juega en ' + esc(eq.nombre) + ' todavía.</span>';
  const otrosConv = otros.filter(function (p) { return !p.noConv; }).length;
  if (otros.length) {
    h += '<button class="eq-otro" data-a="verOtros">' + (ui.verOtros ? 'Ocultar otras ramas' : 'Sumar de otras ramas (' + otros.length + ')') + (otrosConv ? ' · ' + otrosConv + ' sumados' : '') + '</button>';
    if (ui.verOtros) h += '<div class="conv-grid">' + otros.map(boton).join('') + '</div>';
  }
  h += '<div class="row" style="gap:6px"><button class="btn sm" data-a="convReset">Volver a la rama</button><button class="btn sm" data-a="tab" data-v="roster">Editar plantel</button></div>';
  return h;
}

function campoRival(c) {
  return '<div class="field"><label class="lbl" for="f_rival">Rival</label><input id="f_rival" data-cfg="rival" value="' + esc(c.rival === 'Rival' ? '' : c.rival) + '" placeholder="Nombre del rival"></div>';
}

// Lista de pasos para dejar listo el partido.
function preparar(c) {
  const conv = store.roster.filter(function (p) { return !p.noConv; });
  const sinEv = conv.filter(function (p) { return !evaluado(p); }).length;
  const rivalOk = c.rival && c.rival !== 'Rival';
  function paso(ok, n, titulo, detalle, extra) {
    return '<li class="prep-i' + (ok ? ' ok' : '') + '"><span class="prep-n">' + (ok ? '✓' : n) + '</span>' +
      '<span class="prep-t"><b>' + titulo + '</b><span class="muted">' + detalle + '</span></span>' + (extra || '') + '</li>';
  }
  let h = '<div class="card prep"><span class="prep-h disp">Preparar partido</span><ol class="prep-l">';
  const eq = EQUIPOS[c.equipo];
  h += '<li class="prep-i ok"><span class="prep-n">1</span><span class="prep-t"><b>Equipo: ' + esc(c.club) + '</b>' +
    '<span class="muted">' + (eq ? esc(eq.detalle) + (eq.detalle !== DIV[c.division] ? ' · ' + DIV[c.division].toLowerCase() : '') : DIV[c.division]) + (eq ? ' · se convoca a quienes juegan en ' + esc(eq.corto) : (c.division !== 'mixto' ? ' · el otro género queda fuera de la convocatoria' : ' · con proporción de géneros')) + '</span>' +
    '<span class="prep-sel">' + selectorEquipo() + '</span></span></li>';
  h += '<li class="prep-i' + (conv.length >= 7 ? ' ok' : '') + '"><span class="prep-n">' + (conv.length >= 7 ? '✓' : 2) + '</span><span class="prep-t">' +
    '<b>¿Quiénes juegan? ' + conv.length + ' convocados</b><span class="muted">' +
    (conv.length < 7 ? 'Se necesitan al menos 7. ' : (sinEv ? sinEv + ' sin evaluar (cuentan como 3). ' : '')) + 'Toca para sumar o sacar.</span>' +
    '<span class="prep-sel">' + convocatoria(c) + '</span></span></li>';
  h += '<li class="prep-i' + (rivalOk ? ' ok' : '') + '"><span class="prep-n">' + (rivalOk ? '✓' : 3) + '</span><span class="prep-t"><b>' + esc(c.club) + ' vs ' + (rivalOk ? esc(c.rival) : '…') + '</b>' +
    '<span class="prep-sel">' + campoRival(c) + '</span></span></li>';
  h += '<li class="prep-i ok"><span class="prep-n">4</span><span class="prep-t"><b>¿Quién saca el primer pull?</b>' +
    '<span class="grid2 team-toggle sm" style="margin-top:6px">' +
    '<button class="btn us" aria-pressed="' + (c.firstPull === 'us') + '" data-a="firstPull" data-v="us">' + esc(c.club) + '</button>' +
    '<button class="btn th" aria-pressed="' + (c.firstPull === 'them') + '" data-a="firstPull" data-v="them">' + esc(c.rival) + '</button></span>' +
    '<span class="muted">Después saca el equipo que anotó.</span></span></li>';
  return h + '</ol></div>';
}

const DIV = { mixto: 'Mixto', open: 'Open', femenino: 'Femenino' };

// Campos de reglas básicas: puntos, duración y proporción (mixto).
function camposReglas(c) {
  let h = '<div class="grid2">' + numField('pointsToWin', 'Puntos para ganar') +
    numField('hardCap', 'Duración total (min)', '0 = sin límite') + '</div>';
  if (c.division === 'mixto') {
    h += selectField('startRatio', 'Proporción del primer punto', { '4M3F': '4 hombres / 3 mujeres', '3M4F': '3 hombres / 4 mujeres' });
    h += '<label class="switch">Alternar con regla ABBA<input type="checkbox" data-cfg="abba"' + (c.abba ? ' checked' : '') + '></label>';
  }
  return h;
}
function resumenTiempos(c) {
  const medio = c.halfMode === 'time' ? 'medio a los ' + c.halfMin + ' min' : 'medio a ' + c.halfAt + (c.halfMode === 'first' && c.halfMin ? ' o ' + c.halfMin + ' min' : '');
  return medio + ' · ' + (c.softCap ? 'cap ' + c.softCap + ' min' : 'sin cap') + ' · ' + c.timeouts + ' TO de ' + c.toSecs + ' s';
}
function camposTiempos(c) {
  let t = selectField('halfMode', 'Medio tiempo', { first: 'Lo que ocurra primero', points: 'Por puntos', time: 'Por tiempo' },
    c.halfMode === 'first' ? 'Al llegar a los puntos o, cumplido el tiempo, al terminar el punto en juego.' : '');
  t += '<div class="grid2">' +
    (c.halfMode !== 'time' ? numField('halfAt', 'Puntos medio tiempo') : '') +
    (c.halfMode !== 'points' ? numField('halfMin', 'Minutos medio tiempo', 'Al terminar el punto en juego') : '') + '</div>';
  t += '<div class="grid2">' + numField('softCap', 'Cap blando (min)', '0 = sin cap') +
    numField('timeouts', 'Timeouts por equipo') + numField('toSecs', 'Duración timeout (s)') + '</div>';
  return t;
}
function nombresModos() { const n = {}; Object.keys(MODOS).forEach(function (k) { n[k] = MODOS[k].nombre; }); return n; }

// Pestaña Partido sin partido creado: crear el partido paso a paso.
// (Ajustes no aparece en el menú hasta que el partido existe.)
export function viewNuevoPartido() {
  const c = cfg();
  let h = encabezado('Gestión del equipo', c.club) + '<div class="pad stack">';
  h += '<h2 class="h2 disp titulo-sec">Nuevo partido</h2>';
  h += preparar(c);
  // Reglas: vienen con valores típicos; se abren solo si hay que cambiarlas.
  const modo = modoActual();
  const resReglas = 'A ' + c.pointsToWin + (c.hardCap ? ' o ' + c.hardCap + ' min' : '') + ' · ' + resumenTiempos(c) + ' · ' + MODOS[modo].nombre.toLowerCase();
  h += seccion('reglas', 'Reglas del partido', resReglas,
    camposReglas(c) + camposTiempos(c) +
    selectField('lineMode', 'Sugerencia de líneas', nombresModos(), MODOS[modo].ayuda + ' Los detalles se ajustan en Ajustes, ya con el partido creado.'));
  h += '<p class="muted" style="margin:8px 0 0"><a href="privacidad.html">Privacidad y datos</a></p>';
  const hay = store.roster.filter(function (p) { return !p.noConv; }).length;
  h += '<div class="cta-fija"><button class="btn big fill disp full" data-a="startGame"' + (hay ? '' : ' disabled') + '>Crear partido</button>' +
    (hay ? '' : '<span class="muted">Primero arma el plantel (paso 2).</span>') + '</div>';
  return h + '</div>';
}

// Pestaña Ajustes: solo existe con un partido creado.
export function viewSettings() {
  const c = cfg();
  if (!store.game) return viewNuevoPartido();
  const s = derive();
  let h = encabezado('Ajustes', c.club + ' ' + s.us + '–' + s.them + ' ' + c.rival) + '<div class="pad stack">';
  h += '<button class="btn big fill disp full" data-a="closeAjustes">← Volver al partido</button>';
  // Terminar el partido, a mano desde aquí.
  if (!s.ended) h += '<button class="btn full fin-b" data-a="askEnd">Finalizar partido (' + s.us + '–' + s.them + ')</button>';
  else h += '<button class="btn full" data-a="tab" data-v="summary">Ver en Dashboard</button>';

  h += '<h2 class="h2 disp">Partido</h2>';
  h += '<span class="muted">Jugando con <b>' + esc(c.club) + '</b> (' + DIV[c.division].toLowerCase() + '). El equipo no se cambia con un partido en curso.</span>';
  h += campoRival(c);
  h += camposReglas(c);
  h += seccion('tiempos', 'Tiempos y timeouts', resumenTiempos(c), camposTiempos(c));

  // criterio (motor de juego)
  const modo = modoActual();
  const rivalTxt = { menor: 'rival menor', similar: 'rival similar', mayor: 'rival mayor' };
  const resMotor = MODOS[modo].nombre + (modo === 'competencia' ? ' · ' + (c.compModo === 'auto' ? 'automática' : MODALIDADES[c.compModo]) + ' · ' + rivalTxt[c.rivalNivel] + (c.crucial ? ' · crucial' : '') : '');
  let m = selectField('lineMode', 'Criterio', nombresModos(), MODOS[modo].ayuda);
  if (modo === 'competencia') {
    const mg = margenes(c);
    m += selectField('compModo', 'Modalidad', MODALIDADES,
      c.compModo === 'auto' ? 'El motor elige según el marcador (ver mapa).' : (ZONAS[c.compModo] || ZONAS.ataque).ayuda + ' Los márgenes se siguen aplicando.');
    m += selectField('rivalNivel', 'Nivel del rival', { menor: 'Menor que el nuestro', similar: 'Similar', mayor: 'Mayor que el nuestro' });
    m += '<label class="switch">Partido crucial (hay que ganar sí o sí)<input type="checkbox" data-cfg="crucial"' + (c.crucial ? ' checked' : '') + '></label>';
    m += '<div class="grid2">' +
      numField('margenVentaja', 'Margen de ventaja (+)', 'Ganando por esto o más: rotación con piezas clave.') +
      numField('margenDesventaja', 'Margen de desventaja (−)', 'Perdiendo por esto o más: descansan las piezas clave.') + '</div>';
    m += '<p class="muted" style="margin:0">Con el nivel del rival' + (c.crucial ? ' y el partido crucial' : '') + ', se rota desde <b>+' + mg.ventaja + '</b>' +
      (mg.desventaja === Infinity ? ' y <b>no</b> se da descanso a las piezas clave aunque vayamos perdiendo.' : ' y descansan las piezas clave desde <b>−' + mg.desventaja + '</b>.') + '</p>';
    m += seccion('mapa', 'Mapa del marcador', 'Qué hace el motor con cada resultado',
      '<span class="muted">Nosotros en filas, rival en columnas.</span>' + mapaZonas(c) +
      '<p class="muted" style="margin:0">La zona es la misma en puntos de ataque y de defensa; lo que cambia es la línea dentro de cada zona. ' +
      'En "Asegurar el ataque", en defensa descansa el núcleo ofensivo. El recuadro marca el marcador actual.</p>');
  }
  h += seccion('motor', 'Motor de sugerencia', resMotor, m);

  h += '<h2 class="h2 disp">Cerrar o descartar</h2>';
  h += '<button class="btn full" data-a="askReset">Cerrar partido y crear otro</button>';
  h += '<button class="btn danger full" data-a="askDiscard">Descartar partido (no se guarda)</button>';
  h += '<p class="muted" style="margin:0">Al cerrar, el partido queda en el Dashboard. Los datos se guardan solo en este dispositivo.</p>';
  h += '<p class="muted" style="margin:8px 0 0"><a href="privacidad.html">Privacidad y datos</a></p>';
  return h + '</div>';
}

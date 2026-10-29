// Pestaña "Ajustes": preparar el partido (lista de pasos), reglas, criterio de sugerencia
// y empezar/terminar el partido. Las secciones avanzadas se abren y cierran (ui.abiertos).
// (El plantel tiene su propia pestaña: plantel.js.)
import { store, cfg } from '../almacen.js';
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
  h += paso(rivalOk, 1, esc(c.club) + ' vs ' + (rivalOk ? esc(c.rival) : '…'),
    rivalOk ? DIV[c.division] + ' · a ' + c.pointsToWin + ' puntos' : 'Escribe el nombre del rival abajo');
  h += paso(conv.length >= 7, 2, conv.length + ' convocados',
    conv.length < 7 ? 'Se necesitan al menos 7' : (sinEv ? sinEv + ' sin evaluar (cuentan como 3)' : 'Todos evaluados'),
    '<button class="btn sm" data-a="tab" data-v="roster">Plantel</button>');
  h += '<li class="prep-i ok"><span class="prep-n">3</span><span class="prep-t"><b>¿Quién saca el primer pull?</b>' +
    '<span class="grid2 team-toggle sm" style="margin-top:6px">' +
    '<button class="btn us" aria-pressed="' + (c.firstPull === 'us') + '" data-a="firstPull" data-v="us">' + esc(c.club) + '</button>' +
    '<button class="btn th" aria-pressed="' + (c.firstPull === 'them') + '" data-a="firstPull" data-v="them">' + esc(c.rival) + '</button></span>' +
    '<span class="muted">Después saca el equipo que anotó.</span></span></li>';
  return h + '</ol></div>';
}

const DIV = { mixto: 'Mixto', open: 'Open', femenino: 'Femenino' };

export function viewSettings() {
  const c = cfg();
  let h = encabezado('Ajustes', store.game ? 'Partido en curso' : 'Antes del partido') + '<div class="pad stack">';

  if (!store.game) h += preparar(c);

  // partido (siempre visible)
  h += '<h2 class="h2 disp">Partido</h2>';
  h += '<div class="grid2"><div class="field"><label class="lbl" for="f_club">Mi equipo</label><input id="f_club" data-cfg="club" value="' + esc(c.club) + '"></div>' +
    '<div class="field"><label class="lbl" for="f_rival">Rival</label><input id="f_rival" data-cfg="rival" value="' + esc(c.rival === 'Rival' ? '' : c.rival) + '" placeholder="Nombre del rival"></div></div>';
  h += selectField('division', 'Tipo de partido', DIV,
    c.division === 'mixto' ? 'Se aplica la proporción de géneros.' : 'Los jugadores del otro género pasan solos a no convocados (Plantel).');
  h += '<div class="grid2">' + numField('pointsToWin', 'Puntos para ganar') +
    numField('hardCap', 'Duración total (min)', '0 = sin límite') + '</div>';
  if (c.division === 'mixto') {
    h += selectField('startRatio', 'Proporción del primer punto', { '4M3F': '4 hombres / 3 mujeres', '3M4F': '3 hombres / 4 mujeres' });
    h += '<label class="switch">Alternar con regla ABBA<input type="checkbox" data-cfg="abba"' + (c.abba ? ' checked' : '') + '></label>';
  }

  // tiempos y timeouts
  const medio = c.halfMode === 'time' ? 'medio a los ' + c.halfMin + ' min' : 'medio a ' + c.halfAt + (c.halfMode === 'first' && c.halfMin ? ' o ' + c.halfMin + ' min' : '');
  const resTiempos = medio + ' · ' + (c.softCap ? 'cap ' + c.softCap + ' min' : 'sin cap') + ' · ' + c.timeouts + ' TO de ' + c.toSecs + ' s';
  let t = selectField('halfMode', 'Medio tiempo', { first: 'Lo que ocurra primero', points: 'Por puntos', time: 'Por tiempo' },
    c.halfMode === 'first' ? 'Al llegar a los puntos o, cumplido el tiempo, al terminar el punto en juego.' : '');
  t += '<div class="grid2">' +
    (c.halfMode !== 'time' ? numField('halfAt', 'Puntos medio tiempo') : '') +
    (c.halfMode !== 'points' ? numField('halfMin', 'Minutos medio tiempo', 'Al terminar el punto en juego') : '') + '</div>';
  t += '<div class="grid2">' + numField('softCap', 'Cap blando (min)', '0 = sin cap') +
    numField('timeouts', 'Timeouts por equipo') + numField('toSecs', 'Duración timeout (s)') + '</div>';
  h += seccion('tiempos', 'Tiempos y timeouts', resTiempos, t);

  // criterio (motor de juego)
  const modo = modoActual();
  const nombresModos = {}; Object.keys(MODOS).forEach(function (k) { nombresModos[k] = MODOS[k].nombre; });
  const rivalTxt = { menor: 'rival menor', similar: 'rival similar', mayor: 'rival mayor' };
  const resMotor = MODOS[modo].nombre + (modo === 'competencia' ? ' · ' + (c.compModo === 'auto' ? 'automática' : MODALIDADES[c.compModo]) + ' · ' + rivalTxt[c.rivalNivel] + (c.crucial ? ' · crucial' : '') : '');
  let m = selectField('lineMode', 'Criterio', nombresModos, MODOS[modo].ayuda);
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

  // control del partido
  if (store.game) {
    h += '<h2 class="h2 disp">Partido en curso</h2>';
    h += '<button class="btn full" data-a="endGame">Finalizar partido ahora</button>';
    h += '<button class="btn danger full" data-a="askReset">Borrar partido y empezar otro</button>';
    h += '<p class="muted" style="margin:0">Exporta el resumen antes de borrar. Los datos se guardan solo en este dispositivo.</p>';
  }
  h += '<p class="muted" style="margin:8px 0 0"><a href="privacidad.html">Privacidad y datos</a></p>';

  // botón de empezar: queda fijo abajo mientras se revisan los ajustes
  if (!store.game) {
    const hay = store.roster.some(function (p) { return !p.noConv; });
    h += '<div class="cta-fija"><button class="btn big fill disp full" data-a="startGame"' + (hay ? '' : ' disabled') + '>Empezar partido</button>' +
      (hay ? '' : '<span class="muted">Agrega o convoca jugadores en Plantel para empezar.</span>') + '</div>';
  }
  h += '</div>';
  return h;
}

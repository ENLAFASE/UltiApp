// Pestaña "Ajustes": reglas del partido, criterio de sugerencia y empezar/terminar el partido.
// (El plantel tiene su propia pestaña: plantel.js.)
import { store, cfg } from '../almacen.js';
import { esc } from '../util/formato.js';
import { MODOS, modoActual } from '../criterio/recomendador.js';
import { ZONAS, MODALIDADES, zonaDelMarcador, margenes } from '../criterio/zonas.js';
import { derive } from '../modelos/partido.js';

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

export function viewSettings() {
  const c = cfg();
  let h = '<header class="sb"><span class="title-h disp">Ajustes</span></header><div class="pad stack">';

  // partido
  h += '<h2 class="h2 disp">Partido</h2>';
  h += '<div class="grid2"><div class="field"><label class="lbl" for="f_club">Mi equipo</label><input id="f_club" data-cfg="club" value="' + esc(c.club) + '"></div>' +
    '<div class="field"><label class="lbl" for="f_rival">Rival</label><input id="f_rival" data-cfg="rival" value="' + esc(c.rival) + '"></div></div>';
  h += selectField('division', 'Tipo de partido', { mixto: 'Mixto', open: 'Open', femenino: 'Femenino' },
    c.division === 'mixto' ? 'Se aplica la proporción de géneros.' : 'Los jugadores del otro género pasan solos a no convocados (Plantel).');
  h += '<div class="grid2">' + numField('pointsToWin', 'Puntos para ganar') +
    numField('hardCap', 'Duración total (min)', '0 = sin límite de tiempo') + '</div>';

  h += selectField('halfMode', 'Medio tiempo', { first: 'Lo que ocurra primero', points: 'Por puntos', time: 'Por tiempo' },
    c.halfMode === 'first' ? 'Al llegar a los puntos o, cumplido el tiempo, al terminar el punto en juego.' : '');
  h += '<div class="grid2">' +
    (c.halfMode !== 'time' ? numField('halfAt', 'Puntos para el medio tiempo') : '') +
    (c.halfMode !== 'points' ? numField('halfMin', 'Minutos para el medio tiempo', 'Se hace al terminar el punto en juego') : '') + '</div>';

  h += '<div class="grid2">' + numField('softCap', 'Cap blando (min)', '0 = sin cap') +
    numField('timeouts', 'Timeouts por equipo') + numField('toSecs', 'Duración del timeout (seg)') + '</div>';

  if (c.division === 'mixto') {
    h += selectField('startRatio', 'Proporción del primer punto', { '4M3F': '4 hombres / 3 mujeres', '3M4F': '3 hombres / 4 mujeres' });
    h += '<label class="switch">Alternar con regla ABBA<input type="checkbox" data-cfg="abba"' + (c.abba ? ' checked' : '') + '></label>';
  }

  // criterio (motor de juego)
  const modo = modoActual();
  h += '<h2 class="h2 disp">Criterio de sugerencia</h2>';
  const nombresModos = {}; Object.keys(MODOS).forEach(function (k) { nombresModos[k] = MODOS[k].nombre; });
  h += selectField('lineMode', 'Criterio', nombresModos, MODOS[modo].ayuda);
  if (modo === 'competencia') {
    const m = margenes(c);
    h += selectField('compModo', 'Modalidad', MODALIDADES,
      c.compModo === 'auto' ? 'El motor elige según el marcador (ver mapa).' : (ZONAS[c.compModo] || ZONAS.ataque).ayuda + ' Los márgenes se siguen aplicando.');
    h += selectField('rivalNivel', 'Nivel del rival', { menor: 'Menor que el nuestro', similar: 'Similar', mayor: 'Mayor que el nuestro' });
    h += '<label class="switch">Partido crucial (hay que ganar sí o sí)<input type="checkbox" data-cfg="crucial"' + (c.crucial ? ' checked' : '') + '></label>';
    h += '<div class="grid2">' +
      numField('margenVentaja', 'Margen de ventaja (+)', 'Ganando por esto o más: rotación con piezas clave.') +
      numField('margenDesventaja', 'Margen de desventaja (−)', 'Perdiendo por esto o más: descansan las piezas clave.') + '</div>';
    h += '<p class="muted" style="margin:0">Con el nivel del rival' + (c.crucial ? ' y el partido crucial' : '') + ', se rota desde <b>+' + m.ventaja + '</b>' +
      (m.desventaja === Infinity ? ' y <b>no</b> se da descanso a las piezas clave aunque vayamos perdiendo.' : ' y descansan las piezas clave desde <b>−' + m.desventaja + '</b>.') + '</p>';
    h += '<span class="lbl">Mapa del marcador: nosotros (filas) contra rival (columnas)</span>';
    h += mapaZonas(c);
    h += '<p class="muted" style="margin:0">La zona es la misma en puntos de ataque y de defensa; lo que cambia es la línea dentro de cada zona. ' +
      'En "Asegurar el ataque", en defensa descansa el núcleo ofensivo. El recuadro marca el marcador actual.</p>';
  }

  // control del partido
  h += '<h2 class="h2 disp">Control del partido</h2>';
  if (!store.game) {
    h += '<span class="lbl">¿Quién saca el primer pull?</span><div class="grid2 team-toggle">' +
      '<button class="btn us" aria-pressed="' + (c.firstPull === 'us') + '" data-a="firstPull" data-v="us">' + esc(c.club) + '</button>' +
      '<button class="btn th" aria-pressed="' + (c.firstPull === 'them') + '" data-a="firstPull" data-v="them">' + esc(c.rival) + '</button></div>';
    h += '<p class="muted" style="margin:0">Después, saca el pull el equipo que anotó el punto anterior.</p>';
    const hay = store.roster.some(function (p) { return !p.noConv; });
    h += '<button class="btn big fill disp full" data-a="startGame"' + (hay ? '' : ' disabled') + '>Empezar partido</button>';
    if (!hay) h += '<p class="muted" style="margin:0">Agrega o convoca jugadores en la pestaña Plantel para empezar.</p>';
  } else {
    h += '<button class="btn full" data-a="endGame">Finalizar partido ahora</button>';
    h += '<button class="btn danger full" data-a="askReset">Borrar partido y empezar otro</button>';
    h += '<p class="muted" style="margin:0">Exporta el resumen antes de borrar. Los datos se guardan solo en este dispositivo.</p>';
  }
  h += '<p class="muted" style="margin:8px 0 0"><a href="privacidad.html">Privacidad y datos</a></p>';
  h += '</div>';
  return h;
}

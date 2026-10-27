// Pestaña "Ajustes": reglas del partido, plantel y empezar/terminar el partido.
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { label, porNumero } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';
import { evaluado, resumenEv } from '../coach/evaluacion.js';
import { MODOS, modoActual } from '../coach/recomendador.js';

function numField(key, lbl, hint) {
  const v = cfg()[key];
  return '<div class="field"><label class="lbl" for="f_' + key + '">' + lbl + '</label><input id="f_' + key + '" type="number" min="0" inputmode="numeric" data-cfg="' + key + '" value="' + esc(v) + '">' + (hint ? '<span class="muted">' + hint + '</span>' : '') + '</div>';
}

export function viewSettings() {
  const c = cfg();
  let h = '<header class="sb"><span class="title-h disp">Ajustes</span></header><div class="pad stack">';

  // partido
  h += '<h2 class="h2 disp">Partido</h2>';
  h += '<div class="grid2"><div class="field"><label class="lbl" for="f_club">Mi equipo</label><input id="f_club" data-cfg="club" value="' + esc(c.club) + '"></div>' +
    '<div class="field"><label class="lbl" for="f_rival">Rival</label><input id="f_rival" data-cfg="rival" value="' + esc(c.rival) + '"></div></div>';
  h += '<div class="grid2">' + numField('pointsToWin', 'Puntos para ganar') +
    numField('hardCap', 'Duración total (min)', '0 = sin límite de tiempo') + '</div>';

  h += '<div class="grid2"><div class="field"><label class="lbl" for="f_halfMode">Medio tiempo</label><select id="f_halfMode" data-cfg="halfMode">' +
    '<option value="points"' + (c.halfMode !== 'time' ? ' selected' : '') + '>Por puntos</option>' +
    '<option value="time"' + (c.halfMode === 'time' ? ' selected' : '') + '>Por tiempo</option></select></div>' +
    (c.halfMode === 'time'
      ? numField('halfMin', 'Minutos para el medio tiempo', 'Se hace al terminar el punto en juego')
      : numField('halfAt', 'Puntos para el medio tiempo')) + '</div>';

  h += '<div class="grid2">' + numField('softCap', 'Cap blando (min)', '0 = sin cap') +
    numField('timeouts', 'Timeouts por equipo') + numField('toSecs', 'Duración del timeout (seg)') + '</div>';

  h += '<label class="switch">Partido mixto<input type="checkbox" data-cfg="mixed"' + (c.mixed ? ' checked' : '') + '></label>';
  if (c.mixed) {
    h += '<div class="field"><label class="lbl" for="f_ratio">Proporción del primer punto</label><select id="f_ratio" data-cfg="startRatio">' +
      '<option value="4M3F"' + (c.startRatio === '4M3F' ? ' selected' : '') + '>4 masc. / 3 fem.</option>' +
      '<option value="3M4F"' + (c.startRatio === '3M4F' ? ' selected' : '') + '>3 masc. / 4 fem.</option></select></div>';
    h += '<label class="switch">Alternar con regla ABBA<input type="checkbox" data-cfg="abba"' + (c.abba ? ' checked' : '') + '></label>';
  }

  // sugerencia de línea (coach)
  const modo = modoActual();
  h += '<h2 class="h2 disp">Sugerencia de línea</h2>';
  h += '<div class="field"><label class="lbl" for="f_lineMode">Criterio</label><select id="f_lineMode" data-cfg="lineMode">' +
    Object.keys(MODOS).map(function (k) { return '<option value="' + k + '"' + (k === modo ? ' selected' : '') + '>' + MODOS[k].nombre + '</option>'; }).join('') +
    '</select><span class="muted">' + MODOS[modo].ayuda + '</span></div>';

  // plantel
  const sinEv = store.roster.filter(function (p) { return !evaluado(p); }).length;
  h += '<h2 class="h2 disp">Plantel (' + store.roster.length + ')</h2>';
  if (store.roster.length) {
    h += '<p class="muted" style="margin:0">La evaluación (1 a 5) es privada y la usa el recomendador. ' +
      (sinEv ? sinEv + ' sin evaluar: cuentan como nivel 3.' : 'Todos evaluados.') + '</p>';
  }
  h += '<div class="stack" style="gap:6px">';
  porNumero(store.roster).forEach(function (p) {
    h += '<div class="item"><span class="grow"><b>' + esc(label(p.id)) + '</b>' + (c.mixed ? ' <span class="muted">' + (p.g === 'F' ? 'Fem.' : 'Masc.') + '</span>' : '') +
      '<br><span class="muted">' + resumenEv(p) + '</span></span>' +
      '<span class="row" style="gap:6px"><button class="btn sm fill" data-a="evOpen" data-id="' + p.id + '">Evaluar</button>' +
      '<button class="btn sm danger" data-a="delP" data-id="' + p.id + '" aria-label="Quitar ' + esc(label(p.id)) + '">Quitar</button></span></div>';
  });
  h += '</div>';
  const np = ui.newP;
  h += '<div class="card stack"><span class="lbl">Agregar jugador</span><div class="row">' +
    '<div class="field" style="width:80px"><label class="muted" for="np_num">Número</label><input id="np_num" inputmode="numeric" data-in="npNum" value="' + esc(np.num) + '"></div>' +
    '<div class="field grow"><label class="muted" for="np_name">Nombre</label><input id="np_name" data-in="npName" value="' + esc(np.name) + '"></div></div>' +
    (c.mixed ? '<div class="grid2"><button class="chip" aria-pressed="' + (np.g === 'M') + '" data-a="npG" data-v="M">Masc.</button><button class="chip" aria-pressed="' + (np.g === 'F') + '" data-a="npG" data-v="F">Fem.</button></div>' : '') +
    '<button class="btn fill" data-a="addP">Agregar</button></div>';
  h += '<div class="card stack"><label class="lbl" for="bulk">Agregar varios: una línea por jugador, número, nombre y M o F</label>' +
    '<textarea id="bulk" rows="4" data-in="bulk" placeholder="12 Ana F&#10;7 Diego M">' + esc(ui.bulk) + '</textarea><button class="btn" data-a="addBulk">Agregar lista</button></div>';

  // control del partido
  h += '<h2 class="h2 disp">Control del partido</h2>';
  if (!store.game) {
    h += '<span class="lbl">¿Quién saca el primer pull?</span><div class="grid2 team-toggle">' +
      '<button class="btn us" aria-pressed="' + (c.firstPull === 'us') + '" data-a="firstPull" data-v="us">' + esc(c.club) + '</button>' +
      '<button class="btn th" aria-pressed="' + (c.firstPull === 'them') + '" data-a="firstPull" data-v="them">' + esc(c.rival) + '</button></div>';
    h += '<p class="muted" style="margin:0">Después, saca el pull el equipo que anotó el punto anterior.</p>';
    h += '<button class="btn big fill disp full" data-a="startGame"' + (store.roster.length ? '' : ' disabled') + '>Empezar partido</button>';
    if (!store.roster.length) h += '<p class="muted" style="margin:0">Agrega jugadores para empezar.</p>';
  } else {
    h += '<button class="btn full" data-a="endGame">Finalizar partido ahora</button>';
    h += '<button class="btn danger full" data-a="askReset">Borrar partido y empezar otro</button>';
    h += '<p class="muted" style="margin:0">Exporta el resumen antes de borrar. Los datos se guardan solo en este dispositivo.</p>';
  }
  h += '<p class="muted" style="margin:8px 0 0"><a href="privacidad.html">Privacidad y datos</a></p>';
  h += '</div>';
  return h;
}

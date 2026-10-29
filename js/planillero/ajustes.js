// Pestaña "Ajustes": reglas del partido, plantel y empezar/terminar el partido.
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { label, porNumero, letraGenero, nombreGenero } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';
import { evaluado, resumenEv, filasEvaluacion } from '../coach/evaluacion.js';
import { MODOS, modoActual } from '../coach/recomendador.js';

function numField(key, lbl, hint) {
  const v = cfg()[key];
  return '<div class="field"><label class="lbl" for="f_' + key + '">' + lbl + '</label><input id="f_' + key + '" type="number" min="0" inputmode="numeric" data-cfg="' + key + '" value="' + esc(v) + '">' + (hint ? '<span class="muted">' + hint + '</span>' : '') + '</div>';
}

// Botones Hombre / Mujer. Internamente 'M' = hombre y 'F' = mujer.
function botonesGenero(g, accion, id) {
  const dataId = id ? ' data-id="' + id + '"' : '';
  return '<div class="grid2"><button class="chip" aria-pressed="' + (g !== 'F') + '" data-a="' + accion + '" data-v="M"' + dataId + '>Hombre (H)</button>' +
    '<button class="chip" aria-pressed="' + (g === 'F') + '" data-a="' + accion + '" data-v="F"' + dataId + '>Mujer (M)</button></div>';
}

// Ventana para editar un jugador: datos, evaluación y quitar del plantel.
// Los cambios se guardan al instante.
export function modalJugador(id) {
  const p = store.roster.find(function (x) { return x.id === id; });
  if (!p) return '';
  let h = '<h2 class="h2 disp">' + esc(label(id)) + '</h2>';
  h += '<div class="row"><div class="field" style="width:90px"><label class="muted" for="pe_num">Número</label><input id="pe_num" inputmode="numeric" data-pe="num" data-id="' + id + '" value="' + esc(p.num) + '"></div>' +
    '<div class="field grow"><label class="muted" for="pe_name">Nombre</label><input id="pe_name" data-pe="name" data-id="' + id + '" value="' + esc(p.name || '') + '"></div></div>';
  if (cfg().mixed) h += botonesGenero(p.g, 'peG', id);
  h += '<span class="lbl" style="margin-top:6px">Evaluación privada' + (evaluado(p) ? '' : ' · <b class="txt-warn">sin evaluar</b>') + '</span>';
  h += filasEvaluacion(p);
  const orden = porNumero(store.roster), i = orden.findIndex(function (x) { return x.id === id; });
  const sig = orden[i + 1];
  h += '<div class="grid2"><button class="btn" data-a="closeModal">Listo</button>' +
    (sig ? '<button class="btn fill" data-a="editP" data-id="' + sig.id + '">Siguiente: ' + esc(label(sig.id)) + '</button>' : '<span></span>') + '</div>';
  h += '<button class="btn danger full" data-a="askDelP" data-id="' + id + '">Quitar del plantel</button>';
  return h;
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
      '<option value="4M3F"' + (c.startRatio === '4M3F' ? ' selected' : '') + '>4 hombres / 3 mujeres</option>' +
      '<option value="3M4F"' + (c.startRatio === '3M4F' ? ' selected' : '') + '>3 hombres / 4 mujeres</option></select></div>';
    h += '<label class="switch">Alternar con regla ABBA<input type="checkbox" data-cfg="abba"' + (c.abba ? ' checked' : '') + '></label>';
  }

  // sugerencia de línea (coach)
  const modo = modoActual();
  h += '<h2 class="h2 disp">Sugerencia de línea</h2>';
  h += '<div class="field"><label class="lbl" for="f_lineMode">Criterio</label><select id="f_lineMode" data-cfg="lineMode">' +
    Object.keys(MODOS).map(function (k) { return '<option value="' + k + '"' + (k === modo ? ' selected' : '') + '>' + MODOS[k].nombre + '</option>'; }).join('') +
    '</select><span class="muted">' + MODOS[modo].ayuda + '</span></div>';
  if (modo === 'competencia') {
    h += numField('compMargin', 'Margen para rotar (puntos)', 'Si vamos ganando por esta diferencia o más, entra más rotación. Mínimo 1.');
  }

  // plantel
  const sinEv = store.roster.filter(function (p) { return !evaluado(p); }).length;
  h += '<h2 class="h2 disp">Plantel (' + store.roster.length + ')</h2>';
  if (store.roster.length) {
    h += '<p class="muted" style="margin:0">Toca un jugador para editar sus datos o evaluarlo. La evaluación (1 a 5) es privada y la usa el recomendador. ' +
      (sinEv ? '<b class="txt-warn">' + sinEv + ' sin evaluar</b> (cuentan como nivel 3).' : 'Todos evaluados.') + '</p>';
  }
  h += '<div class="stack" style="gap:6px">';
  porNumero(store.roster).forEach(function (p) {
    const ok = evaluado(p);
    h += '<button class="item plantel' + (ok ? '' : ' sin-ev') + '" data-a="editP" data-id="' + p.id + '">' +
      '<span class="grow"><b>' + esc(label(p.id)) + '</b>' + (c.mixed ? ' <span class="g ' + letraGenero(p) + '">' + nombreGenero(p) + '</span>' : '') +
      '<br>' + (ok ? '<span class="muted">' + resumenEv(p) + '</span>' : '<span class="pill warn">Sin evaluar</span>') + '</span>' +
      '<span class="muted">Editar ›</span></button>';
  });
  h += '</div>';
  const np = ui.newP;
  h += '<div class="card stack"><span class="lbl">Agregar jugador</span><div class="row">' +
    '<div class="field" style="width:80px"><label class="muted" for="np_num">Número</label><input id="np_num" inputmode="numeric" data-in="npNum" value="' + esc(np.num) + '"></div>' +
    '<div class="field grow"><label class="muted" for="np_name">Nombre</label><input id="np_name" data-in="npName" value="' + esc(np.name) + '"></div></div>' +
    (c.mixed ? botonesGenero(np.g, 'npG', '') : '') +
    '<button class="btn fill" data-a="addP">Agregar</button></div>';
  h += '<div class="card stack"><label class="lbl" for="bulk">Agregar varios: una línea por jugador, con número, nombre y H (hombre) o M (mujer)</label>' +
    '<textarea id="bulk" rows="4" data-in="bulk" placeholder="12 Ana M&#10;7 Diego H">' + esc(ui.bulk) + '</textarea><button class="btn" data-a="addBulk">Agregar lista</button></div>';

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

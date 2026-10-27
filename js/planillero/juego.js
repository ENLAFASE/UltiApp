// Pestaña "Partido": muestra solo la pantalla que corresponde al momento del juego.
//   línea → pull → ¿quién recoge? → pases / gol / errores → (turnover) → defensa → ...
// Los llamados y timeouts se pueden abrir durante el juego.
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { derive } from '../modelos/partido.js';
import { teamName } from '../modelos/eventos.js';
import { P } from '../modelos/jugador.js';
import { esc, fmtCuenta } from '../util/formato.js';
import { header, chainHTML } from './marcador.js';
import { viewLine } from './linea.js';
import { viewPull } from './pull.js';
import { viewCall } from './llamados.js';

// Botón de jugador: número grande y nombre.
function botonJugador(id, accion, extra) {
  const p = P(id);
  return '<button class="pb" data-a="' + accion + '" data-id="' + id + '"' + (extra || '') + '>' +
    '<span class="num disp">#' + esc(p ? p.num : '?') + '</span><span class="nom">' + esc(p ? p.name : '') + '</span></button>';
}

function barraInferior() {
  return '<div class="mini"><button class="btn" data-a="undo">Deshacer</button>' +
    '<button class="btn dark" data-a="openCall">Llamado</button>' +
    '<button class="btn" data-a="openTO">Timeout</button></div>';
}

// Elegir jugador para un gol, drop o block.
function viewPick() {
  const k = ui.pick;
  let h = '<div class="scr"><p class="q disp">' + esc(k.title) + '</p><div class="pgrid" style="--cols:2">';
  k.ids.forEach(function (id) { h += botonJugador(id, 'picked'); });
  return h + '</div><div class="mini"><button class="btn" data-a="cancelPick">Cancelar</button></div></div>';
}

function viewPlay(s) {
  if (ui.pick) return viewPick();
  let h = '<div class="scr">';

  if (s.possession === 'us' && !s.holder) {
    // Recién recibimos el disco (pull, turnover): primero alguien lo recoge.
    h += '<div class="paso-h us"><span class="disp">ATAQUE</span><span>Tenemos el disco</span></div>';
    h += '<p class="q disp">¿Quién recoge el disco?</p><div class="pgrid" style="--cols:2">';
    s.line.forEach(function (id) { h += botonJugador(id, 'tapP'); });
    h += '</div>';

  } else if (s.possession === 'us') {
    const p = P(s.holder);
    h += '<div class="paso-h us"><span class="disp">#' + esc(p ? p.num : '?') + '</span><span>' + esc(p ? p.name : '') + ' tiene el disco · toca a quién le pasa</span></div>';
    h += '<div class="pgrid" style="--cols:2">';
    s.line.forEach(function (id) {
      h += botonJugador(id, 'tapP', id === s.holder ? ' aria-pressed="true" disabled' : '');
    });
    h += '</div>';
    const cadena = chainHTML(s);
    if (cadena) h += '<div class="chain1">' + cadena + '</div>';
    h += '<div class="acc"><button class="btn fill disp gol" data-a="goal">Gol</button>' +
      '<button class="btn them" data-a="throwaway">Throwaway</button><button class="btn them" data-a="drop">Drop</button><button class="btn them" data-a="stall">Stall</button></div>';

  } else {
    h += '<div class="paso-h th"><span class="disp">DEFENSA</span><span>' + esc(cfg().rival) + ' tiene el disco</span></div>';
    h += '<div class="dfgrid"><button class="btn fill disp" data-a="block">Block</button><button class="btn disp" data-a="themTurn">Error rival</button></div>';
    h += '<button class="btn big themfill disp full" data-a="themGoal">Gol de ' + esc(cfg().rival) + '</button>';
  }

  h += barraInferior();
  return h + '</div>';
}

// Cuenta regresiva del timeout. El reloj del partido sigue corriendo.
function viewTimeout(s) {
  const e = s.timeout, fin = e.ts + (cfg().toSecs || 60) * 1000, resta = fin - Date.now();
  return '<div class="scr to-scr">' +
    '<div class="paso-h ' + (e.team === 'us' ? 'us' : 'th') + '" style="align-self:stretch"><span class="disp">TIMEOUT</span><span>' + esc(teamName(e.team)) + '</span></div>' +
    '<div class="to-centro"><span class="to-v disp' + (resta <= 0 ? ' cero' : '') + '" data-tocount data-fin="' + fin + '">' + fmtCuenta(resta) + '</span>' +
    '<span class="muted" data-tomsg>' + (resta <= 0 ? '¡Se acabó el timeout!' : 'El reloj del partido sigue corriendo') + '</span></div>' +
    '<button class="btn big fill disp full" data-a="toResume">Reanudar juego</button>' +
    '<div class="mini" style="align-self:stretch"><button class="btn" data-a="undo">Deshacer timeout</button></div>' +
    '</div>';
}

function viewEnded(s) {
  const c = cfg();
  return '<div class="scr to-scr"><div class="to-centro"><span class="muted">Resultado final</span><h2 class="h2 disp" style="font-size:34px">' +
    esc(c.club) + ' ' + s.us + ' · ' + s.them + ' ' + esc(c.rival) + '</h2></div>' +
    '<button class="btn big fill disp full" data-a="tab" data-v="summary">Ver resumen</button>' +
    '<div class="mini" style="align-self:stretch"><button class="btn" data-a="undo">Deshacer último evento</button></div></div>';
}

export function viewGame() {
  if (!store.game) return '<div class="empty"><h2 class="h2 disp">No hay partido en curso</h2><p class="muted" style="margin:0">Configura el partido y el plantel para empezar.</p><button class="btn fill" data-a="tab" data-v="settings">Preparar partido</button></div>';
  const s = derive();
  // El llamado ocupa toda la pantalla (sin marcador) para que quepa completo.
  if (ui.view === 'call' && s.phase === 'play') return viewCall(s);
  ui.view = null;
  let h = header(s);
  if (s.timeout) h += viewTimeout(s);
  else if (s.phase === 'line') h += viewLine(s);
  else if (s.phase === 'pull') h += viewPull(s);
  else if (s.phase === 'play') h += viewPlay(s);
  else h += viewEnded(s);
  return h;
}

// Pestaña "Partido": muestra la pantalla que corresponde a la fase del punto
// (elegir línea → pull → juego → fin).
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { derive } from '../modelos/partido.js';
import { label } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';
import { header, chainHTML, lastLine } from './marcador.js';
import { viewLine } from './linea.js';
import { viewPull } from './pull.js';
import { viewCall } from './llamados.js';

function viewPlay(s) {
  let h = '<div class="pad stack">';
  if (s.possession === 'us') {
    h += '<div class="row"><strong class="grow">' + (s.holder ? 'Disco: ' + esc(label(s.holder)) : '¿Quién levanta el disco?') + '</strong><span class="muted">' + (s.holder ? 'Toca quién recibe' : 'Toca al jugador') + '</span></div>';
    h += '<div class="grid2">';
    s.line.forEach(function (id) { h += '<button class="pbtn" aria-pressed="' + (s.holder === id) + '" data-a="tapP" data-id="' + id + '"><span class="n">' + esc(label(id)) + '</span></button>'; });
    h += '</div>';
    h += '<div class="grid3"><button class="btn big fill disp" style="grid-column:span 3" data-a="goal">Gol</button>' +
      '<button class="btn them" data-a="throwaway">Throwaway</button><button class="btn them" data-a="drop">Drop</button><button class="btn them" data-a="stall">Stall</button>' +
      '<button class="btn dark" style="grid-column:span 3" data-a="openCall">Llamado</button></div>';
  } else {
    h += '<div class="poss-them stack"><span class="disp">' + esc(cfg().rival) + ' tiene el disco</span><span class="muted">Registra cómo recuperamos o si anotan</span></div>';
    h += '<div class="grid2"><button class="btn big fill disp" data-a="block">Block</button><button class="btn big disp" data-a="themTurn" style="font-size:20px">Error rival</button>' +
      '<button class="btn big themfill disp" style="grid-column:span 2" data-a="themGoal">Gol de ' + esc(cfg().rival) + '</button>' +
      '<button class="btn dark" style="grid-column:span 2" data-a="openCall">Llamado</button></div>';
  }
  h += '<div class="card stack" style="gap:4px"><span class="lbl">Secuencia del punto</span><span class="chain">' + chainHTML(s) + '</span></div>';
  h += lastLine(s);
  h += '<div class="grid2"><button class="btn" data-a="undo">Deshacer</button><button class="btn" data-a="openTO">Timeout</button></div>';
  h += '</div>';
  return h;
}

function viewEnded(s) {
  const c = cfg();
  return '<div class="empty"><h2 class="h2 disp" style="font-size:30px">Final: ' + esc(c.club) + ' ' + s.us + ', ' + esc(c.rival) + ' ' + s.them + '</h2>' +
    '<button class="btn fill full" data-a="tab" data-v="summary">Ver resumen</button>' +
    '<button class="btn full" data-a="undo">Deshacer último evento</button></div>';
}

export function viewGame() {
  if (!store.game) return '<div class="empty"><h2 class="h2 disp">No hay partido en curso</h2><p class="muted" style="margin:0">Configura el partido y el plantel para empezar.</p><button class="btn fill" data-a="tab" data-v="settings">Preparar partido</button></div>';
  const s = derive();
  let h = header(s);
  if (ui.view === 'call' && s.phase === 'play') return h + viewCall(s);
  ui.view = null;
  if (s.phase === 'line') h += viewLine(s);
  else if (s.phase === 'pull') h += viewPull(s);
  else if (s.phase === 'play') h += viewPlay(s);
  else h += viewEnded(s);
  return h;
}

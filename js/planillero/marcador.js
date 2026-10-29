// Encabezado con el marcador, el reloj, el cap y los timeouts.
import { store, cfg } from '../almacen.js';
import { elapsed, capInfo } from '../modelos/partido.js';
import { P, abrev } from '../modelos/jugador.js';
import { esc, fmt } from '../util/formato.js';
import { escudo, icono } from './encabezado.js';

export function header(s) {
  const c = cfg(), iniciado = !!store.game.start;
  const toUs = Math.max(0, c.timeouts - s.to.us), toTh = Math.max(0, c.timeouts - s.to.them);
  const info = s.phase === 'ended'
    ? 'Partido terminado'
    : 'Punto ' + s.point + (s.half ? ' · 2.ª mitad' : '');
  // Timeouts de cada equipo como puntitos: llenos = disponibles.
  function pips(quedan, lado) {
    let p = '';
    for (let i = 0; i < c.timeouts; i++) p += '<i class="' + (i < quedan ? 'on' : '') + '"></i>';
    return '<span class="tos ' + lado + '" aria-label="Timeouts disponibles: ' + quedan + '"><b>TO</b>' + p + '</span>';
  }
  return '<header class="sb">' +
    '<div class="sb-row">' +
      '<div class="team"><span class="tn">' + escudo() + esc(c.club) + '</span><span class="sc num-d">' + s.us + '</span></div>' +
      '<div class="clock" role="timer" aria-label="Tiempo de juego"><span class="t num-d" data-clock>' + fmt(elapsed()) + '</span>' +
        (iniciado ? '' : '<span class="paused">Parte con el pull</span>') +
        '<span class="cap" data-cap>' + esc(capInfo(s)) + '</span></div>' +
      '<div class="team r"><span class="tn">' + esc(c.rival) + '</span><span class="sc num-d">' + s.them + '</span></div>' +
    '</div>' +
    '<div class="sb-info">' + pips(toUs, 'l') + '<span class="pt sb-acc"><button class="sb-aj" data-a="openAjustes" aria-label="Ajustes del partido"><span>' + info + '</span><span class="sb-gear" aria-hidden="true">' + icono('settings') + '</span></button>' +
      // Finalizar siempre a mano durante el partido (pide confirmación).
      (s.phase === 'ended' ? '' : '<button class="sb-fin" data-a="askEnd">Finalizar</button>') + '</span>' + pips(toTh, 'r') + '</div>' +
  '</header>';
}

// Secuencia de pases del punto en una línea: "#7 → #12 → turnover".
export function chainHTML(s) {
  if (!s.chain.length) return '';
  const items = s.chain.slice(-8).map(function (it) { return it.x ? '<span class="x">turnover</span>' : esc(abrev(P(it.id))); });
  return (s.chain.length > 8 ? '… ' : '') + items.join(' → ');
}

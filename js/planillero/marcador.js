// Encabezado con el marcador, el reloj, el cap y los timeouts.
import { store, cfg } from '../almacen.js';
import { elapsed, capInfo } from '../modelos/partido.js';
import { P, abrev } from '../modelos/jugador.js';
import { esc, fmt } from '../util/formato.js';

export function header(s) {
  const c = cfg(), iniciado = !!store.game.start;
  const toUs = Math.max(0, c.timeouts - s.to.us), toTh = Math.max(0, c.timeouts - s.to.them);
  const info = s.phase === 'ended'
    ? '<span>Partido terminado</span>'
    : '<span>Punto ' + s.point + (s.half ? ' · 2.ª mitad' : '') + '</span>';
  return '<header class="sb">' +
    '<div class="sb-row">' +
      '<div class="team"><span class="tn">' + esc(c.club) + '</span><span class="sc disp">' + s.us + '</span></div>' +
      '<div class="clock" role="timer" aria-label="Tiempo de juego"><span class="t disp" data-clock>' + fmt(elapsed()) + '</span>' +
        (iniciado ? '' : '<span class="paused">Parte con el pull</span>') +
        '<span class="cap" data-cap>' + esc(capInfo(s)) + '</span></div>' +
      '<div class="team r"><span class="tn">' + esc(c.rival) + '</span><span class="sc disp">' + s.them + '</span></div>' +
    '</div>' +
    '<div class="sb-info">' + info + '<span>Timeouts ' + toUs + ' / ' + toTh + '</span></div>' +
  '</header>';
}

// Secuencia de pases del punto en una línea: "#7 → #12 → turnover".
export function chainHTML(s) {
  if (!s.chain.length) return '';
  const items = s.chain.slice(-8).map(function (it) { return it.x ? '<span class="x">turnover</span>' : esc(abrev(P(it.id))); });
  return (s.chain.length > 8 ? '… ' : '') + items.join(' → ');
}

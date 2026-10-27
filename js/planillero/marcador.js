// Encabezado con el marcador, el reloj, el cap y los timeouts.
import { cfg } from '../almacen.js';
import { elapsed, clockRunning, capInfo } from '../modelos/partido.js';
import { describe } from '../modelos/eventos.js';
import { short } from '../modelos/jugador.js';
import { esc, fmt } from '../util/formato.js';

export function header(s) {
  const c = cfg(), run = clockRunning();
  const toUs = Math.max(0, c.timeouts - s.to.us), toTh = Math.max(0, c.timeouts - s.to.them);
  let info = '';
  if (s.phase === 'ended') info = '<span>Partido terminado</span>';
  else info = '<span>Punto ' + s.point + (s.offense ? (s.offense === 'us' ? ', ' + esc(c.club) + ' en ofensa' : ', ' + esc(c.club) + ' en defensa') : '') + '</span>';
  return '<header class="sb">' +
    '<div class="sb-row">' +
      '<div class="team"><span class="tn">' + esc(c.club) + '</span><span class="sc disp">' + s.us + '</span></div>' +
      '<button class="clock" data-a="clock" aria-label="' + (run ? 'Pausar reloj' : 'Iniciar reloj') + '"><span class="t disp" data-clock>' + fmt(elapsed()) + '</span>' +
        (run ? '' : '<span class="paused">' + (elapsed() ? 'En pausa' : 'Toca para iniciar') + '</span>') +
        '<span class="cap" data-cap>' + esc(capInfo()) + '</span></button>' +
      '<div class="team r"><span class="tn">' + esc(c.rival) + '</span><span class="sc disp">' + s.them + '</span></div>' +
    '</div>' +
    '<div class="sb-info">' + info + '<span>Timeouts ' + toUs + ' / ' + toTh + '</span></div>' +
  '</header>';
}

// Secuencia de pases del punto: "#7 → #12 → turnover".
export function chainHTML(s) {
  if (!s.chain.length) return '<span class="muted">Sin pases todavía</span>';
  const items = s.chain.slice(-10).map(function (it) { return it.x ? '<span class="x">turnover</span>' : esc(short(it.id)); });
  return (s.chain.length > 10 ? '… ' : '') + items.join(' → ');
}

export function lastLine(s) {
  return s.last ? '<p class="muted" style="margin:0">Último: ' + esc(describe(s.last)) + '</p>' : '';
}

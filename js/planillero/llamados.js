// Pantalla para registrar un llamado: quién llama, tipo, resolución y posesión.
import { cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { KINDS, RES } from '../modelos/eventos.js';
import { short } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';

export function viewCall(s) {
  const c = cfg(), k = ui.call;
  let h = '<div class="pad stack">';
  h += '<div class="row"><h2 class="h2 disp grow">Registrar llamado</h2><button class="btn" data-a="cancelCall">Cancelar</button></div>';
  h += '<span class="lbl">¿Quién llama?</span><div class="grid2 team-toggle">' +
    '<button class="btn disp us" aria-pressed="' + (k.team === 'us') + '" data-a="callTeam" data-v="us">' + esc(c.club) + '</button>' +
    '<button class="btn disp th" aria-pressed="' + (k.team === 'them') + '" data-a="callTeam" data-v="them">' + esc(c.rival) + '</button></div>';
  if (k.team === 'us') {
    h += '<span class="lbl">Jugador que llama (opcional)</span><div class="row" style="flex-wrap:wrap;gap:6px">';
    s.line.forEach(function (id) { h += '<button class="chip" aria-pressed="' + (k.player === id) + '" data-a="callPlayer" data-id="' + id + '">' + esc(short(id)) + '</button>'; });
    h += '</div>';
  } else {
    h += '<div class="field"><label for="rivnum" class="lbl">Número del jugador rival (opcional)</label><input id="rivnum" inputmode="numeric" data-in="callRival" value="' + esc(k.player || '') + '"></div>';
  }
  h += '<span class="lbl">Tipo de llamado</span><div class="grid3">';
  KINDS.forEach(function (x) { h += '<button class="chip" style="border-radius:8px;padding:0 6px" aria-pressed="' + (k.kind === x) + '" data-a="callKind" data-v="' + esc(x) + '">' + esc(x) + '</button>'; });
  h += '</div><span class="lbl">Resolución</span><div class="stack" style="gap:6px">';
  Object.keys(RES).forEach(function (r) { h += '<button class="radio" aria-pressed="' + (k.res === r) + '" data-a="callRes" data-v="' + r + '">' + RES[r] + '</button>'; });
  h += '</div><span class="lbl">Posesión después del llamado</span><div class="grid2 team-toggle">' +
    '<button class="btn us" aria-pressed="' + (k.poss === 'us') + '" data-a="callPoss" data-v="us">' + esc(c.club) + '</button>' +
    '<button class="btn th" aria-pressed="' + (k.poss === 'them') + '" data-a="callPoss" data-v="them">' + esc(c.rival) + '</button></div>';
  h += '<button class="btn big fill disp full" data-a="saveCall"' + (k.kind && k.res ? '' : ' disabled') + '>Guardar llamado</button>';
  h += '</div>';
  return h;
}

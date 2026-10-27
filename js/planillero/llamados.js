// Pantalla para registrar un llamado, en 4 pasos numerados:
// 1 quién llama → 2 tipo → 3 resolución → 4 posesión al reanudar.
// Cada paso se marca en azul cuando ya tiene respuesta.
import { cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { KINDS, RES_SHORT } from '../modelos/eventos.js';
import { short } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';

// Explicación corta bajo cada resolución.
const RES_AYUDA = {
  aceptado: 'No contestado',
  contestado: 'El disco vuelve',
  retirado: 'Se retira el llamado',
  observador: 'Decide el observador'
};

function paso(n, titulo, listo, cuerpo) {
  return '<section class="paso' + (listo ? ' ok' : '') + '"><div class="paso-t"><span class="n">' + (listo ? '✓' : n) + '</span>' + titulo + '</div>' + cuerpo + '</section>';
}

export function viewCall(s) {
  const c = cfg(), k = ui.call;
  let h = '<div class="scr call">';
  h += '<div class="call-h"><h2 class="h2 disp">Llamado · punto ' + s.point + '</h2><button class="btn sm" data-a="cancelCall">Cancelar</button></div>';

  // 1. Quién llama
  let quien = '<div class="grid2 team-toggle sm">' +
    '<button class="btn disp us" aria-pressed="' + (k.team === 'us') + '" data-a="callTeam" data-v="us">' + esc(c.club) + '</button>' +
    '<button class="btn disp th" aria-pressed="' + (k.team === 'them') + '" data-a="callTeam" data-v="them">' + esc(c.rival) + '</button></div>';
  if (k.team === 'us') {
    quien += '<div class="chips">';
    s.line.forEach(function (id) { quien += '<button class="chip sq" aria-pressed="' + (k.player === id) + '" data-a="callPlayer" data-id="' + id + '">' + esc(short(id)) + '</button>'; });
    quien += '<span class="muted">(opcional)</span></div>';
  } else {
    quien += '<div class="row"><label for="rivnum" class="muted">N.° del rival (opcional)</label><input id="rivnum" class="inp-sm" inputmode="numeric" data-in="callRival" value="' + esc(k.player || '') + '"></div>';
  }
  h += paso(1, '¿Quién llama?', true, quien);

  // 2. Tipo
  let tipos = '<div class="grid3">';
  KINDS.forEach(function (x) { tipos += '<button class="chip sq" aria-pressed="' + (k.kind === x) + '" data-a="callKind" data-v="' + esc(x) + '">' + esc(x) + '</button>'; });
  h += paso(2, 'Tipo de llamado', !!k.kind, tipos + '</div>');

  // 3. Resolución
  let res = '<div class="grid2">';
  Object.keys(RES_SHORT).forEach(function (r) {
    res += '<button class="res" aria-pressed="' + (k.res === r) + '" data-a="callRes" data-v="' + r + '">' + RES_SHORT[r] + '<small>' + RES_AYUDA[r] + '</small></button>';
  });
  h += paso(3, 'Resolución', !!k.res, res + '</div>');

  // 4. Posesión
  h += paso(4, 'Posesión al reanudar', !!k.poss, '<div class="grid2 team-toggle sm">' +
    '<button class="btn us" aria-pressed="' + (k.poss === 'us') + '" data-a="callPoss" data-v="us">' + esc(c.club) + '</button>' +
    '<button class="btn th" aria-pressed="' + (k.poss === 'them') + '" data-a="callPoss" data-v="them">' + esc(c.rival) + '</button></div>');

  h += '<button class="btn big fill disp full" data-a="saveCall"' + (k.kind && k.res ? '' : ' disabled') + '>Guardar llamado</button>';
  h += '</div>';
  return h;
}

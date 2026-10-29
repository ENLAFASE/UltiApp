// Piezas de identidad que se repiten: escudo del club e íconos de la barra inferior.
import { cfg } from '../almacen.js';
import { esc } from '../util/formato.js';

// El escudo se muestra para los equipos del club (Húsares Mix, Húsares Open, Husarex).
export function esHusares() { return /h[uú]sare[sx]/i.test(cfg().club || ''); }

export function escudo(clase) {
  return esHusares() ? '<img class="' + (clase || 'crest') + '" src="img/husares-escudo.png" alt="" aria-hidden="true">' : '';
}

// Encabezado de las pestañas que no son el partido (Ajustes, Plantel...).
export function encabezado(titulo, sub) {
  return '<header class="sb brand"><div class="brand-row">' + escudo('crest-lg') +
    '<div class="brand-t"><span class="title-h">' + esc(titulo) + '</span>' +
    (sub ? '<span class="brand-sub">' + esc(sub) + '</span>' : '') + '</div></div></header>';
}

// Íconos simples (trazo) para la barra inferior.
const ICONOS = {
  game: '<ellipse cx="12" cy="12" rx="9" ry="9"/><ellipse cx="12" cy="12" rx="5" ry="5"/>',
  summary: '<path d="M5 20V11M12 20V5M19 20v-6"/>',
  roster: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.4-.2 4 1.3 4.5 4"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'
};
export function icono(id) {
  return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONOS[id] + '</svg>';
}

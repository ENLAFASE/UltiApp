// Buscar jugadores del plantel y mostrarlos como "#7 Diego".
import { store } from '../almacen.js';

export function P(id) {
  for (let i = 0; i < store.roster.length; i++) if (store.roster[i].id === id) return store.roster[i];
  return null;
}
export function label(id) { const p = P(id); return p ? ('#' + p.num + (p.name ? ' ' + p.name : '')) : '#?'; }
export function short(id) { const p = P(id); return p ? ('#' + p.num) : '#?'; }

// Plantel ordenado por número de camiseta.
export function porNumero(lista) {
  return lista.slice().sort(function (a, b) { return (+a.num || 0) - (+b.num || 0); });
}

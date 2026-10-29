// Buscar jugadores del plantel y mostrarlos.
// Internamente el género se guarda como 'M' (hombre) o 'F' (mujer), igual que
// en el prototipo, para no romper datos guardados. En pantalla se muestra
// H = hombre y M = mujer.
import { store } from '../almacen.js';
import { esc } from '../util/formato.js';

export function P(id) {
  for (let i = 0; i < store.roster.length; i++) if (store.roster[i].id === id) return store.roster[i];
  return null;
}

// "Ana #1" (nombre completo y número), para listas y resúmenes.
export function label(id) {
  const p = P(id); if (!p) return '#?';
  return p.name ? p.name + ' #' + p.num : '#' + p.num;
}
// "Ana" (o "#1" si no tiene nombre), para textos como "Pase Ana a Bea".
export function short(id) { const p = P(id); return p ? (p.name || '#' + p.num) : '#?'; }

// Primeras 3 letras del nombre: "Rodrigo" -> "Rod". Sin nombre: "#7".
export function abrev(p) {
  if (!p) return '?';
  const palabra = String(p.name || '').trim().split(/\s+/)[0];
  if (!palabra) return '#' + p.num;
  const letras = Array.from(palabra).slice(0, 3).join('');
  return letras.charAt(0).toUpperCase() + letras.slice(1);
}

export function letraGenero(p) { return p && p.g === 'F' ? 'M' : 'H'; }
export function nombreGenero(p) { return p && p.g === 'F' ? 'Mujer' : 'Hombre'; }

// Contenido de un botón de jugador: nombre abreviado grande y número chico.
// extra = texto opcional al lado del número (por ejemplo "3 pts").
export function htmlBoton(p, extra, conGenero) {
  return '<span class="ab disp">' + esc(abrev(p)) + '</span>' +
    '<span class="sub">#' + esc(p ? p.num : '?') + (extra ? ' · ' + esc(extra) : '') + '</span>' +
    (conGenero ? '<span class="g ' + letraGenero(p) + '">' + letraGenero(p) + '</span>' : '');
}

// Plantel ordenado por número de camiseta.
export function porNumero(lista) {
  return lista.slice().sort(function (a, b) { return (+a.num || 0) - (+b.num || 0); });
}

// Reloj del partido y pantalla siempre encendida mientras corre.
import { store, save } from '../almacen.js';
import { elapsed, clockRunning, capInfo } from '../modelos/partido.js';
import { fmt } from '../util/formato.js';
import { render } from './render.js';

export function toggleClock() {
  const c = store.game.clock;
  if (c.since) { c.acc += Date.now() - c.since; c.since = null; }
  else { c.since = Date.now(); keepAwake(); }
  save(); render();
}

// Evita que el teléfono apague la pantalla durante el partido.
let wakeLock = null;
export function keepAwake() {
  try {
    if (navigator.wakeLock && !wakeLock) {
      navigator.wakeLock.request('screen').then(function (w) {
        wakeLock = w;
        w.addEventListener('release', function () { wakeLock = null; });
      }).catch(function () {});
    }
  } catch (e) {}
}

// Actualiza solo el reloj y el cap cada segundo, sin redibujar todo.
export function iniciarReloj() {
  setInterval(function () {
    if (!store.game) return;
    const t = document.querySelector('[data-clock]'); if (t) t.textContent = fmt(elapsed());
    const cp = document.querySelector('[data-cap]'); if (cp) cp.textContent = capInfo();
  }, 1000);
  // Al volver a la app, pedir de nuevo la pantalla encendida.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && clockRunning()) { wakeLock = null; keepAwake(); }
  });
}

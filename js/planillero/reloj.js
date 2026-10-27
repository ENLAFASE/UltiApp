// Reloj del partido, cuenta regresiva del timeout y pantalla siempre encendida.
import { store, save } from '../almacen.js';
import { elapsed, clockRunning, capInfo, derive } from '../modelos/partido.js';
import { fmt, fmtCuenta } from '../util/formato.js';

// Marca la salida del pull. Si es el primer pull del partido, ahí parte el reloj.
// Devuelve el tiempo de juego en ese instante.
export function marcarSalidaPull() {
  const g = store.game;
  if (!g.events.some(function (e) { return e.type === 'pull'; })) {
    g.start = Date.now();
    save(); keepAwake();
  }
  return elapsed();
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

// Actualiza el reloj, el cap y la cuenta del timeout sin redibujar todo.
let timeoutAvisado = null;
export function iniciarReloj() {
  setInterval(function () {
    if (!store.game) return;
    const t = document.querySelector('[data-clock]'); if (t) t.textContent = fmt(elapsed());
    const cp = document.querySelector('[data-cap]'); if (cp) cp.textContent = capInfo(derive());
    const to = document.querySelector('[data-tocount]');
    if (to) {
      const fin = +to.getAttribute('data-fin'), resta = fin - Date.now();
      to.textContent = fmtCuenta(resta);
      if (resta <= 0) {
        to.classList.add('cero');
        const msg = document.querySelector('[data-tomsg]'); if (msg) msg.textContent = '¡Se acabó el timeout!';
        if (timeoutAvisado !== fin) {
          timeoutAvisado = fin;
          try { if (navigator.vibrate) navigator.vibrate([400, 150, 400]); } catch (e) {}
        }
      }
    }
  }, 500);
  if (clockRunning()) keepAwake();
  // Al volver a la app, pedir de nuevo la pantalla encendida.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && clockRunning()) { wakeLock = null; keepAwake(); }
  });
}

// Punto de partida de la app: conecta los botones, dibuja la primera
// pantalla y activa el modo sin conexión (service worker).
import { pedirAlmacenPersistente } from './almacen.js';
import { render } from './planillero/render.js';
import { conectarControles } from './planillero/controles.js';
import { iniciarReloj } from './planillero/reloj.js';

conectarControles(document.getElementById('app'));
iniciarReloj();
render();
pedirAlmacenPersistente();

// El service worker guarda una copia de la app para usarla sin señal.
// Solo funciona en https o en localhost.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (e) {
      console.warn('No se pudo activar el modo sin conexión:', e);
    });
  });
}

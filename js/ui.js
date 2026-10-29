// Estado temporal de la pantalla (qué pestaña está abierta, qué jugadores
// están marcados, etc.). No se guarda: se pierde al cerrar la app.
import { store } from './almacen.js';

export const ui = {
  tab: store.game || !store.roster.length ? 'game' : 'settings',
  view: null,          // 'call' mientras se registra un llamado
  sel: [],             // jugadores marcados para la línea
  selFor: null,
  ratioSwap: false,
  sug: null,           // última sugerencia de línea y su explicación
  rankRol: 'man',      // posición que muestra el ranking del plantel
  pull: null,          // pasos del pull en curso
  pick: null,          // elegir jugador (gol, drop, block)
  call: null,
  modal: null,
  toast: null,
  ignoreClickUntil: 0, // evita toques "fantasma" justo después de cronometrar
  newP: { num: '', name: '', g: 'M' },  // g: 'M' = hombre, 'F' = mujer
  bulk: '',
  abiertos: {}         // secciones abiertas en Ajustes (tiempos, motor, mapa)
};

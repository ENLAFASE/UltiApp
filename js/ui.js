// Estado temporal de la pantalla (qué pestaña está abierta, qué jugadores
// están marcados, etc.). No se guarda: se pierde al cerrar la app.
import { store } from './almacen.js';

export const ui = {
  tab: store.game ? 'game' : 'settings',
  view: null,          // 'call' mientras se registra un llamado
  sel: [],             // jugadores marcados para la línea
  selFor: null,
  ratioSwap: false,
  pull: null,          // pasos del pull en curso
  pick: null,          // elegir jugador (gol, drop, block)
  call: null,
  modal: null,
  toast: null,
  ignoreClickUntil: 0, // evita toques "fantasma" justo después de cronometrar
  newP: { num: '', name: '', g: 'M' },
  bulk: ''
};

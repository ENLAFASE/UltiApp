// Estado temporal de la pantalla (qué pestaña está abierta, qué jugadores
// están marcados, etc.). No se guarda: se pierde al cerrar la app.
import { store } from './almacen.js';

export const ui = {
  tab: store.game ? 'game' : 'settings',
  view: null,
  sel: [],
  selFor: null,
  ratioSwap: false,
  pull: null,
  call: null,
  modal: null,
  toast: null,
  firstOffense: 'us',
  newP: { num: '', name: '', g: 'M' },
  bulk: ''
};

// Agregar y deshacer eventos del partido.
import { store, save } from '../almacen.js';
import { ui } from '../ui.js';
import { elapsed } from '../modelos/partido.js';
import { describe } from '../modelos/eventos.js';
import { render, toast } from './render.js';

// Anota un evento con la hora del reloj y la hora real, y lo guarda al tiro.
export function add(e) {
  e.t = elapsed(); e.ts = Date.now();
  store.game.events.push(e);
  save(); render();
}

export function undo() {
  if (!store.game || !store.game.events.length) return;
  const e = store.game.events.pop();
  save(); ui.modal = null;
  toast('Deshecho: ' + describe(e));
  render();
}

// Agregar y deshacer eventos del partido.
import { store, save } from '../almacen.js';
import { ui } from '../ui.js';
import { elapsed, derive } from '../modelos/partido.js';
import { describe } from '../modelos/eventos.js';
import { render, toast } from './render.js';
import { archivar, quitarSiNoTermino } from '../modelos/historial.js';

// Si el partido terminó, congela el reloj; si se deshizo el final, lo reanuda.
function revisarFinal() {
  const g = store.game;
  g.finishedAt = derive().ended ? (g.finishedAt || Date.now()) : null;
}

// Anota un evento con la hora del reloj y la hora real, y lo guarda al tiro.
export function add(e) {
  if (e.t == null) e.t = elapsed();
  e.ts = Date.now();
  store.game.events.push(e);
  revisarFinal();
  // Al terminar, el partido queda guardado en el Dashboard.
  if (derive().ended) archivar();
  save(); render();
}

export function undo() {
  const g = store.game;
  if (!g || !g.events.length) return;
  const e = g.events.pop();
  // Si ya no queda ningún pull, el reloj vuelve a cero.
  if (!g.events.some(function (x) { return x.type === 'pull'; })) g.start = null;
  revisarFinal();
  quitarSiNoTermino();
  save();
  ui.modal = null; ui.pick = null; ui.pull = null;
  toast('Deshecho: ' + describe(e));
  render();
}

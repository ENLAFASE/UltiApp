// Evaluación simple de cada jugador (1 a 5), privada del coach.
// Se guarda solo en este dispositivo, dentro del plantel (jugador.ev),
// y no se incluye en los archivos CSV exportados.
import { store } from '../almacen.js';
import { label, porNumero } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';

export const HABILIDADES = [
  { k: 'man', nombre: 'Manejo', corto: 'Man', ayuda: 'Lanzar, distribuir y mover el disco' },
  { k: 'av', nombre: 'Corte de avance', corto: 'Av', ayuda: 'Cortes para ganar terreno hacia el disco' },
  { k: 'gol', nombre: 'Corte de gol', corto: 'Gol', ayuda: 'Cortes profundos y atrapar en la zona de gol' },
  { k: 'def', nombre: 'Defensa', corto: 'Def', ayuda: 'Marca, blocks y presión' }
];

// Si un jugador no está evaluado, se asume nivel 3 (promedio) en todo.
export const NIVEL_BASE = 3;

export function evaluado(p) { return !!(p && p.ev && Object.keys(p.ev).length); }

export function ev(p) {
  const e = (p && p.ev) || {};
  return { man: e.man || NIVEL_BASE, av: e.av || NIVEL_BASE, gol: e.gol || NIVEL_BASE, def: e.def || NIVEL_BASE };
}

// Nivel general del jugador para este punto. En ataque pesa más lo ofensivo;
// en defensa pesa más la defensa.
export function nivel(p, ataque) {
  const e = ev(p), ofensa = (e.man + e.av + e.gol) / 3;
  return ataque ? 0.7 * ofensa + 0.3 * e.def : 0.4 * ofensa + 0.6 * e.def;
}

export function resumenEv(p) {
  if (!evaluado(p)) return 'Sin evaluar';
  const e = ev(p);
  return HABILIDADES.map(function (h) { return h.corto + ' ' + e[h.k]; }).join(' · ');
}

// Ventana para evaluar a un jugador. Cada toque se guarda al instante.
export function modalEvaluar(id) {
  const p = store.roster.find(function (x) { return x.id === id; });
  if (!p) return '';
  const e = p.ev || {};
  let h = '<h2 class="h2 disp">Evaluar ' + esc(label(id)) + '</h2>' +
    '<p class="muted" style="margin:0">Privado: solo lo ves tú en este teléfono. 1 = básico, 5 = muy bueno. Sin evaluar cuenta como 3.</p>';
  HABILIDADES.forEach(function (hb) {
    h += '<div class="ev-fila"><div><b>' + hb.nombre + '</b><span class="muted">' + hb.ayuda + '</span></div><div class="ev-notas">';
    for (let n = 1; n <= 5; n++) {
      h += '<button class="chip sq" aria-pressed="' + (e[hb.k] === n) + '" data-a="evSet" data-id="' + id + '" data-k="' + hb.k + '" data-v="' + n + '">' + n + '</button>';
    }
    h += '</div></div>';
  });
  const orden = porNumero(store.roster), i = orden.findIndex(function (x) { return x.id === id; });
  const sig = orden[i + 1];
  h += '<div class="grid2"><button class="btn" data-a="closeModal">Listo</button>' +
    (sig ? '<button class="btn fill" data-a="evOpen" data-id="' + sig.id + '">Siguiente: ' + esc(label(sig.id)) + '</button>' : '<span></span>') + '</div>';
  return h;
}

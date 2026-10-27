// Recomendador de líneas. Completa la línea hasta 7 según el criterio elegido
// en Ajustes y explica por qué eligió a cada jugador.
//
//   Competencia:   el mayor nivel posible; si vamos ganando por mucho, rota
//                  y da minutos a jugadores de menor nivel.
//   Amistoso:      rota, pero asegura una columna vertical: un manejo, un
//                  corte de avance y un corte de gol principales.
//   Entrenamiento: rotación pareja: juega quien descansó y lleva menos puntos.
//
// Siempre respeta la proporción de géneros si el partido es mixto. Si no hay
// suficientes jugadores de un género, completa con quien haya.
import { store, cfg } from '../almacen.js';
import { ev, nivel, evaluado } from './evaluacion.js';

export const MODOS = {
  competencia: { nombre: 'Competencia', ayuda: 'Busca el mayor nivel en cancha. Si vamos ganando por 3 o más, rota y da minutos a jugadores de menor nivel.' },
  amistoso: { nombre: 'Amistoso', ayuda: 'Rota a todos, pero asegura un buen manejo, un buen corte de avance y un buen corte de gol en cada punto.' },
  entrenamiento: { nombre: 'Entrenamiento', ayuda: 'Rotación pareja: entra quien descansó el punto anterior y lleva menos puntos jugados.' }
};
export const MARGEN_ROTAR = 3;

// Roles de la columna vertical que asegura el modo amistoso.
const ROLES = [
  { k: 'man', nombre: 'Manejo principal', corto: 'Manejo' },
  { k: 'av', nombre: 'Corte de avance principal', corto: 'Corte de avance' },
  { k: 'gol', nombre: 'Corte de gol principal', corto: 'Corte de gol' }
];

export function modoActual() { return MODOS[cfg().lineMode] ? cfg().lineMode : 'entrenamiento'; }

function genero(p) { return p.g === 'F' ? 'F' : 'M'; }
function n1(x) { return (Math.round(x * 10) / 10).toFixed(1); }

// s = estado del partido, req = { M, F } que pide la proporción (o null),
// elegidos = ids que el coach ya marcó a mano.
export function recomendarLinea(s, req, elegidos) {
  const modo = modoActual(), ataque = s.offense === 'us', EN_CANCHA = 7;
  const sel = elegidos.slice(), motivos = {}, tengo = { M: 0, F: 0 };
  sel.forEach(function (id) {
    motivos[id] = 'Elegido por ti';
    const p = store.roster.find(function (x) { return x.id === id; });
    if (p) tengo[genero(p)]++;
  });
  let libres = store.roster.filter(function (p) { return sel.indexOf(p.id) < 0; });

  const primerPunto = !s.lastLine.length;
  function descanso(p) { return s.lastLine.indexOf(p.id) < 0; }
  function txtDescanso(p) { return primerPunto ? 'primer punto' : (descanso(p) ? 'descansó' : 'jugó el anterior'); }
  function pts(p) { return (s.stats[p.id] || {}).pts || 0; }
  function cabe(p) { return sel.length < EN_CANCHA && (!req || tengo[genero(p)] < req[genero(p)]); }
  function tomar(p, motivo) {
    sel.push(p.id); tengo[genero(p)]++; motivos[p.id] = motivo;
    libres = libres.filter(function (x) { return x.id !== p.id; });
  }
  function textoRotacion(p) {
    if (primerPunto) return 'Primer punto: rotación por número';
    return (descanso(p) ? 'Descansó el punto anterior' : 'Jugó el anterior') + ' · ' + pts(p) + (pts(p) === 1 ? ' punto jugado' : ' puntos jugados');
  }
  // Rotación pareja: primero quien descansó, luego quien lleva menos puntos.
  function porRotacion(a, b) {
    return (descanso(b) - descanso(a)) || (pts(a) - pts(b)) || ((+a.num || 0) - (+b.num || 0));
  }
  function completar(orden, motivoDe) {
    libres.slice().sort(orden).forEach(function (p) { if (cabe(p)) tomar(p, motivoDe(p)); });
    // Si faltan jugadores de un género, completar con quien haya.
    if (sel.length < EN_CANCHA) {
      libres.slice().sort(orden).forEach(function (p) {
        if (sel.length < EN_CANCHA) { sel.push(p.id); motivos[p.id] = motivoDe(p) + ' (completa la línea; no alcanza la proporción)'; }
      });
    }
  }

  let resumen;
  if (modo === 'competencia') {
    const dif = s.us - s.them;
    let puntaje;
    if (dif >= MARGEN_ROTAR) {
      resumen = 'Ganamos por ' + dif + ': rotación, minutos para nivel más bajo.';
      puntaje = function (p) { return (5 - nivel(p, ataque)) + (descanso(p) ? 1 : 0) - 0.05 * pts(p); };
    } else if (dif > 0) {
      resumen = 'Ganamos por ' + dif + ': nivel alto, con algo de descanso.';
      puntaje = function (p) { return nivel(p, ataque) + (descanso(p) ? 0.8 : 0); };
    } else {
      resumen = (dif === 0 ? 'Empatados' : 'Perdemos por ' + (-dif)) + ': el mayor nivel posible.';
      puntaje = function (p) { return nivel(p, ataque) + (descanso(p) ? 0.3 : 0); };
    }
    resumen = 'Competencia · ' + resumen;
    completar(function (a, b) { return (puntaje(b) - puntaje(a)) || porRotacion(a, b); }, function (p) {
      return 'Nivel ' + n1(nivel(p, ataque)) + (ataque ? ' en ataque' : ' en defensa') + (primerPunto ? '' : ' · ' + txtDescanso(p));
    });

  } else if (modo === 'amistoso') {
    resumen = 'Amistoso · rota, con manejo, corte de avance y corte de gol asegurados.';
    ROLES.forEach(function (rol) {
      // ¿Ya hay alguien bueno en ese rol entre los elegidos?
      const yaEsta = sel.some(function (id) {
        const p = store.roster.find(function (x) { return x.id === id; });
        return p && ev(p)[rol.k] >= 4;
      });
      if (yaEsta) return;
      const cands = libres.filter(cabe);
      if (!cands.length) return;
      // Los "buenos" en el rol: nota 4 o más (o la mejor nota disponible).
      const mejor = Math.max.apply(null, cands.map(function (p) { return ev(p)[rol.k]; }));
      const umbral = Math.min(4, mejor);
      const buenos = cands.filter(function (p) { return ev(p)[rol.k] >= umbral; });
      // Entre los buenos, rota: primero quien descansó y lleva menos puntos.
      buenos.sort(function (a, b) { return porRotacion(a, b) || (ev(b)[rol.k] - ev(a)[rol.k]); });
      const p = buenos[0];
      tomar(p, rol.nombre + ' (' + rol.corto + ' ' + ev(p)[rol.k] + ')' + (primerPunto ? '' : ' · ' + txtDescanso(p)));
    });
    completar(porRotacion, textoRotacion);

  } else {
    resumen = 'Entrenamiento · rotación pareja según puntos jugados.';
    completar(porRotacion, textoRotacion);
  }

  const sinEvaluar = store.roster.filter(function (p) { return !evaluado(p); }).length;
  return { ids: sel, resumen: resumen, motivos: motivos, sinEvaluar: sinEvaluar, modo: modo };
}

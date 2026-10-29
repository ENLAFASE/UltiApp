// ============================================================================
//  CRITERIO · MÉTRICAS
//  Cómo se mide a un jugador, a una línea y al plantel completo a partir de la
//  evaluación del coach (1 a 5) y del desgaste en el partido.
// ============================================================================
import { PARAM } from './parametros.js';
import { ev } from '../coach/evaluacion.js';

export const ROLES = [
  { k: 'man', nombre: 'Manejo', principal: 'Manejo principal' },
  { k: 'av', nombre: 'Corte de avance', principal: 'Corte de avance principal' },
  { k: 'gol', nombre: 'Corte de gol', principal: 'Corte de gol principal' },
  { k: 'def', nombre: 'Defensa', principal: 'Defensa' }
];

/* ---------- nivel de un jugador ---------- */
export function ofensa(p) {
  const e = ev(p), w = PARAM.PESO_ROLES_OFENSA;
  return e.man * w.man + e.av * w.av + e.gol * w.gol;
}
function mezcla(p, pesos) { return ofensa(p) * pesos.ofensa + ev(p).def * pesos.defensa; }
export function nivelAtaque(p) { return mezcla(p, PARAM.PESO_ATAQUE); }
export function nivelDefensa(p) { return mezcla(p, PARAM.PESO_DEFENSA); }
export function nivelGeneral(p) { return mezcla(p, PARAM.PESO_GENERAL); }
export function nivelPunto(p, ataque) { return ataque ? nivelAtaque(p) : nivelDefensa(p); }

export function n1(x) { return (Math.round(x * 10) / 10).toFixed(1); }

/* ---------- piezas clave ---------- */
// El mejor tramo del plantel por nivel general. Si es mixto, se calcula por
// género para que haya piezas clave de ambos géneros.
export function piezasClave(lista, mixto) {
  const clave = new Set();
  const grupos = mixto
    ? [lista.filter(function (p) { return p.g !== 'F'; }), lista.filter(function (p) { return p.g === 'F'; })]
    : [lista];
  grupos.forEach(function (g) {
    const n = Math.max(1, Math.ceil(g.length * PARAM.PIEZAS_CLAVE_FRACCION));
    g.slice().sort(function (a, b) { return nivelGeneral(b) - nivelGeneral(a); })
      .slice(0, n).forEach(function (p) { clave.add(p.id); });
  });
  // El mejor manejo del plantel siempre es pieza clave.
  const mejorMan = lista.slice().sort(function (a, b) { return ev(b).man - ev(a).man; })[0];
  if (mejorMan) clave.add(mejorMan.id);
  return clave;
}

/* ---------- métricas de una línea (barra de información) ---------- */
// jugadores = objetos del plantel; s = estado del partido; ataque = punto en que recibimos.
export function metricasLinea(jugadores, s, ataque) {
  const n = jugadores.length;
  if (!n) return null;
  const mejor = {};
  ROLES.forEach(function (r) { mejor[r.k] = Math.max.apply(null, jugadores.map(function (p) { return ev(p)[r.k]; })); });
  const nivel = jugadores.reduce(function (a, p) { return a + nivelPunto(p, ataque); }, 0) / n;
  const st = function (p) { return (s.stats[p.id] || {}); };
  const pts = jugadores.reduce(function (a, p) { return a + (st(p).pts || 0); }, 0) / n;
  const min = jugadores.reduce(function (a, p) { return a + (st(p).ms || 0); }, 0) / n / 60000;
  const seguidos = jugadores.filter(function (p) { return s.lastLine.indexOf(p.id) >= 0; }).length;
  const rachaMax = Math.max.apply(null, jugadores.map(function (p) { return (s.racha || {})[p.id] || 0; }));
  const faltan = ['man', 'av', 'gol'].filter(function (k) { return mejor[k] < PARAM.NOTA_BUENA; });
  return {
    nivel: nivel, mejor: mejor, pts: pts, min: min, seguidos: seguidos, rachaMax: rachaMax,
    faltan: faltan, sinManejo: mejor.man < PARAM.NOTA_MIN_MANEJO
  };
}

/* ---------- análisis del plantel (pestaña Plantel) ---------- */
export function analizarPlantel(lista, mixto) {
  const n = lista.length;
  const res = { n: n, global: 0, porRol: {}, alertas: [] };
  if (!n) return res;
  res.global = lista.reduce(function (a, p) { return a + nivelGeneral(p); }, 0) / n;
  ROLES.forEach(function (r) {
    const notas = lista.map(function (p) { return ev(p)[r.k]; });
    const buenos = lista.filter(function (p) { return ev(p)[r.k] >= PARAM.NOTA_BUENA; });
    res.porRol[r.k] = {
      prom: notas.reduce(function (a, x) { return a + x; }, 0) / n,
      buenos: buenos.length,
      buenosH: buenos.filter(function (p) { return p.g !== 'F'; }).length,
      buenosM: buenos.filter(function (p) { return p.g === 'F'; }).length
    };
  });
  // Alertas que pueden hacer que el motor sugiera malas líneas.
  const man = res.porRol.man;
  if (man.buenos === 0) res.alertas.push('Nadie tiene Manejo ' + PARAM.NOTA_BUENA + ' o más: las líneas sugeridas pueden quedar sin manejo.');
  else if (man.buenos < 3) res.alertas.push('Solo ' + man.buenos + ' con Manejo ' + PARAM.NOTA_BUENA + ' o más: con rotación, algunas líneas tendrán manejo débil.');
  if (mixto && man.buenos > 0 && (man.buenosH === 0 || man.buenosM === 0)) {
    res.alertas.push('En mixto, todos los buenos manejos son ' + (man.buenosH === 0 ? 'mujeres' : 'hombres') + '. Revisa si la evaluación refleja bien a los manejos del otro género.');
  }
  ['av', 'gol'].forEach(function (k) {
    if (res.porRol[k].buenos === 0) res.alertas.push('Nadie tiene ' + (k === 'av' ? 'Corte de avance' : 'Corte de gol') + ' ' + PARAM.NOTA_BUENA + ' o más.');
  });
  const notasTodas = lista.map(function (p) { return ev(p); });
  const todosIguales = notasTodas.every(function (e) { return e.man === e.av && e.av === e.gol && e.gol === e.def; });
  if (n >= 4 && todosIguales) res.alertas.push('Todos tienen la misma nota en las 4 habilidades: el motor no puede distinguir roles.');
  return res;
}

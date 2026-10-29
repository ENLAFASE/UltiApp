// Historial de partidos para el Dashboard.
// Cada partido terminado (o cerrado con al menos un punto) se guarda en
// store.historial con una copia de sus eventos, sus reglas y los jugadores que
// participaron. Así se pueden recalcular sus estadísticas aunque después cambie
// el plantel o los ajustes.
import { store, save, EQUIPOS } from '../almacen.js';
import { derive } from './partido.js';

function copia(x) { return JSON.parse(JSON.stringify(x)); }

export function lista() { return store.historial || (store.historial = []); }

// Calcula derive() para un partido guardado, usando sus propias reglas.
export function deriveDe(rec) {
  const gAnt = store.game, cAnt = store.cfg;
  store.game = rec.game; store.cfg = rec.cfg;
  try { return derive(); } finally { store.game = gAnt; store.cfg = cAnt; }
}

// Guarda (o actualiza) el partido en curso en el historial.
export function archivar() {
  const g = store.game; if (!g) return null;
  const s = derive();
  if (s.us + s.them === 0) return null; // sin puntos no vale la pena guardarlo
  const jugadores = {};
  Object.keys(s.stats).forEach(function (id) {
    const p = store.roster.find(function (x) { return x.id === id; });
    if (p) jugadores[id] = { num: p.num, name: p.name, g: p.g };
  });
  const rec = {
    id: g.created, fecha: g.created,
    equipo: store.cfg.equipo || 'otro', club: store.cfg.club, rival: store.cfg.rival,
    us: s.us, them: s.them, terminado: s.ended,
    cfg: copia(store.cfg), game: copia(g), jugadores: jugadores
  };
  const h = lista(), i = h.findIndex(function (r) { return r.id === rec.id; });
  if (i >= 0) h[i] = rec; else h.push(rec);
  save();
  return rec;
}

// Si se deshace el final de un partido, sale del historial hasta que vuelva a terminar.
export function quitarSiNoTermino() {
  const g = store.game; if (!g || !store.historial) return;
  if (!derive().ended) store.historial = store.historial.filter(function (r) { return r.id !== g.created; });
}

export function borrar(id) {
  store.historial = lista().filter(function (r) { return String(r.id) !== String(id); });
  save();
}

export function nombreEquipo(rec) { return EQUIPOS[rec.equipo] ? EQUIPOS[rec.equipo].nombre : rec.club; }

// Holds y breaks de un partido: puntos ganados recibiendo el pull (hold)
// y puntos ganados sacando el pull, es decir, partiendo en defensa (break).
export function holdBreak(s) {
  const r = { atq: 0, hold: 0, def: 0, brk: 0 };
  s.pointLog.forEach(function (p) {
    if (p.offense === 'us') { r.atq++; if (p.winner === 'us') r.hold++; }
    else { r.def++; if (p.winner === 'us') r.brk++; }
  });
  return r;
}

// Resumen de varios partidos: récord, puntos, holds/breaks y estadísticas por jugador.
export function agregar(recs) {
  const t = { pj: recs.length, g: 0, p: 0, pf: 0, pc: 0, atq: 0, hold: 0, def: 0, brk: 0, jug: {}, partidos: [] };
  recs.forEach(function (rec) {
    const s = deriveDe(rec), hb = holdBreak(s);
    if (s.us > s.them) t.g++; else if (s.us < s.them) t.p++;
    t.pf += s.us; t.pc += s.them;
    t.atq += hb.atq; t.hold += hb.hold; t.def += hb.def; t.brk += hb.brk;
    t.partidos.push({ rec: rec, s: s, hb: hb });
    Object.keys(s.stats).forEach(function (id) {
      const x = s.stats[id];
      const j = t.jug[id] || (t.jug[id] = { id: id, info: rec.jugadores[id] || {}, pj: 0, pts: 0, goals: 0, ast: 0, blk: 0, turn: 0, comp: 0 });
      if (rec.jugadores[id]) j.info = rec.jugadores[id];
      if (x.pts) j.pj++;
      j.pts += x.pts; j.goals += x.goals; j.ast += x.ast; j.blk += x.blk; j.comp += x.comp;
      j.turn += x.thr + x.drop + x.stall;
    });
  });
  return t;
}

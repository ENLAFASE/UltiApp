// Reglas del partido: reloj, caps, proporción ABBA y el cálculo del marcador.
// El partido se guarda como una lista de eventos; derive() la recorre de
// principio a fin y calcula el marcador, la posesión y las estadísticas.
import { store, cfg } from '../almacen.js';
import { fmt } from '../util/formato.js';

/* ---------- reloj y caps ---------- */
export function elapsed() {
  const g = store.game; if (!g) return 0;
  const c = g.clock;
  return c.acc + (c.since ? Date.now() - c.since : 0);
}
export function clockRunning() { return !!(store.game && store.game.clock.since); }

export function capInfo() {
  const c = cfg(), ms = elapsed(), soft = c.softCap * 60000, hard = c.hardCap * 60000;
  if (hard && ms >= hard) return 'Cap duro alcanzado';
  if (soft && ms >= soft) return hard ? 'Cap blando · duro en ' + fmt(hard - ms) : 'Cap blando alcanzado';
  if (soft) return 'Cap blando en ' + fmt(soft - ms);
  if (hard) return 'Cap duro en ' + fmt(hard - ms);
  return '';
}

/* ---------- proporción mixta (ABBA) ---------- */
// Punto 1: A; puntos 2 y 3: B; puntos 4 y 5: A; y así.
export function ratioFor(pointIdx) {
  const c = cfg(); if (!c.mixed) return null;
  const base = c.startRatio, other = base === '4M3F' ? '3M4F' : '4M3F';
  let r = base;
  if (c.abba) r = (((pointIdx + 1) >> 1) % 2 === 0) ? base : other;
  return r;
}
export function reqCounts(r) { return r === '4M3F' ? { M: 4, F: 3 } : { M: 3, F: 4 }; }
export function ratioText(r) { return r === '4M3F' ? '4 masc. / 3 fem.' : '3 masc. / 4 fem.'; }

/* ---------- calcular el estado repasando los eventos ---------- */
export function derive() {
  const g = store.game, c = cfg();
  const s = {
    us: 0, them: 0, point: 1, phase: 'line', offense: g.firstOffense, possession: null, holder: null,
    line: [], lastLine: [], chain: [], stats: {}, pulls: [], calls: [], to: { us: 0, them: 0 },
    half: false, ended: false, log: [], last: null, pointLog: []
  };
  function st(id) {
    return s.stats[id] || (s.stats[id] = { pts: 0, goals: 0, ast: 0, comp: 0, catches: 0, thr: 0, drop: 0, stall: 0, blk: 0 });
  }
  function turn(team) { s.possession = team; s.holder = null; s.chain.push({ x: true }); }
  function endPoint(w) {
    s.pointLog.push({ point: s.point, winner: w, offense: s.offense, line: s.line.slice() });
    s.lastLine = s.line.slice(); s.point++; s.phase = 'line'; s.possession = null; s.holder = null; s.chain = [];
    s.offense = (w === 'us') ? 'them' : 'us';
    if (!s.half && c.halfAt && Math.max(s.us, s.them) >= c.halfAt) {
      s.half = true; s.offense = (g.firstOffense === 'us') ? 'them' : 'us';
    }
    if (s.us >= c.pointsToWin || s.them >= c.pointsToWin) { s.ended = true; s.phase = 'ended'; }
  }
  g.events.forEach(function (e) {
    s.log.push({ e: e, point: s.point });
    switch (e.type) {
      case 'line': s.line = e.players.slice(); s.phase = 'pull'; s.chain = []; e.players.forEach(function (id) { st(id).pts++; }); break;
      case 'pull': s.pulls.push(Object.assign({ point: s.point }, e)); s.phase = 'play'; s.possession = s.offense; s.holder = null; break;
      case 'pickup': s.holder = e.player; s.chain.push({ id: e.player }); break;
      case 'pass': st(e.from).comp++; st(e.to).catches++; s.holder = e.to; s.chain.push({ id: e.to }); break;
      case 'goal': if (e.from) { st(e.from).ast++; st(e.from).comp++; } st(e.to).goals++; st(e.to).catches++; s.us++; endPoint('us'); break;
      case 'themGoal': s.them++; endPoint('them'); break;
      case 'throwaway': st(e.player).thr++; turn('them'); break;
      case 'stall': st(e.player).stall++; turn('them'); break;
      case 'drop': st(e.player).drop++; turn('them'); break;
      case 'block': st(e.player).blk++; turn('us'); break;
      case 'themTurn': turn('us'); break;
      case 'call': s.calls.push(Object.assign({ point: s.point }, e)); if (e.possession && s.possession && e.possession !== s.possession) turn(e.possession); break;
      case 'timeout': s.to[e.team]++; break;
      case 'end': s.ended = true; s.phase = 'ended'; break;
    }
    s.last = e;
  });
  return s;
}

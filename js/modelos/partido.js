// Reglas del partido: reloj, caps, medio tiempo, proporción ABBA y el cálculo del marcador.
// El partido se guarda como una lista de eventos; derive() la recorre de
// principio a fin y calcula el marcador, la posesión y las estadísticas.
import { store, cfg } from '../almacen.js';
import { fmt } from '../util/formato.js';

/* ---------- reloj ---------- */
// El reloj parte cuando sale el primer pull (game.start) y no se detiene,
// ni siquiera en los timeouts. Se congela al terminar el partido.
export function elapsed() {
  const g = store.game; if (!g || !g.start) return 0;
  return (g.finishedAt || Date.now()) - g.start;
}
export function clockRunning() { return !!(store.game && store.game.start && !store.game.finishedAt); }

export function tiempoCumplido() {
  const h = cfg().hardCap;
  return !!(h && elapsed() >= h * 60000);
}

// Texto bajo el reloj: caps, medio tiempo por tiempo y fin del partido.
export function capInfo(s) {
  const c = cfg(), ms = elapsed(), soft = c.softCap * 60000, hard = c.hardCap * 60000;
  if (s && s.ended) return '';
  if (hard && ms >= hard) return 'Tiempo cumplido';
  if (s && !s.half && c.halfMode !== 'points' && c.halfMin && ms >= c.halfMin * 60000) return 'Medio tiempo al terminar el punto';
  if (soft && ms >= soft) return hard ? 'Cap blando · fin en ' + fmt(hard - ms) : 'Cap blando alcanzado';
  if (soft) return 'Cap blando en ' + fmt(soft - ms);
  if (hard) return 'Fin en ' + fmt(hard - ms);
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
// Internamente '4M3F' = 4 hombres y 3 mujeres; '3M4F' = 3 hombres y 4 mujeres.
export function ratioText(r) { return r === '4M3F' ? '4 hombres / 3 mujeres' : '3 hombres / 4 mujeres'; }

/* ---------- calcular el estado repasando los eventos ---------- */
// s.offense = equipo que RECIBE el pull del punto (el otro lo saca).
export function derive() {
  const g = store.game, c = cfg();
  const s = {
    us: 0, them: 0, point: 1, phase: 'line', offense: g.firstOffense, possession: null, holder: null,
    line: [], lastLine: [], chain: [], stats: {}, pulls: [], calls: [], to: { us: 0, them: 0 },
    half: false, halfPoint: null, ended: false, log: [], last: null, pointLog: []
  };
  let inicioPunto = null; // tiempo de juego en que salió el pull del punto
  function st(id) {
    return s.stats[id] || (s.stats[id] = {
      pts: 0, ms: 0, goals: 0, ast: 0, comp: 0, catches: 0, thr: 0, drop: 0, stall: 0, blk: 0,
      pulls: 0, pullIn: 0, pullOut: 0, hangMs: 0, hangN: 0 // pulls sacados, dentro, fuera y tiempo de vuelo medido
    });
  }
  function turn(team) { s.possession = team; s.holder = null; s.chain.push({ x: true }); }
  function endPoint(w, e) {
    // Minutos jugados: duración del punto (desde el pull hasta el gol) para cada jugador de la línea.
    const dur = inicioPunto != null ? Math.max(0, (e.t || 0) - inicioPunto) : 0;
    s.line.forEach(function (id) { st(id).ms += dur; });
    inicioPunto = null;
    s.pointLog.push({ point: s.point, winner: w, offense: s.offense, line: s.line.slice(), ms: dur });
    s.lastLine = s.line.slice(); s.point++; s.phase = 'line'; s.possession = null; s.holder = null; s.chain = [];
    // Saca el pull el equipo que anotó; recibe el otro.
    s.offense = (w === 'us') ? 'them' : 'us';
    const porPuntos = !!(c.halfAt && Math.max(s.us, s.them) >= c.halfAt);
    const porTiempo = !!(c.halfMin && (e.t || 0) >= c.halfMin * 60000);
    const llegaMedio = c.halfMode === 'time' ? porTiempo
      : c.halfMode === 'first' ? (porPuntos || porTiempo)
      : porPuntos;
    if (!s.half && llegaMedio) {
      // En la segunda mitad recibe el equipo que sacó el primer pull.
      s.half = true; s.halfPoint = s.point;
      s.offense = (g.firstOffense === 'us') ? 'them' : 'us';
    }
    if (s.us >= c.pointsToWin || s.them >= c.pointsToWin) { s.ended = true; s.phase = 'ended'; }
  }
  g.events.forEach(function (e) {
    s.log.push({ e: e, point: s.point });
    switch (e.type) {
      case 'line': s.line = e.players.slice(); s.phase = 'pull'; s.chain = []; e.players.forEach(function (id) { st(id).pts++; }); break;
      case 'pull':
        s.pulls.push(Object.assign({ point: s.point }, e)); s.phase = 'play'; s.possession = s.offense; s.holder = null; inicioPunto = e.t || 0;
        if (e.team === 'us' && e.player) {
          const x = st(e.player);
          x.pulls++;
          if (e.inBounds) x.pullIn++; else x.pullOut++;
          if (e.hang != null) { x.hangMs += e.hang; x.hangN++; }
        }
        break;
      case 'pickup': s.holder = e.player; s.chain.push({ id: e.player }); break;
      case 'pass': st(e.from).comp++; st(e.to).catches++; s.holder = e.to; s.chain.push({ id: e.to }); break;
      case 'goal': if (e.from) { st(e.from).ast++; st(e.from).comp++; } st(e.to).goals++; st(e.to).catches++; s.us++; endPoint('us', e); break;
      case 'themGoal': s.them++; endPoint('them', e); break;
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
  // Racha: cuántos puntos seguidos lleva jugando cada uno (contando desde el último).
  s.racha = {};
  for (let i = s.pointLog.length - 1; i >= 0; i--) {
    const linea = s.pointLog[i].line;
    Object.keys(s.stats).forEach(function (id) {
      if (s.racha[id] === undefined) s.racha[id] = 0;
      if (s.racha[id] === s.pointLog.length - 1 - i && linea.indexOf(id) >= 0) s.racha[id]++;
    });
  }
  // Timeout en curso: el último evento es un timeout que aún no se reanuda.
  s.timeout = (s.last && s.last.type === 'timeout' && !s.last.fin && !s.ended) ? s.last : null;
  return s;
}

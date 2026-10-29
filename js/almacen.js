// Guarda y lee los datos en el propio teléfono (no se envía nada a internet).
// Por ahora se usa localStorage, con la misma clave del prototipo.
// Más adelante, al guardar varios partidos, se pasará a IndexedDB.

const KEY = 'ufs-v1';

export const DEF_CFG = {
  club: 'Mi Club', rival: 'Rival',
  pointsToWin: 15,
  halfMode: 'points',   // medio tiempo 'points' (por puntos) o 'time' (por minutos)
  halfAt: 8,            // puntos para el medio tiempo
  halfMin: 0,           // minutos para el medio tiempo
  timeouts: 2,          // timeouts por equipo
  toSecs: 60,           // duración de cada timeout, en segundos
  softCap: 0,           // cap blando, en minutos (0 = sin cap)
  hardCap: 0,           // duración total del partido, en minutos (0 = sin límite)
  firstPull: 'us',      // quién saca el primer pull
  lineMode: 'competencia', // criterio de sugerencia: 'competencia', 'amistoso' o 'entrenamiento'
  compMargin: 3,        // en Competencia, ventaja desde la que se rota
  mixed: true, startRatio: '4M3F', abba: true
};

function cargar() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) {
      const d = JSON.parse(r);
      d.cfg = Object.assign({}, DEF_CFG, d.cfg || {});
      d.roster = d.roster || [];
      d.game = d.game || null;
      // Partidos guardados con el reloj antiguo (que se iniciaba a mano).
      if (d.game && d.game.clock && d.game.start === undefined) {
        const c = d.game.clock;
        d.game.start = c.since ? c.since - c.acc : (c.acc ? Date.now() - c.acc : null);
        delete d.game.clock;
      }
      return d;
    }
  } catch (e) {}
  return { cfg: Object.assign({}, DEF_CFG), roster: [], game: null };
}

// store = todo lo guardado: configuración (cfg), plantel (roster) y partido en curso (game).
// game.start = hora en que salió el primer pull (ahí parte el reloj del partido).
export const store = cargar();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
}

export function cfg() { return store.cfg; }

// Pide al navegador que no borre estos datos aunque falte espacio.
export function pedirAlmacenPersistente() {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  } catch (e) {}
}

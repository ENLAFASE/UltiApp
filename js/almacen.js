// Guarda y lee los datos en el propio teléfono (no se envía nada a internet).
// Por ahora se usa localStorage, con la misma clave del prototipo.
// Más adelante, al guardar varios partidos, se pasará a IndexedDB.

const KEY = 'ufs-v1';

export const DEF_CFG = {
  club: 'Mi Club', rival: 'Rival', pointsToWin: 15, halfAt: 8, timeouts: 2,
  softCap: 0, hardCap: 0, mixed: true, startRatio: '4M3F', abba: true
};

function cargar() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) {
      const d = JSON.parse(r);
      d.cfg = Object.assign({}, DEF_CFG, d.cfg || {});
      d.roster = d.roster || [];
      d.game = d.game || null;
      return d;
    }
  } catch (e) {}
  return { cfg: Object.assign({}, DEF_CFG), roster: [], game: null };
}

// store = todo lo guardado: configuración (cfg), plantel (roster) y partido en curso (game)
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

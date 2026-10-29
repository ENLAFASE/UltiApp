// Guarda y lee los datos en el propio teléfono (no se envía nada a internet).
// Por ahora se usa localStorage, con la misma clave del prototipo.
// Más adelante, al guardar varios partidos, se pasará a IndexedDB.

const KEY = 'ufs-v1';

export const DEF_CFG = {
  club: 'Húsares', rival: 'Rival',
  pointsToWin: 15,
  // Medio tiempo: 'points' (por puntos), 'time' (por minutos) o
  // 'first' (lo que ocurra primero: los puntos o, cumplido el tiempo, al terminar el punto).
  halfMode: 'first',
  halfAt: 8,            // puntos para el medio tiempo
  halfMin: 0,           // minutos para el medio tiempo
  timeouts: 2,          // timeouts por equipo
  toSecs: 60,           // duración de cada timeout, en segundos
  softCap: 0,           // cap blando, en minutos (0 = sin cap)
  hardCap: 0,           // duración total del partido, en minutos (0 = sin límite)
  firstPull: 'us',      // quién saca el primer pull
  // Criterio de sugerencia de línea (ver js/criterio/).
  lineMode: 'competencia', // 'competencia', 'amistoso' o 'entrenamiento'
  compModo: 'auto',     // en Competencia: 'auto' (según marcador), 'ataque' o 'fuerte'
  rivalNivel: 'similar', // 'menor', 'similar' o 'mayor'
  crucial: false,       // partido que hay que ganar sí o sí
  margenVentaja: 4,     // ganando por esto o más: rotación con piezas clave
  margenDesventaja: 6,  // perdiendo por esto o más: descanso de las piezas clave
  // Tipo de partido: 'mixto', 'open' o 'femenino'. "mixed" se mantiene
  // sincronizado (true solo en mixto) porque lo usa el resto de la app.
  division: 'mixto',
  mixed: true, startRatio: '4M3F', abba: true
};

// Jugadores que no corresponden a la categoría ('M' = hombre, 'F' = mujer).
export function generoFueraDeCategoria(division) {
  return division === 'femenino' ? 'M' : division === 'open' ? 'F' : null;
}

// Al cambiar el tipo de partido, marca automáticamente como no convocados a
// los jugadores del género que no corresponde, y vuelve a convocar a los que
// habían quedado fuera solo por la categoría anterior.
export function aplicarCategoria(d) {
  const fuera = generoFueraDeCategoria(d.cfg.division);
  d.roster.forEach(function (p) {
    if (fuera && p.g === fuera) {
      if (!p.noConv) { p.noConv = true; p.noConvAuto = true; }
    } else if (p.noConvAuto) {
      p.noConv = false; p.noConvAuto = false;
    }
  });
}

function cargar() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) {
      const d = JSON.parse(r);
      const viejo = d.cfg || {};
      d.cfg = Object.assign({}, DEF_CFG, viejo);
      // Versiones anteriores: "partido mixto" (sí/no) pasa a tipo de partido.
      if (!viejo.division) d.cfg.division = viejo.mixed === false ? 'open' : 'mixto';
      d.cfg.mixed = d.cfg.division === 'mixto';
      // El antiguo "margen para rotar" se reemplaza por los márgenes de ventaja (+4)
      // y desventaja (-6), con los valores por defecto pedidos.
      delete d.cfg.compMargin;
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

// Guarda y lee los datos en el propio teléfono (no se envía nada a internet).
// Por ahora se usa localStorage, con la misma clave del prototipo.
// Más adelante, al guardar varios partidos, se pasará a IndexedDB.

const KEY = 'ufs-v1';

export const DEF_CFG = {
  club: 'Húsares Mix', rival: 'Rival',
  equipo: 'mix',        // equipo del club: 'mix', 'open', 'husarex' u 'otro' (ver EQUIPOS)
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

// Equipos del club. Elegir uno deja puesto el nombre y el tipo de partido.
// El plantel es uno solo: en Open y Husarex (open) las jugadoras pasan solas a no convocadas.
export const EQUIPOS = {
  mix: { nombre: 'Húsares Mix', corto: 'Mix', detalle: 'Mixto', division: 'mixto' },
  open: { nombre: 'Húsares Open', corto: 'Open', detalle: 'Open', division: 'open' },
  // Husarex: rama master (más de 32 años) que juega open.
  husarex: { nombre: 'Husarex', corto: 'Husarex', detalle: 'Master +32', division: 'open' }
};

// Jugadores que no corresponden a la categoría ('M' = hombre, 'F' = mujer).
export function generoFueraDeCategoria(division) {
  return division === 'femenino' ? 'M' : division === 'open' ? 'F' : null;
}

// Ramas en que juega cada jugador (p.ramas), por ejemplo ['mix', 'husarex'].
// Un jugador puede estar en varias.
export function ramasDe(p) { return Array.isArray(p.ramas) ? p.ramas : []; }

// Convocatoria del próximo partido (p.noConv = no convocado):
// - equipo del club: se convoca a quienes juegan en esa rama;
// - otro equipo: según la categoría (open/femenino deja fuera al otro género).
export function aplicarCategoria(d) {
  const eq = d.cfg.equipo, fuera = generoFueraDeCategoria(d.cfg.division);
  d.roster.forEach(function (p) {
    p.noConv = EQUIPOS[eq] ? ramasDe(p).indexOf(eq) < 0 : !!(fuera && p.g === fuera);
    delete p.noConvAuto;
  });
}

// Ramas por defecto para jugadores guardados antes de que existieran las ramas.
function ramasIniciales(p) { return p.g === 'F' ? ['mix'] : ['mix', 'open']; }

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
      // Datos sin equipo elegido: se deduce del nombre y la categoría.
      if (!viejo.equipo) {
        if (/h[uú]sare[sx]/i.test(d.cfg.club || '')) {
          d.cfg.equipo = /husarex/i.test(d.cfg.club) ? 'husarex' : d.cfg.division === 'open' ? 'open' : 'mix';
          d.cfg.club = EQUIPOS[d.cfg.equipo].nombre;
        } else d.cfg.equipo = 'otro';
      }
      // Un equipo del club siempre usa su categoría (por ejemplo, Husarex pasó a open).
      const eq = EQUIPOS[d.cfg.equipo];
      if (eq && d.cfg.division !== eq.division) {
        d.cfg.division = eq.division; d.cfg.mixed = eq.division === 'mixto';
        d.roster = d.roster || [];
        aplicarCategoria(d);
      }
      // El antiguo "margen para rotar" se reemplaza por los márgenes de ventaja (+4)
      // y desventaja (-6), con los valores por defecto pedidos.
      delete d.cfg.compMargin;
      d.roster = d.roster || [];
      d.roster.forEach(function (p) { if (!Array.isArray(p.ramas)) p.ramas = ramasIniciales(p); });
      d.game = d.game || null;
      d.historial = d.historial || []; // partidos guardados (Dashboard)
      // Partidos guardados con el reloj antiguo (que se iniciaba a mano).
      if (d.game && d.game.clock && d.game.start === undefined) {
        const c = d.game.clock;
        d.game.start = c.since ? c.since - c.acc : (c.acc ? Date.now() - c.acc : null);
        delete d.game.clock;
      }
      return d;
    }
  } catch (e) {}
  return { cfg: Object.assign({}, DEF_CFG), roster: [], game: null, historial: [] };
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

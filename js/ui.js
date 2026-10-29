// Estado temporal de la pantalla (qué pestaña está abierta, qué jugadores
// están marcados, etc.). No se guarda: se pierde al cerrar la app.
import { store } from './almacen.js';

export const ui = {
  tab: store.game || store.roster.length ? 'game' : 'roster',
  view: null,          // 'call' mientras se registra un llamado
  sel: [],             // jugadores marcados para la línea
  selFor: null,
  ratioSwap: false,
  sug: null,           // última sugerencia de línea y su explicación
  rankRol: 'man',      // posición que muestra el ranking del plantel
  pull: null,          // pasos del pull en curso
  pick: null,          // elegir jugador (gol, drop, block)
  call: null,
  modal: null,
  toast: null,
  ignoreClickUntil: 0, // evita toques "fantasma" justo después de cronometrar
  // jugador nuevo: g 'M' = hombre, 'F' = mujer; ramas = equipos del club en que juega
  newP: { num: '', name: '', g: 'M', ramas: [store.cfg.equipo && store.cfg.equipo !== 'otro' ? store.cfg.equipo : 'mix'] },
  plRama: 'todos',     // filtro de rama en Plantel
  verOtros: false,     // en Nuevo partido: mostrar jugadores de otras ramas
  bulk: '',
  copiaQue: 'todos',   // qué copiar como texto en Plantel: 'todos', 'conv' o 'noconv'
  dash: null,          // Dashboard: 'actual' (este partido) o 'historial'
  dashEq: 'todos',     // filtro de equipo del historial
  dashRank: 'goals',   // orden del ranking de jugadores
  dashVer: null,       // partido del historial abierto en detalle
  abiertos: {}         // secciones abiertas en Ajustes (tiempos, motor, mapa)
};

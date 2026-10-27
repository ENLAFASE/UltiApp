// Tipos de evento del partido y su descripción en palabras.
// Cada cosa que pasa en la cancha (línea, pull, pase, gol, llamado...) es un evento.
import { cfg } from '../almacen.js';
import { short } from './jugador.js';

export const KINDS = ['Foul', 'Pick', 'Travel', 'Strip', 'Dentro/Fuera', 'Down', 'Contacto', 'Stall', 'Otro'];
export const RES = {
  aceptado: 'Aceptado (no contestado)',
  contestado: 'Contestado, disco vuelve',
  retirado: 'Retirado',
  observador: 'Decisión de observador'
};
export const RES_SHORT = { aceptado: 'Aceptado', contestado: 'Contestado', retirado: 'Retirado', observador: 'Observador' };

export function teamName(t) { return t === 'us' ? cfg().club : cfg().rival; }

export function describe(e) {
  switch (e.type) {
    case 'line': return 'Línea: ' + e.players.map(short).join(' ');
    case 'pull': return 'Pull de ' + teamName(e.team) + (e.player ? ' (' + short(e.player) + ')' : '') +
      (e.hang != null ? ', ' + (e.hang / 1000).toFixed(2) + ' s' : '') + ', ' + (e.inBounds ? 'dentro' : 'fuera');
    case 'pickup': return 'Levanta ' + short(e.player);
    case 'pass': return 'Pase ' + short(e.from) + ' a ' + short(e.to);
    case 'goal': return 'Gol de ' + short(e.to) + (e.from ? ', asistencia ' + short(e.from) : '');
    case 'themGoal': return 'Gol de ' + cfg().rival;
    case 'throwaway': return 'Throwaway de ' + short(e.player);
    case 'stall': return 'Stall a ' + short(e.player);
    case 'drop': return 'Drop de ' + short(e.player);
    case 'block': return 'Block de ' + short(e.player);
    case 'themTurn': return 'Turnover de ' + cfg().rival;
    case 'call': return 'Llamado de ' + teamName(e.team) + ': ' + e.kind +
      (e.player ? ' (' + (e.team === 'us' ? short(e.player) : '#' + e.player) + ')' : '') + ', ' + RES_SHORT[e.res];
    case 'timeout': return 'Timeout de ' + teamName(e.team);
    case 'end': return 'Partido finalizado';
  }
  return e.type;
}

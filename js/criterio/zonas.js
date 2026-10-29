// ============================================================================
//  CRITERIO · ZONAS DEL MARCADOR (solo para "Competencia")
//  Según el marcador, el motor decide qué modalidad aplicar en el punto:
//
//    Asegurar el ataque   inicio del partido, parejo o ventaja moderada.
//                         En ataque: la mejor línea ofensiva. En defensa:
//                         descansa el núcleo ofensivo para el próximo ataque.
//    Línea fuerte         leve desventaja (hay que remontar), cierre de un
//                         partido parejo o partido crucial.
//    Rotación con clave   ventaja amplia (margen de ventaja o más): minutos
//                         para jugadores de menor nivel, con la estructura
//                         (manejo, avance, gol) asegurada por piezas clave.
//    Descanso de clave    desventaja amplia (margen de desventaja o más):
//                         descansan las piezas clave, ya es difícil remontar.
//
//  El análisis completo de por qué cada zona está donde está se encuentra en
//  docs/criterio.md.
// ============================================================================
import { PARAM } from './parametros.js';

export const ZONAS = {
  ataque: { nombre: 'Asegurar el ataque', corto: 'Asegurar ataque', clase: 'z-ataque',
    ayuda: 'En ataque, la mejor línea ofensiva para no perder el punto. En defensa, descansa el núcleo ofensivo para el próximo ataque.' },
  fuerte: { nombre: 'Línea fuerte', corto: 'Línea fuerte', clase: 'z-fuerte',
    ayuda: 'La mejor combinación posible, vayamos en ataque o en defensa. Para remontar, cerrar un partido parejo o ganar sí o sí.' },
  rotacion: { nombre: 'Rotación con piezas clave', corto: 'Rotación', clase: 'z-rotacion',
    ayuda: 'Vamos ganando por el margen de ventaja o más: minutos para jugadores de menor nivel, con manejo, corte de avance y corte de gol asegurados por piezas clave.' },
  descanso: { nombre: 'Descanso de piezas clave', corto: 'Descanso clave', clase: 'z-descanso',
    ayuda: 'Vamos perdiendo por el margen de desventaja o más: descansan las piezas clave. Igual se busca el mejor manejo disponible fuera de ellas.' }
};

export const MODALIDADES = {
  auto: 'Automática (según el marcador)',
  ataque: ZONAS.ataque.nombre,
  fuerte: ZONAS.fuerte.nombre
};

// Márgenes efectivos, ajustados por el nivel del rival y si el partido es crucial.
export function margenes(c) {
  let v = Math.max(1, c.margenVentaja || 4);
  if (c.rivalNivel === 'mayor') v += PARAM.AJUSTE_RIVAL_MAYOR;
  if (c.rivalNivel === 'menor') v += PARAM.AJUSTE_RIVAL_MENOR;
  if (c.crucial) v += PARAM.AJUSTE_CRUCIAL;
  const d = c.crucial ? Infinity : Math.max(1, c.margenDesventaja || 6); // si es crucial no se baja los brazos
  return { ventaja: Math.max(1, v), desventaja: d };
}

// us, them = marcador; c = configuración. Devuelve { id, motivo }.
export function zonaDelMarcador(us, them, c) {
  const dif = us - them, total = us + them, meta = c.pointsToWin || 15;
  const m = margenes(c);
  const cierre = Math.max(us, them) >= meta - PARAM.CIERRE_PUNTOS;
  const inicio = total < PARAM.INICIO_PUNTOS;
  const marcador = dif === 0 ? 'Empatados' : dif > 0 ? 'Ganamos por ' + dif : 'Perdemos por ' + (-dif);

  if (dif >= m.ventaja) return { id: 'rotacion', motivo: marcador + ' (margen de ventaja +' + m.ventaja + ')' };
  if (-dif >= m.desventaja) return { id: 'descanso', motivo: marcador + ' (margen de desventaja −' + m.desventaja + ')' };
  if (c.compModo === 'ataque' || c.compModo === 'fuerte') return { id: c.compModo, motivo: marcador + ' · modalidad fijada en Ajustes' };
  if (dif < 0) return { id: 'fuerte', motivo: marcador + ': hay que remontar' };
  if (c.crucial) return { id: 'fuerte', motivo: marcador + ' en partido crucial' };
  if (cierre && dif <= PARAM.PAREJO) return { id: 'fuerte', motivo: marcador + ' en el cierre del partido' };
  if (inicio) return { id: 'ataque', motivo: 'Inicio del partido' };
  return { id: 'ataque', motivo: marcador };
}

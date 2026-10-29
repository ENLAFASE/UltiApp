// ============================================================================
//  CRITERIO · PARÁMETROS
//  Todos los números que usa el "motor de juego" para decidir líneas están
//  aquí, en un solo lugar. Cuando tengamos feedback de la cancha, se ajustan
//  estos valores sin tocar el resto del código.
// ============================================================================

export const PARAM = {
  // Evaluación (1 a 5)
  NOTA_BUENA: 4,          // desde esta nota alguien es "bueno" en un rol
  NOTA_MIN_MANEJO: 3,     // si el mejor manejo de la línea está bajo esto: alerta "sin manejo"
  NIVEL_SIN_EVALUAR: 3,   // nota que se asume si el jugador no está evaluado

  // Cómo se combina la evaluación en un "nivel" según el tipo de punto.
  // ofensa = promedio ponderado de manejo, corte de avance y corte de gol.
  PESO_ROLES_OFENSA: { man: 0.4, av: 0.3, gol: 0.3 },
  PESO_ATAQUE: { ofensa: 0.75, defensa: 0.25 },   // puntos en que recibimos
  PESO_DEFENSA: { ofensa: 0.35, defensa: 0.65 },  // puntos en que sacamos
  PESO_GENERAL: { ofensa: 0.55, defensa: 0.45 },  // "línea fuerte" y ranking general

  // Piezas clave: el mejor tramo del plantel convocado (por género si es mixto).
  PIEZAS_CLAVE_FRACCION: 0.35,

  // Zonas del marcador
  INICIO_PUNTOS: 4,       // si se han jugado menos de estos puntos en total: "inicio del partido"
  CIERRE_PUNTOS: 3,       // si algún equipo está a esta distancia de ganar: "cierre"
  PAREJO: 1,              // diferencia que se considera partido parejo
  AJUSTE_RIVAL_MAYOR: 2,  // contra un rival mayor, la ventaja para rotar sube en esto
  AJUSTE_RIVAL_MENOR: -1, // contra un rival menor, baja en esto
  AJUSTE_CRUCIAL: 2,      // en un partido crucial, la ventaja para rotar sube en esto

  // Desgaste
  BONO_DESCANSO: { fuerte: 0.3, ataque: 0.4, poca: 0.8, rotacion: 1.0 }, // premio por haber descansado el punto anterior
  CASTIGO_RACHA: 0.35,    // por cada punto seguido jugado desde el 2.º en adelante
  CASTIGO_PUNTOS: 0.05,   // por cada punto jugado en el partido (reparte minutos)
  CASTIGO_NUCLEO_ATAQUE: 1.5 // en "asegurar el ataque", lo que se castiga en defensa a quien es del núcleo ofensivo
};

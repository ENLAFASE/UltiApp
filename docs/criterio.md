# Criterio de sugerencia de líneas ("motor de juego")

Este documento explica cómo decide la app qué línea sugerir, en el criterio **Competencia**. El código está separado en `js/criterio/` para poder pulirlo con el feedback de la cancha:

| Archivo | Qué contiene |
|---|---|
| `parametros.js` | **Todos los números ajustables** (notas, pesos, márgenes, castigos por desgaste). Se cambian aquí sin tocar el resto. |
| `zonas.js` | Qué modalidad aplica según el marcador. |
| `metricas.js` | Cómo se mide un jugador, una línea y el plantel. |
| `recomendador.js` | Cómo se arma la línea de 7 en cada modalidad. |

## 1. El árbol de marcadores

Un partido a 15 tiene **225 marcadores en juego** (de 0-0 a 14-14). Los marcadores finales (15-x o x-15) no necesitan sugerencia. Desde cada marcador solo hay dos caminos: anotamos nosotros o anota el rival.

Lo que importa para decidir la línea no es el marcador exacto, sino tres cosas:

1. **La diferencia** (nosotros − rival): ¿vamos cómodos, parejos o abajo?
2. **El momento**: inicio (menos de 4 puntos jugados), medio o **cierre** (algún equipo a 3 o menos de ganar).
3. **El contexto**: nivel del rival y si el partido es crucial.

Con eso, el árbol se agrupa en **cuatro zonas**:

| Zona | Cuándo (ajustes por defecto) | Qué hace |
|---|---|---|
| **Asegurar el ataque** | Inicio, empate o ventaja de +1 a +3 | En **ataque**: la mejor línea ofensiva para no perder el punto. En **defensa**: descansa el núcleo ofensivo para el próximo ataque. |
| **Línea fuerte** | Desventaja de −1 a −5, cierre parejo (diferencia ≤ 1 con alguien a 3 o menos de ganar), o partido crucial | La mejor combinación, en ataque o en defensa. |
| **Rotación con piezas clave** | Ventaja de **+4** o más | La estructura (manejo, corte de avance, corte de gol) con piezas clave; el resto, minutos para jugadores de menor nivel. |
| **Descanso de piezas clave** | Desventaja de **−6** o más | Descansan las piezas clave; se busca el mejor manejo disponible fuera de ellas. |

Con los ajustes por defecto (rival similar, no crucial), los 225 marcadores se reparten así: **48** asegurar el ataque, **66** línea fuerte, **66** rotación y **45** descanso. El mapa en **Ajustes → Criterio** muestra esta división con los ajustes actuales.

### Ajustes que mueven las zonas

- **Margen de ventaja** (+4) y **margen de desventaja** (−6): se cambian en Ajustes.
- **Rival mayor**: la ventaja para rotar sube +2 (no se relaja tan pronto).
- **Rival menor**: la ventaja para rotar baja 1.
- **Partido crucial**: la ventaja para rotar sube +2, **nunca** se da descanso a las piezas clave y, sin ventaja amplia, siempre es línea fuerte.
- **Modalidad fija**: "Asegurar el ataque" o "Línea fuerte" reemplaza la elección automática, pero los márgenes se siguen aplicando.

## 2. Ataque y defensa dentro del árbol

En Ultimate saca el pull quien anotó. Por eso:

- Después de **anotar nosotros**, el punto siguiente es de **defensa**.
- Después de **anotar el rival**, el punto siguiente es de **ataque**.
- Si los dos equipos "mantienen el saque" (cada uno anota cuando recibe), se alterna ataque–defensa.
- Si **quebramos** (anotamos en defensa), volvemos a defender. La línea de defensa puede jugar varios puntos seguidos, y ahí el desgaste importa: el motor castiga cada punto seguido desde el segundo.
- En el **medio tiempo** se invierte: recibe quien sacó el primer pull.

Empezar en ataque o en defensa no cambia la zona (la zona depende del marcador). Sí cambia **qué línea** se arma dentro de la zona:

- En "Asegurar el ataque", un punto de ataque usa la mejor línea ofensiva, y uno de defensa deja descansar a esa línea.
- En las otras zonas, el nivel de cada jugador se calcula distinto: en ataque pesa más lo ofensivo y en defensa, la defensa.

## 3. Proporción de géneros (mixto)

Con la regla ABBA, la proporción cambia cada dos puntos, **sin importar** si se ataca o se defiende. Así, en un partido aparecen las cuatro combinaciones: ataque con 4H, ataque con 4M, defensa con 4H y defensa con 4M. Por eso el motor:

- Calcula las **piezas clave por género** (el mejor 35 % de hombres y de mujeres), para que siempre haya piezas clave de ambos.
- Arma la línea respetando los cupos del punto (por ejemplo, 3H y 4M) también cuando asegura la estructura.
- Si todos los buenos manejos son de un solo género, la pestaña **Plantel** lo avisa: en los puntos con menos cupos de ese género, el manejo puede quedar débil.

## 4. Estructura y desgaste

- **Estructura**: en Competencia y Amistoso, cada línea lleva un manejo, un corte de avance y un corte de gol buenos (nota 4 o más, o la mejor disponible). Cada rol lo cubre **una persona distinta**.
- **Desgaste**: puntos jugados, minutos jugados (desde el pull hasta el gol de cada punto) y puntos seguidos. Se ve en cada botón de jugador ("3p 6'") y en la tarjeta de la línea.

## 5. Qué falta pulir (con feedback de cancha)

- Ajustar en `parametros.js` los pesos y castigos según cómo se sientan las sugerencias en partidos reales.
- Considerar el **tiempo** (cap blando y duro) además del marcador: con poco tiempo, una ventaja de +2 vale más.
- Diferenciar el "núcleo ofensivo" de la "línea de defensa" a partir de los resultados reales de cada línea (holds y breaks).
- Registrar el nivel del rival por partido (hoy es un ajuste general).

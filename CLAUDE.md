# UltiApp — App de Ultimate Frisbee

App para registrar y analizar partidos de Ultimate Frisbee. Nace en un club chileno con 9 años de trayectoria (Pro Ultimate). Meta a largo plazo: ofrecerla a la Federación Chilena de Disco Volador.

El punto de partida es `ultimate-estadistico.html`, un prototipo funcional de una sola página. Se guarda sin cambios en `prototipo/` como referencia y se migra por partes a la estructura de abajo.

## Sobre quien desarrolla

El dueño del proyecto no es programador profesional. Explicar cada paso de forma sencilla, en español, sin dar por sabido el vocabulario técnico. Preferir soluciones simples y fáciles de mantener sobre soluciones "elegantes".

## Visión: tres modalidades

> **Importante (aclarado por el usuario el 2026-10-27):** la app que estamos construyendo ahora **es la modalidad Coach**: registro detallado (líneas, pull cronometrado, pases, llamados), evaluación de jugadores y recomendador de líneas. El **Planillero** se hará después como una versión **aún más simple**, que solo registre estadísticas y controle los tiempos de juego.

### 1. Planillero (libre, sin cuenta) — pendiente, versión simplificada
- Solo registrar estadísticas básicas del partido (marcador, goles, asistencias, defensas) y controlar los tiempos (reloj, caps, medio tiempo, timeouts).
- Sin evaluación de jugadores ni recomendador.

### 2. Coach (restringido; cuentas aprobadas por el administrador) — **en construcción**
- Todo el registro del partido: línea con proporción mixta ABBA, pull (quién saca, tiempo de vuelo, dentro/fuera), recepción y pases, goles, asistencias, turnovers, defensas, llamados (equipo que llama, tipo, resolución, posesión), timeouts con cuenta regresiva.
- Evaluación **privada** de jugadores, 1 a 5 en: manejo, corte de avance, corte de gol y defensa (`js/coach/evaluacion.js`).
- Recomendador de líneas ("motor de juego") que **explica** por qué sugiere cada jugador. Todo el criterio está aislado en `js/criterio/` para pulirlo con feedback de cancha; el análisis completo está en `docs/criterio.md`. Tres criterios:
  - **Competencia:** según la zona del marcador (`zonas.js`): asegurar el ataque (inicio, parejo, ventaja moderada), línea fuerte (leve desventaja, cierre parejo, partido crucial), rotación con piezas clave (ventaja ≥ margen de ventaja, por defecto +4) y descanso de piezas clave (desventaja ≥ margen de desventaja, por defecto −6). Ajustes: modalidad (automática o fija), nivel del rival y partido crucial. Siempre asegura la columna vertical con 3 personas distintas.
  - **Amistoso:** rota, pero asegura una columna vertical de 3: un manejo, un corte de avance y un corte de gol principales (nota 4 o más).
  - **Entrenamiento:** rotación pareja (descansó el punto anterior, menos puntos jugados).
  - Siempre 7 jugadores y respetando la proporción de géneros si es mixto. En ataque pesa más lo ofensivo; en defensa, la defensa.

### 3. Jugador (restringido; piloto solo con nuestro club, acceso con código de invitación)
- Carta de jugador compartible.
- Reclamar el perfil a partir de partidos ya registrados.
- Niveles por participación y logros.
- "Kudos" solo positivos.
- **No** habrá notas públicas entre jugadores. Las valoraciones del coach nunca son visibles para jugadores.

## Decisiones técnicas

- **Idioma:** toda la interfaz en español de Chile (textos, fechas, formatos). El código y los nombres de archivo también en español cuando sea natural.
- **Primero sin conexión (offline-first):** tiene que funcionar en la cancha sin señal. Todo se guarda primero en el teléfono (IndexedDB) y se sincroniza después.
- **Tecnología:** HTML, CSS y JavaScript sin frameworks pesados ni paso de compilación. Módulos JS nativos (`<script type="module">`). Debe ser una PWA instalable (manifest + service worker).
- **Alojamiento:** gratuito, en GitHub Pages o Cloudflare Pages.
- **Más adelante:** Supabase para cuentas, roles (planillero/coach/jugador/admin) y sincronización.
- **Datos personales — Ley 21.719 (Chile):** pedir consentimiento informado, publicar una política de privacidad, permitir borrar la cuenta y los datos. Recoger solo los datos necesarios. Las valoraciones de jugadores son datos sensibles a nivel de club: privadas por defecto.
- **Pruebas locales:** con Python (`python -m http.server`). Ver la sección "Cómo probar".

## Estructura de carpetas (actual, Fase 2)

```
UltiApp/
├── CLAUDE.md                 # este archivo
├── README.md                 # descripción corta para GitHub
├── .gitignore
├── prototipo/
│   └── ultimate-estadistico.html   # original, solo referencia (no editar)
├── index.html                # página principal de la app
├── privacidad.html           # política de privacidad (borrador, Ley 21.719)
├── manifest.webmanifest      # nombre, íconos y colores para instalar la app
├── sw.js                     # service worker (debe estar en la raíz)
├── css/
│   ├── base.css              # colores (claro/oscuro), tipografía
│   └── componentes.css       # botones, tarjetas, marcador, pestañas
├── icons/                    # íconos PNG con el escudo Húsares (diseño UX, 2026-10-29)
├── img/                      # escudo Húsares (husares.png grande, husares-escudo.png chico)
├── herramientas/
│   └── generar_iconos.py     # creaba los íconos genéricos del disco (ya reemplazados por el escudo)
└── js/
    ├── app.js                # arranque: conecta botones, dibuja, registra el service worker
    ├── almacen.js            # datos guardados: cfg, plantel, partido (localStorage 'ufs-v1')
    ├── ui.js                 # estado temporal de la pantalla (no se guarda)
    ├── coach/
    │   └── evaluacion.js     # evaluación 1-5 de jugadores (privada, no se exporta)
    ├── criterio/             # MOTOR DE JUEGO (ver docs/criterio.md)
    │   ├── parametros.js     # todos los números ajustables del motor
    │   ├── zonas.js          # marcador → modalidad (asegurar ataque, línea fuerte, rotación, descanso)
    │   ├── metricas.js       # nivel de jugador, métricas de línea, análisis del plantel
    │   └── recomendador.js   # arma la línea de 7 y explica cada elección
    ├── modelos/
    │   ├── partido.js        # derive() (eventos → marcador y estadísticas), reloj, caps, ABBA
    │   ├── historial.js      # partidos guardados (store.historial), holds/breaks, agregados del Dashboard
    │   ├── jugador.js        # buscar y mostrar jugadores
    │   └── eventos.js        # tipos de llamado, resoluciones, describe(evento)
    ├── planillero/
    │   ├── render.js         # dibuja la pestaña activa, ventanas y avisos
    │   ├── encabezado.js     # escudo, encabezados con marca e íconos de la barra inferior
    │   ├── controles.js      # qué hace cada botón (data-a="...")
    │   ├── acciones.js       # agregar / deshacer eventos
    │   ├── reloj.js          # reloj del partido y pantalla encendida
    │   ├── marcador.js       # encabezado con puntaje, reloj, cap y timeouts
    │   ├── juego.js          # pestaña Partido (elige la pantalla según la fase)
    │   ├── linea.js          # elegir línea, ABBA y línea sugerida
    │   ├── pull.js
    │   ├── llamados.js
    │   ├── resumen.js        # resumen del partido en curso (se muestra dentro del Dashboard)
    │   ├── dashboard.js      # pestaña Dashboard: este partido / historial (récord, hold, break, tendencia, ranking)
    │   ├── ajustes.js        # Nuevo partido (sin partido) y Ajustes (con partido, desde el engranaje del marcador)
    │   └── plantel.js        # pestaña Plantel (visión, convocados, edición, carga por texto)
    └── util/
        ├── formato.js        # esc(), fmt(), nombres de archivo
        └── exportar.js       # CSV de estadísticas y eventos
```

Las pantallas del partido están en `js/planillero/` por razones históricas, pero hoy forman la modalidad Coach. Cuando se haga el Planillero simplificado, conviene reorganizar las carpetas. Más adelante se agregará `js/jugador/` (carta, logros, kudos).

### Pestaña Partido: reglas de diseño (pedidas por el usuario)

- **Nunca desplazar:** cada pantalla cabe completa en el alto del teléfono (`#app.full`, `.scr`, grillas que se estiran). Probar en 375×667.
- **Secuencial:** solo se muestran las acciones posibles en cada momento: línea → pull → ¿quién recoge? → pases / gol / throwaway / drop / stall → (turnover) → defensa (block, error rival, gol rival). Llamado y timeout siempre a mano en la barra inferior.
- **Línea:** arriba ATAQUE/DEFENSA y proporción (si es mixto). Máximo 7; aviso si hay menos de 7 o la proporción no calza. "Sugerir" siempre completa 7.
- **Pull:** quién saca se deduce (primer pull en Ajustes; luego saca quien anotó; en la 2.ª mitad recibe quien sacó primero). Mi equipo: ¿quién saca? → cronometrar (tocar al soltar, luego tocar cualquier parte) → dentro/fuera. Rival: no se cronometra. Al elegir dentro/fuera pasa solo al juego.
- **Reloj:** parte al soltar el primer pull (`game.start`), no se pausa, se congela al terminar (`game.finishedAt`).
- **Timeout:** cuenta regresiva de `cfg.toSecs` segundos sin detener el reloj; no se permiten más que `cfg.timeouts` por equipo.
- **Jugadores en pantalla:** nombre abreviado a 3 letras en grande ("Rod"), número chico debajo (`htmlBoton` en `js/modelos/jugador.js`).
- **Género:** en pantalla H = hombre y M = mujer. Internamente sigue 'M' = hombre y 'F' = mujer (datos antiguos). Colores: `--hom` (petróleo) y `--muj` (fucsia), con texto blanco.
- **Proporción:** el cuadro toma el color del género que predomina y se cambia solo manteniendo presionado 1 segundo.
- **Barra inferior:** 3 pestañas con ícono: Plantel, Partido (o "Nuevo partido" si no hay partido) y Dashboard. Ajustes ya no es pestaña: sin partido, las reglas están en Nuevo partido; con partido, se abren desde el engranaje del marcador (`ui.view = 'ajustes'`). Segunda propuesta UX, incorporada el 2026-10-29.
- **Equipos y ramas del club:** `EQUIPOS` en `almacen.js` = Húsares Mix (mixto), Húsares Open (open) y Husarex (master +32, open), más "otro equipo" con nombre libre (`cfg.equipo`). Cada jugador tiene `ramas` (puede ser varias). Al elegir equipo se convoca a quienes juegan en esa rama (`aplicarCategoria`); con "otro", según el género de la categoría. En la carga por texto las ramas se escriben como `mix`, `open`, `husarex` (o `hx`).
- **Historial y Dashboard:** al terminar un partido (o cerrarlo con puntos) se guarda una copia completa en `store.historial` (eventos, reglas y jugadores), en localStorage. "Descartar" lo borra sin guardar. Con muchos partidos podría acercarse al límite de localStorage (~5 MB): por eso sigue pendiente pasar a IndexedDB.
- **Línea:** solo convocados; cada botón muestra puntos y minutos jugados ("3p 6'"). Con 7 marcados, el lugar de "Sugerir" muestra la tarjeta de la línea (nivel, mejor manejo/avance/gol, desgaste).
- **Plantel (pestaña propia):** visión de la evaluación (puntaje global, por posición, ranking, alertas), convocados y no convocados (deslizar a la derecha para cambiar; la categoría femenino/open marca sola al otro género), edición al tocar, carga por texto `36 Enzo H man5 av5 gol3 def3` y copia de respaldo en el mismo formato. Campos por jugador: `noConv`, `noConvAuto` (marcado por la categoría).
- **Tipo de partido:** `cfg.division` = mixto / open / femenino; `cfg.mixed` se mantiene sincronizado (true solo en mixto).
- **Medio tiempo:** `cfg.halfMode` = first (lo que ocurra primero) / points / time.
- **Llamado:** pantalla completa con 4 pasos numerados (qué equipo llama, tipo, resolución, posesión). No se registra el jugador que llama.

### Identidad visual (propuesta UX Húsares, aceptada el 2026-10-29)

- Colores en `css/base.css`: `--us` naranja Húsares (nuestro equipo), `--them` grafito (rival), `--warn` ámbar (avisos, separado del rival), `--acc` ámbar de acento. No reutilizar `--them` para avisos.
- Letras: Teko (`--display`, clase `.num-d`) para marcador, reloj y títulos; Barlow para el texto; botones grandes en mayúsculas.
- El escudo solo aparece si el equipo se llama "Húsares" (`esHusares()` en `encabezado.js`), para que la app siga sirviendo a otros clubes.
- Nuevo partido: tarjeta "Preparar partido" en 4 pasos (equipo, quiénes juegan, rival, primer pull), reglas plegables (`ui.abiertos`) y botón "Crear partido" fijo abajo.
- Las entregas de la diseñadora llegan como ZIP con la app completa: compararlas con la versión desde la que partió (no sobrescribir), combinar en tres vías y no tomar su CLAUDE.md si viene desactualizado.
- Primer uso guiado: sin jugadores, la app abre en Partido con "Armar plantel".
- Resumen: destacados (goles, asistencias, blocks) y columna de nombres fija en la tabla.
- Plantel: copiar como texto con desplegable (plantel completo, convocados o no convocados), formato con ramas y evaluación.

Cómo funciona: toda la pantalla se dibuja como texto HTML en `render()`. Cada botón tiene `data-a="accion"` y `controles.js` decide qué hacer. Tras cada cambio se guarda (`save()`) y se vuelve a dibujar (`render()`).

Principio de datos: un partido es una **lista ordenada de eventos** (line, pull, pickup, pass, goal, themGoal, throwaway, drop, stall, block, themTurn, call, timeout, end). El marcador y las estadísticas se calculan con `derive()` a partir de esa lista. Así es fácil deshacer, revisar un partido y sincronizar después con Supabase. Los nombres internos de eventos y campos siguen en inglés como en el prototipo, para no romper datos ya guardados.

Pendiente: pasar de localStorage a IndexedDB cuando se guarden varios partidos (historial).

## Al agregar o renombrar archivos

Agregar el archivo nuevo a la lista `ARCHIVOS` de `sw.js` y subir `VERSION`. Si no, la app no lo tendrá sin conexión.

## Cómo probar

- En el PC, desde la carpeta del proyecto: `python -m http.server 8000 --bind 0.0.0.0` y abrir `http://localhost:8000`. No abrir `index.html` con doble clic: los módulos JS y el service worker no funcionan con `file://`.
- En el teléfono (misma wifi): `http://<IP-del-PC>:8000` (la IP sale con `ipconfig`, línea "Dirección IPv4"). Por ser `http` y no `https`, el teléfono **no** activa el service worker ni deja instalar la app; sirve para ver la interfaz. Para probar instalación y modo sin señal, usar la versión publicada en GitHub Pages (https).
- En `localhost` el service worker trae siempre la versión nueva de internet (para ver cambios al recargar). En la versión publicada usa primero la copia guardada: al cambiar cualquier archivo, subir `VERSION` en `sw.js` para que los teléfonos reciban la actualización.
- El navegador integrado de Claude no permite service workers; para revisar el modo sin conexión usar Chrome o Edge (F12 → Application → Service workers).

## Fases

1. Planificación, CLAUDE.md, estructura, repositorio git. ✅
2. Migrar el prototipo a la estructura PWA, sin conexión. ✅ (publicada en GitHub Pages: https://enlafase.github.io/UltiApp/)
3. **(actual)** Modalidad Coach: registro secuencial, evaluación, motor de juego. Probar en partidos reales y pulir `js/criterio/` con ese feedback.
4. Planillero simplificado (solo estadísticas y tiempos).
5. Supabase: cuentas, roles, sincronización, consentimiento y borrado de cuenta. Historial de partidos (IndexedDB).
6. Modalidad Jugador (piloto con el club).

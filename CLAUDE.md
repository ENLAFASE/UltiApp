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
- Recomendador de líneas que **explica** por qué sugiere cada jugador (`js/coach/recomendador.js`), con tres criterios:
  - **Competencia:** siempre asegura la columna vertical (manejo, corte de avance y corte de gol buenos) y completa según el marcador: empatados o perdiendo → máximo nivel; ganando por poco → nivel alto con algo de descanso; ganando por el margen para rotar (`cfg.compMargin`, en Ajustes, por defecto 3) o más → rotación con minutos para el nivel más bajo. Nunca pone a los 7 de menor nivel.
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
├── icons/                    # íconos PNG (los genera herramientas/generar_iconos.py)
├── herramientas/
│   └── generar_iconos.py     # crea los íconos solo con Python
└── js/
    ├── app.js                # arranque: conecta botones, dibuja, registra el service worker
    ├── almacen.js            # datos guardados: cfg, plantel, partido (localStorage 'ufs-v1')
    ├── ui.js                 # estado temporal de la pantalla (no se guarda)
    ├── coach/
    │   ├── evaluacion.js     # evaluación 1-5 de jugadores (privada, no se exporta)
    │   └── recomendador.js   # sugerencia de línea: competencia / amistoso / entrenamiento
    ├── modelos/
    │   ├── partido.js        # derive() (eventos → marcador y estadísticas), reloj, caps, ABBA
    │   ├── jugador.js        # buscar y mostrar jugadores
    │   └── eventos.js        # tipos de llamado, resoluciones, describe(evento)
    ├── planillero/
    │   ├── render.js         # dibuja la pestaña activa, ventanas y avisos
    │   ├── controles.js      # qué hace cada botón (data-a="...")
    │   ├── acciones.js       # agregar / deshacer eventos
    │   ├── reloj.js          # reloj del partido y pantalla encendida
    │   ├── marcador.js       # encabezado con puntaje, reloj, cap y timeouts
    │   ├── juego.js          # pestaña Partido (elige la pantalla según la fase)
    │   ├── linea.js          # elegir línea, ABBA y línea sugerida
    │   ├── pull.js
    │   ├── llamados.js
    │   ├── resumen.js        # pestaña Resumen
    │   └── ajustes.js        # pestaña Ajustes y plantel
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
- **Llamado:** pantalla completa con 4 pasos numerados (qué equipo llama, tipo, resolución, posesión). No se registra el jugador que llama.

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
2. **(actual)** Migrar el prototipo a la estructura PWA (Planillero completo, sin conexión). Migración hecha; falta probar instalación y modo sin señal en teléfono.
3. Publicar en GitHub Pages y probar en partidos reales.
4. Supabase: cuentas, roles, sincronización, consentimiento y borrado de cuenta.
5. Modalidad Coach.
6. Modalidad Jugador (piloto con el club).

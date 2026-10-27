# UltiApp — App de Ultimate Frisbee

App para registrar y analizar partidos de Ultimate Frisbee. Nace en un club chileno con 9 años de trayectoria (Pro Ultimate). Meta a largo plazo: ofrecerla a la Federación Chilena de Disco Volador.

El punto de partida es `ultimate-estadistico.html`, un prototipo funcional de una sola página. Se guarda sin cambios en `prototipo/` como referencia y se migra por partes a la estructura de abajo.

## Sobre quien desarrolla

El dueño del proyecto no es programador profesional. Explicar cada paso de forma sencilla, en español, sin dar por sabido el vocabulario técnico. Preferir soluciones simples y fáciles de mantener sobre soluciones "elegantes".

## Visión: tres modalidades

### 1. Planillero (libre, sin cuenta)
Registro básico del partido en la cancha:
- Reloj de partido.
- Caps (límite de tiempo / puntos).
- Timeouts por equipo.
- Proporción mixta ABBA (qué proporción de género toca en cada punto).
- Pull: equipo, jugador, tiempo de vuelo (opcional), dentro/fuera.
- Llamados: quién llama, tipo, resolución y con quién queda la posesión.
- Goles, asistencias y defensas.

### 2. Coach (restringido; cuentas aprobadas por el administrador)
- Estadísticas detalladas.
- Valoración **privada** de jugadores: 1 a 5 en manejo, corte, defensa y físico; posición manejador/cortador.
- Recomendador de líneas que **explica** por qué sugiere cada línea.

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

## Estructura de carpetas (propuesta, Fase 1)

```
UltiApp/
├── CLAUDE.md                 # este archivo
├── README.md                 # descripción corta para GitHub
├── .gitignore
├── prototipo/
│   └── ultimate-estadistico.html   # original, solo referencia
├── index.html                # página principal de la app
├── privacidad.html           # política de privacidad (Ley 21.719)
├── manifest.webmanifest      # nombre, íconos y colores para instalar la app
├── sw.js                     # service worker (debe estar en la raíz)
├── css/
│   ├── base.css              # colores, tipografía, variables
│   └── componentes.css       # botones, tarjetas, marcador
├── icons/                    # icon-192.png, icon-512.png, icon-maskable-512.png
└── js/
    ├── app.js                # arranque: registra el service worker y abre la vista
    ├── router.js             # cambia entre pantallas (#/partido, #/coach, ...)
    ├── almacen.js            # guardar/leer en IndexedDB
    ├── modelos/
    │   ├── partido.js        # equipos, configuración (caps, ABBA, timeouts)
    │   ├── jugador.js
    │   └── eventos.js        # tipos de evento: pull, gol, llamado, timeout...
    ├── planillero/
    │   ├── vista.js          # pantalla de registro en cancha
    │   ├── reloj.js
    │   ├── marcador.js       # puntaje, caps, timeouts
    │   ├── abba.js
    │   ├── pull.js
    │   └── llamados.js
    ├── coach/                # Fase posterior
    │   ├── estadisticas.js
    │   ├── valoraciones.js
    │   └── recomendador.js
    ├── jugador/              # Fase posterior
    │   ├── carta.js
    │   ├── logros.js
    │   └── kudos.js
    └── util/
        ├── formato.js        # fechas y números en formato chileno
        └── exportar.js       # exportar/importar partidos (JSON/CSV)
```

Principio de datos: un partido es una **lista ordenada de eventos** (pull, gol, llamado, timeout...). El marcador y las estadísticas se calculan a partir de esa lista. Así es fácil deshacer, revisar un partido y sincronizar después con Supabase.

## Cómo probar

- En el PC, desde la carpeta del proyecto: `python -m http.server 8000 --bind 0.0.0.0` y abrir `http://localhost:8000`. No abrir `index.html` con doble clic: los módulos JS y el service worker no funcionan con `file://`.
- En el teléfono (misma wifi): `http://<IP-del-PC>:8000` (la IP sale con `ipconfig`, línea "Dirección IPv4"). Por ser `http` y no `https`, el teléfono **no** activa el service worker ni deja instalar la app; sirve para ver la interfaz. Para probar instalación y modo sin señal, usar la versión publicada en GitHub Pages (https).
- Al cambiar `sw.js` o los archivos que guarda en caché, subir el número de versión del caché para que los teléfonos reciban la actualización.

## Fases

1. **Fase 1 (actual):** planificación, CLAUDE.md, estructura, repositorio git.
2. Migrar el prototipo a la estructura PWA (Planillero completo, sin conexión).
3. Publicar en GitHub Pages y probar en partidos reales.
4. Supabase: cuentas, roles, sincronización, consentimiento y borrado de cuenta.
5. Modalidad Coach.
6. Modalidad Jugador (piloto con el club).

# UltiApp

App para registrar y analizar partidos de Ultimate Frisbee, creada por el club Pro Ultimate (Chile).

- **Planillero:** registro del partido en cancha (reloj, caps, timeouts, ABBA, pulls, llamados, goles, asistencias y defensas).
- **Coach:** estadísticas, valoraciones privadas y recomendador de líneas *(en desarrollo)*.
- **Jugador:** carta de jugador, logros y kudos *(en desarrollo)*.

Funciona sin conexión y se instala en el teléfono como app (PWA).

## Probar en tu PC

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Luego abre `http://localhost:8000` en el navegador.

El prototipo original está en [`prototipo/`](prototipo/ultimate-estadistico.html).

// Dibuja la pantalla completa según la pestaña abierta.
// Cada vez que algo cambia se vuelve a llamar a render().
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { derive } from '../modelos/partido.js';
import { esc } from '../util/formato.js';
import { viewGame } from './juego.js';
import { viewSummary } from './resumen.js';
import { viewSettings } from './ajustes.js';

const app = document.getElementById('app');

export function render() {
  const y = window.scrollY;
  let body;
  if (ui.tab === 'game') body = viewGame();
  else if (ui.tab === 'summary') body = viewSummary();
  else body = viewSettings();
  // Durante el partido, la pantalla ocupa exactamente el alto del teléfono (sin desplazar).
  const pantallaFija = ui.tab === 'game' && !!store.game;
  app.classList.toggle('full', pantallaFija);
  const sinPestanas = pantallaFija && ui.view === 'call';
  app.innerHTML = body + (sinPestanas ? '' : tabs()) + modalHTML() + (ui.toast ? '<div class="toast" role="status">' + esc(ui.toast) + '</div>' : '');
  if (pantallaFija) window.scrollTo(0, 0); else window.scrollTo(0, y);
}

// Aviso breve en la parte inferior ("Llamado guardado").
let toastTimer = null;
export function toast(t) {
  ui.toast = t;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    ui.toast = null;
    const el = document.querySelector('.toast'); if (el) el.remove();
  }, 1800);
}

function tabs() {
  function t(id, txt) { return '<button class="tab" data-a="tab" data-v="' + id + '"' + (ui.tab === id ? ' aria-current="page"' : '') + '>' + txt + '</button>'; }
  return '<nav class="tabs" aria-label="Secciones"><div class="tabs-in">' + t('game', 'Partido') + t('summary', 'Resumen') + t('settings', 'Ajustes') + '</div></nav>';
}

// Ventanas que suben desde abajo: timeout, confirmar, texto exportado.
function modalHTML() {
  const m = ui.modal; if (!m) return '';
  let h = '<div class="ov" data-a="closeModal"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(m.title || '') + '">';
  if (m.kind === 'timeout') {
    const s = derive(), c = cfg();
    const quedan = { us: Math.max(0, c.timeouts - s.to.us), them: Math.max(0, c.timeouts - s.to.them) };
    function boton(t, clase, nombre) {
      return '<button class="btn ' + clase + '" data-a="timeout" data-v="' + t + '"' + (quedan[t] ? '' : ' disabled') + '>' +
        esc(nombre) + '<br><small>' + (quedan[t] ? 'Quedan ' + quedan[t] : 'Sin timeouts') + '</small></button>';
    }
    h += '<h2 class="h2 disp">¿Quién pide timeout?</h2><div class="grid2 team-toggle to-pick">' + boton('us', 'us', c.club) + boton('them', 'th', c.rival) + '</div>' +
      '<p class="muted" style="margin:0">Se activará una cuenta regresiva de ' + (c.toSecs || 60) + ' segundos.</p>' +
      '<button class="btn full" data-a="closeModal">Cancelar</button>';
  } else if (m.kind === 'confirm') {
    h += '<h2 class="h2 disp">' + esc(m.title) + '</h2><p style="margin:0">' + esc(m.text) + '</p><div class="grid2"><button class="btn" data-a="closeModal">' + esc(m.cancel || 'Cancelar') + '</button><button class="btn ' + (m.okClass || 'danger') + '" data-a="' + m.action + '">' + esc(m.ok) + '</button></div>';
  } else if (m.kind === 'text') {
    h += '<h2 class="h2 disp">' + esc(m.title) + '</h2><p class="muted" style="margin:0">La descarga no está disponible aquí. Copia el contenido y pégalo en una hoja de cálculo.</p><textarea readonly id="exptxt">' + esc(m.text) + '</textarea><div class="grid2"><button class="btn" data-a="closeModal">Cerrar</button><button class="btn fill" data-a="copyTxt">Copiar</button></div>';
  }
  return h + '</div></div>';
}

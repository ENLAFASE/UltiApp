// Qué pasa al tocar cada botón. Cada botón tiene un atributo data-a="..."
// con el nombre de la acción; aquí se decide qué hacer con cada una.
import { store, save, cfg, DEF_CFG } from '../almacen.js';
import { ui } from '../ui.js';
import { derive } from '../modelos/partido.js';
import { teamName } from '../modelos/eventos.js';
import { uid, slug, fileStamp } from '../util/formato.js';
import { exportFile, statsCSV, eventsCSV } from '../util/exportar.js';
import { render, toast } from './render.js';
import { add, undo } from './acciones.js';
import { marcarSalidaPull, keepAwake } from './reloj.js';
import { suggestLine, currentRatio, revisarLinea, EN_CANCHA } from './linea.js';
import { hangTick, quienSaca } from './pull.js';

function mostrarTexto(name, text) { ui.modal = { kind: 'text', title: name, text: text }; render(); }

/* ---------- cronómetro del pull ---------- */
// Se usa "pointerdown" (el instante en que el dedo toca la pantalla) y no
// "click" (cuando se levanta el dedo), para medir con más precisión.
function cronometro(a) {
  const pu = ui.pull; if (!pu) return;
  if (a === 'hang' && pu.step === 'timing') {
    pu.relT = marcarSalidaPull();
    pu.ms = null; pu.start = performance.now(); pu.step = 'running';
    render(); requestAnimationFrame(hangTick);
  } else if (a === 'hangStop' && pu.step === 'running') {
    pu.ms = Math.round(performance.now() - pu.start); pu.start = null; pu.step = 'land';
    // El mismo toque no debe "apretar" el botón que aparece debajo del dedo.
    ui.ignoreClickUntil = performance.now() + 600;
    render();
  }
}
function alPresionar(ev) {
  const b = ev.target.closest('[data-a="hang"],[data-a="hangStop"]'); if (!b) return;
  ev.preventDefault();
  cronometro(b.getAttribute('data-a'));
}

function alTocar(ev) {
  const b = ev.target.closest('[data-a]'); if (!b) return;
  const a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), id = b.getAttribute('data-id');
  if (performance.now() < ui.ignoreClickUntil) return;
  // El cronómetro se maneja en alPresionar; aquí solo si se usó el teclado.
  if (a === 'hang' || a === 'hangStop') { if (ev.detail === 0) cronometro(a); return; }
  // Tocar dentro de la ventana no la cierra; solo tocar el fondo oscuro.
  if (a === 'closeModal' && b.classList.contains('ov') && ev.target !== b) return;
  const s = store.game ? derive() : null;

  switch (a) {
    case 'tab': ui.tab = v; ui.modal = null; window.scrollTo(0, 0); break;
    case 'undo': undo(); return;
    case 'closeModal': ui.modal = null; break;

    // línea
    case 'selP': {
      const i = ui.sel.indexOf(id);
      if (i >= 0) ui.sel.splice(i, 1);
      else if (ui.sel.length >= EN_CANCHA) toast('Ya hay 7 en la línea. Quita a alguien primero.');
      else ui.sel.push(id);
      break;
    }
    case 'suggest': suggestLine(s); break;
    case 'clearSel': ui.sel = []; break;
    case 'swapRatio': ui.ratioSwap = !ui.ratioSwap; break;
    case 'confirmLine': {
      if (!ui.sel.length) return;
      const avisos = revisarLinea(s);
      if (avisos.length) {
        ui.modal = { kind: 'confirm', title: '¿Confirmar esta línea?', text: avisos.join(' '), ok: 'Confirmar igual', okClass: 'themfill', cancel: 'Volver', action: 'confirmLineOk' };
        break;
      }
    }
    // sin avisos: sigue directo a confirmar
    // falls through
    case 'confirmLineOk':
      ui.modal = null;
      add({ type: 'line', players: ui.sel.slice(), ratio: currentRatio(s) });
      return;

    // pull
    case 'pullPlayer': ui.pull.player = id || null; ui.pull.step = 'timing'; break;
    case 'pullBack': ui.pull.step = ui.pull.step === 'land' ? 'timing' : 'player'; ui.pull.ms = null; break;
    case 'pullNoTime': ui.pull.relT = marcarSalidaPull(); ui.pull.ms = null; ui.pull.step = 'land'; break;
    case 'hangRedo': ui.pull.ms = null; ui.pull.step = 'timing'; break;
    case 'relRival': ui.pull.relT = marcarSalidaPull(); ui.pull.step = 'land'; break;
    case 'pullIn': {
      const p = ui.pull, saca = quienSaca(s);
      ui.pull = null;
      // Con esto el pull queda completo y se pasa directo al juego.
      add({ type: 'pull', team: saca, player: saca === 'us' ? p.player : null, hang: p.ms, inBounds: v === '1', t: p.relT });
      return;
    }

    // juego
    case 'tapP':
      if (!s.holder) { add({ type: 'pickup', player: id }); return; }
      if (s.holder !== id) add({ type: 'pass', from: s.holder, to: id });
      return;
    case 'goal': ui.pick = { act: 'goal', title: '¿Quién atrapó el gol?', ids: s.line.filter(function (x) { return x !== s.holder; }) }; break;
    case 'throwaway': case 'stall': add({ type: a, player: s.holder }); return;
    case 'drop': ui.pick = { act: 'drop', title: '¿Quién soltó el disco?', ids: s.line.filter(function (x) { return x !== s.holder; }) }; break;
    case 'block': ui.pick = { act: 'block', title: '¿Quién hizo el block?', ids: s.line }; break;
    case 'themTurn': add({ type: 'themTurn' }); return;
    case 'themGoal': add({ type: 'themGoal' }); return;
    case 'picked': {
      const k = ui.pick; ui.pick = null;
      if (k.act === 'goal') add({ type: 'goal', from: s.holder || null, to: id });
      else add({ type: k.act, player: id });
      return;
    }
    case 'cancelPick': ui.pick = null; break;

    // timeout
    case 'openTO': ui.modal = { kind: 'timeout', title: 'Timeout' }; break;
    case 'timeout': {
      const quedan = cfg().timeouts - s.to[v];
      if (quedan <= 0) { toast(teamName(v) + ' no tiene timeouts'); break; }
      ui.modal = null; ui.view = null;
      add({ type: 'timeout', team: v });
      keepAwake();
      return;
    }
    case 'toResume': s.last.fin = Date.now(); save(); break;

    // llamado
    case 'openCall': ui.call = { team: 'us', player: null, kind: null, res: null, poss: s.possession }; ui.view = 'call'; break;
    case 'cancelCall': ui.view = null; break;
    case 'callTeam': ui.call.team = v; ui.call.player = null; break;
    case 'callPlayer': ui.call.player = ui.call.player === id ? null : id; break;
    case 'callKind': ui.call.kind = v; break;
    case 'callRes': ui.call.res = v; break;
    case 'callPoss': ui.call.poss = v; break;
    case 'saveCall': {
      const k = ui.call; if (!k.kind || !k.res) return;
      ui.view = null;
      add({ type: 'call', team: k.team, player: k.player || null, kind: k.kind, res: k.res, possession: k.poss });
      toast('Llamado guardado');
      return;
    }

    // exportar
    case 'expStats':
      if (exportFile('estadisticas-' + slug(cfg().rival) + '-' + fileStamp() + '.csv', statsCSV(s), mostrarTexto)) toast('Archivo descargado');
      break;
    case 'expEvents':
      if (exportFile('eventos-' + slug(cfg().rival) + '-' + fileStamp() + '.csv', eventsCSV(s), mostrarTexto)) toast('Archivo descargado');
      break;
    case 'copyTxt': {
      const ta = document.getElementById('exptxt'); ta.select();
      const done = function () { toast('Copiado'); render(); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(done, function () { try { document.execCommand('copy'); done(); } catch (e) {} });
      } else { try { document.execCommand('copy'); done(); } catch (e) {} }
      return;
    }

    // ajustes y plantel
    case 'npG': ui.newP.g = v; break;
    case 'addP': {
      const np = ui.newP;
      if (!String(np.num).trim()) { toast('Falta el número'); break; }
      store.roster.push({ id: uid(), num: String(np.num).trim(), name: np.name.trim(), g: np.g });
      save(); ui.newP = { num: '', name: '', g: np.g }; toast('Jugador agregado');
      break;
    }
    case 'addBulk': {
      let n = 0;
      ui.bulk.split(/\n/).forEach(function (line) {
        line = line.trim(); if (!line) return;
        const mm = line.match(/^(\d+)\s*(.*?)(?:\s+([MFmf]))?$/); if (!mm) return;
        store.roster.push({ id: uid(), num: mm[1], name: (mm[2] || '').trim(), g: (mm[3] || 'M').toUpperCase() });
        n++;
      });
      save(); ui.bulk = ''; toast(n + ' jugadores agregados');
      break;
    }
    case 'delP': store.roster = store.roster.filter(function (p) { return p.id !== id; }); save(); break;
    case 'firstPull': store.cfg.firstPull = v; save(); break;
    case 'startGame':
      if (!store.roster.length) return;
      // Recibe el primer pull el equipo que NO lo saca.
      store.game = { firstOffense: cfg().firstPull === 'us' ? 'them' : 'us', events: [], start: null, finishedAt: null, created: Date.now() };
      ui.sel = []; ui.selFor = null; ui.pull = null; ui.pick = null; ui.view = null;
      save(); ui.tab = 'game';
      break;
    case 'askEnd':
      ui.modal = { kind: 'confirm', title: '¿Finalizar el partido?', text: 'Se cumplió el tiempo. El resultado quedará como está.', ok: 'Finalizar', okClass: 'fill', action: 'endGame' };
      break;
    case 'endGame': ui.modal = null; add({ type: 'end' }); ui.tab = 'summary'; break;
    case 'askReset':
      ui.modal = { kind: 'confirm', title: '¿Borrar el partido?', text: 'Se perderán todos los eventos de este partido. El plantel y los ajustes se mantienen.', ok: 'Borrar', action: 'doReset' };
      break;
    case 'doReset': store.game = null; ui.modal = null; save(); break;
  }
  render();
}

// Cambios en casillas, números y listas de Ajustes.
function alCambiar(ev) {
  const el = ev.target;
  const key = el.getAttribute('data-cfg'); if (!key) return;
  const c = store.cfg;
  if (el.type === 'checkbox') c[key] = el.checked;
  else if (el.type === 'number') c[key] = Math.max(0, parseInt(el.value, 10) || 0);
  else c[key] = el.value.trim() || DEF_CFG[key];
  save(); render();
}

// Texto que se va escribiendo (se guarda sin redibujar para no perder el cursor).
function alEscribir(ev) {
  const el = ev.target, k = el.getAttribute('data-in'); if (!k) return;
  if (k === 'npNum') ui.newP.num = el.value;
  else if (k === 'npName') ui.newP.name = el.value;
  else if (k === 'bulk') ui.bulk = el.value;
  else if (k === 'callRival') ui.call.player = el.value.trim();
}

export function conectarControles(app) {
  app.addEventListener('pointerdown', alPresionar);
  app.addEventListener('click', alTocar);
  app.addEventListener('change', alCambiar);
  app.addEventListener('input', alEscribir);
}

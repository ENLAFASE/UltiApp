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
import { toggleClock, keepAwake } from './reloj.js';
import { suggestLine, currentRatio } from './linea.js';
import { hangTick } from './pull.js';

function mostrarTexto(name, text) { ui.modal = { kind: 'text', title: name, text: text }; render(); }

function alTocar(ev) {
  const b = ev.target.closest('[data-a]'); if (!b) return;
  const a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), id = b.getAttribute('data-id');
  // Tocar dentro de la ventana no la cierra; solo tocar el fondo oscuro.
  if (a === 'closeModal' && b.classList.contains('ov') && ev.target !== b) return;
  if (a === 'pullTiming') return;
  const s = store.game ? derive() : null;

  switch (a) {
    case 'tab': ui.tab = v; ui.modal = null; window.scrollTo(0, 0); break;
    case 'clock': toggleClock(); return;
    case 'undo': undo(); return;
    case 'closeModal': ui.modal = null; break;

    // línea
    case 'selP': { const i = ui.sel.indexOf(id); if (i >= 0) ui.sel.splice(i, 1); else ui.sel.push(id); break; }
    case 'suggest': suggestLine(s); break;
    case 'clearSel': ui.sel = []; break;
    case 'swapRatio': ui.ratioSwap = !ui.ratioSwap; break;
    case 'confirmLine':
      if (ui.sel.length) { add({ type: 'line', players: ui.sel.slice(), ratio: currentRatio(s) }); window.scrollTo(0, 0); }
      return;

    // pull
    case 'pullTeam': ui.pull.team = v; if (v === 'them') ui.pull.player = null; break;
    case 'pullPlayer': ui.pull.player = ui.pull.player === id ? null : id; break;
    case 'hang': {
      const pu = ui.pull;
      if (pu.start != null) { pu.ms = Math.round(performance.now() - pu.start); pu.start = null; }
      else { pu.ms = null; pu.start = performance.now(); requestAnimationFrame(hangTick); }
      break;
    }
    case 'pullIn': ui.pull.inb = (v === '1'); break;
    case 'confirmPull': {
      const p = ui.pull; if (p.inb === null || p.start != null) return;
      // El reloj parte solo con el primer pull si nadie lo inició antes.
      if (!store.game.clock.since && !store.game.clock.acc) { store.game.clock.since = Date.now(); keepAwake(); }
      add({ type: 'pull', team: p.team, player: p.team === 'us' ? p.player : null, hang: p.timing ? p.ms : null, inBounds: p.inb });
      window.scrollTo(0, 0);
      return;
    }

    // juego
    case 'tapP':
      if (!s.holder) { add({ type: 'pickup', player: id }); return; }
      if (s.holder !== id) add({ type: 'pass', from: s.holder, to: id });
      return;
    case 'goal': ui.modal = { kind: 'pick', title: '¿Quién anotó?', ids: s.line, act: 'goal', from: s.holder }; break;
    case 'throwaway': case 'stall':
      if (s.holder) { add({ type: a, player: s.holder }); return; }
      ui.modal = { kind: 'pick', title: a === 'stall' ? '¿A quién le contaron stall?' : '¿Quién lanzó?', ids: s.line, act: a };
      break;
    case 'drop': ui.modal = { kind: 'pick', title: '¿Quién soltó el disco?', ids: s.line.filter(function (x) { return x !== s.holder; }), act: 'drop' }; break;
    case 'block': ui.modal = { kind: 'pick', title: '¿Quién hizo el block?', ids: s.line, act: 'block' }; break;
    case 'themTurn': add({ type: 'themTurn' }); return;
    case 'themGoal': add({ type: 'themGoal' }); window.scrollTo(0, 0); return;
    case 'picked': {
      const m = ui.modal; ui.modal = null;
      if (m.act === 'goal') add({ type: 'goal', from: (m.from && m.from !== id) ? m.from : null, to: id });
      else add({ type: m.act, player: id });
      if (m.act === 'goal') window.scrollTo(0, 0);
      return;
    }
    case 'openTO': ui.modal = { kind: 'timeout', title: 'Timeout' }; break;
    case 'timeout': ui.modal = null; add({ type: 'timeout', team: v }); toast('Timeout de ' + teamName(v)); return;

    // llamado
    case 'openCall': ui.call = { team: 'us', player: null, kind: null, res: null, poss: s.possession }; ui.view = 'call'; window.scrollTo(0, 0); break;
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
    case 'firstOff': ui.firstOffense = v; break;
    case 'startGame':
      if (!store.roster.length) return;
      store.game = { firstOffense: ui.firstOffense, events: [], clock: { acc: 0, since: null }, created: Date.now() };
      ui.sel = []; ui.selFor = null; ui.pull = null; save(); ui.tab = 'game'; window.scrollTo(0, 0);
      break;
    case 'endGame': add({ type: 'end' }); ui.tab = 'summary'; break;
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
  if (el.matches('[data-a="pullTiming"]')) {
    ui.pull.timing = el.checked;
    if (!el.checked) { ui.pull.start = null; ui.pull.ms = null; }
    render(); return;
  }
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
  app.addEventListener('click', alTocar);
  app.addEventListener('change', alCambiar);
  app.addEventListener('input', alEscribir);
}

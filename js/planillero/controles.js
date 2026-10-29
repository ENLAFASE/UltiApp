// Qué pasa al tocar cada botón. Cada botón tiene un atributo data-a="..."
// con el nombre de la acción; aquí se decide qué hacer con cada una.
import { store, save, cfg, DEF_CFG, aplicarCategoria, generoFueraDeCategoria } from '../almacen.js';
import { ui } from '../ui.js';
import { derive } from '../modelos/partido.js';
import { teamName } from '../modelos/eventos.js';
import { P, label } from '../modelos/jugador.js';
import { uid, slug, fileStamp } from '../util/formato.js';
import { exportFile, statsCSV, eventsCSV } from '../util/exportar.js';
import { render, toast } from './render.js';
import { add, undo } from './acciones.js';
import { marcarSalidaPull, keepAwake } from './reloj.js';
import { suggestLine, currentRatio, revisarLinea, EN_CANCHA } from './linea.js';
import { hangTick, quienSaca } from './pull.js';
import { leerLineaPlantel, lineaPlantel } from './plantel.js';
import { convocados } from '../criterio/recomendador.js';
import { porNumero } from '../modelos/jugador.js';

/* ---------- convocados ---------- */
function cambiarConvocatoria(p) {
  p.noConv = !p.noConv;
  p.noConvAuto = false; // desde ahora es una decisión manual
  save();
  toast(label(p.id) + (p.noConv ? ' pasa a no convocados' : ' convocado'));
}
// Un jugador nuevo del género que no corresponde a la categoría entra como no convocado.
function convocatoriaInicial(p) {
  if (generoFueraDeCategoria(cfg().division) === p.g) { p.noConv = true; p.noConvAuto = true; }
}

/* ---------- deslizar hacia la derecha en el plantel ---------- */
let desliz = null;
function iniciarDesliz(ev, el) {
  desliz = { id: el.getAttribute('data-swipe'), x: ev.clientX, y: ev.clientY, el: el, dx: 0 };
}
function moverDesliz(ev) {
  if (!desliz) return;
  const dx = ev.clientX - desliz.x, dy = ev.clientY - desliz.y;
  if (Math.abs(dy) > 25 && Math.abs(dy) > Math.abs(dx)) { desliz.el.style.transform = ''; desliz = null; return; } // es un scroll
  desliz.dx = Math.max(0, dx);
  desliz.el.style.transform = 'translateX(' + Math.min(desliz.dx, 140) + 'px)';
  desliz.el.classList.toggle('listo', desliz.dx > 90);
}
function terminarDesliz() {
  if (!desliz) return;
  const d = desliz; desliz = null;
  d.el.style.transform = ''; d.el.classList.remove('listo');
  if (d.dx > 90) {
    const p = P(d.id);
    if (p) cambiarConvocatoria(p);
    ui.ignoreClickUntil = performance.now() + 400; // que no se abra la ficha
    render();
  } else if (d.dx > 10) {
    ui.ignoreClickUntil = performance.now() + 300;
  }
}

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
/* ---------- proporción: mantener presionado 1 segundo para cambiarla ---------- */
let presionTimer = null, presionBoton = null;
function soltarPresion() {
  clearTimeout(presionTimer); presionTimer = null;
  if (presionBoton) presionBoton.classList.remove('pressing');
  presionBoton = null;
}
function presionarRatio(b) {
  soltarPresion();
  presionBoton = b; b.classList.add('pressing');
  presionTimer = setTimeout(function () {
    presionTimer = null;
    ui.ratioSwap = !ui.ratioSwap;
    // Evita que al soltar el dedo se cuente además como un toque normal.
    ui.ignoreClickUntil = performance.now() + 800;
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {}
    toast('Proporción cambiada');
    render();
  }, 1000);
}

function alPresionar(ev) {
  const fila = ev.target.closest('[data-swipe]');
  if (fila) { iniciarDesliz(ev, fila); return; }
  const r = ev.target.closest('[data-a="swapRatio"]');
  if (r) { presionarRatio(r); return; }
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
    case 'secc': ui.abiertos[v] = !ui.abiertos[v]; break;

    // línea
    case 'selP': {
      const i = ui.sel.indexOf(id);
      if (i >= 0) ui.sel.splice(i, 1);
      else if (ui.sel.length >= EN_CANCHA) toast('Ya hay 7 en la línea. Quita a alguien primero.');
      else ui.sel.push(id);
      break;
    }
    case 'suggest': suggestLine(s); break;
    case 'openWhy': ui.modal = { kind: 'why', title: '¿Por qué esta línea?' }; break;
    case 'openLineInfo': ui.modal = { kind: 'lineinfo', title: 'Línea marcada' }; break;
    case 'clearSel': ui.sel = []; ui.sug = null; break;
    case 'swapRatio':
      // Con teclado (Enter) se cambia directo; con el dedo hay que mantener presionado.
      soltarPresion();
      if (ev.detail === 0) { ui.ratioSwap = !ui.ratioSwap; break; }
      toast('Mantén presionado 1 segundo para cambiar la proporción');
      break;
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
    case 'drop': ui.pick = { act: 'drop', title: '¿A quién se le cayó el disco?', ids: s.line.filter(function (x) { return x !== s.holder; }) }; break;
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
    case 'openCall': ui.call = { team: 'us', kind: null, res: null, poss: s.possession }; ui.view = 'call'; break;
    case 'cancelCall': ui.view = null; break;
    case 'callTeam': ui.call.team = v; break;
    case 'callKind': ui.call.kind = v; break;
    case 'callRes': ui.call.res = v; break;
    case 'callPoss': ui.call.poss = v; break;
    case 'saveCall': {
      const k = ui.call; if (!k.kind || !k.res) return;
      ui.view = null;
      add({ type: 'call', team: k.team, kind: k.kind, res: k.res, possession: k.poss });
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
      const nuevo = { id: uid(), num: String(np.num).trim(), name: np.name.trim(), g: np.g };
      convocatoriaInicial(nuevo);
      store.roster.push(nuevo);
      save(); ui.newP = { num: '', name: '', g: np.g }; toast('Jugador agregado');
      break;
    }
    case 'addBulk': {
      // Formato: "36 Enzo H man5 av5 gol3 def3" (la evaluación es opcional).
      // Si ya existe un jugador con el mismo número y nombre, se actualiza.
      let nuevos = 0, actualizados = 0, malas = 0;
      ui.bulk.split(/\n/).forEach(function (linea) {
        if (!linea.trim()) return;
        const d = leerLineaPlantel(linea); if (!d) { malas++; return; }
        const existe = store.roster.find(function (p) {
          return p.num === d.num && (p.name || '').toLowerCase() === d.name.toLowerCase();
        });
        if (existe) {
          if (d.g) existe.g = d.g;
          if (Object.keys(d.ev).length) existe.ev = Object.assign({}, existe.ev || {}, d.ev);
          actualizados++;
        } else {
          const p = { id: uid(), num: d.num, name: d.name, g: d.g || 'M' };
          if (Object.keys(d.ev).length) p.ev = d.ev;
          convocatoriaInicial(p);
          store.roster.push(p);
          nuevos++;
        }
      });
      save(); ui.bulk = '';
      toast(nuevos + ' agregados' + (actualizados ? ', ' + actualizados + ' actualizados' : '') + (malas ? ', ' + malas + ' líneas sin número' : ''));
      break;
    }
    case 'copyRoster': {
      // Qué copiar: plantel completo, solo convocados o solo no convocados (desplegable en Plantel).
      const que = ui.copiaQue || 'todos';
      const lista = store.roster.filter(function (p) {
        return que === 'conv' ? !p.noConv : que === 'noconv' ? !!p.noConv : true;
      });
      if (!lista.length) { toast('No hay jugadores en esa lista'); break; }
      const texto = porNumero(lista).map(lineaPlantel).join('\n');
      const nombre = { todos: 'Plantel completo copiado', conv: 'Convocados copiados', noconv: 'No convocados copiados' }[que];
      const listo = function () { toast(nombre + ' (' + lista.length + '). Pégalo en una nota o mensaje.'); render(); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(listo, function () { mostrarTexto('plantel.txt', texto); });
      } else mostrarTexto('plantel.txt', texto);
      return;
    }
    case 'rankRol': ui.rankRol = v; break;
    case 'convP': { const p = P(id); if (p) cambiarConvocatoria(p); break; }

    // editar jugador y evaluación privada (coach)
    case 'editP': ui.modal = { kind: 'player', id: id, title: 'Editar jugador' }; break;
    case 'peG': { const p = P(id); if (p) { p.g = v; save(); } break; }
    case 'evSet': {
      const p = P(id); if (!p) break;
      p.ev = p.ev || {};
      p.ev[b.getAttribute('data-k')] = +v;
      save();
      break;
    }
    case 'askDelP': {
      const p = P(id); if (!p) break;
      ui.modal = { kind: 'confirm', title: '¿Quitar a ' + label(id) + '?', text: 'Se borra del plantel junto con su evaluación.' + (store.game ? ' Sus estadísticas del partido en curso dejarán de mostrarse.' : ''), ok: 'Quitar', action: 'delP', id: id };
      break;
    }
    case 'delP': store.roster = store.roster.filter(function (p) { return p.id !== id; }); ui.modal = null; save(); toast('Jugador quitado'); break;
    case 'firstPull': store.cfg.firstPull = v; save(); break;
    case 'startGame':
      if (!convocados().length) return;
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
  // Opciones de la pantalla que no se guardan (por ejemplo, qué parte del plantel copiar).
  const opUi = el.getAttribute('data-ui');
  if (opUi) { ui[opUi] = el.value; render(); return; }
  const key = el.getAttribute('data-cfg'); if (!key) return;
  const c = store.cfg;
  if (el.type === 'checkbox') c[key] = el.checked;
  else if (el.type === 'number') c[key] = Math.max(0, parseInt(el.value, 10) || 0);
  else c[key] = el.value.trim() || DEF_CFG[key];
  if (key === 'margenVentaja' || key === 'margenDesventaja') c[key] = Math.max(1, c[key]);
  if (key === 'division') {
    // "mixed" se mantiene para el resto de la app; los del otro género pasan a no convocados.
    c.mixed = c.division === 'mixto';
    aplicarCategoria(store);
    const fuera = store.roster.filter(function (p) { return p.noConvAuto; }).length;
    if (fuera) toast(fuera + ' jugador(es) pasan a no convocados por la categoría');
  }
  save(); render();
}

// Texto que se va escribiendo (se guarda sin redibujar para no perder el cursor).
function alEscribir(ev) {
  const el = ev.target;
  // Datos de un jugador en la ventana de edición: se guardan mientras se escribe.
  const campo = el.getAttribute('data-pe');
  if (campo) {
    const p = P(el.getAttribute('data-id')); if (!p) return;
    const valor = el.value.trim();
    if (campo === 'num' && !valor) return; // el número no puede quedar vacío
    p[campo] = valor;
    save();
    return;
  }
  const k = el.getAttribute('data-in'); if (!k) return;
  if (k === 'npNum') ui.newP.num = el.value;
  else if (k === 'npName') ui.newP.name = el.value;
  else if (k === 'bulk') ui.bulk = el.value;
}

export function conectarControles(app) {
  app.addEventListener('pointerdown', alPresionar);
  app.addEventListener('pointerup', function () { soltarPresion(); terminarDesliz(); });
  app.addEventListener('pointercancel', function () {
    soltarPresion();
    if (desliz) { desliz.el.style.transform = ''; desliz = null; }
  });
  app.addEventListener('pointermove', moverDesliz);
  // Evita el menú del navegador al mantener presionado el cuadro de proporción.
  app.addEventListener('contextmenu', function (ev) { if (ev.target.closest('[data-a="swapRatio"]')) ev.preventDefault(); });
  app.addEventListener('click', alTocar);
  app.addEventListener('change', alCambiar);
  app.addEventListener('input', alEscribir);
}

// Pull paso a paso. El equipo que saca se deduce solo (el primero sale de
// Ajustes; después saca quien anotó).
//   Mi equipo:  ¿quién saca? → cronometrar (opcional) → ¿dentro o fuera?
//   Rival:      (solo el primer pull: tocar al soltar, parte el reloj) → ¿dentro o fuera?
// Al elegir dentro/fuera se guarda el pull y se pasa directo al juego.
import { store, cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { short } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';

export function quienSaca(s) { return s.offense === 'us' ? 'them' : 'us'; }

function hayPull() { return store.game.events.some(function (e) { return e.type === 'pull'; }); }

// Paso con que empieza el pull de este punto.
function pasoInicial(saca) {
  if (saca === 'us') return 'player';
  return hayPull() ? 'land' : 'release';
}

export function viewPull(s) {
  const c = cfg(), saca = quienSaca(s);
  if (!ui.pull || ui.pull.point !== s.point) {
    ui.pull = { point: s.point, step: pasoInicial(saca), player: null, start: null, ms: null, relT: null };
  }
  const pu = ui.pull;
  let h = '<div class="scr">';
  h += '<div class="paso-h ' + (saca === 'us' ? 'us' : 'th') + '"><span class="disp">PULL</span><span>' +
    (saca === 'us' ? esc(c.club) + ' saca · estamos en defensa' : esc(c.rival) + ' saca · estamos en ataque') + '</span></div>';

  if (pu.step === 'player') {
    h += '<p class="q disp">¿Quién saca el pull?</p><div class="pgrid" style="--cols:2">';
    s.line.forEach(function (id) {
      const p = store.roster.find(function (x) { return x.id === id; });
      h += '<button class="pb" data-a="pullPlayer" data-id="' + id + '"><span class="num disp">' + esc(short(id)) + '</span><span class="nom">' + esc(p ? p.name : '') + '</span></button>';
    });
    h += '</div><div class="mini"><button class="btn" data-a="undo">Editar línea</button><button class="btn" data-a="pullPlayer">Sin registrar</button></div>';

  } else if (pu.step === 'timing') {
    h += '<p class="q disp">' + (pu.player ? esc(short(pu.player)) + ' saca el pull' : 'Cronometrar el vuelo') + '</p>';
    h += '<button class="hang-big disp" data-a="hang">Toca al<br>SOLTAR<br>el disco</button>';
    h += '<p class="muted" style="margin:0;text-align:center">Luego toca en <b>cualquier parte</b> de la pantalla cuando caiga o lo atrapen.' +
      (hayPull() ? '' : ' Así también parte el reloj del partido.') + '</p>';
    h += '<div class="mini"><button class="btn" data-a="pullBack">Atrás</button><button class="btn" data-a="pullNoTime">No cronometrar</button></div>';

  } else if (pu.step === 'running') {
    // Capa que cubre toda la pantalla: cualquier toque detiene el cronómetro.
    h += '<div class="hang-ov" data-a="hangStop" role="button" aria-label="Detener cronómetro">' +
      '<span class="hang-v disp" id="hangv">0.00 s</span><span class="disp" style="font-size:24px">Toca en cualquier parte<br>cuando caiga o lo atrapen</span></div>';

  } else if (pu.step === 'release') {
    h += '<p class="q disp">' + esc(c.rival) + ' saca el primer pull</p>';
    h += '<button class="hang-big disp" data-a="relRival">Toca cuando<br>SUELTEN<br>el pull</button>';
    h += '<p class="muted" style="margin:0;text-align:center">Así parte el reloj del partido.</p>';
    h += '<div class="mini"><button class="btn" data-a="undo">Editar línea</button></div>';

  } else { // 'land'
    if (pu.ms != null) {
      h += '<div class="aviso info"><span>Vuelo: <b class="disp" style="font-size:22px">' + (pu.ms / 1000).toFixed(2) + ' s</b></span><button class="btn sm" data-a="hangRedo">Repetir</button></div>';
    }
    h += '<p class="q disp">¿Dónde cae el pull?</p>';
    h += '<div class="dfgrid"><button class="btn fill disp" data-a="pullIn" data-v="1">Dentro</button><button class="btn themfill disp" data-a="pullIn" data-v="0">Fuera</button></div>';
    h += '<div class="mini">' + (saca === 'us'
      ? '<button class="btn" data-a="pullBack">Atrás</button>'
      : '<button class="btn" data-a="undo">Editar línea</button>') + '</div>';
  }
  h += '</div>';
  return h;
}

// Actualiza el cronómetro del vuelo del disco en pantalla.
export function hangTick() {
  const pu = ui.pull; if (!pu || pu.start == null) return;
  const el = document.getElementById('hangv');
  if (el) el.textContent = ((performance.now() - pu.start) / 1000).toFixed(2) + ' s';
  requestAnimationFrame(hangTick);
}

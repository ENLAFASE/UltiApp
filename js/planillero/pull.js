// Pantalla del pull: quién saca, tiempo de vuelo (opcional) y si cae dentro o fuera.
import { cfg } from '../almacen.js';
import { ui } from '../ui.js';
import { short } from '../modelos/jugador.js';
import { esc } from '../util/formato.js';

export function viewPull(s) {
  const c = cfg();
  if (!ui.pull || ui.pull.point !== s.point) {
    ui.pull = { point: s.point, team: s.offense === 'us' ? 'them' : 'us', player: null, timing: ui.pull ? ui.pull.timing : true, start: null, ms: null, inb: null };
  }
  const pu = ui.pull;
  let h = '<div class="pad stack">';
  h += '<h2 class="h2 disp">Pull</h2>';
  h += '<span class="lbl">¿Quién saca?</span><div class="grid2 team-toggle">' +
    '<button class="btn disp us" aria-pressed="' + (pu.team === 'us') + '" data-a="pullTeam" data-v="us">' + esc(c.club) + '</button>' +
    '<button class="btn disp th" aria-pressed="' + (pu.team === 'them') + '" data-a="pullTeam" data-v="them">' + esc(c.rival) + '</button></div>';
  if (pu.team === 'us') {
    h += '<span class="lbl">Jugador que saca (opcional)</span><div class="row" style="flex-wrap:wrap;gap:6px">';
    s.line.forEach(function (id) { h += '<button class="chip" aria-pressed="' + (pu.player === id) + '" data-a="pullPlayer" data-id="' + id + '">' + esc(short(id)) + '</button>'; });
    h += '</div>';
  }
  h += '<div class="card stack"><label class="switch">Cronometrar vuelo<input type="checkbox" role="switch" data-a="pullTiming"' + (pu.timing ? ' checked' : '') + '></label>';
  if (pu.timing) {
    const running = pu.start != null;
    const btnTxt = running ? 'Tocar al<br>caer o recibir' : (pu.ms != null ? 'Repetir' : 'Tocar al<br>soltar');
    h += '<div class="hang"><button class="hang-btn disp' + (running ? ' run' : '') + '" data-a="hang">' + btnTxt + '</button>' +
      '<div class="stack" style="gap:4px"><span class="hang-v disp" id="hangv">' + ((pu.ms != null ? pu.ms : 0) / 1000).toFixed(2) + ' s</span>' +
      '<span class="muted">' + (running ? 'Cronometrando…' : (pu.ms != null ? 'Tiempo de vuelo registrado' : 'Toca cuando el disco sale de la mano')) + '</span></div></div>';
  }
  h += '</div>';
  h += '<span class="lbl">¿Dónde cae?</span><div class="grid2">' +
    '<button class="chip disp" style="min-height:60px;border-radius:10px;font-size:20px" aria-pressed="' + (pu.inb === true) + '" data-a="pullIn" data-v="1">Dentro</button>' +
    '<button class="chip them disp" style="min-height:60px;border-radius:10px;font-size:20px" aria-pressed="' + (pu.inb === false) + '" data-a="pullIn" data-v="0">Fuera</button></div>';
  h += '<button class="btn big fill disp full" data-a="confirmPull"' + (pu.inb === null || pu.start != null ? ' disabled' : '') + '>Confirmar pull</button>';
  h += '<button class="btn full" data-a="undo">Deshacer línea</button>';
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

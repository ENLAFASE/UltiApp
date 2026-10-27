// Pequeñas ayudas para mostrar textos, tiempos y nombres de archivo.

// Evita que un nombre con símbolos raros rompa la página.
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// Identificador único para cada jugador.
export function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Milisegundos a "mm:ss".
export function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

// Fecha de hoy como "2026-10-26", para nombres de archivo.
export function fileStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// "Club Ñuñoa" -> "club-nunoa", para nombres de archivo.
export function slug(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'partido';
}

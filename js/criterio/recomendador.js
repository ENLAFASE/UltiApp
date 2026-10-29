// ============================================================================
//  CRITERIO · RECOMENDADOR DE LÍNEAS
//  Arma la línea de 7 según el criterio elegido en Ajustes y explica por qué
//  eligió a cada jugador. Solo usa jugadores convocados.
//
//    Competencia    según la zona del marcador (ver zonas.js):
//                   asegurar el ataque, línea fuerte, rotación con piezas
//                   clave o descanso de piezas clave.
//    Amistoso       rota, pero asegura manejo, corte de avance y corte de gol.
//    Entrenamiento  rotación pareja: descansó el punto anterior y menos puntos.
//
//  Siempre respeta la proporción de géneros si el partido es mixto; si no hay
//  suficientes jugadores de un género, completa con quien haya.
// ============================================================================
import { store, cfg } from '../almacen.js';
import { ev, evaluado } from '../coach/evaluacion.js';
import { PARAM } from './parametros.js';
import { ROLES, nivelPunto, nivelAtaque, nivelDefensa, nivelGeneral, piezasClave, n1 } from './metricas.js';
import { zonaDelMarcador, ZONAS } from './zonas.js';

export const MODOS = {
  competencia: { nombre: 'Competencia', ayuda: 'Decide según el marcador: asegurar el ataque, línea fuerte, rotación con piezas clave (ganando por el margen de ventaja) o descanso de piezas clave (perdiendo por el margen de desventaja). Siempre asegura manejo, corte de avance y corte de gol.' },
  amistoso: { nombre: 'Amistoso', ayuda: 'Rota a todos, pero asegura un buen manejo, un buen corte de avance y un buen corte de gol en cada punto.' },
  entrenamiento: { nombre: 'Entrenamiento', ayuda: 'Rotación pareja: entra quien descansó el punto anterior y lleva menos puntos jugados.' }
};

export function modoActual() { return MODOS[cfg().lineMode] ? cfg().lineMode : 'entrenamiento'; }

// Jugadores convocados para el partido (los no convocados no se sugieren ni se muestran).
export function convocados() { return store.roster.filter(function (p) { return !p.noConv; }); }

function genero(p) { return p.g === 'F' ? 'F' : 'M'; }
const ROLES_ESTRUCTURA = ROLES.filter(function (r) { return r.k !== 'def'; });

// s = estado del partido, req = { M, F } que pide la proporción (o null),
// elegidos = ids que el coach ya marcó a mano.
export function recomendarLinea(s, req, elegidos) {
  const c = cfg(), modo = modoActual(), ataque = s.offense === 'us', EN_CANCHA = 7;
  const lista = convocados();
  const enLista = function (id) { return lista.some(function (p) { return p.id === id; }); };
  const sel = elegidos.filter(enLista), motivos = {}, tengo = { M: 0, F: 0 };
  const P = function (id) { return lista.find(function (x) { return x.id === id; }); };
  sel.forEach(function (id) { motivos[id] = 'Elegido por ti'; tengo[genero(P(id))]++; });
  let libres = lista.filter(function (p) { return sel.indexOf(p.id) < 0; });

  /* ----- desgaste ----- */
  const primerPunto = !s.lastLine.length;
  function descanso(p) { return s.lastLine.indexOf(p.id) < 0; }
  function pts(p) { return (s.stats[p.id] || {}).pts || 0; }
  function racha(p) { return (s.racha || {})[p.id] || 0; }
  function desgaste(p, bono) {
    return (descanso(p) ? bono : 0) - PARAM.CASTIGO_RACHA * Math.max(0, racha(p) - 1) - PARAM.CASTIGO_PUNTOS * pts(p);
  }
  function txtDesgaste(p) {
    if (primerPunto) return '';
    const r = racha(p);
    return ' · ' + (descanso(p) ? 'descansó' : (r >= 2 ? r + ' puntos seguidos' : 'jugó el anterior')) + ' · ' + pts(p) + (pts(p) === 1 ? ' punto' : ' puntos');
  }

  /* ----- armar la línea ----- */
  function cabe(p) { return sel.length < EN_CANCHA && (!req || tengo[genero(p)] < req[genero(p)]); }
  function tomar(p, motivo) {
    sel.push(p.id); tengo[genero(p)]++; motivos[p.id] = motivo;
    libres = libres.filter(function (x) { return x.id !== p.id; });
  }
  // Completa hasta 7 con el mejor puntaje (mayor = mejor).
  function completar(puntaje, motivoDe) {
    const orden = function (a, b) { return (puntaje(b) - puntaje(a)) || ((+a.num || 0) - (+b.num || 0)); };
    libres.slice().sort(orden).forEach(function (p) { if (cabe(p)) tomar(p, motivoDe(p)); });
    if (sel.length < EN_CANCHA) { // faltan jugadores de un género: completar con quien haya
      libres.slice().sort(orden).forEach(function (p) {
        if (sel.length < EN_CANCHA) { sel.push(p.id); motivos[p.id] = motivoDe(p) + ' (completa la línea; no alcanza la proporción)'; }
      });
    }
  }
  // Asegura la columna vertical: un manejo, un corte de avance y un corte de gol
  // buenos (nota 4 o más, o la mejor disponible).
  //   rotar: entre los buenos entra quien descansó y lleva menos puntos;
  //          si no, entra la mejor nota (empate: menos desgaste).
  //   evitar:   ids que se prefiere no usar (si hay alternativa).
  //   preferir: ids que se prefiere usar si son buenos en el rol (piezas clave).
  // Cada rol lo cubre un jugador distinto: en una columna vertical nadie hace dos roles.
  const asignados = new Set();
  function asegurarEstructura(rotar, evitar, sufijo, preferir) {
    ROLES_ESTRUCTURA.forEach(function (rol) {
      // ¿Alguien ya elegido (a mano) cubre el rol y no tiene otro rol asignado?
      const yaEsta = sel.find(function (id) { return !asignados.has(id) && ev(P(id))[rol.k] >= PARAM.NOTA_BUENA; });
      if (yaEsta) { asignados.add(yaEsta); return; }
      let cands = libres.filter(cabe);
      if (evitar) {
        const fuera = cands.filter(function (p) { return !evitar.has(p.id); });
        if (fuera.length) cands = fuera;
      }
      if (!cands.length) return;
      let mejor = Math.max.apply(null, cands.map(function (p) { return ev(p)[rol.k]; }));
      if (preferir) {
        const clave = cands.filter(function (p) { return preferir.has(p.id) && ev(p)[rol.k] >= Math.min(PARAM.NOTA_BUENA, mejor); });
        if (clave.length) { cands = clave; mejor = Math.max.apply(null, cands.map(function (p) { return ev(p)[rol.k]; })); }
      }
      const buenos = cands.filter(function (p) { return ev(p)[rol.k] >= Math.min(PARAM.NOTA_BUENA, mejor); });
      buenos.sort(function (a, b) {
        const nota = ev(b)[rol.k] - ev(a)[rol.k];
        const rot = (descanso(b) - descanso(a)) || (pts(a) - pts(b));
        return rotar ? (rot || nota) : (nota || (desgaste(b, 0.5) - desgaste(a, 0.5)));
      });
      const p = buenos[0];
      asignados.add(p.id);
      const esClave = preferir && preferir.has(p.id);
      tomar(p, rol.principal + ' (' + rol.nombre + ' ' + ev(p)[rol.k] + ')' + (esClave ? (sufijo || '') : '') + txtDesgaste(p));
    });
  }
  function textoNivel(p, valor, tipo) { return 'Nivel ' + n1(valor) + ' ' + tipo + txtDesgaste(p); }

  let resumen, zona = null;
  if (modo === 'competencia') {
    zona = zonaDelMarcador(s.us, s.them, c);
    resumen = 'Competencia · ' + ZONAS[zona.id].nombre + ' · ' + zona.motivo;
    const B = PARAM.BONO_DESCANSO;

    if (zona.id === 'rotacion') {
      // Piezas clave en la estructura; el resto, minutos para el nivel más bajo.
      asegurarEstructura(true, null, ' · pieza clave', piezasClave(lista, c.mixed));
      completar(function (p) { return (5 - nivelPunto(p, ataque)) + desgaste(p, B.rotacion); },
        function (p) { return 'Suma minutos (nivel ' + n1(nivelPunto(p, ataque)) + ')' + txtDesgaste(p); });

    } else if (zona.id === 'descanso') {
      const clave = piezasClave(lista, c.mixed);
      asegurarEstructura(true, clave);
      completar(function (p) { return (clave.has(p.id) ? -10 : 0) + desgaste(p, B.rotacion) + 0.2 * nivelPunto(p, ataque); },
        function (p) { return (clave.has(p.id) ? 'Pieza clave (no alcanzan los demás)' : 'Juega mientras descansan las piezas clave') + txtDesgaste(p); });

    } else if (zona.id === 'fuerte') {
      asegurarEstructura(false);
      completar(function (p) { return nivelGeneral(p) + desgaste(p, B.fuerte); },
        function (p) { return textoNivel(p, nivelGeneral(p), 'general'); });

    } else if (ataque) { // asegurar el ataque, punto en que recibimos
      asegurarEstructura(false);
      completar(function (p) { return nivelAtaque(p) + desgaste(p, B.ataque); },
        function (p) { return textoNivel(p, nivelAtaque(p), 'en ataque'); });

    } else { // asegurar el ataque, punto en que defendemos: descansa el núcleo ofensivo
      const nucleo = nucleoOfensivo(lista, c.mixed);
      asegurarEstructura(true, nucleo);
      completar(function (p) { return nivelDefensa(p) - (nucleo.has(p.id) ? PARAM.CASTIGO_NUCLEO_ATAQUE : 0) + desgaste(p, B.ataque); },
        function (p) { return nucleo.has(p.id) ? textoNivel(p, nivelDefensa(p), 'en defensa') + ' (del núcleo ofensivo)' : textoNivel(p, nivelDefensa(p), 'en defensa') + ' · el núcleo ofensivo descansa'; });
    }

  } else if (modo === 'amistoso') {
    resumen = 'Amistoso · rota, con manejo, corte de avance y corte de gol asegurados.';
    asegurarEstructura(true);
    completar(function (p) { return desgaste(p, 1); }, rotacionTxt);

  } else {
    resumen = 'Entrenamiento · rotación pareja según puntos jugados.';
    completar(function (p) { return desgaste(p, 1); }, rotacionTxt);
  }

  function rotacionTxt(p) {
    if (primerPunto) return 'Primer punto: rotación por número';
    return (descanso(p) ? 'Descansó el punto anterior' : 'Jugó el anterior') + ' · ' + pts(p) + (pts(p) === 1 ? ' punto jugado' : ' puntos jugados');
  }

  const sinEvaluar = lista.filter(function (p) { return !evaluado(p); }).length;
  return { ids: sel, resumen: resumen, motivos: motivos, sinEvaluar: sinEvaluar, modo: modo, zona: zona && zona.id };
}

// Los mejores para atacar (los que se reservan para el próximo punto de ataque).
function nucleoOfensivo(lista, mixto) {
  const nucleo = new Set();
  const top = function (g, n) {
    g.slice().sort(function (a, b) { return nivelAtaque(b) - nivelAtaque(a); }).slice(0, n).forEach(function (p) { nucleo.add(p.id); });
  };
  if (mixto) {
    top(lista.filter(function (p) { return p.g !== 'F'; }), 4);
    top(lista.filter(function (p) { return p.g === 'F'; }), 4);
  } else top(lista, 7);
  return nucleo;
}

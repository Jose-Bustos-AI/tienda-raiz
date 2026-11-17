import { PRODUCTOS, CATEGORIAS, FILTROS, LUZ, DIFICULTAD, MACETAS, ENVIO_GRATIS, COSTE_ENVIO, CUPONES, buscar, desde, euros, recomendar } from './datos.js';
import { plantaSVG, crecer, habitacionSVG, nivelLuz, moverMaceta } from './planta.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const app = $('#app');
const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Estado guardado en el navegador ---------- */
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
let carrito = leer('raiz-carrito', []);
let favoritos = leer('raiz-favoritos', []);
let cupon = leer('raiz-cupon', null);
if (!CUPONES[cupon]) cupon = null;

const categoria = (id) => CATEGORIAS.find((c) => c.id === id)?.nombre || '';
const subtotal = () => carrito.reduce((n, l) => n + l.precio * l.cantidad, 0);
const unidades = () => carrito.reduce((n, l) => n + l.cantidad, 0);
const descuento = () => (cupon ? Math.round(subtotal() * CUPONES[cupon] * 100) / 100 : 0);
// Importe que cuenta para el envío gratis: lo que se paga por los productos.
const base = () => subtotal() - descuento();
const maceta = (id) => MACETAS.find((m) => m.id === id);

function tostada(texto) {
  const t = $('#tostada');
  t.textContent = texto;
  t.classList.add('ver');
  clearTimeout(tostada.t);
  tostada.t = setTimeout(() => t.classList.remove('ver'), 2600);
}
function burbuja(id, n) {
  const b = $(id);
  b.hidden = n === 0;
  if (b.textContent !== String(n)) { b.textContent = n; b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); }
}
function actualizarContadores() { burbuja('#num-carrito', unidades()); burbuja('#num-fav', favoritos.length); }

/* ---------- Carrito ---------- */
function añadir(id, tamanoId, macetaId = 'vivero', abrir = true) {
  const p = buscar(id);
  const t = p.tamanos.find((x) => x.id === tamanoId) || p.tamanos[0];
  const m = p.sinMaceta ? null : maceta(macetaId);
  const precio = Math.round((t.precio + (m ? m.extra : 0)) * 100) / 100;
  const clave = `${id}|${t.id}|${m ? m.id : ''}`;
  const linea = carrito.find((l) => l.clave === clave);
  if (linea) linea.cantidad += 1;
  else carrito.push({ clave, id, tamano: t.id, maceta: m ? m.id : null, precio, cantidad: 1 });
  guardar('raiz-carrito', carrito);
  actualizarContadores();
  pintarCajon();
  if (abrir) abrirCajon();
}
function cambiar(i, delta) {
  carrito[i].cantidad += delta;
  if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
  guardar('raiz-carrito', carrito);
  actualizarContadores();
  pintarCajon();
}
function barraEnvio() {
  const falta = ENVIO_GRATIS - base();
  const pct = Math.min(base() / ENVIO_GRATIS, 1) * 100;
  const texto = carrito.length === 0 ? `Envío gratis a partir de ${euros(ENVIO_GRATIS)}`
    : falta > 0 ? `Te faltan <b>${euros(falta)}</b> para el envío gratis` : '<b>Tienes el envío gratis</b>';
  return `${texto}<div class="envio__barra"><span style="width:${pct}%"></span></div>`;
}
function detalleLinea(l) {
  const p = buscar(l.id);
  const t = p.tamanos.find((x) => x.id === l.tamano);
  return [p.tamanos.length > 1 || !p.sinMaceta ? t.nombre : '', l.maceta ? maceta(l.maceta).nombre : ''].filter(Boolean).join(' · ');
}
function lineaHTML(l, i, editable = true) {
  const p = buscar(l.id);
  return `<div class="linea">
    <img src="${p.imagen}" alt="">
    <div>
      <h3>${esc(p.nombre)}</h3>
      <small>${esc(detalleLinea(l))}</small>
      ${editable ? `<div class="cantidad"><button type="button" data-cant="${i}" data-delta="-1" aria-label="Quitar una unidad">−</button><span>${l.cantidad}</span><button type="button" data-cant="${i}" data-delta="1" aria-label="Añadir una unidad">+</button></div>` : `<small>${l.cantidad} ${l.cantidad === 1 ? 'unidad' : 'unidades'}</small>`}
    </div>
    <div><b>${euros(l.precio * l.cantidad)}</b>${editable ? `<br><button class="quitar" type="button" data-quitar="${i}">Quitar</button>` : ''}</div>
  </div>`;
}
function pintarCajon() {
  $('#envio').innerHTML = barraEnvio();
  if (!carrito.length) {
    $('#lineas').innerHTML = '<div class="vacio"><b>Tu carrito está vacío</b>¿No sabes cuál elegir? Responde cinco preguntas y te lo decimos.</div>';
    $('#cajon-pie').innerHTML = '<a class="btn btn--ancho" href="#/encuentra" data-cerrar>Encontrar mi planta</a>';
    return;
  }
  $('#lineas').innerHTML = carrito.map((l, i) => lineaHTML(l, i)).join('') + sugerenciaHTML();
  $('#cajon-pie').innerHTML = `${cuponHTML()}
    <dl class="cuentas"><dt>Subtotal</dt><dd>${euros(subtotal())}</dd>${descuento() ? `<dt>Descuento</dt><dd>−${euros(descuento())}</dd>` : ''}</dl>
    <div class="total"><span>Total sin envío</span><span>${euros(base())}</span></div>
    <a class="btn btn--ancho" href="#/pago" data-cerrar>Finalizar compra</a>`;
}

/* Con una planta en el carrito y sin kit de cuidado, se propone el kit. */
function sugerenciaHTML() {
  const kit = buscar('kit');
  const hayPlanta = carrito.some((l) => buscar(l.id).cuidados);
  if (!kit || !hayPlanta || carrito.some((l) => l.id === 'kit')) return '';
  return `<div class="sugerencia">
    <img src="${kit.imagen}" alt="">
    <div><small>Para cuidarla bien</small><b>${esc(kit.nombre)}</b><span>${euros(desde(kit))}</span></div>
    <button class="btn btn--hueco" type="button" data-sugerir="kit">Añadir</button>
  </div>`;
}

function cuponHTML() {
  if (cupon) {
    return `<div class="cupon cupon--puesto"><span>Código <b>${esc(cupon)}</b>: −${Math.round(CUPONES[cupon] * 100)} %</span><button class="quitar" type="button" data-quitar-cupon>Quitar</button></div>`;
  }
  return `<form class="cupon" data-cupon novalidate>
    <label class="visual-oculto" for="campo-cupon">Código de descuento</label>
    <input id="campo-cupon" name="cupon" type="text" placeholder="Código de descuento" autocomplete="off" autocapitalize="characters">
    <button class="btn btn--hueco" type="submit">Aplicar</button>
  </form><p class="cupon__error" id="cupon-error" role="alert"></p>`;
}
let focoPrevio = null;
function abrirCajon() {
  focoPrevio = document.activeElement;
  $('#cajon').classList.add('abierto');
  $('#cajon').setAttribute('aria-hidden', 'false');
  document.body.classList.add('bloqueado');
  setTimeout(() => $('#cajon .icono[data-cerrar]')?.focus(), 50);
}
function cerrarCajon() {
  $('#cajon').classList.remove('abierto');
  $('#cajon').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('bloqueado');
  focoPrevio?.focus?.();
}
$('#cajon').addEventListener('click', (e) => {
  const c = e.target.closest('[data-cant]');
  if (c) return cambiar(+c.dataset.cant, +c.dataset.delta);
  const q = e.target.closest('[data-quitar]');
  if (q) return cambiar(+q.dataset.quitar, -999);
  const sug = e.target.closest('[data-sugerir]');
  if (sug) { const p = buscar(sug.dataset.sugerir); añadir(p.id, p.tamanos[0].id, 'vivero', false); tostada(`${p.nombre} añadido al carrito`); return; }
  if (e.target.closest('[data-quitar-cupon]')) { cupon = null; guardar('raiz-cupon', cupon); pintarCajon(); return; }
  if (e.target.closest('[data-cerrar]')) cerrarCajon();
});
$('#cajon').addEventListener('submit', (e) => {
  const f = e.target.closest('[data-cupon]');
  if (!f) return;
  e.preventDefault();
  const codigo = f.cupon.value.trim().toUpperCase();
  if (CUPONES[codigo]) {
    cupon = codigo;
    guardar('raiz-cupon', cupon);
    pintarCajon();
    tostada(`Código aplicado: ${Math.round(CUPONES[codigo] * 100)} % de descuento`);
  } else {
    $('#cupon-error').textContent = codigo ? 'Ese código no existe. Prueba con BIENVENIDA10.' : 'Escribe un código.';
    f.cupon.focus();
  }
});
$('#btn-carrito').addEventListener('click', () => { pintarCajon(); abrirCajon(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#cajon').classList.contains('abierto')) cerrarCajon(); });

/* ---------- Favoritos ---------- */
function alternarFavorito(id) {
  const i = favoritos.indexOf(id);
  if (i >= 0) favoritos.splice(i, 1); else favoritos.push(id);
  guardar('raiz-favoritos', favoritos);
  actualizarContadores();
  tostada(i >= 0 ? 'Quitada de favoritos' : 'Guardada en favoritos');
  $$(`[data-fav="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', String(i < 0)));
}
const CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

/* ---------- Iconos de cuidados ---------- */
const ICONO = {
  luz: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  riego: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
  mascota: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="10" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="14" cy="5.5" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-5.5 3.5-5.5 6 0 1.7 1.3 2.5 2.8 2.5 1.2 0 1.8-.6 2.7-.6s1.5.6 2.7.6c1.5 0 2.8-.8 2.8-2.5 0-2.5-2.5-6-5.5-6z"/></svg>',
  nivel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21v-9M12 14c-4.5 0-7-3-7-7 4.5 0 7 2.5 7 7zm0-2c0-4.5 2.5-7 7-7 0 4-2.5 7-7 7z"/></svg>',
  aire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/></svg>'
};
function etiquetasCuidado(c) {
  if (!c) return '';
  return `<ul class="mini-cuidados">
    <li title="${LUZ[c.luz[0]]} a ${LUZ[c.luz[1]].toLowerCase()}">${ICONO.luz}${c.luz[0] === 1 ? 'Poca luz' : c.luz[0] >= 3 ? 'Mucha luz' : 'Luz media'}</li>
    <li>${ICONO.riego}${c.riego >= 14 ? `${Math.round(c.riego / 7)} sem.` : `${c.riego} días`}</li>
    ${c.mascotas ? `<li class="mini-cuidados--ok">${ICONO.mascota}Mascotas</li>` : ''}
  </ul>`;
}
function puntos(n, max = 4) {
  return `<span class="puntos">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
}

/* ---------- Tarjetas ---------- */
function tarjeta(p) {
  const fav = favoritos.includes(p.id);
  return `<article class="tarjeta revela">
    <a class="tarjeta__foto" href="#/producto/${p.id}" tabindex="-1" aria-hidden="true"><img src="${p.imagen}" alt="" loading="lazy"></a>
    <div class="tarjeta__marcas">
      ${p.nuevo ? '<span class="marca">Nueva</span>' : ''}
      ${p.antes ? `<span class="marca marca--oferta">−${Math.round((1 - desde(p) / p.antes) * 100)} %</span>` : ''}
      ${p.cuidados?.mascotas ? '<span class="marca marca--verde">Apta mascotas</span>' : ''}
    </div>
    <button class="corazon" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Guardar ${esc(p.nombre)} en favoritos">${CORAZON}</button>
    <div class="tarjeta__cuerpo">
      <h3 class="tarjeta__nombre"><a href="#/producto/${p.id}">${esc(p.nombre)}</a></h3>
      <span class="tarjeta__lema">${esc(p.lema)}</span>
      ${etiquetasCuidado(p.cuidados)}
      <span class="precio-linea">${p.tamanos.length > 1 ? 'Desde ' : ''}${euros(desde(p))}${p.antes ? `<s>${euros(p.antes)}</s>` : ''}</span>
    </div>
  </article>`;
}

/* ---------- Recomendador ---------- */
const PREGUNTAS = [
  { id: 'luz', titulo: '¿Cuánta luz tiene el sitio donde la vas a poner?', ayuda: 'Arrastra la planta por el salón hasta el sitio donde la pondrías: cerca de la ventana, al fondo o en un rincón.' },
  { id: 'riego', titulo: '¿Cada cuánto te acuerdas de regar?', ayuda: 'Sé sincero: no hay respuestas malas, hay plantas para cada ritmo.',
    opciones: [{ v: 4, t: 'Muy a menudo', d: 'Me encanta estar pendiente', i: 'g3' }, { v: 8, t: 'Una vez por semana', d: 'Tengo mi día de riego', i: 'g2' }, { v: 18, t: 'Cuando me acuerdo', d: 'Cada dos o tres semanas', i: 'g1' }] },
  { id: 'mascotas', titulo: '¿Vives con perros o gatos?', ayuda: 'Algunas plantas les sientan mal si las mordisquean.',
    opciones: [{ v: true, t: 'Sí, tengo mascotas', d: 'Solo plantas seguras', i: 'mascota' }, { v: false, t: 'No', d: 'Todas me valen', i: 'casa' }] },
  { id: 'espacio', titulo: '¿Qué hueco quieres llenar?', ayuda: 'Así te proponemos el tamaño adecuado.',
    opciones: [{ v: 'pequena', t: 'Una balda o una mesa', d: 'Algo pequeño y simpático', i: 'peq' }, { v: 'mediana', t: 'Un rincón del suelo', d: 'Mediana, con presencia', i: 'med' }, { v: 'grande', t: 'Que sea la protagonista', d: 'Grande, que se note', i: 'gran' }] },
  { id: 'experiencia', titulo: '¿Qué tal se te dan las plantas?', ayuda: 'La última y te decimos cuál es la tuya.',
    opciones: [{ v: 1, t: 'Es mi primera planta', d: 'Mejor que sea muy fácil', i: 'brote' }, { v: 2, t: 'Ya tengo alguna', d: 'Y siguen vivas', i: 'planta' }, { v: 3, t: 'Mi casa es una selva', d: 'Me atrevo con todo', i: 'selva' }] }
];
function iconoOpcion(k) {
  const gota = '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>';
  const g = (n) => `<svg viewBox="0 0 ${n * 20 + 4} 24">${Array.from({ length: n }, (_, i) => `<g transform="translate(${i * 20 - 2} 0)">${gota}</g>`).join('')}</svg>`;
  const hoja = (x, y, e) => `<g transform="translate(${x} ${y}) scale(${e})"><path d="M12 21v-9M12 14c-4.5 0-7-3-7-7 4.5 0 7 2.5 7 7zm0-2c0-4.5 2.5-7 7-7 0 4-2.5 7-7 7z"/></g>`;
  const mapa = {
    g3: g(3), g2: g(2), g1: g(1),
    mascota: ICONO.mascota,
    casa: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
    peq: `<svg viewBox="0 0 24 24">${hoja(4, 2, 0.65)}<path d="M8 17h8l-1 4H9z"/></svg>`,
    med: `<svg viewBox="0 0 24 24">${hoja(1, -2, 0.9)}<path d="M7 17h10l-1.5 5h-7z"/></svg>`,
    gran: '<svg viewBox="0 0 24 24"><path d="M12 22V9M12 9c-2-4-6-5-9-4 3 0 6 2 9 4zm0 0c2-4 6-5 9-4-3 0-6 2-9 4zm0 0c-1-4 0-6 0-7 0 1 1 3 0 7z"/><path d="M9 22h6"/></svg>',
    brote: `<svg viewBox="0 0 24 24">${hoja(4, 4, 0.65)}</svg>`,
    planta: `<svg viewBox="0 0 24 24">${hoja(0, 0, 1)}</svg>`,
    selva: `<svg viewBox="0 0 24 24">${hoja(-4, 0, 0.75)}${hoja(10, -2, 0.75)}${hoja(3, 4, 0.75)}</svg>`
  };
  return mapa[k] || '';
}
const ORIENTACIONES = [{ v: 'sur', t: 'Sur u oeste' }, { v: 'este', t: 'Este' }, { v: 'norte', t: 'Norte' }];

function htmlTest(enPagina) {
  return `<section class="test ${enPagina ? 'test--pagina' : ''}" id="test" aria-labelledby="test-titulo">
    <div class="test__in envoltura">
      <div class="test__planta">
        <div class="sala" id="sala" hidden>
          <canvas class="sala__lienzo" id="sala-lienzo" role="img" aria-label="Salón en 3D con una ventana por la que entra el sol. La planta se mueve con el control de distancia."></canvas>
          <div class="sala__chapa" id="sala-chapa" aria-hidden="true"><span class="soles" id="chapa-soles"><i></i><i></i><i></i><i></i></span><b id="chapa-luz"></b><small id="chapa-m"></small></div>
          <div class="sala__pista" id="sala-pista" aria-hidden="true">✥ Arrastra la planta a cualquier rincón</div>
        </div>
        <div class="test__sol" aria-hidden="true"></div>
        <div id="test-planta">${plantaSVG()}</div>
        <div class="test__progreso" aria-hidden="true"><span id="test-barra"></span></div>
        <p class="test__paso" id="test-paso"></p>
      </div>
      <div class="test__panel">
        <span class="etiqueta">Recomendador</span>
        <${enPagina ? 'h1' : 'h2'} class="bloque__titulo" id="test-titulo">Encuentra la planta que <em>sí</em> va a sobrevivir en tu casa</${enPagina ? 'h1' : 'h2'}>
        <div class="test__pregunta" id="test-pregunta" aria-live="polite"></div>
      </div>
    </div>
  </section>`;
}

let sala3d = null;
let hero3d = null;
function limpiar3D() {
  sala3d?.destruir(); sala3d = null;
  hero3d?.destruir(); hero3d = null;
}

function activarTest() {
  const raiz = $('#test');
  if (!raiz) return;
  const svg = $('#test-planta svg');
  const guardado = leer('raiz-test', null);
  const r = guardado?.r || { luz: 2, metros: 2, orientacion: 'sur' };
  let paso = guardado?.terminado ? PREGUNTAS.length : 0;
  let sala = null;
  let ocupado = false;
  raiz.style.setProperty('--cab-real', `${$('#cab').offsetHeight}px`);

  // El salón en 3D refleja cada respuesta; si el dispositivo no puede con el 3D, se queda el dibujo.
  const sincronizar = () => {
    raiz.dataset.paso = paso;
    $('#chapa-luz').textContent = LUZ[r.luz];
    $('#chapa-m').textContent = `a ${(r.metros + (r.extra || 0)).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m de la ventana`;
    $('#chapa-soles').dataset.n = r.luz;
    if (!sala) return;
    sala.luz(r.metros, r.orientacion, r.luz, r.z);
    sala.estado(paso, r);
  };
  // En la portada no se monta hasta que el recomendador se acerca a la pantalla
  const cerca = new Promise((listo) => {
    if (!('IntersectionObserver' in window)) return listo();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); listo(); } }, { rootMargin: '900px 0px' });
    io.observe(raiz);
  });
  cerca.then(() => import('./jardin3d.js')).then(({ Habitacion3D }) => {
    if (!raiz.isConnected) return;
    $('#sala').hidden = false;
    raiz.classList.add('con-3d');
    sala = sala3d = new Habitacion3D($('#sala-lienzo'), {
      chapa: $('#sala-chapa'),
      alMover: (m, extra, z) => { const c = $('#metros'); if (!c) return; r.extra = extra; r.z = z; c.value = m; c.dispatchEvent(new Event('input')); $('#sala-pista').classList.add('tocada'); }
    });
    sincronizar();
  }).catch((err) => console.warn('No se pudo cargar el salón en 3D', err));

  const pintar = () => {
    const total = PREGUNTAS.length;
    ocupado = false;
    sincronizar();
    crecer(svg, paso / total);
    $('#test-barra').style.width = `${(paso / total) * 100}%`;
    $('#test-paso').textContent = paso < total ? `Pregunta ${paso + 1} de ${total}` : '¡Ya ha crecido tu recomendación!';
    const caja = $('#test-pregunta');
    caja.classList.remove('entra'); void caja.offsetWidth; caja.classList.add('entra');
    if (paso >= total) return pintarResultado(caja);
    const q = PREGUNTAS[paso];
    const atras = paso > 0 ? '<button class="test__atras" type="button" data-atras>← Anterior</button>' : '';
    if (q.id === 'luz') {
      caja.innerHTML = `<h3>${q.titulo}</h3><p class="test__ayuda">${q.ayuda}</p>
        <div class="simulador">${habitacionSVG()}
          <label class="visual-oculto" for="metros">Distancia a la ventana en metros</label>
          <input class="rango" id="metros" type="range" min="0" max="5" step="0.1" value="${r.metros}">
          <div class="simulador__fila"><div class="segmento" role="group" aria-label="Hacia dónde mira la ventana">${ORIENTACIONES.map((o) => `<button type="button" data-ori="${o.v}" aria-pressed="${o.v === r.orientacion}">${o.t}</button>`).join('')}</div>
          <div class="simulador__lectura"><small>A <b id="metros-txt"></b> de la ventana</small><b id="luz-txt"></b></div></div>
        </div>
        <div class="test__acciones">${atras}<button class="btn" type="button" data-siguiente>Siguiente</button></div>`;
      const hab = $('.habitacion', caja);
      const act = () => {
        r.metros = +$('#metros').value;
        r.luz = nivelLuz(Math.min(5, r.metros + (r.extra || 0)), r.orientacion);
        moverMaceta(hab, r.metros, r.luz);
        $('#metros-txt').textContent = `${(r.metros + (r.extra || 0)).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`;
        $('#luz-txt').textContent = LUZ[r.luz];
        hab.dataset.ori = r.orientacion;
        sincronizar();
      };
      $('#metros').addEventListener('input', act);
      $$('[data-ori]', caja).forEach((b) => b.addEventListener('click', () => {
        r.orientacion = b.dataset.ori;
        $$('[data-ori]', caja).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        act();
      }));
      act();
    } else {
      caja.innerHTML = `<h3>${q.titulo}</h3><p class="test__ayuda">${q.ayuda}</p>
        <div class="tarjetas-opcion">${q.opciones.map((o, i) => `<button class="opcion-test" type="button" data-i="${i}" aria-pressed="${r[q.id] === o.v}"><span class="opcion-test__icono" aria-hidden="true">${iconoOpcion(o.i)}</span><b>${o.t}</b><small>${o.d}</small></button>`).join('')}</div>
        <div class="test__acciones">${atras}</div>`;
      $$('.opcion-test', caja).forEach((b) => b.addEventListener('click', () => {
        if (ocupado) return;
        ocupado = true;
        r[q.id] = q.opciones[+b.dataset.i].v;
        $$('.opcion-test', caja).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        // El salón enseña la respuesta (la regadera, el gato, el tamaño, más plantas) antes de pasar a la siguiente
        sincronizar();
        if (sala && q.id === 'riego') sala.regar(r.riego <= 4 ? 3 : r.riego <= 8 ? 2 : 1);
        const espera = reducir ? 0 : !sala ? 260 : q.id === 'riego' ? 1700 : 1150;
        setTimeout(() => { paso += 1; guardar('raiz-test', { r, terminado: paso >= PREGUNTAS.length }); pintar(); }, espera);
      }));
    }
    caja.querySelector('[data-atras]')?.addEventListener('click', () => { paso -= 1; pintar(); });
    caja.querySelector('[data-siguiente]')?.addEventListener('click', () => { paso += 1; guardar('raiz-test', { r, terminado: false }); pintar(); });
  };

  const pintarResultado = (caja) => {
    const lista = recomendar(r).slice(0, 3);
    caja.innerHTML = `<h3>Estas son tus plantas</h3>
      <p class="test__ayuda">Para ${LUZ[r.luz].toLowerCase()}, ${r.riego >= 18 ? 'riego de vez en cuando' : r.riego >= 8 ? 'riego semanal' : 'riego frecuente'}${r.mascotas ? ', con mascotas en casa' : ''}.</p>
      <ol class="resultados-test">${lista.map((x, i) => `<li class="resultado-test" style="--d:${i * 120}ms">
        <a class="resultado-test__foto" href="#/producto/${x.producto.id}"><img src="${x.producto.imagen}" alt=""></a>
        <div class="resultado-test__info">
          <div class="resultado-test__cab"><h4><a href="#/producto/${x.producto.id}">${esc(x.producto.nombre)}</a></h4><span class="afinidad" style="--p:${x.puntos}" aria-label="${x.puntos} % de afinidad"><span>${x.puntos}%</span></span></div>
          <ul class="motivos">${x.motivos.map((m) => `<li>${esc(m)}</li>`).join('')}${x.avisos.map((m) => `<li class="aviso-motivo">${esc(m)}</li>`).join('')}</ul>
          <div class="resultado-test__compra"><b>${x.producto.tamanos.length > 1 ? 'Desde ' : ''}${euros(desde(x.producto))}</b><button class="btn btn--peq" type="button" data-añadir="${x.producto.id}">Añadir</button></div>
        </div></li>`).join('')}</ol>
      <div class="test__acciones"><button class="test__atras" type="button" data-repetir>↺ Volver a empezar</button><a class="btn btn--hueco" href="#/catalogo/todo">Ver todas las plantas</a></div>`;
    $$('[data-añadir]', caja).forEach((b) => b.addEventListener('click', () => añadir(b.dataset.añadir, buscar(b.dataset.añadir).tamanos[0].id)));
    caja.querySelector('[data-repetir]').addEventListener('click', () => { paso = 0; guardar('raiz-test', { r, terminado: false }); pintar(); });
  };
  pintar();
}

/* ---------- Calendario de riego ---------- */
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
function calendarioRiego(plantas, semanas = 4) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const celdas = [];
  for (let i = 0; i < semanas * 7; i++) {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i);
    const dif = Math.round((d - hoy) / 864e5);
    const tocan = dif >= 1 ? plantas.filter((p) => (dif - 1) % p.cuidados.riego === 0) : [];
    celdas.push(`<div class="cal__dia ${dif < 0 ? 'pasado' : ''} ${dif === 0 ? 'hoy' : ''}"><span>${d.getDate()}</span>${tocan.map((p) => `<i title="Regar ${esc(p.nombre)}" style="--c:${COLORES[plantas.indexOf(p) % COLORES.length]}"></i>`).join('')}</div>`);
  }
  return `<div class="cal"><div class="cal__cab">${DIAS.map((d) => `<span>${d}</span>`).join('')}</div><div class="cal__rejilla">${celdas.join('')}</div>
    <ul class="cal__leyenda">${plantas.map((p, i) => `<li><i style="--c:${COLORES[i % COLORES.length]}"></i>${esc(p.nombre)}: cada ${p.cuidados.riego} días</li>`).join('')}</ul></div>`;
}
const COLORES = ['#3f7d52', '#c4673f', '#4d7fa8', '#b08a2e', '#8a5aa3'];

function descargarCalendario(plantas) {
  const pad = (n) => String(n).padStart(2, '0');
  const man = new Date(); man.setDate(man.getDate() + 1);
  const fecha = `${man.getFullYear()}${pad(man.getMonth() + 1)}${pad(man.getDate())}`;
  const eventos = plantas.map((p, i) => [
    'BEGIN:VEVENT', `UID:raiz-${p.id}-${Date.now()}-${i}@raiz.dania360.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${fecha}T100000`, `DTEND:${fecha}T101500`, `RRULE:FREQ=DAILY;INTERVAL=${p.cuidados.riego};COUNT=12`,
    `SUMMARY:Regar ${p.nombre}`, `DESCRIPTION:${p.consejo.replace(/[,;]/g, (c) => '\\' + c)}`, 'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY', `DESCRIPTION:Regar ${p.nombre}`, 'END:VALARM', 'END:VEVENT'
  ].join('\r\n'));
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Raiz//Calendario de riego//ES', 'CALSCALE:GREGORIAN', ...eventos, 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  a.download = 'calendario-de-riego-raiz.ics';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  tostada('Calendario descargado: ábrelo para añadir los avisos');
}

/* ---------- Vistas ---------- */
function vistaInicio() {
  const destacadas = ['monstera', 'pothos', 'calathea', 'kentia', 'sansevieria', 'pilea', 'ficus', 'orquidea'].map(buscar);
  const seguras = PRODUCTOS.filter((p) => p.cuidados?.mascotas);
  app.innerHTML = `
  <section class="portada portada--viva" id="portada">
   <div class="portada__pegado">
    <canvas class="hero__lienzo" id="hero-lienzo" aria-hidden="true"></canvas>
    <div class="hero__etiquetas" id="hero-etiquetas" aria-hidden="true"></div>
    <div class="portada__grid envoltura" id="fase-0">
      <div class="portada__copia">
        <span class="etiqueta">Vivero de plantas de interior · Murcia</span>
        <h1 class="portada__titulo"><span class="portada__l">Plantas que</span> <em class="portada__l">se quedan.</em></h1>
        <p class="portada__texto">Te decimos qué planta va a vivir feliz en tu casa según la luz, cómo riegas y si tienes mascotas. Y te la mandamos con su calendario de riego.</p>
        <div class="portada__acciones">
          <a class="btn" href="#test" data-ir="test">Encontrar mi planta</a>
          <a class="btn btn--hueco" href="#/catalogo/todo">Ver todas</a>
        </div>
        <ul class="portada__datos"><li><b>30 días</b> de garantía</li><li><b>12</b> plantas fáciles</li><li><b>48 h</b> en caja protegida</li></ul>
      </div>
      <div class="portada__media" id="hero-respaldo" hidden>
        <div class="portada__arco"><img src="img/portada.webp" alt="Salón luminoso con una monstera, un ficus, una kentia y un pothos colgante" id="parallax"></div>
        <div class="flotante flotante--1"><span>${ICONO.luz}</span><div><small>Monstera</small><b>Luz media</b></div></div>
        <div class="flotante flotante--2"><span>${ICONO.riego}</span><div><small>Próximo riego</small><b>El jueves</b></div></div>
        <div class="flotante flotante--3"><span>${ICONO.mascota}</span><div><small>Kentia</small><b>Segura para gatos</b></div></div>
      </div>
    </div>
    <div class="hero__fase hero__fase--crece envoltura" id="fase-1" aria-hidden="true">
      <div>
        <span class="etiqueta">Así crece una Monstera en tu casa</span>
        <div class="hero__contador"><b>Semana <i id="hero-semana">1</i></b><span><i id="hero-cm">12</i> cm</span></div>
        <div class="hero__barra"><span id="hero-barra"></span></div>
        <p>Una hoja nueva cada tres semanas si le das la luz y el agua que pide. Nosotros te decimos cuáles son.</p>
      </div>
    </div>
    <div class="hero__fase hero__fase--fin envoltura" id="fase-2">
      <div>
        <span class="etiqueta">Un año después</span>
        <h2 class="hero__titulo">Ahora, <em>la tuya.</em></h2>
        <p class="portada__texto">Cinco preguntas sobre tu casa y te decimos qué planta va a crecer así contigo.</p>
        <div class="portada__acciones"><a class="btn" href="#test" data-ir="test">Encontrar mi planta</a></div>
      </div>
    </div>
    <div class="hero__pista" id="hero-pista" aria-hidden="true">Baja y mírala crecer <span>↓</span></div>
   </div>
  </section>
  <div class="cinta" aria-hidden="true"><div class="cinta__pista">${Array(2).fill('<span>Recomendador de plantas</span><span>Garantía de 30 días</span><span>10 % con el código BIENVENIDA10</span><span>Envío gratis desde 45 €</span><span>Calendario de riego con cada pedido</span><span>Plantas seguras para mascotas</span>').join('')}</div></div>
  ${htmlTest(false)}
  <section class="bloque envoltura">
    <div class="bloque__cab"><div><span class="etiqueta">Las más queridas</span><h2 class="bloque__titulo">Plantas para <em>empezar bien</em></h2></div><a class="btn btn--hueco" href="#/catalogo/todo">Ver todas</a></div>
    <div class="rejilla">${destacadas.map(tarjeta).join('')}</div>
  </section>
  <section class="promesas">
    <div class="envoltura promesas__in">
      <div class="promesa revela"><span>${ICONO.nivel}</span><h3>Cultivadas sin prisas</h3><p>Crecen en nuestro vivero el tiempo que necesitan, no el que pide el camión.</p></div>
      <div class="promesa revela"><span>${ICONO.riego}</span><h3>Con su calendario</h3><p>Cada pedido trae los días de riego de tus plantas, listos para añadir al móvil.</p></div>
      <div class="promesa revela"><span>${ICONO.aire}</span><h3>Garantía de 30 días</h3><p>Si no se adapta a tu casa en un mes, te mandamos otra sin preguntas.</p></div>
    </div>
  </section>
  <section class="bloque envoltura">
    <div class="bloque__cab"><div><span class="etiqueta">Perros y gatos tranquilos</span><h2 class="bloque__titulo">Aptas para <em>mascotas</em></h2></div><a class="btn btn--hueco" href="#/catalogo/todo/mascotas">Ver las ${seguras.length}</a></div>
    <div class="carrusel">${seguras.map(tarjeta).join('')}</div>
  </section>
  <section class="vivero envoltura">
    <div class="vivero__foto revela"><img src="img/vivero.webp" alt="Manos trasplantando una planta a una maceta de barro en el vivero" loading="lazy"></div>
    <div class="vivero__texto revela">
      <span class="etiqueta">El vivero</span>
      <h2 class="bloque__titulo">De nuestras manos <em>a tu salón.</em></h2>
      <ol class="pasos-vivero"><li><b>La elegimos</b><span>Escogemos tu planta una a una, la más sana del invernadero.</span></li><li><b>La preparamos</b><span>La trasplantamos a la maceta que elijas y la regamos justo antes de salir.</span></li><li><b>Viaja segura</b><span>En una caja con sujeción que llega en 48 horas, sin una hoja rota.</span></li></ol>
    </div>
  </section>
  <section class="bloque envoltura" style="padding-top:0">
    <div class="faq">
      <div><span class="etiqueta">Antes de pedir</span><h2 class="bloque__titulo">Preguntas <em>frecuentes</em></h2></div>
      <div>
        <details class="acordeon" open><summary>¿Y si se me muere la planta?</summary><p>Tienes 30 días de garantía: si no se adapta a tu casa en un mes, te mandamos otra sin preguntas. Y cada ficha dice la luz y el riego que necesita para que no llegue a pasar.</p></details>
        <details class="acordeon"><summary>No sé cuál elegir, ¿me ayudáis?</summary><p>Responde las cinco preguntas del recomendador (luz, riego, mascotas, experiencia y tamaño) y te propone las plantas que mejor encajan en tu casa.</p></details>
        <details class="acordeon"><summary>¿Cómo viajan las plantas?</summary><p>En una caja con sujeción para la maceta y las hojas. El envío estándar llega en 48-72 h por ${euros(COSTE_ENVIO.estandar)}, gratis desde ${euros(ENVIO_GRATIS)}; el exprés llega en 24 h por ${euros(COSTE_ENVIO.expres)}.</p></details>
        <details class="acordeon"><summary>¿Hay algún descuento?</summary><p>Sí: con el código BIENVENIDA10 tienes un 10 % en tu primer pedido. Se escribe en el carrito.</p></details>
        <details class="acordeon"><summary>¿Es una tienda de verdad?</summary><p>No. Es una tienda de demostración hecha por Dania360: la marca y los productos son inventados y el pago es de prueba, no se cobra nada.</p></details>
      </div>
    </div>
  </section>`;
  activarTest();
  montarHero();
}

async function montarHero() {
  const seccion = $('#portada');
  if (!seccion) return;
  const fases = [$('#fase-0'), $('#fase-1'), $('#fase-2')], pista = $('#hero-pista'), pegado = $('.portada__pegado', seccion);
  seccion.style.setProperty('--cab-real', `${$('#cab').offsetHeight}px`);
  const suave = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const poner = (el, v) => { const t = v.toFixed(2); if (el.dataset.v === t) return; el.dataset.v = t; el.style.opacity = t; el.style.pointerEvents = v > 0.6 ? '' : 'none'; el.style.visibility = v < 0.01 ? 'hidden' : 'visible'; };
  let veloAntes = '';
  const dato = (titulo, texto) => `<b>${titulo}</b><small>${texto}</small>`;
  try {
    const { HeroPlanta } = await import('./jardin3d.js');
    if (!seccion.isConnected) return;
    let semana = 0;
    hero3d = new HeroPlanta(seccion, $('#hero-lienzo'), $('#hero-etiquetas'), {
      etiquetas: [
        { hoja: 5, de: 0.2, a: 0.42, lado: 'der', html: dato('Luz media', 'Ni sol directo ni sombra') },
        { hoja: 7, de: 0.34, a: 0.56, lado: 'izq', html: dato('Riego cada 7 días', 'Cuando la tierra se seca') },
        { hoja: 10, de: 0.5, a: 0.7, lado: 'der', html: dato('Hoja nueva', 'Cada tres semanas') },
        { hoja: 12, de: 0.62, a: 0.8, lado: 'izq', html: dato('Purifica el aire', 'Y llena el salón') }
      ],
      alCambiar: (p) => {
        poner(fases[0], 1 - suave(0.01, 0.07, p));
        poner(fases[1], suave(0.09, 0.16, p) * (1 - suave(0.8, 0.86, p)));
        poner(fases[2], suave(0.88, 0.96, p));
        poner(pista, 1 - suave(0, 0.04, p));
        const velo = ((1 - suave(0.02, 0.1, p)) + suave(0.86, 0.95, p)).toFixed(2);
        if (velo !== veloAntes) { veloAntes = velo; pegado.style.setProperty('--velo', velo); }
        const avance = suave(0, 0.84, p);
        const s = Math.round(1 + avance * 51);
        if (s !== semana) {
          semana = s;
          $('#hero-semana').textContent = s;
          $('#hero-cm').textContent = Math.round(12 + avance * 138);
          $('#hero-barra').style.width = `${avance * 100}%`;
        }
      }
    });
    hero3d.lista.then(() => seccion.classList.add('lista'));
  } catch (err) {
    console.warn('No se pudo cargar la planta en 3D', err);
    seccion.classList.add('sin-3d');
    $('#hero-respaldo').hidden = false;
  }
}

function vistaEncuentra() {
  app.innerHTML = htmlTest(true);
  activarTest();
}

function vistaCatalogo(cat, filtroInicial) {
  let orden = 'destacados';
  const activos = new Set(filtroInicial && FILTROS.some((f) => f.id === filtroInicial) ? [filtroInicial] : []);
  const pintar = () => {
    let lista = PRODUCTOS.filter((p) => cat === 'todo' || p.categoria === cat).filter((p) => [...activos].every((id) => FILTROS.find((f) => f.id === id).prueba(p)));
    if (orden === 'precio-asc') lista = [...lista].sort((a, b) => desde(a) - desde(b));
    if (orden === 'precio-desc') lista = [...lista].sort((a, b) => desde(b) - desde(a));
    if (orden === 'facil') lista = [...lista].sort((a, b) => (a.cuidados?.dificultad || 9) - (b.cuidados?.dificultad || 9));
    $('#rejilla').innerHTML = lista.length ? lista.map(tarjeta).join('') : '<div class="vacio vacio--ancho"><b>Ninguna planta cumple todo a la vez</b>Quita algún filtro o deja que el recomendador elija por ti.<br><br><a class="btn" href="#/encuentra">Encontrar mi planta</a></div>';
    $('#total').textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
    $$('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', String(activos.has(b.dataset.filtro))));
    revelar();
  };
  app.innerHTML = `<section class="bloque envoltura">
    <div class="bloque__cab"><div><span class="etiqueta" id="total"></span><h1 class="bloque__titulo">${cat === 'todo' ? 'Todas las <em>plantas</em>' : esc(categoria(cat))}</h1></div></div>
    <div class="filtros">
      <nav class="chips" aria-label="Categorías">${CATEGORIAS.map((c) => `<a class="chip" href="#/catalogo/${c.id}" ${c.id === cat ? 'aria-current="page"' : ''}>${c.nombre}</a>`).join('')}</nav>
      <label><span class="visual-oculto">Ordenar</span><select class="orden" id="orden">
        <option value="destacados">Destacadas</option><option value="facil">Más fáciles primero</option>
        <option value="precio-asc">Precio: de menor a mayor</option><option value="precio-desc">Precio: de mayor a menor</option>
      </select></label>
    </div>
    <div class="filtros-cuidado" role="group" aria-label="Filtrar por cuidados">${FILTROS.map((f) => `<button class="interruptor" type="button" data-filtro="${f.id}" aria-pressed="false"><span></span>${f.nombre}</button>`).join('')}</div>
    <div class="rejilla" id="rejilla"></div>
  </section>`;
  $('#orden').addEventListener('change', (e) => { orden = e.target.value; pintar(); });
  $$('[data-filtro]').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.filtro; activos.has(id) ? activos.delete(id) : activos.add(id); pintar(); }));
  pintar();
}

function vistaProducto(id) {
  const p = buscar(id);
  if (!p) return vistaNoEncontrada();
  let tamano = p.tamanos[0].id;
  let mac = 'vivero';
  const c = p.cuidados;
  const precioActual = () => p.tamanos.find((t) => t.id === tamano).precio + (p.sinMaceta ? 0 : maceta(mac).extra);
  const relacionados = PRODUCTOS.filter((x) => x.id !== p.id && x.categoria === p.categoria).slice(0, 4);
  app.innerHTML = `<div class="envoltura">
    <section class="producto">
      <div class="producto__media">
        <img src="${p.imagen}" alt="${esc(p.nombre)}">
        ${p.sinMaceta ? '' : `<div class="producto__maceta" id="muestra-maceta"><i style="background:${maceta(mac).color}"></i><span>${maceta(mac).nombre}</span></div>`}
      </div>
      <div>
        <nav class="migas" aria-label="Estás en"><a href="#/">Inicio</a> / <a href="#/catalogo/${p.categoria}">${categoria(p.categoria)}</a> / ${esc(p.nombre)}</nav>
        <span class="etiqueta">${esc(p.comun)}</span>
        <h1>${esc(p.nombre)}</h1>
        <p class="producto__lema">${esc(p.lema)}</p>
        <div class="producto__precio"><span id="precio">${euros(precioActual())}</span>${p.antes ? `<s>${euros(p.antes)}</s>` : ''}</div>
        ${p.tamanos.length > 1 ? `<div class="opciones__cab"><span>Tamaño</span></div>
          <div class="opciones" role="group" aria-label="Tamaño">${p.tamanos.map((t, i) => `<button class="opcion-btn" type="button" data-tamano="${t.id}" aria-pressed="${i === 0}">${esc(t.nombre)}<small>${euros(t.precio)}</small></button>`).join('')}</div>` : `<p class="tamano-unico">${esc(p.tamanos[0].nombre)}</p>`}
        ${p.sinMaceta ? '' : `<div class="opciones__cab"><span>Maceta</span><b id="maceta-nombre">${maceta(mac).nombre}</b></div>
          <div class="macetas" role="group" aria-label="Maceta">${MACETAS.map((m) => `<button class="maceta-btn" type="button" data-maceta="${m.id}" aria-pressed="${m.id === mac}"><i style="background:${m.color}"></i><span>${m.nombre}</span><small>${m.extra ? `+${euros(m.extra)}` : 'Incluida'}</small></button>`).join('')}</div>`}
        <div class="fila-compra">
          <button class="btn" type="button" id="btn-añadir">Añadir al carrito</button>
          <button class="corazon corazon--grande" type="button" data-fav="${p.id}" aria-pressed="${favoritos.includes(p.id)}" aria-label="Guardar en favoritos">${CORAZON}</button>
        </div>
        <div class="ventajas-mini"><span>Envío gratis desde ${euros(ENVIO_GRATIS)}</span><span>Garantía de 30 días</span><span>Calendario de riego incluido</span></div>
        ${c ? `<div class="ficha-cuidados">
          <h2>Ficha de cuidados</h2>
          <div class="cuidado"><span class="cuidado__icono">${ICONO.luz}</span><div><b>Luz</b><small>${LUZ[c.luz[0]]}${c.luz[1] !== c.luz[0] ? ` a ${LUZ[c.luz[1]].toLowerCase()}` : ''}</small></div>${puntos(c.luz[1])}</div>
          <div class="cuidado"><span class="cuidado__icono">${ICONO.riego}</span><div><b>Riego</b><small>Cada ${c.riego} días aproximadamente</small></div>${puntos(c.riego <= 5 ? 4 : c.riego <= 8 ? 3 : c.riego <= 14 ? 2 : 1)}</div>
          <div class="cuidado"><span class="cuidado__icono">${ICONO.nivel}</span><div><b>Dificultad</b><small>${DIFICULTAD[c.dificultad]}</small></div>${puntos(c.dificultad, 3)}</div>
          <div class="cuidado"><span class="cuidado__icono">${ICONO.mascota}</span><div><b>Mascotas</b><small>${c.mascotas ? 'Segura para perros y gatos' : 'Mejor fuera de su alcance'}</small></div><span class="sello ${c.mascotas ? 'sello--ok' : 'sello--no'}">${c.mascotas ? 'Apta' : 'No apta'}</span></div>
          ${c.purifica ? `<div class="cuidado"><span class="cuidado__icono">${ICONO.aire}</span><div><b>Purifica el aire</b><small>Ayuda a renovar el ambiente</small></div><span class="sello sello--ok">Sí</span></div>` : ''}
          <p class="consejo"><b>Consejo del vivero:</b> ${esc(p.consejo)}</p>
          <h3>Así quedaría su riego este mes</h3>
          ${calendarioRiego([p])}
        </div>` : ''}
        <details class="acordeon" open><summary>Descripción</summary><p>${esc(p.descripcion)}</p></details>
        <details class="acordeon"><summary>Envío y garantía</summary><ul><li>Estándar en 48-72 h: ${euros(COSTE_ENVIO.estandar)}, gratis desde ${euros(ENVIO_GRATIS)}.</li><li>Exprés en 24 h: ${euros(COSTE_ENVIO.expres)}.</li><li>Si en 30 días no se adapta, te enviamos otra.</li></ul></details>
      </div>
    </section>
    ${relacionados.length ? `<section class="bloque" style="padding-top:0"><div class="bloque__cab"><h2 class="bloque__titulo">También te pueden <em>gustar</em></h2></div><div class="rejilla">${relacionados.map(tarjeta).join('')}</div></section>` : ''}
  </div>`;
  const actualizarPrecio = () => {
    const el = $('#precio');
    el.textContent = euros(precioActual());
    el.classList.remove('late'); void el.offsetWidth; el.classList.add('late');
  };
  $$('[data-tamano]').forEach((b) => b.addEventListener('click', () => {
    tamano = b.dataset.tamano;
    $$('[data-tamano]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    actualizarPrecio();
  }));
  $$('[data-maceta]').forEach((b) => b.addEventListener('click', () => {
    mac = b.dataset.maceta;
    $$('[data-maceta]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#maceta-nombre').textContent = maceta(mac).nombre;
    $('#muestra-maceta').innerHTML = `<i style="background:${maceta(mac).color}"></i><span>${maceta(mac).nombre}</span>`;
    actualizarPrecio();
  }));
  $('#btn-añadir').addEventListener('click', () => añadir(p.id, tamano, mac));
}

function vistaFavoritos() {
  const lista = PRODUCTOS.filter((p) => favoritos.includes(p.id));
  app.innerHTML = `<section class="bloque envoltura"><div class="bloque__cab"><div><span class="etiqueta">${lista.length} ${lista.length === 1 ? 'guardada' : 'guardadas'}</span><h1 class="bloque__titulo">Tus <em>favoritas</em></h1></div></div>
    ${lista.length ? `<div class="rejilla">${lista.map(tarjeta).join('')}</div>` : '<div class="vacio"><b>Todavía no has guardado ninguna</b>Pulsa el corazón de cualquier planta para tenerla aquí.<br><br><a class="btn" href="#/catalogo/todo">Ver las plantas</a></div>'}</section>`;
}

/* ---------- Pago en tres pasos (de demostración) ---------- */
function vistaPago() {
  if (!carrito.length) { location.hash = '#/catalogo/todo'; return; }
  let paso = 1;
  const datos = leer('raiz-envio', { nombre: '', email: '', direccion: '', cp: '', ciudad: '', telefono: '' });
  let metodo = 'estandar';
  let regalo = false;
  let mensaje = '';
  const gastos = () => (metodo === 'expres' ? COSTE_ENVIO.expres : base() >= ENVIO_GRATIS ? 0 : COSTE_ENVIO.estandar);
  const resumen = () => `<aside class="caja resumen"><h2>Resumen</h2>${carrito.map((l, i) => lineaHTML(l, i, false)).join('')}
    <dl><dt>Subtotal</dt><dd>${euros(subtotal())}</dd>${descuento() ? `<dt>Descuento (${esc(cupon)})</dt><dd>−${euros(descuento())}</dd>` : ''}<dt>Envío</dt><dd>${gastos() === 0 ? 'Gratis' : euros(gastos())}</dd>${regalo ? '<dt>Tarjeta de regalo</dt><dd>Gratis</dd>' : ''}</dl>
    <div class="total"><span>Total</span><span>${euros(base() + gastos())}</span></div></aside>`;
  const campo = (id, etiqueta, tipo = 'text', ancho = false, extra = '') => `<label class="campo ${ancho ? 'campo--ancho' : ''}">${etiqueta}<input id="${id}" name="${id}" type="${tipo}" value="${esc(datos[id] || '')}" ${extra} required></label>`;
  const pintar = () => {
    const etapas = ['Envío', 'Entrega', 'Pago'];
    let cuerpo = '';
    if (paso === 1) {
      cuerpo = `<form class="caja" id="form-paso" novalidate><h2>¿Dónde las llevamos?</h2>
        <div class="nota-prueba">Es una tienda de prueba: puedes inventarte los datos, no se guardan en ningún servidor.</div>
        <div class="campos">${campo('nombre', 'Nombre y apellidos', 'text', true, 'autocomplete="name"')}${campo('email', 'Correo electrónico', 'email', false, 'autocomplete="email"')}${campo('telefono', 'Teléfono', 'tel', false, 'autocomplete="tel"')}${campo('direccion', 'Dirección', 'text', true, 'autocomplete="street-address"')}${campo('cp', 'Código postal', 'text', false, 'inputmode="numeric" pattern="[0-9]{5}" autocomplete="postal-code"')}${campo('ciudad', 'Ciudad', 'text', false, 'autocomplete="address-level2"')}</div>
        <div class="botones-pago"><a class="btn btn--hueco" href="#/catalogo/todo">Seguir comprando</a><button class="btn" type="submit">Continuar</button></div></form>`;
    } else if (paso === 2) {
      cuerpo = `<form class="caja" id="form-paso"><h2>¿Cómo la quieres?</h2>
        <label class="opcion"><input type="radio" name="metodo" value="estandar" ${metodo === 'estandar' ? 'checked' : ''}><span>Estándar<small>Entrega en 48-72 h en caja protegida</small></span><b>${base() >= ENVIO_GRATIS ? 'Gratis' : euros(COSTE_ENVIO.estandar)}</b></label>
        <label class="opcion"><input type="radio" name="metodo" value="expres" ${metodo === 'expres' ? 'checked' : ''}><span>Exprés<small>Entrega en 24 h</small></span><b>${euros(COSTE_ENVIO.expres)}</b></label>
        <label class="opcion"><input type="checkbox" name="regalo" ${regalo ? 'checked' : ''}><span>Es para regalar<small>Sin precio en el paquete y con una tarjeta escrita a mano</small></span><b>Gratis</b></label>
        ${regalo ? `<label class="campo campo--ancho mensaje-regalo">Mensaje para la tarjeta<textarea id="mensaje" maxlength="140" rows="3" placeholder="Para que llenes tu casa de verde">${esc(mensaje)}</textarea><small><span id="quedan">${140 - mensaje.length}</span> caracteres libres</small></label>` : ''}
        <div class="botones-pago"><button class="btn btn--hueco" type="button" data-atras>Atrás</button><button class="btn" type="submit">Continuar</button></div></form>`;
    } else {
      cuerpo = `<form class="caja" id="form-paso"><h2>Pago</h2>
        <div class="nota-prueba">Pago de demostración: no se pide tarjeta y no se cobra nada. Al confirmar verás cómo termina un pedido real.</div>
        <label class="opcion"><input type="radio" name="pago" value="demo" checked><span>Pago de prueba<small>Simula un pago con tarjeta aceptado</small></span></label>
        <p class="pago__envio">Enviamos a <b>${esc(datos.nombre)}</b>, ${esc(datos.direccion)}, ${esc(datos.cp)} ${esc(datos.ciudad)}.${regalo && mensaje ? ` Con la tarjeta: "${esc(mensaje)}".` : ''}</p>
        <div class="botones-pago"><button class="btn btn--hueco" type="button" data-atras>Atrás</button><button class="btn" type="submit">Pagar ${euros(base() + gastos())}</button></div></form>`;
    }
    app.innerHTML = `<div class="envoltura"><section class="pago"><div>
      <ol class="pasos">${etapas.map((e, i) => `<li class="${i + 1 === paso ? 'activo' : i + 1 < paso ? 'hecho' : ''}">${i + 1}. ${e}</li>`).join('')}</ol>
      ${cuerpo}</div>${resumen()}</section></div>`;
    const f = $('#form-paso');
    f.querySelector('[data-atras]')?.addEventListener('click', () => { paso -= 1; pintar(); });
    f.querySelector('#mensaje')?.addEventListener('input', (e) => { mensaje = e.target.value; $('#quedan').textContent = 140 - mensaje.length; });
    f.addEventListener('change', (e) => {
      if (e.target.name === 'metodo') { metodo = e.target.value; pintar(); }
      if (e.target.name === 'regalo') { regalo = e.target.checked; pintar(); if (regalo) $('#mensaje')?.focus(); }
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (paso === 1) {
        let ok = true;
        $$('input', f).forEach((i) => {
          datos[i.name] = i.value.trim();
          const valido = i.checkValidity() && i.value.trim() !== '';
          i.setAttribute('aria-invalid', String(!valido));
          if (!valido) ok = false;
        });
        if (!ok) { tostada('Revisa los campos marcados en rojo'); f.querySelector('[aria-invalid=true]')?.focus(); return; }
        guardar('raiz-envio', datos);
      }
      if (paso === 3) return confirmar(base() + gastos(), regalo ? mensaje.trim() : '');
      paso += 1;
      pintar();
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  pintar();
}

function confirmar(total, mensaje) {
  const numero = 'RZ-' + Math.floor(100000 + Math.random() * 900000);
  const plantas = [...new Set(carrito.map((l) => l.id))].filter((id) => buscar(id).cuidados);
  carrito = [];
  guardar('raiz-carrito', carrito);
  cupon = null;
  guardar('raiz-cupon', cupon);
  actualizarContadores();
  sessionStorage.setItem('raiz-pedido', JSON.stringify({ numero, total, plantas, mensaje }));
  location.hash = '#/gracias';
}

function vistaGracias() {
  let pedido = null;
  try { pedido = JSON.parse(sessionStorage.getItem('raiz-pedido')); } catch { /* nada */ }
  const plantas = (pedido?.plantas || []).map(buscar).filter(Boolean);
  app.innerHTML = `<section class="gracias envoltura">
    <div class="gracias__brote" aria-hidden="true">${plantaSVG()}</div>
    <h1>¡Pedido confirmado!</h1>
    <p>${pedido ? `Tu pedido <b>${pedido.numero}</b> por ${euros(pedido.total)} ya se está preparando en el vivero. ` : ''}${pedido?.mensaje ? `Escribiremos a mano tu tarjeta: "${esc(pedido.mensaje)}". ` : ''}Como es una tienda de prueba no se ha cobrado nada ni se enviará nada.</p>
    ${plantas.length ? `<div class="caja gracias__cal">
      <h2>Tu calendario de riego</h2>
      <p>Empieza el día después de recibirlas. Puedes añadirlo a tu móvil y te avisará cada vez que toque.</p>
      ${calendarioRiego(plantas)}
      <button class="btn" type="button" id="btn-ics">${ICONO.riego} Añadir los avisos a mi calendario</button>
    </div>` : ''}
    <a class="btn btn--hueco" href="#/">Volver a la tienda</a>
  </section>`;
  const svg = $('.gracias__brote svg');
  crecer(svg, 0);
  setTimeout(() => crecer(svg, 1), 120);
  $('#btn-ics')?.addEventListener('click', () => descargarCalendario(plantas));
}

function vistaNoEncontrada() {
  app.innerHTML = '<section class="gracias envoltura"><h1>Aquí no ha brotado nada</h1><p>No encontramos lo que buscabas.</p><a class="btn" href="#/">Volver al inicio</a></section>';
}

/* ---------- Efectos ---------- */
let observador;
function revelar() {
  observador?.disconnect();
  if (reducir || !('IntersectionObserver' in window)) { $$('.revela').forEach((el) => el.classList.add('dentro')); return; }
  observador = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('dentro');
    observador.unobserve(e.target);
  }), { threshold: 0.1 });
  $$('.revela:not(.dentro)').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; observador.observe(el); });
}
window.addEventListener('scroll', () => {
  $('#cab').classList.toggle('on', scrollY > 10);
  const img = $('#parallax');
  if (img && !reducir) img.style.transform = `translateY(${Math.min(scrollY, 900) * 0.12}px) scale(1.12)`;
}, { passive: true });

/* ---------- Buscador ---------- */
$('#btn-buscar').addEventListener('click', () => {
  const b = $('#buscador');
  b.hidden = !b.hidden;
  if (!b.hidden) $('#campo-buscar').focus();
});
$('#campo-buscar').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const texto = (p) => `${p.nombre} ${p.comun} ${p.lema}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const lista = q.length < 2 ? [] : PRODUCTOS.filter((p) => texto(p).includes(q));
  $('#resultados').innerHTML = q.length < 2 ? '' : lista.length
    ? lista.map((p) => `<a href="#/producto/${p.id}"><img src="${p.imagen}" alt=""><span>${esc(p.nombre)}<small>${esc(p.comun)} · ${euros(desde(p))}</small></span></a>`).join('')
    : '<p class="resultados__nada">No hay resultados. Prueba con "monstera", "helecho" u "orquídea".</p>';
});

/* ---------- Eventos globales ---------- */
document.addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]');
  if (fav) { e.preventDefault(); alternarFavorito(fav.dataset.fav); return; }
  const ir = e.target.closest('[data-ir]');
  if (ir) { e.preventDefault(); document.getElementById(ir.dataset.ir)?.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth' }); }
});

/* ---------- Rutas ---------- */
function ruta() {
  if (/^#[a-z-]+$/.test(location.hash) && document.getElementById(location.hash.slice(1))) return;
  const partes = location.hash.replace(/^#\/?/, '').split('/');
  $('#buscador').hidden = true;
  if ($('#cajon').classList.contains('abierto')) cerrarCajon();
  limpiar3D();
  $$('.cab__nav a, .cab__movil a').forEach((a) => (a.getAttribute('href') === location.hash ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  switch (partes[0]) {
    case '': vistaInicio(); break;
    case 'encuentra': vistaEncuentra(); break;
    case 'catalogo': vistaCatalogo(CATEGORIAS.some((c) => c.id === partes[1]) ? partes[1] : 'todo', partes[2]); break;
    case 'producto': vistaProducto(partes[1]); break;
    case 'favoritos': vistaFavoritos(); break;
    case 'pago': vistaPago(); break;
    case 'gracias': vistaGracias(); break;
    default: vistaNoEncontrada();
  }
  revelar();
  window.scrollTo({ top: 0, behavior: 'instant' });
  app.focus({ preventScroll: true });
}
window.addEventListener('hashchange', ruta);
actualizarContadores();
pintarCajon();
ruta();
setTimeout(() => $('#carga').classList.add('fuera'), reducir ? 0 : 1100);

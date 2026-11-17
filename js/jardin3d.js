// Plantas y habitación en 3D construidas por código con three.js.
// HeroPlanta: una monstera que crece hoja a hoja con el scroll.
// Habitacion3D: el salón del recomendador, con sol real entrando por la ventana.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const TAU = Math.PI * 2;
const sujetar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (a, b, v) => { const t = sujetar((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mezcla = (a, b, t) => a + (b - a) * t;
const rebote = (t) => { const c = 1.70158; const u = sujetar(t) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
function azar(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function lienzoTex(ancho, alto, pintar) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  pintar(c.getContext('2d'), ancho, alto);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- Materiales ----------
   Todos los materiales con luz comparten la misma receta (color + textura, sin recortes por alfa), así el navegador
   solo tiene que compilar un par de shaders. En gráficas integradas la diferencia es de muchos segundos. */
let blanca = null;
function texBlanca() {
  return (blanca ||= lienzoTex(4, 4, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 4, 4); }));
}
function mat(color, rugosidad = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rugosidad, metalness: 0, map: texBlanca(), ...extra });
}
function matPlano(extra = {}) {
  return new THREE.MeshBasicMaterial({ map: texBlanca(), transparent: true, ...extra });
}

/* ---------- Hojas: textura dibujada + malla curvada ---------- */
const HOJAS = {
  monstera: { ancho: 0.95, pliegue: 0.05, caida: 0.75, onda: 0.022, origen: 0.1 },
  redonda: { ancho: 1, pliegue: 0.05, caida: 0.35, onda: 0.012, origen: 0.36 },
  corazon: { ancho: 0.8, pliegue: 0.12, caida: 0.8, onda: 0.02, origen: 0.1 },
  lanza: { ancho: 0.15, pliegue: 0.22, caida: -0.14, onda: 0.006, origen: 0 }
};
const texturas = {};
// La textura solo da color y nervios: la silueta (con sus cortes) está en la malla.
function texturaHoja(tipo) {
  if (texturas[tipo]) return texturas[tipo];
  const L = 512;
  texturas[tipo] = lienzoTex(L, L, (g) => {
    g.setTransform(L, 0, 0, L, 0, L / 2);
    const rnd = azar(11);
    const nervios = (n, color, grosor) => {
      g.strokeStyle = color; g.lineCap = 'round';
      g.lineWidth = grosor * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(1, 0); g.stroke();
      g.lineWidth = grosor;
      for (let k = 0; k < n; k++) {
        const u = 0.16 + k * (0.75 / n);
        for (const s of [-1, 1]) { g.beginPath(); g.moveTo(u, 0); g.quadraticCurveTo(u + 0.1, s * 0.16, u + 0.24, s * 0.46); g.stroke(); }
      }
    };
    if (tipo === 'monstera' || tipo === 'corazon') {
      const fondo = g.createLinearGradient(0, -0.5, 0, 0.5);
      if (tipo === 'monstera') { fondo.addColorStop(0, '#123c20'); fondo.addColorStop(0.5, '#1f5a31'); fondo.addColorStop(1, '#123c20'); }
      else { fondo.addColorStop(0, '#2f7a41'); fondo.addColorStop(0.5, '#4d9a57'); fondo.addColorStop(1, '#2f7a41'); }
      g.fillStyle = fondo; g.fillRect(0, -0.5, 1, 1);
      const brillo = g.createLinearGradient(0, 0, 1, 0);
      brillo.addColorStop(0, 'rgba(255,255,220,0)'); brillo.addColorStop(0.45, 'rgba(170,220,140,.07)'); brillo.addColorStop(1, 'rgba(0,30,10,.22)');
      g.fillStyle = brillo; g.fillRect(0, -0.5, 1, 1);
      if (tipo === 'corazon') {
        for (let i = 0; i < 26; i++) {
          g.fillStyle = `rgba(232,224,138,${0.25 + rnd() * 0.4})`;
          g.beginPath(); g.ellipse(0.15 + rnd() * 0.75, (rnd() - 0.5) * 0.7, 0.02 + rnd() * 0.07, 0.008 + rnd() * 0.02, (rnd() - 0.5) * 1.6, 0, TAU); g.fill();
        }
      } else {
        for (let i = 0; i < 90; i++) {
          g.fillStyle = `rgba(${rnd() > 0.5 ? '190,230,160' : '8,40,18'},${0.03 + rnd() * 0.05})`;
          g.beginPath(); g.ellipse(rnd(), rnd() - 0.5, 0.01 + rnd() * 0.04, 0.004 + rnd() * 0.012, (rnd() - 0.5) * 2, 0, TAU); g.fill();
        }
      }
      nervios(6, tipo === 'monstera' ? 'rgba(120,176,104,.5)' : 'rgba(200,232,170,.4)', 0.0045);
    } else if (tipo === 'redonda') {
      const fondo = g.createRadialGradient(0.4, 0, 0.02, 0.5, 0, 0.5);
      fondo.addColorStop(0, '#7cc070'); fondo.addColorStop(0.6, '#4f9c57'); fondo.addColorStop(1, '#357f47');
      g.fillStyle = fondo; g.fillRect(0, -0.5, 1, 1);
      g.strokeStyle = 'rgba(210,240,180,.35)'; g.lineWidth = 0.006;
      for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU; g.beginPath(); g.moveTo(0.36, 0); g.lineTo(0.5 + Math.cos(a) * 0.5, Math.sin(a) * 0.5); g.stroke(); }
      g.fillStyle = '#d9efba'; g.beginPath(); g.arc(0.36, 0, 0.022, 0, TAU); g.fill();
    } else {
      // Hoja de sansevieria: bandas claras y borde amarillo
      g.fillStyle = '#2a5a3a'; g.fillRect(0, -0.5, 1, 1);
      for (let x = 0.02; x < 1; x += 0.028 + rnd() * 0.03) {
        g.strokeStyle = `rgba(150,196,140,${0.25 + rnd() * 0.35})`; g.lineWidth = 0.006 + rnd() * 0.012;
        g.beginPath(); g.moveTo(x, -0.5);
        for (let y = -0.5; y <= 0.5; y += 0.1) g.lineTo(x + (rnd() - 0.5) * 0.02, y);
        g.stroke();
      }
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, s * 0.24); g.bezierCurveTo(0.3, s * 0.52, 0.78, s * 0.44, 1, 0); g.strokeStyle = 'rgba(222,204,104,.95)'; g.lineWidth = 0.1; g.stroke(); }
    }
  });
  return texturas[tipo];
}

function bezier(p0, c1, c2, p3, n, desde = 0) {
  const pts = [];
  for (let i = desde; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]]);
  }
  return pts;
}

const geos = {};
function geoHoja(tipo) {
  if (geos[tipo]) return geos[tipo];
  const { ancho, pliegue, caida, onda, origen } = HOJAS[tipo];
  const verts = [], uvs = [], indices = [];
  if (tipo === 'redonda') {
    verts.push(0.5, 0, 0); uvs.push(0.5, 0.5);
    const n = 30;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; verts.push(0.5 + Math.cos(a) * 0.47, Math.sin(a) * 0.47 * ancho, 0); uvs.push(0.5 + Math.cos(a) * 0.47, 0.5 + Math.sin(a) * 0.47); }
    for (let i = 0; i < n; i++) indices.push(0, 1 + i, 1 + ((i + 1) % n));
  } else {
    // Media hoja: nervio central + borde exterior. La otra mitad es su espejo.
    let borde, u0;
    if (tipo === 'lanza') { u0 = 0; borde = bezier([0, 0.24], [0.3, 0.52], [0.78, 0.44], [1, 0], 22); }
    else { u0 = 0.11; borde = [...bezier([0.11, 0], [0.03, 0.12], [0.0, 0.33], [0.15, 0.42], 10, 1), ...bezier([0.15, 0.42], [0.36, 0.52], [0.72, 0.36], [0.99, 0], 46, 1)]; }
    const agujeros = [];
    if (tipo === 'monstera') {
      // Cortes desde el borde hacia el nervio y agujeros, como en la costilla de Adán
      for (let k = 0; k < 4; k++) {
        const uk = 0.16 + k * 0.125, ox = uk + 0.3;
        let j = -1, mejor = 9;
        borde.forEach((p, i) => { const d = Math.abs(p[0] - ox); if (i > 12 && d < mejor) { mejor = d; j = i; } });
        if (j > 12 && j < borde.length - 3) borde.splice(j, 1, [uk + 0.13, 0.1]);
        if (k > 0) {
          const h = [];
          for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, ex = Math.cos(a) * 0.03, ey = Math.sin(a) * 0.013; h.push(new THREE.Vector2(uk + 0.06 + ex * 0.88 - ey * 0.48, 0.062 + ex * 0.48 + ey * 0.88)); }
          agujeros.push(h);
        }
      }
    }
    const fin = borde[borde.length - 1][0], M = 22;
    const nervio = Array.from({ length: M + 1 }, (_, i) => [mezcla(u0, fin, i / M), i === 0 || i === M ? 0 : (i % 2 ? 0.0006 : 0.0012)]);
    const contorno = [...nervio, ...borde.slice(0, -1).reverse()].map(([x, y]) => new THREE.Vector2(x, y));
    const caras = THREE.ShapeUtils.triangulateShape(contorno, agujeros);
    const todos = [...contorno, ...agujeros.flat()];
    todos.forEach((p, i) => { if (i <= M) p.y = 0; });
    const n = todos.length;
    for (const s of [1, -1]) for (const p of todos) { verts.push(p.x, p.y * ancho * s, 0); uvs.push(p.x, 0.5 + p.y * s); }
    for (const [a, b, c] of caras) indices.push(a, b, c, a + n, c + n, b + n);
  }
  const g = new THREE.BufferGeometry();
  const p = new THREE.BufferAttribute(new Float32Array(verts), 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const a = Math.abs(y) / (ancho / 2);
    const z = pliegue * a * ancho * 0.5 * (0.5 + 0.5 * Math.sin(Math.min(x, 1) * Math.PI)) + Math.sin(x * 8 + y * 6) * onda * a;
    const k = caida || 0.0001, ang = k * x;
    p.setXYZ(i, Math.sin(ang) / k + z * Math.sin(ang) - origen, y, -(1 - Math.cos(ang)) / k + z * Math.cos(ang));
  }
  g.setAttribute('position', p);
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return (geos[tipo] = g);
}
const mats = {};
function matHoja(tipo) {
  return (mats[tipo] ||= mat(0xffffff, tipo === 'lanza' ? 0.55 : 0.4, { map: texturaHoja(tipo), side: THREE.DoubleSide }));
}
let tallo = null;
const matTallo = () => (tallo ||= mat(0x2c5c33, 0.55));

// Una hoja con su peciolo. Ejes locales: +X hacia fuera, +Y hacia arriba.
function unidadHoja({ tipo, az, r = 0, h = 0, tam, colgar, giro = 0, grosor = 0.012, pos, recoge = 0.7, cede = 0.25 }) {
  const pivote = new THREE.Group();
  pivote.rotation.y = -az;
  if (pos) pivote.position.copy(pos);
  const brazo = new THREE.Group();
  pivote.add(brazo);
  if (r > 0 || h > 0) {
    const curva = new THREE.QuadraticBezierCurve3(V3(0, 0, 0), V3(r * 0.2, h * 1.03, 0), V3(r, h, 0));
    const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 10, grosor, 5), matTallo());
    tubo.castShadow = true;
    brazo.add(tubo);
  }
  const soporte = new THREE.Group();
  soporte.position.set(r, h, 0);
  soporte.rotation.z = -colgar;
  brazo.add(soporte);
  const limbo = new THREE.Mesh(geoHoja(tipo), matHoja(tipo));
  limbo.rotation.x = -Math.PI / 2 + giro;
  limbo.scale.setScalar(tam);
  limbo.castShadow = true; limbo.receiveShadow = true;
  soporte.add(limbo);
  const punta = new THREE.Object3D();
  punta.position.set(tam * 0.55, -tam * 0.12, 0);
  soporte.add(punta);
  return { pivote, brazo, limbo, punta, az, tam, recoge, cede };
}

function maceta(radio, alto, color, rugosidad = 0.85) {
  const g = new THREE.Group();
  const pts = [[0.001, 0], [radio * 0.72, 0], [radio * 0.98, alto * 0.86], [radio * 1.07, alto * 0.86], [radio * 1.07, alto], [radio * 0.93, alto], [radio * 0.9, alto * 0.9], [0.001, alto * 0.9]].map(([x, y]) => new THREE.Vector2(x, y));
  const cuerpo = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mat(color, rugosidad));
  cuerpo.castShadow = true; cuerpo.receiveShadow = true;
  const tierra = new THREE.Mesh(new THREE.CircleGeometry(radio * 0.91, 28), mat(0x33251a, 1));
  tierra.rotation.x = -Math.PI / 2; tierra.position.y = alto * 0.905; tierra.receiveShadow = true;
  g.add(cuerpo, tierra);
  return g;
}

function plantaMonstera(semilla = 3, colorMaceta = 0xc4673f) {
  const rnd = azar(semilla), grupo = new THREE.Group(), hojas = [], n = 13;
  grupo.add(maceta(0.17, 0.3, colorMaceta));
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const u = unidadHoja({ tipo: 'monstera', az: i * 2.39996 + rnd() * 0.35, r: 0.14 + rnd() * 0.22 + f * 0.1, h: 0.16 + 0.74 * Math.pow(f, 0.85) + rnd() * 0.05, tam: 0.3 + 0.32 * f + rnd() * 0.05, colgar: 0.3 + rnd() * 0.55, giro: (rnd() - 0.5) * 0.5, grosor: 0.007 + f * 0.005, pos: V3((rnd() - 0.5) * 0.08, 0.27, (rnd() - 0.5) * 0.08) });
    grupo.add(u.pivote); hojas.push(u);
  }
  return { grupo, hojas, alto: 1.4 };
}
function plantaPilea(semilla = 5, colorMaceta = 0xf2efe8) {
  const rnd = azar(semilla), grupo = new THREE.Group(), hojas = [];
  grupo.add(maceta(0.075, 0.1, colorMaceta, 0.5));
  for (let i = 0; i < 17; i++) {
    const u = unidadHoja({ tipo: 'redonda', az: i * 2.39996 + rnd(), r: 0.04 + rnd() * 0.13, h: 0.06 + rnd() * 0.2, tam: 0.075 + rnd() * 0.04, colgar: 0.15 + rnd() * 0.8, giro: (rnd() - 0.5) * 0.6, grosor: 0.0035, pos: V3(0, 0.088, 0) });
    grupo.add(u.pivote); hojas.push(u);
  }
  return { grupo, hojas, alto: 0.4 };
}
function plantaSansevieria(semilla = 8, colorMaceta = 0x3b3b38) {
  const rnd = azar(semilla), grupo = new THREE.Group(), hojas = [];
  grupo.add(maceta(0.14, 0.22, colorMaceta));
  for (let i = 0; i < 9; i++) {
    const az = i * 2.39996 + rnd();
    const d = 0.02 + rnd() * 0.06;
    const u = unidadHoja({ tipo: 'lanza', az, tam: 0.5 + rnd() * 0.38, colgar: -(Math.PI / 2 - (0.05 + rnd() * 0.24)), giro: (rnd() - 0.5) * 1.2, pos: V3(Math.cos(az) * d, 0.2, Math.sin(az) * d), recoge: 0, cede: 0.04 });
    grupo.add(u.pivote); hojas.push(u);
  }
  return { grupo, hojas, alto: 1 };
}
function plantaColgante(semilla = 13, colorMaceta = 0xf2efe8) {
  const rnd = azar(semilla), grupo = new THREE.Group(), hojas = [];
  grupo.add(maceta(0.09, 0.12, colorMaceta, 0.5));
  for (let v = 0; v < 6; v++) {
    const az = (v / 6) * TAU + rnd() * 0.6, largo = 0.35 + rnd() * 0.45, cx = Math.cos(az), cz = Math.sin(az);
    const curva = new THREE.CatmullRomCurve3([V3(0, 0.1, 0), V3(cx * 0.1, 0.16, cz * 0.1), V3(cx * 0.17, 0.06, cz * 0.17), V3(cx * 0.19, -largo * 0.5, cz * 0.19), V3(cx * 0.17, -largo, cz * 0.17)]);
    const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.004, 5), matTallo());
    tubo.castShadow = true; grupo.add(tubo);
    const total = 5 + Math.round(largo * 8);
    for (let k = 1; k <= total; k++) {
      const u = unidadHoja({ tipo: 'corazon', az: az + (k % 2 ? 1.1 : -1.1) + (rnd() - 0.5) * 0.6, r: 0.02, h: 0.008, tam: 0.075 + rnd() * 0.035, colgar: 0.9 + rnd() * 0.5, giro: (rnd() - 0.5) * 0.7, grosor: 0.003, pos: curva.getPoint(0.12 + 0.88 * (k / total)) });
      grupo.add(u.pivote); hojas.push(u);
    }
  }
  return { grupo, hojas, alto: 0.3 };
}

// t de 0 a 1: las hojas brotan por orden, se despliegan y se mecen. "animo" negativo las deja caer.
function crecer(planta, t, tiempo = 0, animo = 0) {
  const n = planta.hojas.length, D = 3;
  planta.hojas.forEach((h, i) => {
    const g = sujetar((t * (n - 1 + D) - i) / D);
    h.pivote.visible = g > 0.001;
    if (!h.pivote.visible) return;
    const e = 1 - Math.pow(1 - g, 3);
    h.pivote.scale.setScalar(Math.max(e, 0.001));
    h.brazo.rotation.z = (1 - e) * h.recoge + Math.sin(tiempo * 0.9 + i * 1.7) * 0.014 + animo * h.cede;
    h.limbo.scale.set(h.tam, h.tam * mezcla(0.2, 1, suave(0.15, 0.9, g)), h.tam);
    h.pivote.rotation.y = -h.az + Math.sin(tiempo * 0.6 + i * 2.3) * 0.022;
  });
}

function crearRenderer(lienzo) {
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}
// Se compila sin bloquear la página. No hay mapas de sombra: en gráficas integradas su shader tarda
// muchos segundos en compilar, así que las sombras y la luz de la ventana van dibujadas.
function preparar(renderer, escena, camara) {
  escena.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return renderer.compileAsync ? renderer.compileAsync(escena, camara).catch(() => {}) : Promise.resolve();
}

/* ====================================================================== */
/* Hero: la monstera que crece con el scroll                              */
/* ====================================================================== */
export class HeroPlanta {
  constructor(seccion, lienzo, etiquetasEl, { alCambiar, etiquetas = [] } = {}) {
    this.seccion = seccion; this.lienzo = lienzo; this.alCambiar = alCambiar;
    this.reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = crearRenderer(lienzo);
    this.escena = new THREE.Scene();
    this.escena.add(new THREE.HemisphereLight(0xfff6e2, 0x4f6b45, 1.25));
    const relleno = new THREE.DirectionalLight(0xd8ecff, 0.8); relleno.position.set(-3, 2, -2); this.escena.add(relleno);
    this.sol = new THREE.DirectionalLight(0xffe2b0, 3.4);
    this.escena.add(this.sol, this.sol.target);
    this.sol.target.position.set(0, 0.5, 0);

    this.sombra = sombraBlanda(1, 1, 0.34);
    this.escena.add(this.sombra);

    this.planta = plantaMonstera(3);
    this.escena.add(this.planta.grupo);
    this.camara = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

    this.etiquetas = etiquetas.map((d) => {
      const el = document.createElement('div');
      el.className = 'hero__etiqueta';
      el.innerHTML = d.html;
      etiquetasEl.append(el);
      return { ...d, el, punto: V3(0, 0, 0), ancho: el.offsetWidth + 20, visible: false };
    });

    this.progreso = 0; this.visto = 0; this.tiempo = 0;
    this.raton = { x: 0, y: 0 }; this.ratonVisto = { x: 0, y: 0 };
    this.alMover = (e) => { this.raton.x = (e.clientX / window.innerWidth - 0.5) * 2; this.raton.y = (e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener('pointermove', this.alMover, { passive: true });
    this.alScroll = () => this.medir();
    window.addEventListener('scroll', this.alScroll, { passive: true });
    this.ro = new ResizeObserver(() => { this.ajustar(); this.medir(); });
    this.ro.observe(lienzo.parentElement);
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(seccion);
    this.ajustar(); this.medir();
    this.visto = this.progreso;
    this.antes = performance.now();
    this.bucle = this.bucle.bind(this);
    this.colocar(0);
    this.lista = preparar(this.renderer, this.escena, this.camara).then(() => { if (!this.fin) this.frame = requestAnimationFrame(this.bucle); });
  }

  medir() {
    const r = this.seccion.getBoundingClientRect();
    const recorrido = r.height - window.innerHeight;
    this.progreso = recorrido > 0 ? sujetar(-r.top / recorrido) : 0;
  }

  ajustar() {
    const caja = this.lienzo.parentElement;
    const w = caja.clientWidth, h = caja.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.ancha = w / h > 1.15;
    const tan = Math.tan((this.camara.fov / 2) * Math.PI / 180);
    // En escritorio la planta ocupa la mitad derecha; en móvil, la parte de arriba.
    this.distancia = this.ancha ? Math.max(1.95 / (2 * tan), 1.7 / (2 * tan * (w / h) * 0.5)) : Math.max(2.9 / (2 * tan), 1.6 / (2 * tan * (w / h)));
    if (this.ancha) this.camara.setViewOffset(w, h, -w * 0.21, 0, w, h);
    else this.camara.setViewOffset(w, h, 0, h * 0.2, w, h);
    this.camara.updateProjectionMatrix();
  }

  bucle(ahora) {
    this.frame = requestAnimationFrame(this.bucle);
    const dt = Math.min((ahora - this.antes) / 1000, 0.1);
    this.antes = ahora;
    if (!this.visible) return;
    this.tiempo += dt;
    this.visto += (this.progreso - this.visto) * (this.reducir ? 1 : 1 - Math.exp(-dt * 16));
    this.ratonVisto.x += (this.raton.x - this.ratonVisto.x) * (1 - Math.exp(-dt * 3));
    this.ratonVisto.y += (this.raton.y - this.ratonVisto.y) * (1 - Math.exp(-dt * 3));
    const p = this.visto;
    this.pintar(p, this.colocar(p));
  }

  colocar(p) {
    const t = mezcla(0.1, 1, suave(0, 0.84, p));
    crecer(this.planta, t, this.reducir ? 0 : this.tiempo);
    const talla = suave(0.1, 1, t), esc = mezcla(0.5, 1.32, talla);
    this.planta.grupo.scale.setScalar(esc);
    const giro = -0.55 + p * 1.5 + this.ratonVisto.x * 0.12;
    // En móvil, mientras crece no hay texto debajo: la planta baja al centro y se acerca
    const conTexto = (1 - suave(0.02, 0.1, p)) + suave(0.86, 0.95, p);
    if (!this.ancha && this.w) { this.camara.setViewOffset(this.w, this.h, 0, this.h * mezcla(0.04, 0.2, conTexto), this.w, this.h); }
    const d = this.distancia * mezcla(0.42, 1.3, talla) * (this.ancha ? 1 : mezcla(0.8, 1, conTexto));
    const mira = mezcla(0.2, 0.95, talla);
    this.camara.position.set(Math.sin(giro) * d, mira + mezcla(0.25, 0.7, talla) + this.ratonVisto.y * 0.1, Math.cos(giro) * d);
    this.camara.lookAt(0, mira, 0);
    const a = mezcla(-0.9, 1.6, p);
    this.sol.position.set(Math.sin(a) * 4, mezcla(3, 5, Math.sin(p * Math.PI)), Math.cos(a) * 4 + 1.5);
    this.sol.color.setHSL(0.11, 0.9, mezcla(0.74, 0.84, Math.sin(p * Math.PI)));
    // la sombra del suelo crece con la planta y se aparta del sol
    const s = mezcla(0.22, 1.02, talla);
    this.sombra.scale.set(s * 1.2, s, 1);
    this.sombra.position.set(-Math.sin(a) * 0.22 * s, 0.004, -Math.cos(a) * 0.12 * s);
    this.sombra.rotation.z = a;
    return t;
  }

  pintar(p, t) {
    this.renderer.render(this.escena, this.camara);
    for (const e of this.etiquetas) {
      const hoja = this.planta.hojas[e.hoja];
      const v = suave(e.de, e.de + 0.06, p) * (1 - suave(e.a, e.a + 0.06, p));
      if (v < 0.01 || !hoja.pivote.visible) { if (e.visible) { e.el.style.opacity = 0; e.visible = false; } continue; }
      e.visible = true;
      hoja.punta.getWorldPosition(e.punto).project(this.camara);
      e.el.style.opacity = v.toFixed(3);
      const ancho = e.ancho, izq = e.lado === 'izq';
      const x = sujetar((e.punto.x + 1) / 2 * this.w, izq ? ancho : 0, this.w - (izq ? 0 : ancho));
      e.el.style.transform = `translate(${x.toFixed(1)}px, ${((1 - e.punto.y) / 2 * this.h).toFixed(1)}px) translate(${izq ? '-100%' : '0'}, -50%)`;
    }
    this.alCambiar?.(p, t);
  }

  destruir() {
    this.fin = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('pointermove', this.alMover);
    window.removeEventListener('scroll', this.alScroll);
    this.ro.disconnect(); this.io.disconnect();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

/* ====================================================================== */
/* Recomendador: el salón con luz real                                    */
/* ====================================================================== */
const SALA = { ancho: 5.6, fondo: 3.2, alto: 2.7 };
const VENTANA = { z1: 0.8, z2: 2.4, y1: 0.55, y2: 2.25 };
const Z_PLANTA = 1.6, X0 = 0.5, PASO_M = 0.93;
const SOLES = {
  sur: { dir: V3(0.8, -0.59, -0.08), fuerza: 6, color: 0xffdfa6 },
  este: { dir: V3(0.56, -0.82, 0.1), fuerza: 3.4, color: 0xfff0cf },
  norte: { dir: V3(0.56, -0.82, 0.1), fuerza: 0, color: 0xe8f1ff }
};
const VISTAS = [
  { foco: [2.75, 1.05, 1.5], az: 0.34, el: 0.34, zoom: 1 },
  { foco: null, alto: 0.75, az: 0.12, el: 0.26, zoom: 0.62 },
  { foco: [3.3, 0.55, 1.95], az: 0.5, el: 0.4, zoom: 0.66 },
  { foco: null, alto: 0.95, az: 0.3, el: 0.3, zoom: 0.8 },
  { foco: [2.8, 1.05, 1.5], az: 0.48, el: 0.36, zoom: 1 },
  { foco: [2.8, 1.05, 1.5], az: 0.3, el: 0.36, zoom: 1, pasea: true }
];

function sombraBlanda(rx, rz, fuerza = 0.38) {
  sombraBlanda.tex ||= lienzoTex(128, 128, (g) => {
    const d = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    d.addColorStop(0, 'rgba(40,24,10,1)'); d.addColorStop(0.55, 'rgba(40,24,10,.45)'); d.addColorStop(1, 'rgba(40,24,10,0)');
    g.fillStyle = d; g.fillRect(0, 0, 128, 128);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(rx * 2, rz * 2), matPlano({ map: sombraBlanda.tex, opacity: fuerza, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.006; m.renderOrder = 1;
  return m;
}

export class Habitacion3D {
  constructor(lienzo, { chapa, alMover } = {}) {
    this.lienzo = lienzo; this.chapa = chapa; this.alMover = alMover;
    this.reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = crearRenderer(lienzo);
    this.renderer.toneMappingExposure = 1.0;
    this.escena = new THREE.Scene();
    this.cielo = new THREE.HemisphereLight(0xfff3df, 0x9c8463, 1.7);
    this.escena.add(this.cielo);
    const relleno = new THREE.DirectionalLight(0xfff1dc, 0.7); relleno.position.set(6, 5, 8); this.escena.add(relleno);
    // La ventana ilumina como un foco: lo que está cerca recibe más luz
    this.sol = new THREE.PointLight(0xffdfa6, 20, 9, 1.5);
    this.sol.position.set(0.9, 1.9, 1.6);
    this.escena.add(this.sol);
    this.camara = new THREE.PerspectiveCamera(28, 1, 0.1, 80);

    // valores actuales (v) que persiguen a sus objetivos (o)
    this.v = { x: X0 + 2 * PASO_M, z: Z_PLANTA, esc: 0.9, tab: 0, gato: 0, crece: 0.62, fuerza: 6, animo: 0, az: 0.34, el: 0.34, zoom: 1.25 };
    this.o = { ...this.v, zoom: 1 };
    this.dir = SOLES.sur.dir.clone().normalize(); this.dirO = this.dir.clone();
    this.foco = V3(2.75, 1.05, 1.5); this.focoO = this.foco.clone();
    this.vista = VISTAS[0];
    this.extrasO = [];
    this.tiempo = 0; this.riego = null; this.arrastrable = true;

    this.construirSala();
    this.construirHabitantes();

    this.rayo = new THREE.Raycaster();
    // La planta se arrastra por el suelo: hacia la ventana, hacia el fondo o a un rincón
    this.plano = new THREE.Plane(V3(0, 1, 0), 0);
    const enSuelo = (e) => {
      const r = lienzo.getBoundingClientRect();
      this.rayo.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.camara);
      return this.rayo.ray.intersectPlane(this.plano, V3(0, 0, 0));
    };
    this.agarre = V3(0, 0, 0);
    this.abajo = (e) => {
      if (!this.arrastrable) return;
      const punto = enSuelo(e);
      if (!punto) return;
      this.arrastrando = true;
      lienzo.setPointerCapture?.(e.pointerId);
      // si se agarra la planta (o sus hojas), no salta: se mueve desde donde está
      this.agarre.set(this.v.x - punto.x, 0, this.v.z - punto.z);
      if (this.agarre.length() > 1.3) this.agarre.set(0, 0, 0);
      this.mover(e);
    };
    this.mover = (e) => {
      if (!this.arrastrando) return;
      const punto = enSuelo(e);
      if (!punto) return;
      let x = sujetar(punto.x + this.agarre.x, X0, X0 + 5 * PASO_M), z = sujetar(punto.z + this.agarre.z, 0.4, SALA.fondo - 0.3);
      // no se mete en el sofá ni en la mesita
      if (x > 1.75 && x < 4.6 && z < 1.25) z = 1.25;
      const dx = x - 4.98, dz = z - 0.98, dm = Math.hypot(dx, dz);
      if (dm < 0.6) { x = 4.98 + (dx / (dm || 1)) * 0.6; z = 0.98 + (dz / (dm || 1)) * 0.6; x = Math.min(x, X0 + 5 * PASO_M); }
      this.o.z = z;
      const metros = Math.round(((x - X0) / PASO_M) * 10) / 10;
      // fuera del frente de la ventana llega menos luz: cuenta como estar más lejos
      const lado = Math.max(0, Math.abs(z - Z_PLANTA) - 0.8) / PASO_M;
      this.alMover?.(metros, Math.round((Math.hypot(metros, lado) - metros) * 10) / 10, z);
    };
    this.arriba = () => { this.arrastrando = false; };
    lienzo.addEventListener('pointerdown', this.abajo);
    lienzo.addEventListener('pointermove', this.mover);
    lienzo.addEventListener('pointerup', this.arriba);
    lienzo.addEventListener('pointercancel', this.arriba);

    this.ro = new ResizeObserver(() => this.ajustar());
    this.ro.observe(lienzo.parentElement);
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(lienzo);
    this.ajustar();
    this.antes = performance.now();
    this.bucle = this.bucle.bind(this);
    this.camara.position.set(6, 4, 12); this.camara.lookAt(this.foco);
    // Se compila con todo a la vista para que nada dé un tirón al aparecer
    const ocultos = [];
    this.escena.traverse((o) => { if (!o.visible) { ocultos.push(o); o.visible = true; } });
    this.lista = preparar(this.renderer, this.escena, this.camara).then(() => {
      ocultos.forEach((o) => { o.visible = false; });
      if (!this.fin) this.frame = requestAnimationFrame(this.bucle);
    });
  }

  construirSala() {
    const e = this.escena, { ancho, fondo, alto } = SALA;
    const caja = (w, h, d, color, x, y, z, rug = 0.9) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, rug)); m.position.set(x, y, z); m.castShadow = true; e.add(m); return m; };
    const redonda = (w, h, d, r, color, x, y, z, rug = 0.95) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat(color, rug)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; e.add(m); return m; };

    // Suelo de tarima
    const tarima = lienzoTex(1024, 512, (g, w, h) => {
      const rnd = azar(21);
      for (let f = 0; f < 8; f++) {
        let x = -rnd() * 300;
        while (x < w) {
          const largo = 220 + rnd() * 260, tono = 150 + rnd() * 34;
          g.fillStyle = `rgb(${tono + 48},${tono + 12},${tono - 34})`;
          g.fillRect(x, f * 64, largo, 64);
          for (let v = 0; v < 14; v++) { g.fillStyle = `rgba(90,58,30,${0.03 + rnd() * 0.05})`; g.fillRect(x, f * 64 + rnd() * 64, largo, 1 + rnd() * 2); }
          g.fillStyle = 'rgba(70,44,22,.5)'; g.fillRect(x + largo - 2, f * 64, 2, 64);
          x += largo;
        }
        g.fillStyle = 'rgba(70,44,22,.45)'; g.fillRect(0, f * 64, w, 2);
      }
    });
    tarima.wrapS = tarima.wrapT = THREE.RepeatWrapping; tarima.repeat.set(1.4, 2);
    const suelo = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.12, 0.14, fondo + 0.12), mat(0xffffff, 0.62, { map: tarima }));
    suelo.position.set(ancho / 2 - 0.06, -0.07, fondo / 2 - 0.06); suelo.receiveShadow = true; e.add(suelo);

    // Paredes: la del fondo y la de la ventana (con su hueco)
    const pared = mat(0xf1e9d8, 0.95);
    const fondoM = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.12, alto, 0.12), pared);
    fondoM.position.set(ancho / 2 - 0.06, alto / 2, -0.06); fondoM.receiveShadow = true; e.add(fondoM);
    const forma = new THREE.Shape();
    forma.moveTo(0, 0); forma.lineTo(fondo, 0); forma.lineTo(fondo, alto); forma.lineTo(0, alto); forma.closePath();
    const hueco = new THREE.Path();
    hueco.moveTo(VENTANA.z1, VENTANA.y1); hueco.lineTo(VENTANA.z2, VENTANA.y1); hueco.lineTo(VENTANA.z2, VENTANA.y2); hueco.lineTo(VENTANA.z1, VENTANA.y2); hueco.closePath();
    forma.holes.push(hueco);
    const paredV = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.12, bevelEnabled: false }), pared);
    paredV.rotation.y = -Math.PI / 2; paredV.castShadow = true; paredV.receiveShadow = true; e.add(paredV);
    caja(ancho, 0.09, 0.02, 0xfbf7ee, ancho / 2, 0.045, 0.01, 0.7).castShadow = false;

    // Marco de la ventana, con sus travesaños (dan sombra en el suelo)
    const madera = 0x8c6a45, zc = (VENTANA.z1 + VENTANA.z2) / 2, yc = (VENTANA.y1 + VENTANA.y2) / 2, az = VENTANA.z2 - VENTANA.z1, ay = VENTANA.y2 - VENTANA.y1;
    caja(0.14, 0.06, az + 0.12, madera, -0.06, VENTANA.y2 + 0.03, zc, 0.6);
    caja(0.2, 0.05, az + 0.16, madera, -0.03, VENTANA.y1 - 0.025, zc, 0.6);
    caja(0.14, ay, 0.06, madera, -0.06, yc, VENTANA.z1 - 0.03, 0.6);
    caja(0.14, ay, 0.06, madera, -0.06, yc, VENTANA.z2 + 0.03, 0.6);
    caja(0.05, ay, 0.04, madera, -0.06, yc, zc, 0.6);
    caja(0.05, 0.04, az, madera, -0.06, yc + 0.25, zc, 0.6);
    const fuera = new THREE.Mesh(new THREE.PlaneGeometry(az + 0.1, ay + 0.1), matPlano({ map: lienzoTex(64, 256, (g, w, h) => { const d = g.createLinearGradient(0, 0, 0, h); d.addColorStop(0, '#9fd0ee'); d.addColorStop(0.7, '#dff1f8'); d.addColorStop(1, '#f6f3df'); g.fillStyle = d; g.fillRect(0, 0, w, h); }) }));
    fuera.rotation.y = Math.PI / 2; fuera.position.set(-0.125, yc, zc); e.add(fuera);
    this.fuera = fuera;

    // Haz de luz que entra por la ventana
    this.hazGeo = new THREE.BufferGeometry();
    this.hazGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24), 3));
    this.hazGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(16), 2));
    // cada cara por los dos lados, para no necesitar otro shader de doble cara
    const caras = [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
    this.hazGeo.setIndex([...caras, ...caras.slice().reverse()]);
    this.hazMat = matPlano({ color: 0xffe6a8, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false });
    const haz = new THREE.Mesh(this.hazGeo, this.hazMat); haz.frustumCulled = false; haz.renderOrder = 3; e.add(haz);
    // Mancha de sol en el suelo, con la sombra de los travesaños
    this.manchaGeo = new THREE.BufferGeometry();
    this.manchaGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    this.manchaGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    this.manchaGeo.setIndex([0, 1, 2, 0, 2, 3]);
    this.manchaMat = matPlano({ color: 0xffdc9a, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, map: lienzoTex(256, 256, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      g.filter = 'blur(5px)';
      g.fillStyle = '#fff'; g.fillRect(14, 14, w - 28, h - 28);
      g.fillStyle = '#000'; g.fillRect(w / 2 - 5, 0, 10, h); g.fillRect(0, h * 0.34 - 4, w, 8);
    }) });
    const mancha = new THREE.Mesh(this.manchaGeo, this.manchaMat); mancha.frustumCulled = false; mancha.renderOrder = 2; e.add(mancha);

    // Alfombra
    const alfombra = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.7), mat(0xffffff, 1, { map: lienzoTex(512, 320, (g, w, h) => {
      g.fillStyle = '#efe6d3'; g.fillRect(0, 0, w, h);
      const rnd = azar(4);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '150,120,80'},${rnd() * 0.08})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
      g.strokeStyle = '#c4673f'; g.lineWidth = 7; g.strokeRect(22, 22, w - 44, h - 44);
      g.strokeStyle = '#3f7d52'; g.lineWidth = 3; g.strokeRect(38, 38, w - 76, h - 76);
      g.fillStyle = '#c4673f';
      for (let x = 70; x < w - 60; x += 46) for (const y of [70, h - 70]) { g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.lineTo(x - 9, y); g.fill(); }
    }) }));
    alfombra.rotation.x = -Math.PI / 2; alfombra.position.set(3.15, 0.004, 1.95); alfombra.receiveShadow = true; e.add(alfombra);

    // Sofá
    const ss = sombraBlanda(1.25, 0.62); ss.position.set(3, 0.005, 0.55); e.add(ss);
    redonda(1.95, 0.3, 0.82, 0.08, 0xe3d9c5, 3, 0.31, 0.55);
    redonda(1.95, 0.52, 0.22, 0.08, 0xe3d9c5, 3, 0.62, 0.22);
    redonda(0.2, 0.44, 0.82, 0.08, 0xe3d9c5, 2.1, 0.42, 0.55);
    redonda(0.2, 0.44, 0.82, 0.08, 0xe3d9c5, 3.9, 0.42, 0.55);
    redonda(0.78, 0.14, 0.62, 0.06, 0xece3d1, 2.62, 0.5, 0.62);
    redonda(0.78, 0.14, 0.62, 0.06, 0xece3d1, 3.38, 0.5, 0.62);
    redonda(0.42, 0.42, 0.14, 0.06, 0xc4673f, 2.5, 0.72, 0.42).rotation.set(-0.25, 0.2, 0.05);
    redonda(0.4, 0.4, 0.14, 0.06, 0x8fae8a, 3.52, 0.71, 0.42).rotation.set(-0.25, -0.25, -0.05);
    for (const [x, z] of [[2.12, 0.22], [3.88, 0.22], [2.12, 0.88], [3.88, 0.88]]) caja(0.05, 0.16, 0.05, 0x6f5236, x, 0.08, z, 0.6);

    // Cuadro, balda con libros, lámpara y mesita
    caja(0.78, 0.98, 0.03, 0x8c6a45, 3, 1.72, 0.02, 0.6);
    const lamina = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.88), mat(0xffffff, 0.9, { map: lienzoTex(256, 330, (g, w, h) => {
      g.fillStyle = '#f7f1e3'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e9a684'; g.beginPath(); g.arc(w * 0.62, h * 0.36, 52, 0, TAU); g.fill();
      g.strokeStyle = '#2c5139'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(w * 0.42, h * 0.92); g.quadraticCurveTo(w * 0.4, h * 0.55, w * 0.5, h * 0.28); g.stroke();
      g.fillStyle = '#3f7d52';
      for (const [x, y, a] of [[0.36, 0.62, -0.9], [0.5, 0.52, 0.7], [0.38, 0.42, -0.7], [0.53, 0.34, 0.6], [0.5, 0.24, -0.1]]) { g.save(); g.translate(w * x, h * y); g.rotate(a); g.beginPath(); g.ellipse(0, -22, 13, 26, 0, 0, TAU); g.fill(); g.restore(); }
    }) }));
    lamina.position.set(3, 1.72, 0.04); e.add(lamina);
    caja(1.15, 0.04, 0.26, 0x8c6a45, 1.4, 1.6, 0.15, 0.6);
    [[0.95, 0.24, 0xc4673f], [1.0, 0.2, 0x2c5139], [1.045, 0.26, 0xe9d9a8], [1.09, 0.22, 0x4d7fa8]].forEach(([x, h, c]) => caja(0.04, h, 0.17, c, x, 1.62 + h / 2, 0.14, 0.8));
    // lámpara de pie
    const metal = mat(0x2f2a25, 0.5, { metalness: 0.3 });
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.45, 10), metal); pie.position.set(4.3, 0.725, 0.36); pie.castShadow = true; e.add(pie);
    const peana = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.03, 28), metal); peana.position.set(4.3, 0.015, 0.36); peana.castShadow = true; e.add(peana);
    const pantalla = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.26, 28), mat(0xf6ead0, 0.9, { emissive: 0xffd9a0, emissiveIntensity: 0.35 }));
    pantalla.position.set(4.3, 1.5, 0.36); pantalla.castShadow = true; e.add(pantalla);
    // mesita redonda
    const mesa = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.035, 36), mat(0xa67c52, 0.5));
    mesa.position.set(4.98, 0.5, 0.98); mesa.castShadow = true; mesa.receiveShadow = true; e.add(mesa);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.4; const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.5, 8), mat(0x6f5236, 0.6)); pata.position.set(4.98 + Math.cos(a) * 0.2, 0.25, 0.98 + Math.sin(a) * 0.2); pata.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); pata.castShadow = true; e.add(pata); }
    const sm = sombraBlanda(0.4, 0.4, 0.3); sm.position.set(4.98, 0.006, 0.98); e.add(sm);
  }

  construirHabitantes() {
    const e = this.escena;
    // La planta protagonista, con un taburete para cuando es pequeña
    this.principal = new THREE.Group();
    this.principal.position.set(this.v.x, 0, this.v.z);
    this.planta = plantaMonstera(3);
    this.portaPlanta = new THREE.Group();
    this.portaPlanta.add(this.planta.grupo);
    this.taburete = new THREE.Group();
    const asiento = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 30), mat(0xa67c52, 0.5));
    asiento.position.y = 0.43; asiento.castShadow = true; asiento.receiveShadow = true; this.taburete.add(asiento);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.43, 8), mat(0x6f5236, 0.6)); pata.position.set(Math.cos(a) * 0.14, 0.215, Math.sin(a) * 0.14); pata.rotation.set(Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14); pata.castShadow = true; this.taburete.add(pata); }
    this.sombraPlanta = sombraBlanda(0.38, 0.38, 0.42);
    this.principal.add(this.portaPlanta, this.taburete, this.sombraPlanta);
    e.add(this.principal);

    // Las compañeras, que aparecen según la experiencia
    const poner = (planta, x, y, z, esc, nivel, conSombra = true) => {
      crecer(planta, 1);
      const g = new THREE.Group();
      g.add(planta.grupo); planta.grupo.scale.setScalar(esc);
      if (conSombra && y < 0.01) g.add(sombraBlanda(0.3 * esc + 0.08, 0.3 * esc + 0.08, 0.36));
      g.position.set(x, y, z); g.scale.setScalar(0.001); g.visible = false;
      e.add(g);
      return { g, nivel, v: 0 };
    };
    this.extras = [
      poner(plantaSansevieria(8), 0.78, 0, 0.5, 1, 2),
      poner(plantaColgante(13), 1.62, 1.62, 0.16, 1, 2),
      poner(plantaPilea(5), 4.98, 0.518, 0.98, 1, 2),
      poner(plantaMonstera(9, 0xf2efe8), 5.1, 0, 2.7, 0.92, 3),
      poner(plantaSansevieria(15, 0xc9a675), 0.55, 0, 2.85, 0.72, 3),
      poner(plantaPilea(6, 0xc4673f), -0.04, VENTANA.y1, 1.15, 0.9, 3),
      poner(plantaColgante(17, 0xc4673f), 1.25, 1.62, 0.16, 0.8, 3)
    ];

    // El gato
    const gato = new THREE.Group();
    const pelo = mat(0xd98a4b, 0.92);
    const claro = mat(0xf5e6d0, 0.92);
    const oscuro = mat(0x2a211b, 0.4);
    const bola = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; gato.add(m); return m; };
    bola(0.13, pelo, 0, 0.155, 0, 1, 1.2, 1.12);
    bola(0.085, claro, 0, 0.17, 0.085, 0.95, 1.15, 0.7);
    this.cabeza = new THREE.Group(); this.cabeza.position.set(0, 0.37, 0.04); gato.add(this.cabeza);
    const enCabeza = (m) => { gato.remove(m); this.cabeza.add(m); return m; };
    enCabeza(bola(0.095, pelo, 0, 0, 0, 1.1, 0.95, 1));
    enCabeza(bola(0.04, claro, 0, -0.028, 0.075, 1.25, 0.8, 0.8));
    enCabeza(bola(0.011, mat(0xd27a7a, 0.6), 0, -0.014, 0.108));
    enCabeza(bola(0.014, oscuro, -0.038, 0.016, 0.082));
    enCabeza(bola(0.014, oscuro, 0.038, 0.016, 0.082));
    for (const s of [-1, 1]) { const oreja = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.07, 4), pelo); oreja.position.set(s * 0.058, 0.09, -0.005); oreja.rotation.set(0, Math.PI / 4, -s * 0.28); oreja.castShadow = true; this.cabeza.add(oreja); }
    bola(0.03, claro, -0.05, 0.03, 0.115, 1, 1, 1.5); bola(0.03, claro, 0.05, 0.03, 0.115, 1, 1, 1.5);
    this.cola = new THREE.Group(); this.cola.position.set(0, 0.05, -0.1);
    const colaM = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(0.13, -0.01, -0.04), V3(0.2, 0.01, 0.08), V3(0.17, 0.07, 0.18)]), 20, 0.022, 8), pelo);
    colaM.castShadow = true; this.cola.add(colaM); gato.add(this.cola);
    gato.add(sombraBlanda(0.2, 0.2, 0.4));
    gato.position.set(3.45, 0.006, 2.3); gato.rotation.y = 0.45; gato.scale.setScalar(0.001); gato.visible = false;
    e.add(gato); this.gato = gato;

    // Regadera y gotas
    const reg = new THREE.Group();
    const chapa = mat(0x8fae8a, 0.45, { metalness: 0.25 });
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.15, 28), chapa); cuerpo.castShadow = true; reg.add(cuerpo);
    reg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(V3(0.06, -0.04, 0), V3(0.24, 0.1, 0)), 2, 0.013, 8), chapa));
    const alcachofa = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.014, 0.03, 16), chapa); alcachofa.position.set(0.25, 0.108, 0); alcachofa.rotation.z = -0.9; reg.add(alcachofa);
    const asa = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.009, 8, 20, Math.PI), chapa); asa.position.set(-0.075, 0.01, 0); asa.rotation.z = Math.PI / 2; reg.add(asa);
    reg.visible = false; e.add(reg); this.regadera = reg;
    const agua = mat(0x9fd8ff, 0.15, { emissive: 0x3d8fd0, emissiveIntensity: 0.45 });
    this.gotas = Array.from({ length: 10 }, () => { const g = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), agua); g.scale.y = 1.6; g.visible = false; e.add(g); return g; });
  }

  /* ---- API ---- */
  luz(metros, orientacion, nivel, z) {
    this.o.x = X0 + metros * PASO_M;
    if (typeof z === 'number') this.o.z = z;
    const s = SOLES[orientacion] || SOLES.sur;
    this.dirO.copy(s.dir).normalize();
    this.o.fuerza = s.fuerza;
    this.sol.color.set(s.color);
    this.o.animo = [0, 0.9, 0.25, 0, -0.15][nivel] ?? 0;
    this.norte = orientacion === 'norte';
  }

  estado(paso, r) {
    this.vista = VISTAS[Math.min(paso, VISTAS.length - 1)];
    this.arrastrable = paso === 0;
    this.lienzo.classList.toggle('arrastrable', this.arrastrable);
    this.o.gato = r.mascotas === true && paso >= 2 ? 1 : 0;
    const tam = paso >= 3 ? r.espacio : null;
    this.o.esc = tam === 'pequena' ? 0.45 : tam === 'grande' ? 1.25 : 0.9;
    this.o.tab = tam === 'pequena' ? 1 : 0;
    const nivel = paso >= 4 ? (r.experiencia || 0) : 0;
    this.extras.forEach((x) => { x.o = nivel >= x.nivel ? 1 : 0; });
    this.o.crece = 0.62 + 0.38 * Math.min(paso, 5) / 5;
  }

  regar(veces) { this.riego = { inicio: this.tiempo, veces }; }

  ajustar() {
    const caja = this.lienzo.parentElement;
    const w = caja.clientWidth, h = caja.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
    const tan = Math.tan((this.camara.fov / 2) * Math.PI / 180);
    this.distancia = Math.max(3.5 / (2 * tan), 6.5 / (2 * tan * (w / h)));
  }

  bucle(ahora) {
    this.frame = requestAnimationFrame(this.bucle);
    const dt = Math.min((ahora - this.antes) / 1000, 0.1);
    this.antes = ahora;
    if (!this.visible) return;
    this.tiempo += dt;
    const k = this.reducir ? 1 : 1 - Math.exp(-dt * 5), lento = this.reducir ? 1 : 1 - Math.exp(-dt * 2.6);
    const v = this.v, o = this.o;
    const kx = this.arrastrando ? 1 - Math.exp(-dt * 16) : k;
    v.x += (o.x - v.x) * kx;
    v.z += (o.z - v.z) * kx;
    for (const c of ['esc', 'tab', 'gato', 'fuerza', 'animo']) v[c] += (o[c] - v[c]) * k;
    v.crece += (o.crece - v.crece) * lento;
    this.dir.lerp(this.dirO, k).normalize();

    // Sol y haz de luz
    this.sol.intensity = 4 + v.fuerza * 3.2;
    this.cielo.intensity = mezcla(1.95, 1.65, v.fuerza / 6);
    this.cielo.color.set(this.norte ? 0xeaf1fb : 0xfff3df);
    this.hazMat.opacity = 0.011 * v.fuerza;
    const pos = this.hazGeo.attributes.position, esquinas = [[VENTANA.z1, VENTANA.y1], [VENTANA.z2, VENTANA.y1], [VENTANA.z2, VENTANA.y2], [VENTANA.z1, VENTANA.y2]];
    esquinas.forEach(([z, y], i) => {
      const t = y / -this.dir.y;
      pos.setXYZ(i, 0, y, z);
      pos.setXYZ(i + 4, this.dir.x * t, 0.01, z + this.dir.z * t);
      this.manchaGeo.attributes.position.setXYZ(i, this.dir.x * t, 0.012, z + this.dir.z * t);
    });
    pos.needsUpdate = true;
    this.manchaGeo.attributes.position.needsUpdate = true;
    this.manchaMat.opacity = 0.085 * v.fuerza;
    // la planta al sol proyecta una sombra alargada
    const alcance = this.dir.x * (VENTANA.y2 / -this.dir.y);
    const alSol = sujetar(v.fuerza / 3) * (1 - suave(alcance - 0.5, alcance + 0.2, v.x)) * suave(VENTANA.z1 - 0.5, VENTANA.z1, v.z) * (1 - suave(VENTANA.z2, VENTANA.z2 + 0.5, v.z));
    this.sombraPlanta.position.x = 0.3 * alSol * v.esc;
    this.sombraPlanta.material.opacity = mezcla(0.4, 0.62, alSol);
    this.alSol = alSol;

    // Planta protagonista
    const alturaTab = 0.45 * v.tab;
    this.principal.position.x = v.x;
    this.principal.position.z = v.z;
    this.portaPlanta.position.y = alturaTab;
    this.portaPlanta.scale.setScalar(v.esc);
    this.taburete.scale.set(1, Math.max(v.tab, 0.001), 1);
    this.taburete.visible = v.tab > 0.02;
    const sp = mezcla(v.esc, 0.75, v.tab);
    this.sombraPlanta.scale.set(sp * (1 + 0.9 * (this.alSol || 0)), sp, 1);
    crecer(this.planta, v.crece, this.reducir ? 0 : this.tiempo, v.animo);
    const cima = alturaTab + (0.3 + 1.05 * mezcla(0.55, 1, v.crece)) * v.esc;

    // Compañeras y gato
    for (const x of this.extras) {
      x.v += ((x.o || 0) - x.v) * k;
      x.g.visible = x.v > 0.01;
      if (x.g.visible) x.g.scale.setScalar(Math.max(rebote(x.v), 0.001));
    }
    this.gato.visible = v.gato > 0.01;
    if (this.gato.visible) {
      this.gato.scale.setScalar(Math.max(rebote(v.gato), 0.001));
      this.cola.rotation.y = Math.sin(this.tiempo * 2.2) * 0.35;
      this.cabeza.rotation.z = Math.sin(this.tiempo * 0.9) * 0.1;
      this.cabeza.rotation.y = Math.sin(this.tiempo * 0.5) * 0.25;
    }

    // Riego
    let regando = false;
    if (this.riego) {
      const tau = this.tiempo - this.riego.inicio, dura = 0.5 + this.riego.veces * 0.8;
      if (tau > dura + 0.4) { this.riego = null; } else {
        regando = true;
        const entra = suave(0, 0.35, tau) * (1 - suave(dura, dura + 0.4, tau));
        this.regadera.visible = true;
        this.regadera.position.set(v.x - 0.42 * Math.max(v.esc, 0.6), cima + 0.28 + (1 - entra) * 0.3, v.z + 0.05);
        this.regadera.rotation.z = -0.75 * entra;
        this.regadera.scale.setScalar(Math.max(entra, 0.001) * 1.15);
        const boca = V3(0.27, 0.1, 0).applyEuler(this.regadera.rotation).multiplyScalar(1.15).add(this.regadera.position);
        this.gotas.forEach((g, i) => {
          const fase = (tau - 0.35) / 0.8 - i * 0.1;
          const ciclo = fase - Math.floor(fase);
          const activa = fase >= 0 && Math.floor(fase) < this.riego.veces && ciclo < 0.75;
          g.visible = activa;
          if (activa) { const c = ciclo / 0.75; g.position.set(boca.x + c * 0.16 + Math.sin(i * 5) * 0.03, boca.y - c * c * (boca.y - alturaTab - 0.3 * v.esc), boca.z + Math.cos(i * 3) * 0.04); }
        });
      }
    }
    if (!regando) { this.regadera.visible = false; this.gotas.forEach((g) => { g.visible = false; }); }

    // Cámara
    const vis = this.vista;
    if (vis.foco) this.focoO.set(...vis.foco); else this.focoO.set(v.x, alturaTab + vis.alto * Math.max(v.esc, 0.6), v.z);
    o.az = vis.az + (vis.pasea && !this.reducir ? Math.sin(this.tiempo * 0.22) * 0.3 : 0); o.el = vis.el; o.zoom = vis.zoom;
    for (const c of ['az', 'el', 'zoom']) v[c] += (o[c] - v[c]) * lento;
    this.foco.lerp(this.focoO, lento);
    const d = this.distancia * v.zoom;
    this.camara.position.set(this.foco.x + Math.sin(v.az) * Math.cos(v.el) * d, this.foco.y + Math.sin(v.el) * d, this.foco.z + Math.cos(v.az) * Math.cos(v.el) * d);
    this.camara.lookAt(this.foco);
    this.renderer.render(this.escena, this.camara);

    if (this.chapa) {
      const p = V3(v.x, cima + 0.12, v.z).project(this.camara);
      this.chapa.style.transform = `translate(${((p.x + 1) / 2 * this.w).toFixed(1)}px, ${((1 - p.y) / 2 * this.h).toFixed(1)}px) translate(-50%, -100%)`;
    }
  }

  destruir() {
    this.fin = true;
    cancelAnimationFrame(this.frame);
    this.ro.disconnect(); this.io.disconnect();
    this.lienzo.removeEventListener('pointerdown', this.abajo);
    this.lienzo.removeEventListener('pointermove', this.mover);
    this.lienzo.removeEventListener('pointerup', this.arriba);
    this.lienzo.removeEventListener('pointercancel', this.arriba);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

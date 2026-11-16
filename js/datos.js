// Catálogo de la tienda de ejemplo Raíz. Precios en euros.
export const ENVIO_GRATIS = 45;
export const COSTE_ENVIO = { estandar: 4.95, expres: 7.95 };

export const CATEGORIAS = [
  { id: 'todo', nombre: 'Todo' },
  { id: 'grandes', nombre: 'Plantas grandes' },
  { id: 'medianas', nombre: 'Medianas y pequeñas' },
  { id: 'flor', nombre: 'Con flor y suculentas' },
  { id: 'cuidado', nombre: 'Cuidado' }
];

export const FILTROS = [
  { id: 'mascotas', nombre: 'Aptas para mascotas', prueba: (p) => p.cuidados && p.cuidados.mascotas },
  { id: 'facil', nombre: 'Muy fáciles', prueba: (p) => p.cuidados && p.cuidados.dificultad === 1 },
  { id: 'sombra', nombre: 'Aguantan poca luz', prueba: (p) => p.cuidados && p.cuidados.luz[0] === 1 }
];

// Luz: 1 poca · 2 media · 3 mucha indirecta · 4 sol directo
export const LUZ = ['', 'Poca luz', 'Luz media', 'Mucha luz indirecta', 'Sol directo'];
export const DIFICULTAD = ['', 'Muy fácil', 'Fácil', 'Para cuidadores con experiencia'];

export const MACETAS = [
  { id: 'vivero', nombre: 'Maceta de vivero', extra: 0, color: '#3b3b38' },
  { id: 'terracota', nombre: 'Terracota', extra: 6, color: '#c4673f' },
  { id: 'ceramica', nombre: 'Cerámica blanca', extra: 12, color: '#f2efe8' },
  { id: 'cesta', nombre: 'Cesta de fibra', extra: 10, color: '#c9a675' }
];

export const PRODUCTOS = [
  {
    id: 'monstera', nombre: 'Monstera deliciosa', comun: 'Costilla de Adán', categoria: 'grandes', imagen: 'img/monstera.webp',
    tamanos: [{ id: 'M', nombre: 'Mediana · 70 cm', precio: 34.9 }, { id: 'L', nombre: 'Grande · 110 cm', precio: 59.9 }],
    nuevo: false, antes: null, lema: 'Las hojas abiertas que todo el mundo quiere',
    cuidados: { luz: [2, 3], riego: 7, dificultad: 1, mascotas: false, purifica: true, tamano: 'grande' },
    descripcion: 'La reina del salón. Crece rápido, abre hojas nuevas cada pocas semanas y perdona algún olvido. Le gusta la luz indirecta y que la tierra se seque un poco entre riegos.',
    consejo: 'Limpia sus hojas con un paño húmedo una vez al mes: respira mejor y brilla más.'
  },
  {
    id: 'pothos', nombre: 'Pothos dorado', comun: 'Potus', categoria: 'medianas', imagen: 'img/pothos.webp',
    tamanos: [{ id: 'S', nombre: 'Pequeño · 25 cm', precio: 14.9 }, { id: 'M', nombre: 'Colgante · 60 cm', precio: 22.9 }],
    nuevo: false, antes: null, lema: 'La planta imposible de matar',
    cuidados: { luz: [1, 3], riego: 8, dificultad: 1, mascotas: false, purifica: true, tamano: 'pequena' },
    descripcion: 'Si nunca has tenido plantas, empieza por aquí. Aguanta rincones con poca luz, avisa cuando tiene sed (se le caen un poco las hojas) y en un año cuelga más de un metro.',
    consejo: 'Corta un tallo con dos hojas, mételo en agua y en tres semanas tendrás otra planta.'
  },
  {
    id: 'sansevieria', nombre: 'Sansevieria', comun: 'Lengua de suegra', categoria: 'medianas', imagen: 'img/sansevieria.webp',
    tamanos: [{ id: 'M', nombre: 'Mediana · 50 cm', precio: 24.9 }, { id: 'L', nombre: 'Alta · 80 cm', precio: 39.9 }],
    nuevo: false, antes: null, lema: 'Tres semanas sin agua y tan tranquila',
    cuidados: { luz: [1, 4], riego: 21, dificultad: 1, mascotas: false, purifica: true, tamano: 'mediana' },
    descripcion: 'Vertical, gráfica y casi indestructible. Vale para el dormitorio, el pasillo o una terraza con sol. Su único enemigo es el exceso de agua.',
    consejo: 'En invierno, riega una vez al mes como mucho.'
  },
  {
    id: 'zamioculca', nombre: 'Zamioculca', comun: 'Planta ZZ', categoria: 'medianas', imagen: 'img/zamioculca.webp',
    tamanos: [{ id: 'M', nombre: 'Mediana · 55 cm', precio: 27.9 }, { id: 'L', nombre: 'Grande · 80 cm', precio: 44.9 }],
    nuevo: true, antes: null, lema: 'Hojas de charol para la oficina',
    cuidados: { luz: [1, 3], riego: 18, dificultad: 1, mascotas: false, purifica: true, tamano: 'mediana' },
    descripcion: 'Guarda agua en sus raíces, así que aguanta vacaciones, despachos sin ventana y despistes. Sus hojas brillan como si las hubieras pulido.',
    consejo: 'Si las hojas amarillean, estás regando demasiado: espera a que la tierra esté seca del todo.'
  },
  {
    id: 'ficus', nombre: 'Ficus lyrata', comun: 'Ficus hoja de violín', categoria: 'grandes', imagen: 'img/ficus.webp',
    tamanos: [{ id: 'L', nombre: 'Árbol · 120 cm', precio: 64.9 }],
    nuevo: false, antes: 74.9, lema: 'Un árbol de interior con presencia',
    cuidados: { luz: [3, 4], riego: 7, dificultad: 3, mascotas: false, purifica: true, tamano: 'grande' },
    descripcion: 'Hojas enormes con forma de violín en un tronco fino. Necesita mucha luz y que no la cambies de sitio: cuando encuentra su rincón, crece sin parar.',
    consejo: 'Gírala un cuarto de vuelta cada mes para que crezca recta hacia la luz.'
  },
  {
    id: 'calathea', nombre: 'Calathea orbifolia', comun: 'Calathea', categoria: 'medianas', imagen: 'img/calathea.webp',
    tamanos: [{ id: 'M', nombre: 'Mediana · 50 cm', precio: 29.9 }],
    nuevo: true, antes: null, lema: 'Hojas rayadas que se cierran de noche',
    cuidados: { luz: [2, 3], riego: 5, dificultad: 3, mascotas: true, purifica: false, tamano: 'mediana' },
    descripcion: 'Sus hojas redondas con rayas plateadas se mueven a lo largo del día y se pliegan al anochecer. Le gusta la humedad, como un baño con ventana.',
    consejo: 'Riégala con agua sin cal (filtrada o de lluvia) para que no se le quemen los bordes.'
  },
  {
    id: 'pilea', nombre: 'Pilea peperomioides', comun: 'Planta del dinero china', categoria: 'medianas', imagen: 'img/pilea.webp',
    tamanos: [{ id: 'S', nombre: 'Pequeña · 20 cm', precio: 16.9 }],
    nuevo: false, antes: null, lema: 'Hojas como monedas, hijos para regalar',
    cuidados: { luz: [2, 3], riego: 7, dificultad: 2, mascotas: true, purifica: false, tamano: 'pequena' },
    descripcion: 'Pequeña, redonda y muy simpática. Echa hijuelos que puedes separar y regalar a tus amigos. Segura para perros y gatos.',
    consejo: 'Sepárale los hijuelos cuando midan unos 5 cm, con un poco de raíz.'
  },
  {
    id: 'helecho', nombre: 'Helecho de Boston', comun: 'Helecho', categoria: 'medianas', imagen: 'img/helecho.webp',
    tamanos: [{ id: 'M', nombre: 'Mediano · 40 cm', precio: 19.9 }],
    nuevo: false, antes: null, lema: 'Frondoso, verde y seguro para mascotas',
    cuidados: { luz: [2, 3], riego: 4, dificultad: 2, mascotas: true, purifica: true, tamano: 'mediana' },
    descripcion: 'Una cascada de frondas verdes que llena cualquier rincón. Le encanta la humedad y es una de las mejores plantas para purificar el aire.',
    consejo: 'Pulverízalo un par de veces por semana en verano.'
  },
  {
    id: 'kentia', nombre: 'Kentia', comun: 'Palmera de salón', categoria: 'grandes', imagen: 'img/kentia.webp',
    tamanos: [{ id: 'L', nombre: 'Grande · 150 cm', precio: 79.9 }],
    nuevo: false, antes: null, lema: 'La palmera elegante que tolera la sombra',
    cuidados: { luz: [1, 3], riego: 10, dificultad: 1, mascotas: true, purifica: true, tamano: 'grande' },
    descripcion: 'La palmera clásica de los salones con techos altos. Aguanta rincones con poca luz, crece despacio y es segura para perros y gatos.',
    consejo: 'Dúchala de vez en cuando para quitarle el polvo de las hojas.'
  },
  {
    id: 'orquidea', nombre: 'Orquídea blanca', comun: 'Phalaenopsis', categoria: 'flor', imagen: 'img/orquidea.webp',
    tamanos: [{ id: 'M', nombre: 'Dos varas · 55 cm', precio: 24.9 }],
    nuevo: false, antes: null, lema: 'Tres meses de flor con muy poco',
    cuidados: { luz: [2, 3], riego: 10, dificultad: 2, mascotas: true, purifica: false, tamano: 'pequena' },
    descripcion: 'Flores blancas que duran hasta tres meses. Se riega por inmersión: diez minutos en agua cada diez días y listo.',
    consejo: 'Cuando acabe la flor, corta la vara por encima del segundo nudo y volverá a florecer.'
  },
  {
    id: 'suculentas', nombre: 'Trío de suculentas', comun: 'Echeveria, haworthia y cactus', categoria: 'flor', imagen: 'img/suculentas.webp',
    tamanos: [{ id: 'S', nombre: 'Tres macetas de 8 cm', precio: 18.9 }],
    nuevo: true, antes: null, lema: 'Para la ventana con más sol de la casa',
    cuidados: { luz: [3, 4], riego: 14, dificultad: 1, mascotas: false, purifica: false, tamano: 'pequena' },
    descripcion: 'Tres pequeñas que adoran el sol y odian el exceso de agua. Perfectas para el alféizar de la cocina o un escritorio junto a la ventana.',
    consejo: 'Riega solo cuando la tierra esté seca del todo, y nunca encima de las hojas.'
  },
  {
    id: 'kit', nombre: 'Kit de cuidado', comun: 'Regadera, abono y pulverizador', categoria: 'cuidado', imagen: 'img/kit.webp',
    tamanos: [{ id: 'U', nombre: 'Kit completo', precio: 32.9 }],
    nuevo: false, antes: 39.9, lema: 'Todo lo que necesitas para empezar', sinMaceta: true,
    cuidados: null,
    descripcion: 'Regadera de latón de 1 litro con boca fina, abono orgánico líquido para seis meses y pulverizador de cristal para las plantas que piden humedad.',
    consejo: 'Abona una vez al mes de marzo a septiembre; en invierno, nada.'
  }
];

export const buscar = (id) => PRODUCTOS.find((p) => p.id === id);
export const desde = (p) => Math.min(...p.tamanos.map((t) => t.precio));
export const euros = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

/* ---------- Recomendador ---------- */
// respuestas: { luz: 1-4, riego: 4|8|18, mascotas: bool, espacio: 'pequena'|'mediana'|'grande', experiencia: 1-3 }
export function puntuar(p, r) {
  const c = p.cuidados;
  if (!c) return null;
  const motivos = [];
  const avisos = [];
  let puntos = 100;
  // Luz
  if (r.luz >= c.luz[0] && r.luz <= c.luz[1]) motivos.push(`Le va bien la ${LUZ[r.luz].toLowerCase()} de ese rincón`);
  else { const d = r.luz < c.luz[0] ? c.luz[0] - r.luz : r.luz - c.luz[1]; puntos -= d * 30; avisos.push(r.luz < c.luz[0] ? 'Le falta luz en ese sitio' : 'Ese sitio tiene demasiado sol para ella'); }
  // Riego: comparamos cada cuántos días riegas con lo que pide la planta
  const ratio = Math.log2(r.riego / c.riego);
  puntos -= Math.min(Math.abs(ratio) * 16, 40);
  if (Math.abs(ratio) < 0.6) motivos.push(c.riego >= 14 ? `Aguanta ${c.riego >= 18 ? 'tres semanas' : 'dos semanas'} sin agua, como tú` : `Pide agua cada ${c.riego} días, a tu ritmo`);
  else if (ratio > 0) avisos.push('Pide más riego del que sueles dar');
  else avisos.push('Riegas más de lo que ella necesita');
  // Mascotas
  if (r.mascotas) {
    if (c.mascotas) motivos.push('Segura para perros y gatos');
    else { puntos -= 60; avisos.push('No es apta para mascotas'); }
  }
  // Espacio
  const orden = { pequena: 0, mediana: 1, grande: 2 };
  const dEsp = Math.abs(orden[r.espacio] - orden[c.tamano]);
  puntos -= dEsp * 12;
  if (dEsp === 0) motivos.push(r.espacio === 'grande' ? 'Llena ese espacio ella sola' : r.espacio === 'pequena' ? 'Cabe en una balda o una mesa' : 'Tamaño perfecto para el suelo o un rincón');
  // Experiencia
  if (c.dificultad > r.experiencia) { puntos -= (c.dificultad - r.experiencia) * 14; avisos.push('Es algo delicada para empezar'); }
  else if (c.dificultad === 1) motivos.push('Muy fácil de cuidar');
  return { producto: p, puntos: Math.max(0, Math.min(99, Math.round(puntos))), motivos: motivos.slice(0, 3), avisos: avisos.slice(0, 2) };
}

export function recomendar(r) {
  return PRODUCTOS.filter((p) => p.cuidados && (!r.mascotas || p.cuidados.mascotas)).map((p) => puntuar(p, r)).sort((a, b) => b.puntos - a.puntos);
}

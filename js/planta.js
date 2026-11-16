// Ilustraciones dibujadas por código: la planta que crece con el recomendador y la habitación del simulador de luz.

const HOJAS = [
  // x, y (base de la hoja sobre el tallo), ángulo, tamaño, tallo al que pertenece
  { x: 150, y: 268, a: -150, s: 0.85 },
  { x: 150, y: 262, a: -30, s: 0.9 },
  { x: 141, y: 222, a: -160, s: 1.05 },
  { x: 160, y: 206, a: -20, s: 1.1 },
  { x: 136, y: 168, a: -145, s: 1.15 },
  { x: 163, y: 150, a: -35, s: 1.2 },
  { x: 141, y: 112, a: -120, s: 1.05 },
  { x: 156, y: 92, a: -60, s: 0.95 },
  { x: 150, y: 70, a: -88, s: 0.8 }
];

function hoja(h, i) {
  // Hoja acorazonada con nervio central y dos cortes, al estilo de una monstera joven.
  return `<g transform="translate(${h.x} ${h.y}) rotate(${h.a}) scale(${h.s})">
    <g class="hoja" style="--i:${i}">
      <path class="hoja__peciolo" d="M0 0 L14 0"/>
      <path class="hoja__limbo" d="M14 0 C 22 -26, 58 -34, 78 -12 C 86 -4, 88 2, 92 0 C 88 4, 86 10, 78 14 C 58 34, 22 28, 14 0 Z"/>
      <path class="hoja__corte" d="M40 -24 L 48 -10 M58 -24 L 62 -10 M40 22 L 48 9 M58 22 L 62 9"/>
      <path class="hoja__nervio" d="M14 0 C 40 -1, 64 -1, 90 0"/>
    </g>
  </g>`;
}

export function plantaSVG() {
  return `<svg class="planta-svg" viewBox="0 0 300 400" aria-hidden="true">
    <defs>
      <linearGradient id="pl-maceta" x1="0" x2="1"><stop offset="0" stop-color="#a94f2c"/><stop offset=".45" stop-color="#d07a4f"/><stop offset="1" stop-color="#9b4627"/></linearGradient>
      <linearGradient id="pl-hoja" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8a5b"/><stop offset="1" stop-color="#1f5a36"/></linearGradient>
    </defs>
    <ellipse cx="150" cy="384" rx="88" ry="10" fill="rgba(0,0,0,.18)"/>
    <path class="tallo" pathLength="1" d="M150 300 C 150 250, 138 220, 142 190 C 146 160, 158 140, 154 110 C 151 90, 150 80, 150 66"/>
    ${HOJAS.map(hoja).join('')}
    <path d="M86 296 H214 L200 380 Q198 386 192 386 H108 Q102 386 100 380 Z" fill="url(#pl-maceta)"/>
    <rect x="80" y="288" width="140" height="18" rx="5" fill="#c4673f"/>
    <rect x="80" y="288" width="140" height="5" rx="2.5" fill="rgba(255,255,255,.18)"/>
    <ellipse cx="150" cy="292" rx="60" ry="4" fill="#3a2a1e"/>
  </svg>`;
}

// nivel de 0 a 1: el tallo se dibuja y las hojas brotan por orden.
export function crecer(svg, nivel) {
  if (!svg) return;
  svg.style.setProperty('--crece', nivel);
  const n = Math.round(nivel * HOJAS.length);
  svg.querySelectorAll('.hoja').forEach((h, i) => h.classList.toggle('brota', i < n));
  svg.classList.toggle('florece', nivel >= 1);
}

/* ---------- Simulador de luz ---------- */
export function habitacionSVG() {
  return `<svg class="habitacion" viewBox="0 0 520 260" role="img" aria-label="Habitación con ventana: la maceta se aleja de la ventana al mover el control">
    <defs>
      <linearGradient id="hab-luz" x1="0" x2="1"><stop offset="0" stop-color="#ffe7a3" stop-opacity=".95"/><stop offset="1" stop-color="#ffe7a3" stop-opacity="0"/></linearGradient>
      <radialGradient id="hab-sol"><stop offset="0" stop-color="#ffd76a"/><stop offset="1" stop-color="#ffb84a"/></radialGradient>
    </defs>
    <rect x="0" y="0" width="520" height="260" fill="#efe7d6"/>
    <rect x="0" y="214" width="520" height="46" fill="#d9c4a2"/>
    <g class="hab__cielo"><rect x="14" y="40" width="44" height="130" rx="3" fill="#bfe0f2"/><circle class="hab__sol" cx="36" cy="72" r="13" fill="url(#hab-sol)"/></g>
    <rect x="10" y="36" width="52" height="138" rx="4" fill="none" stroke="#8c6f4e" stroke-width="5"/>
    <line x1="36" y1="38" x2="36" y2="172" stroke="#8c6f4e" stroke-width="3"/>
    <path class="hab__rayo" d="M60 44 L520 150 L520 214 L60 172 Z" fill="url(#hab-luz)"/>
    <g class="hab__regla" font-size="11" fill="#8c7b63" font-family="inherit">
      ${[0, 1, 2, 3, 4, 5].map((m) => `<g transform="translate(${70 + m * 86} 232)"><line y1="-6" y2="0" stroke="#8c7b63"/><text y="16" text-anchor="middle">${m} m</text></g>`).join('')}
    </g>
    <g class="hab__maceta" id="hab-maceta">
      <path d="M-16 0 C -22 -18, -30 -26, -36 -40 M0 0 C 0 -22, 2 -40, 0 -56 M16 0 C 22 -18, 30 -26, 36 -40" stroke="#2f6b43" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="-36" cy="-42" rx="12" ry="7" fill="#3f7d52" transform="rotate(-35 -36 -42)"/>
      <ellipse cx="36" cy="-42" rx="12" ry="7" fill="#3f7d52" transform="rotate(35 36 -42)"/>
      <ellipse cx="0" cy="-60" rx="9" ry="13" fill="#4f8a5b"/>
      <path d="M-22 0 H22 L17 28 H-17 Z" fill="#c4673f"/>
      <rect x="-25" y="-4" width="50" height="8" rx="2" fill="#a9532f"/>
    </g>
  </svg>`;
}

// distancia en metros (0 a 5) y orientación de la ventana → nivel de luz 1 a 4
export function nivelLuz(metros, orientacion) {
  let n = metros <= 0.6 ? 4 : metros <= 1.6 ? 3 : metros <= 3 ? 2 : 1;
  if (orientacion === 'norte') n = Math.max(1, Math.min(n, 3) - 1);
  if (orientacion === 'este' && n === 4) n = 3;
  return n;
}

export function moverMaceta(svg, metros, nivel) {
  if (!svg) return;
  svg.querySelector('#hab-maceta').setAttribute('transform', `translate(${70 + metros * 86} 214) translate(0 -28)`);
  svg.style.setProperty('--luz', [0, 0.25, 0.5, 0.8, 1][nivel]);
}

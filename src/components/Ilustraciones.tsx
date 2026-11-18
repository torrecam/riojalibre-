// Ilustraciones vectoriales propias (sin fotos). Usan las clases de color del tema,
// así que se adaptan solas al modo oscuro (la paleta neutra y de marca se reasigna en .dark).
import type { ReactNode } from "react";

/* ---------- Fondo del hero: colinas, viñedos, malla de puntos y silueta de La Rioja ---------- */

/** Silueta estilizada (no cartográfica) de La Rioja, en un viewBox 0 0 400 250. */
const RIOJA =
  "M18 96 C34 78 52 70 74 72 C92 58 112 60 128 66 C146 50 170 48 190 58 C208 50 228 52 246 60 C268 58 290 70 306 82 C330 86 352 98 372 112 C384 118 392 126 386 136 C370 142 352 150 336 162 C314 172 294 186 270 194 C248 210 222 222 196 226 C170 232 144 224 122 212 C100 204 80 192 62 176 C44 162 30 146 22 128 C16 116 12 104 18 96 Z";
const EBRO = "M24 92 C48 76 70 78 92 70 C120 60 146 58 172 62 C202 66 230 56 258 64 C286 72 312 88 340 98 C358 104 374 114 388 126";
const CIUDADES = [
  { x: 76, y: 82, n: "Haro" },
  { x: 214, y: 80, n: "Logroño", grande: true },
  { x: 318, y: 110, n: "Calahorra" },
  { x: 150, y: 120, n: "Nájera" },
  { x: 364, y: 128, n: "Alfaro" },
];

export function FondoHero() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* base */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_0%,#7a2744_0%,#3d1322_45%,#1c0910_100%)]" />
      {/* blobs */}
      <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] animate-flotar rounded-full bg-[#ab4466]/45 blur-3xl" />
      <div className="absolute top-10 right-[-8rem] h-[24rem] w-[24rem] animate-flotar rounded-full bg-[#5d8a3c]/30 blur-3xl [animation-delay:-3s]" />
      <div className="absolute bottom-[-10rem] left-1/3 h-[22rem] w-[22rem] animate-flotar rounded-full bg-[#dc9bad]/20 blur-3xl [animation-delay:-5s]" />
      {/* malla de puntos */}
      <div className="punteado absolute inset-0 text-white/[0.09] [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_75%)]" />

      {/* sol */}
      <svg className="absolute top-[4%] right-[2%] hidden h-44 w-44 opacity-60 sm:block" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="sol" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#f7c6d4" stopOpacity="0.55" />
            <stop offset="1" stopColor="#f7c6d4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#sol)" />
        <circle cx="50" cy="50" r="16" fill="#f7c6d4" fillOpacity="0.35" />
      </svg>

      {/* silueta de La Rioja (solo escritorio) */}
      <svg className="absolute top-[16%] right-[3%] hidden w-[36rem] max-w-[44vw] lg:block" viewBox="0 0 400 250" fill="none">
        <defs>
          <linearGradient id="mapa" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <path d={RIOJA} fill="url(#mapa)" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" strokeLinejoin="round" />
        <path d={EBRO} stroke="#9cc5e8" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 7" className="animate-fluir" />
        {/* conexiones */}
        <path d="M214 80 L76 82 M214 80 L318 110 M214 80 L150 120 M318 110 L364 128" stroke="#f7c6d4" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 4" />
        {CIUDADES.map((c) => (
          <g key={c.n}>
            <circle cx={c.x} cy={c.y} r={c.grande ? 10 : 7} fill="#f7c6d4" fillOpacity="0.15" className="animate-latido" style={{ transformOrigin: `${c.x}px ${c.y}px`, transformBox: "view-box" }} />
            <circle cx={c.x} cy={c.y} r={c.grande ? 4 : 2.6} fill={c.grande ? "#f7c6d4" : "#cbe5a8"} />
            <text x={c.x + 8} y={c.y - 7} fill="#ffffff" fillOpacity="0.55" fontSize="10" fontWeight="600">{c.n}</text>
          </g>
        ))}
      </svg>

      {/* colinas con viñedos */}
      <svg className="absolute inset-x-0 bottom-0 h-[16%] w-full sm:h-[34%]" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="colina1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8f2f50" stopOpacity="0.55" />
            <stop offset="1" stopColor="#521d31" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="colina2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#48702d" stopOpacity="0.55" />
            <stop offset="1" stopColor="#1f2e15" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="colina3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3d1322" />
            <stop offset="1" stopColor="#1c0910" />
          </linearGradient>
          <pattern id="hileras" width="22" height="400" patternUnits="userSpaceOnUse" patternTransform="skewX(-28)">
            <rect width="3" height="400" fill="#a3c47a" fillOpacity="0.14" />
          </pattern>
          <clipPath id="clipColina2">
            <path d="M0 230 C180 170 330 200 470 220 C640 245 760 160 930 175 C1100 190 1240 250 1440 205 L1440 400 L0 400 Z" />
          </clipPath>
        </defs>
        <g className="animate-deriva">
          <path d="M-80 170 C120 110 260 150 430 140 C620 128 760 60 960 95 C1140 126 1290 90 1520 120 L1520 400 L-80 400 Z" fill="url(#colina1)" />
        </g>
        <path d="M0 230 C180 170 330 200 470 220 C640 245 760 160 930 175 C1100 190 1240 250 1440 205 L1440 400 L0 400 Z" fill="url(#colina2)" />
        <rect width="1440" height="400" fill="url(#hileras)" clipPath="url(#clipColina2)" />
        <path d="M0 300 C220 270 380 320 600 305 C820 290 980 255 1180 280 C1300 295 1380 300 1440 292 L1440 400 L0 400 Z" fill="url(#colina3)" />
        <path d="M0 300 C220 270 380 320 600 305 C820 290 980 255 1180 280 C1300 295 1380 300 1440 292" stroke="#f7c6d4" strokeOpacity="0.18" strokeWidth="2" fill="none" />
      </svg>
      {/* velo para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1c0910]/70 via-[#1c0910]/25 to-transparent" />
    </div>
  );
}

/* ---------- Ilustraciones de los casos de uso (viewBox 0 0 320 180) ---------- */

function Lienzo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 320 180" className={`h-full w-full ${className}`} aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* decoración común: círculos suaves y puntos */}
      <circle cx="56" cy="40" r="46" className="fill-vino-100/70" />
      <circle cx="276" cy="150" r="54" className="fill-vid-100/70" />
      {[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => <circle key={`${i}-${j}`} cx={262 + i * 10} cy={22 + j * 10} r="1.6" className="fill-stone-300" />))}
      <ellipse cx="160" cy="166" rx="92" ry="7" className="fill-stone-900/10" />
      {children}
    </svg>
  );
}

const TRAZO = "stroke-stone-800";

export function IlustLicitaciones() {
  return (
    <Lienzo>
      <g className="transition-transform duration-500 group-hover:-translate-y-1">
        <path d="M104 22 h82 l22 22 v114 a8 8 0 0 1 -8 8 h-96 a8 8 0 0 1 -8 -8 v-128 a8 8 0 0 1 8 -8 z" className={`fill-surface ${TRAZO}`} strokeWidth="3" />
        <path d="M186 22 v16 a6 6 0 0 0 6 6 h16" className={`fill-vino-100 ${TRAZO}`} strokeWidth="3" />
        <rect x="112" y="40" width="44" height="12" rx="6" className="fill-emerald-500/80" />
        <circle cx="120" cy="46" r="2.5" className="fill-surface" />
        {[64, 78, 92, 106].map((y, i) => <rect key={y} x="112" y={y} width={i % 2 ? 58 : 80} height="6" rx="3" className="fill-stone-200" />)}
        <rect x="112" y="128" width="40" height="10" rx="5" className="fill-vino-500" />
      </g>
      <g className="origin-[214px_116px] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
        <circle cx="206" cy="108" r="30" className="fill-vino-100/60 stroke-vino-600" strokeWidth="9" />
        <path d="M184 92 a26 26 0 0 1 18 -10" className="stroke-surface" strokeWidth="4" />
        <path d="M228 130 l24 24" className="stroke-vino-800" strokeWidth="13" />
      </g>
    </Lienzo>
  );
}

export function IlustGanadores() {
  return (
    <Lienzo>
      {/* podio */}
      <rect x="92" y="112" width="46" height="50" rx="6" className="fill-vino-300" />
      <rect x="138" y="88" width="46" height="74" rx="6" className="fill-vino-500" />
      <rect x="184" y="124" width="46" height="38" rx="6" className="fill-vid-400" />
      <text x="115" y="144" textAnchor="middle" className="fill-surface" fontSize="20" fontWeight="800">2</text>
      <text x="161" y="132" textAnchor="middle" className="fill-surface" fontSize="24" fontWeight="800">1</text>
      <text x="207" y="150" textAnchor="middle" className="fill-surface" fontSize="18" fontWeight="800">3</text>
      {/* trofeo */}
      <g className="transition-transform duration-500 group-hover:-translate-y-2">
        <path d="M140 24 h42 v18 a21 21 0 0 1 -42 0 z" className="fill-amber-400 stroke-amber-600" strokeWidth="3" />
        <path d="M140 30 h-10 a10 10 0 0 0 12 16 M182 30 h10 a10 10 0 0 1 -12 16" className="stroke-amber-600" strokeWidth="3" />
        <rect x="156" y="62" width="10" height="10" className="fill-amber-500" />
        <rect x="146" y="72" width="30" height="9" rx="3" className="fill-amber-600" />
        <path d="M152 32 v8" className="stroke-amber-100" strokeWidth="3" />
      </g>
      {/* destellos */}
      {[[116, 40], [208, 34], [222, 70]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 7} v14 M${x - 7} ${y} h14`} className="stroke-amber-400 transition-opacity duration-500 group-hover:opacity-100 sm:opacity-60" strokeWidth="3" />
      ))}
    </Lienzo>
  );
}

export function IlustOrganismo() {
  return (
    <Lienzo>
      <g className="transition-transform duration-500 group-hover:-translate-y-1">
        <path d="M86 66 L160 30 L234 66 Z" className={`fill-vino-500 ${TRAZO}`} strokeWidth="3" />
        <circle cx="160" cy="54" r="6" className="fill-surface" />
        <rect x="90" y="66" width="140" height="10" className={`fill-surface ${TRAZO}`} strokeWidth="3" />
        {[104, 132, 160, 188, 216].map((x) => <rect key={x} x={x - 6} y="80" width="12" height="58" rx="2" className={`fill-surface ${TRAZO}`} strokeWidth="2.5" />)}
        <rect x="82" y="138" width="156" height="10" rx="2" className={`fill-stone-200 ${TRAZO}`} strokeWidth="3" />
        <rect x="74" y="148" width="172" height="10" rx="2" className={`fill-stone-300 ${TRAZO}`} strokeWidth="3" />
      </g>
      {/* campana de aviso */}
      <g className="origin-[250px_40px] group-hover:animate-campana">
        <circle cx="250" cy="44" r="24" className="fill-vid-500" />
        <path d="M240 52 v-9 a10 10 0 0 1 20 0 v9 l3 4 h-26 z" className="fill-surface" />
        <circle cx="250" cy="59" r="3" className="fill-surface" />
        <circle cx="267" cy="28" r="6" className="fill-vino-500 stroke-surface" strokeWidth="2" />
      </g>
      <path d="M276 46 q6 -4 6 -12 M224 46 q-6 -4 -6 -12" className="stroke-vid-500" strokeWidth="2.5" />
    </Lienzo>
  );
}

export function IlustSubvenciones() {
  return (
    <Lienzo>
      {/* monedas apiladas */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx="160" cy={104 - i * 12} rx="34" ry="10" className="fill-amber-500 stroke-amber-700" strokeWidth="2.5" />
          <rect x="126" y={94 - i * 12} width="68" height="10" className="fill-amber-500" />
          <ellipse cx="160" cy={94 - i * 12} rx="34" ry="10" className="fill-amber-300 stroke-amber-700" strokeWidth="2.5" />
        </g>
      ))}
      {/* brote */}
      <path d="M160 48 v-14" className="stroke-vid-600" strokeWidth="3.5" />
      <path d="M160 38 c-14 -2 -20 -12 -18 -20 c10 0 18 8 18 20 z M160 34 c12 -2 18 -12 16 -20 c-10 0 -16 8 -16 20 z" className="fill-vid-400 stroke-vid-600" strokeWidth="2" />
      {/* mano */}
      <path d="M78 128 c22 -6 42 -2 60 4 l32 0 a8 8 0 0 1 0 16 h-28 l40 0 c14 0 30 -12 46 -22 a9 9 0 0 1 12 13 c-18 18 -38 33 -60 33 h-62 c-14 0 -28 4 -40 8 z" className={`fill-vino-300 ${TRAZO}`} strokeWidth="3" />
      <rect x="56" y="122" width="24" height="44" rx="5" className={`fill-vino-600 ${TRAZO}`} strokeWidth="3" />
      {/* moneda cayendo */}
      <g className="transition-transform duration-700 group-hover:translate-y-3">
        <circle cx="226" cy="44" r="16" className="fill-amber-300 stroke-amber-700" strokeWidth="2.5" />
        <text x="226" y="50" textAnchor="middle" className="fill-amber-800" fontSize="16" fontWeight="800">€</text>
      </g>
    </Lienzo>
  );
}

export function IlustMenores() {
  return (
    <Lienzo>
      <g className="origin-[150px_100px] -rotate-3 transition-transform duration-500 group-hover:rotate-0">
        <path d="M108 20 h84 v130 l-10.5 -8 l-10.5 8 l-10.5 -8 l-10.5 8 l-10.5 -8 l-10.5 8 l-10.5 -8 l-10.5 8 z" className={`fill-surface ${TRAZO}`} strokeWidth="3" />
        <rect x="122" y="34" width="56" height="8" rx="4" className="fill-vino-500" />
        {[54, 68, 82, 96].map((y, i) => (
          <g key={y}>
            <rect x="122" y={y} width={[30, 38, 26, 34][i]} height="6" rx="3" className="fill-stone-200" />
            <rect x="164" y={y} width="14" height="6" rx="3" className="fill-stone-300" />
          </g>
        ))}
        <path d="M122 112 h56" className="stroke-stone-300" strokeWidth="2" strokeDasharray="4 4" />
        <rect x="122" y="120" width="24" height="8" rx="4" className="fill-stone-800" />
        <rect x="156" y="118" width="22" height="12" rx="4" className="fill-vino-600" />
      </g>
      {/* sello */}
      <g className="transition-transform duration-500 group-hover:scale-110" style={{ transformOrigin: "224px 112px", transformBox: "view-box" }}>
        <circle cx="224" cy="112" r="26" className="fill-vid-100 stroke-vid-600" strokeWidth="3.5" strokeDasharray="5 4" />
        <path d="M212 112 l8 8 l16 -17" className="stroke-vid-600" strokeWidth="5" />
      </g>
      <circle cx="86" cy="140" r="12" className="fill-amber-300 stroke-amber-700" strokeWidth="2.5" />
      <circle cx="72" cy="128" r="9" className="fill-amber-400 stroke-amber-700" strokeWidth="2.5" />
    </Lienzo>
  );
}

export function IlustEstadisticas() {
  const barras = [46, 70, 56, 92, 78, 112];
  return (
    <Lienzo>
      <rect x="70" y="22" width="180" height="138" rx="12" className={`fill-surface ${TRAZO}`} strokeWidth="3" />
      {[50, 80, 110].map((y) => <path key={y} d={`M86 ${y} h148`} className="stroke-stone-200" strokeWidth="1.5" />)}
      {barras.map((h, i) => (
        <rect key={i} x={88 + i * 24} y={146 - h} width="15" height={h} rx="4"
          className={`${i === barras.length - 1 ? "fill-vino-600" : "fill-vino-300"} origin-bottom transition-transform duration-500 group-hover:scale-y-110`}
          style={{ transformOrigin: `${95 + i * 24}px 146px`, transformBox: "view-box" }} />
      ))}
      <path d="M95 104 L119 86 L143 94 L167 62 L191 72 L215 42" className="stroke-vid-500" strokeWidth="3.5" />
      {[[95, 104], [119, 86], [143, 94], [167, 62], [191, 72], [215, 42]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" className="fill-surface stroke-vid-600" strokeWidth="2.5" />)}
      {/* mini tarta */}
      <g className="transition-transform duration-500 group-hover:rotate-12" style={{ transformOrigin: "266px 52px", transformBox: "view-box" }}>
        <circle cx="266" cy="52" r="20" className="fill-vid-400 stroke-surface" strokeWidth="3" />
        <path d="M266 52 V32 A20 20 0 0 1 285 58 Z" className="fill-vino-500 stroke-surface" strokeWidth="3" />
      </g>
    </Lienzo>
  );
}

/* ---------- Llamada final: ayuntamiento con lupa sobre el mapa ---------- */
export function IlustCTA({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 250" className={className} aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={RIOJA} fill="#ffffff" fillOpacity="0.08" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d={EBRO} stroke="#9cc5e8" strokeOpacity="0.5" strokeWidth="2.5" strokeDasharray="1 7" />
      {/* ayuntamiento */}
      <g transform="translate(150 70)">
        <path d="M0 40 L50 12 L100 40 Z" fill="#f7c6d4" />
        <rect x="42" y="-10" width="16" height="22" fill="#ffffff" fillOpacity="0.9" />
        <path d="M50 -10 v-12 l12 4 l-12 4" stroke="#cbe5a8" strokeWidth="2.5" fill="#cbe5a8" />
        <rect x="6" y="40" width="88" height="56" fill="#ffffff" fillOpacity="0.92" />
        {[18, 38, 58, 78].map((x) => <rect key={x} x={x - 4} y="50" width="8" height="18" rx="4" fill="#772541" fillOpacity="0.7" />)}
        <rect x="40" y="72" width="20" height="24" rx="10" fill="#521d31" />
        <rect x="0" y="96" width="100" height="8" rx="2" fill="#f7c6d4" />
      </g>
      {/* lupa */}
      <g className="animate-flotar">
        <circle cx="288" cy="96" r="30" fill="#ffffff" fillOpacity="0.15" stroke="#ffffff" strokeWidth="8" />
        <path d="M310 118 l26 26" stroke="#ffffff" strokeWidth="12" />
      </g>
      {/* pines */}
      {[[76, 82], [318, 110], [364, 128]].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x} ${y} c-8 -10 -10 -14 -10 -18 a10 10 0 0 1 20 0 c0 4 -2 8 -10 18 z`} fill="#cbe5a8" />
          <circle cx={x} cy={y - 18} r="3.5" fill="#385726" />
        </g>
      ))}
    </svg>
  );
}

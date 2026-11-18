import Link from "next/link";
import { eurosCompacto, numero } from "@/lib/format";

/** Barras horizontales con etiqueta y valor. */
export function BarrasH({ datos, formato = "numero", max }: { datos: { etiqueta: string; valor: number; href?: string; extra?: string }[]; formato?: "numero" | "euros"; max?: number }) {
  const m = max ?? Math.max(1, ...datos.map((d) => d.valor));
  const fmt = (v: number) => (formato === "euros" ? eurosCompacto(v) : numero(v));
  return (
    <ul className="space-y-2.5">
      {datos.map((d, i) => (
        <li key={`${d.etiqueta}-${i}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {d.href ? (
              <Link href={d.href} className="min-w-0 truncate text-stone-700 hover:text-vino-700" title={d.etiqueta}>{d.etiqueta}</Link>
            ) : (
              <span className="min-w-0 truncate text-stone-700" title={d.etiqueta}>{d.etiqueta}</span>
            )}
            <span className="shrink-0 font-medium text-stone-900 tabular-nums">
              {fmt(d.valor)}
              {d.extra && <span className="ml-1.5 text-xs font-normal text-stone-500">{d.extra}</span>}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-gradient-to-r from-vino-400 to-vino-700 transition-[width] duration-700" style={{ width: `${Math.max(0.5, (d.valor / m) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Columnas (recuento) + línea (importe) por año, en SVG puro (sin JS en cliente). */
export function ColumnasLinea({ datos, etiquetaBarras = "Nº", etiquetaLinea = "Importe" }: { datos: { x: string | number; barras: number; linea: number }[]; etiquetaBarras?: string; etiquetaLinea?: string }) {
  if (!datos.length) return <p className="p-6 text-sm text-stone-500">Sin datos.</p>;
  const W = 760;
  const H = 260;
  const pad = { l: 44, r: 64, t: 16, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const maxB = Math.max(1, ...datos.map((d) => d.barras));
  const maxL = Math.max(1, ...datos.map((d) => d.linea));
  const bw = iw / datos.length;
  const pts = datos.map((d, i) => [pad.l + bw * i + bw / 2, pad.t + ih - (d.linea / maxL) * ih] as const);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${etiquetaBarras} y ${etiquetaLinea} por año`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih - t * ih} y2={pad.t + ih - t * ih} className="stroke-stone-100" />
            <text x={pad.l - 6} y={pad.t + ih - t * ih + 4} textAnchor="end" className="fill-stone-400 text-[10px]">{numero(Math.round(maxB * t))}</text>
            <text x={W - pad.r + 6} y={pad.t + ih - t * ih + 4} className="fill-stone-400 text-[10px]">{eurosCompacto(maxL * t)}</text>
          </g>
        ))}
        {datos.map((d, i) => {
          const h = (d.barras / maxB) * ih;
          return (
            <g key={String(d.x)}>
              <rect x={pad.l + bw * i + bw * 0.15} y={pad.t + ih - h} width={bw * 0.7} height={h} rx={3} className="fill-vino-300/70 transition-colors hover:fill-vino-500">
                <title>{`${d.x}: ${numero(d.barras)} · ${eurosCompacto(d.linea)}`}</title>
              </rect>
              <text x={pad.l + bw * i + bw / 2} y={H - 8} textAnchor="middle" className="fill-stone-500 text-[10px]">
                {datos.length > 14 ? `'${String(d.x).slice(-2)}` : d.x}
              </text>
            </g>
          );
        })}
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" className="stroke-vid-600" strokeWidth={2.5} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={3.5} className="fill-white stroke-vid-600" strokeWidth={2} />
        ))}
      </svg>
      <figcaption className="mt-2 flex gap-5 text-xs text-stone-500">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-vino-200" /> {etiquetaBarras}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-vid-600" /> {etiquetaLinea}</span>
      </figcaption>
    </figure>
  );
}

/** Donut simple por categorías. */
export function Donut({ datos }: { datos: { etiqueta: string; valor: number }[] }) {
  const total = datos.reduce((a, d) => a + d.valor, 0) || 1;
  const colores = ["#772541", "#ab4466", "#dc9bad", "#5d8a3c", "#a3c47a", "#78716c", "#d6d3d1", "#f59e0b"];
  const R = 60;
  const offsets = datos.map((_, i) => datos.slice(0, i).reduce((a, d) => a + d.valor / total, 0));
  const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0 -rotate-90">
        {datos.map((d, i) => {
          const frac = d.valor / total;
          return (
            <circle key={d.etiqueta} cx="80" cy="80" r={R} fill="none" stroke={colores[i % colores.length]} strokeWidth="26"
              strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-offsets[i] * C}>
              <title>{`${d.etiqueta}: ${numero(d.valor)}`}</title>
            </circle>
          );
        })}
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {datos.map((d, i) => (
          <li key={d.etiqueta} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colores[i % colores.length] }} />
              <span className="truncate text-stone-700">{d.etiqueta}</span>
            </span>
            <span className="shrink-0 text-stone-900 tabular-nums">
              {numero(d.valor)} <span className="text-xs text-stone-500">({((d.valor / total) * 100).toLocaleString("es-ES", { maximumFractionDigits: d.valor / total < 0.01 ? 1 : 0 })} %)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

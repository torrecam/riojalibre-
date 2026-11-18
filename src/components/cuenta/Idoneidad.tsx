import { Check, Minus, X } from "lucide-react";
import type { Motivo } from "@/lib/queries/usuario";

export function tono(p: number) {
  return p >= 70 ? "alta" : p >= 45 ? "media" : "baja";
}

const COLORES = {
  alta: { aro: "var(--color-vid-500)", fondo: "bg-vid-50 text-vid-700 ring-vid-300/60", texto: "Encaja muy bien" },
  media: { aro: "#d89b2b", fondo: "bg-amber-50 text-amber-800 ring-amber-300/60 dark:bg-amber-950/40 dark:text-amber-300", texto: "Encaje parcial" },
  baja: { aro: "var(--color-stone-400)", fondo: "bg-stone-100 text-stone-600 ring-stone-300/60", texto: "Poco encaje" },
};

/** Insignia compacta con la puntuación de idoneidad. */
export function Insignia({ p, className = "" }: { p: number; className?: string }) {
  const c = COLORES[tono(p)];
  return (
    <span title={`Idoneidad ${p}/100 · ${c.texto}`} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ${c.fondo} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.aro }} aria-hidden />
      {p}
    </span>
  );
}

/** Anillo grande con la puntuación. */
export function Anillo({ p, tam = 88 }: { p: number; tam?: number }) {
  const c = COLORES[tono(p)];
  const r = 40, l = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-stone-200" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={c.aro} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(l * p) / 100} ${l}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-[family-name:var(--font-display)] text-2xl leading-none font-extrabold text-stone-900 tabular-nums">{p}</div>
          <div className="text-[10px] font-semibold tracking-wide text-stone-500 uppercase">/ 100</div>
        </div>
      </div>
    </div>
  );
}

export function textoTono(p: number) {
  return COLORES[tono(p)].texto;
}

/** «Por qué encaja / por qué no». */
export function Desglose({ positivos, negativos, compacto = false }: { positivos: Motivo[]; negativos: Motivo[]; compacto?: boolean }) {
  return (
    <div className={`grid gap-4 ${compacto ? "" : "sm:grid-cols-2"}`}>
      <div>
        <div className="mb-2 text-xs font-semibold tracking-wider text-vid-700 uppercase">Por qué encaja</div>
        {positivos.length === 0 ? <p className="text-sm text-stone-500">Ningún criterio a favor.</p> : (
          <ul className="space-y-1.5">
            {positivos.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-vid-600" />
                <span className="min-w-0 flex-1 text-stone-700"><b className="font-semibold">{m.criterio}</b> · {m.texto}</span>
                <span className="shrink-0 text-xs font-semibold text-vid-700 tabular-nums">+{m.puntos}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold tracking-wider text-vino-700 uppercase">Por qué no</div>
        {negativos.length === 0 ? <p className="text-sm text-stone-500">Nada en contra.</p> : (
          <ul className="space-y-1.5">
            {negativos.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {m.puntos < 0 ? <X className="mt-0.5 h-4 w-4 shrink-0 text-vino-600" /> : <Minus className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />}
                <span className="min-w-0 flex-1 text-stone-700"><b className="font-semibold">{m.criterio}</b> · {m.texto}</span>
                <span className={`shrink-0 text-xs font-semibold tabular-nums ${m.puntos < 0 ? "text-vino-700" : "text-stone-400"}`}>{m.puntos < 0 ? m.puntos : m.puntos > 0 ? `+${m.puntos}` : "0"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

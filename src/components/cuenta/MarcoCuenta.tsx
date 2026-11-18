import type { ReactNode } from "react";
import { Bell, ClipboardCheck, KanbanSquare, Sparkles } from "lucide-react";
import { IlustCTA } from "@/components/Ilustraciones";

const VENTAJAS = [
  { i: Sparkles, t: "Idoneidad 0–100", d: "Cada licitación puntuada según tu perfil, con el porqué." },
  { i: KanbanSquare, t: "Tablero de seguimiento", d: "De «me interesa» a «ganada», sin hojas de cálculo." },
  { i: ClipboardCheck, t: "Checklist y plazos", d: "DEUC, solvencia, garantías y sobres bajo control." },
  { i: Bell, t: "Alertas", d: "Elige la frecuencia y el umbral de idoneidad." },
];

export function MarcoCuenta({ titulo, subtitulo, children, pie }: { titulo: string; subtitulo?: ReactNode; children: ReactNode; pie?: ReactNode }) {
  return (
    <div className="fondo-aurora relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="punteado pointer-events-none absolute inset-0 text-stone-300/40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:py-16">
        <aside className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-vino-700 via-vino-800 to-vino-950 p-8 text-white shadow-2xl shadow-vino-900/30 lg:block">
          <IlustCTA className="pointer-events-none absolute -right-10 -bottom-6 w-[26rem] opacity-60" />
          <p className="text-xs font-semibold tracking-widest text-white/60 uppercase">Tu cuenta gratuita</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">Encuentra las licitaciones que de verdad te encajan</h2>
          <ul className="relative mt-8 space-y-4">
            {VENTAJAS.map((v) => (
              <li key={v.t} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-white/20"><v.i className="h-4 w-4" /></span>
                <div><div className="font-semibold">{v.t}</div><div className="text-sm text-white/70">{v.d}</div></div>
              </li>
            ))}
          </ul>
        </aside>
        <div className="card animate-entrar p-6 sm:p-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">{titulo}</h1>
          {subtitulo && <div className="mt-1.5 text-sm text-stone-500">{subtitulo}</div>}
          <div className="mt-6">{children}</div>
          {pie && <div className="mt-6 border-t border-stone-100 pt-5 text-center text-sm text-stone-500">{pie}</div>}
        </div>
      </div>
    </div>
  );
}

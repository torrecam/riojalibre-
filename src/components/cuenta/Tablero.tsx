"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckSquare, GripVertical } from "lucide-react";
import { accEstado } from "@/app/mi/acciones";
import type { EstadoSeg } from "@/lib/queries/usuario";
import { ESTADOS_UI, ESTADO_UI } from "./estados";

export type Tarjeta = {
  id: string; licitacion_id: string; estado: EstadoSeg; objeto: string; organismo: string | null;
  importe: string; plazo: string; urgente: boolean; hechos: number; total: number; puntuacion: number | null; motivo: string | null;
};

const PRINCIPALES: EstadoSeg[] = ["interesa", "preparando", "presentada", "ganada", "perdida"];
const ARCHIVO: EstadoSeg[] = ["descartada", "desierta"];

export function Tablero({ tarjetas }: { tarjetas: Tarjeta[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [lista, mover] = useOptimistic(tarjetas, (l: Tarjeta[], m: { id: string; estado: EstadoSeg }) => l.map((t) => (t.id === m.id ? { ...t, estado: m.estado } : t)));
  const [sobre, setSobre] = useState<EstadoSeg | null>(null);
  const [descartar, setDescartar] = useState<{ id: string; motivo: string } | null>(null);

  const cambiar = (id: string, estado: EstadoSeg, motivo?: string) => {
    if (estado === "descartada" && motivo === undefined) return setDescartar({ id, motivo: "" });
    start(async () => {
      mover({ id, estado });
      await accEstado(id, estado, motivo);
      router.refresh();
    });
  };

  return (
    <>
      {[PRINCIPALES, ARCHIVO].map((grupo, gi) => (
      <div key={gi} className={`grid grid-cols-1 gap-4 ${gi === 0 ? "md:grid-cols-3 xl:grid-cols-5" : "mt-4 md:grid-cols-2"}`}>
        {grupo.map((col) => {
          const e = ESTADO_UI[col];
          const items = lista.filter((t) => t.estado === col);
          return (
            <section
              key={col}
              aria-label={e.t}
              onDragOver={(ev) => { ev.preventDefault(); setSobre(col); }}
              onDragLeave={() => setSobre((s) => (s === col ? null : s))}
              onDrop={(ev) => { ev.preventDefault(); setSobre(null); const id = ev.dataTransfer.getData("text/plain"); const t = lista.find((x) => x.id === id); if (t && t.estado !== col) cambiar(id, col); }}
              className={`flex min-w-0 flex-col rounded-2xl border p-3 transition ${sobre === col ? "border-vino-400 bg-vino-50/60" : "border-stone-200/80 bg-stone-50/70"}`}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-sm font-bold text-stone-800">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.punto }} /> {e.t}
                </h2>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-stone-500 tabular-nums ring-1 ring-stone-200">{items.length}</span>
              </header>
              <div className="flex min-h-16 flex-col gap-2.5">
                {items.length === 0 && <p className="rounded-xl border border-dashed border-stone-300 px-3 py-4 text-center text-xs text-stone-400"><span className="md:hidden">Sin tarjetas</span><span className="hidden md:inline">Arrastra aquí</span></p>}
                {items.map((t) => (
                  <article
                    key={t.id}
                    draggable
                    onDragStart={(ev) => { ev.dataTransfer.setData("text/plain", t.id); ev.dataTransfer.effectAllowed = "move"; }}
                    className="group card cursor-grab p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 hidden h-4 w-4 shrink-0 text-stone-300 md:block" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <Link href={`/mi/licitaciones/${t.licitacion_id}`} className="line-clamp-3 text-sm font-semibold text-stone-900 hover:text-vino-700">{t.objeto}</Link>
                        <div className="mt-1 truncate text-xs text-stone-500">{t.organismo}</div>
                      </div>
                      {t.puntuacion !== null && <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[11px] font-bold text-stone-600 tabular-nums" title="Idoneidad al empezar a seguirla">{t.puntuacion}</span>}
                    </div>
                    {t.motivo && <p className="mt-2 rounded-lg bg-vino-50 px-2 py-1 text-xs text-vino-800">Motivo: {t.motivo}</p>}
                    <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-stone-700">{t.importe}</span>
                      <span className={`flex items-center gap-1 ${t.urgente ? "font-semibold text-vino-700" : ""}`}><CalendarClock className="h-3.5 w-3.5" />{t.plazo}</span>
                      {t.total > 0 && <span className="flex items-center gap-1"><CheckSquare className="h-3.5 w-3.5" />{t.hechos}/{t.total}</span>}
                    </div>
                    <label className="mt-2.5 block md:hidden">
                      <span className="sr-only">Mover a</span>
                      <select className="input w-full py-1.5 text-sm" value={t.estado} onChange={(ev) => cambiar(t.id, ev.target.value as EstadoSeg)}>
                        {ESTADOS_UI.map((x) => <option key={x.v} value={x.v}>{x.t}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      ))}
      {descartar && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal aria-label="Motivo del descarte">
          <form className="card w-full max-w-md p-5" onSubmit={(ev) => { ev.preventDefault(); const d = descartar; setDescartar(null); cambiar(d.id, "descartada", d.motivo || "Sin motivo"); }}>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">¿Por qué la descartas?</h3>
            <p className="mt-1 text-sm text-stone-500">Te ayudará a afinar el perfil y a no repetir errores.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["No es nuestro sector", "Importe fuera de rango", "Sin solvencia suficiente", "Plazo demasiado corto", "Pliegos poco favorables"].map((m) => (
                <button key={m} type="button" className={`chip ${descartar.motivo === m ? "!bg-vino-700 !text-white" : ""}`} onClick={() => setDescartar({ ...descartar, motivo: m })}>{m}</button>
              ))}
            </div>
            <input className="input mt-3 w-full" placeholder="U otro motivo…" value={descartar.motivo} onChange={(ev) => setDescartar({ ...descartar, motivo: ev.target.value })} maxLength={300} />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn btn-secundario" onClick={() => setDescartar(null)}>Cancelar</button>
              <button className="btn btn-primario">Descartar</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

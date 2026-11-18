"use client";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { accTareaBorrar, accTareaMarcar, accTareaNueva } from "@/app/mi/acciones";
import type { Tarea } from "@/lib/queries/usuario";

type Op = { t: "marcar"; id: string; hecho: boolean } | { t: "borrar"; id: string } | { t: "nueva"; texto: string };

export function Checklist({ segId, tareas }: { segId: string; tareas: Tarea[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [texto, setTexto] = useState("");
  const [lista, aplicar] = useOptimistic(tareas, (l: Tarea[], o: Op) =>
    o.t === "marcar" ? l.map((x) => (x.id === o.id ? { ...x, hecho: o.hecho } : x))
      : o.t === "borrar" ? l.filter((x) => x.id !== o.id)
        : [...l, { id: "tmp-" + l.length, texto: o.texto, hecho: false, orden: 999 }]);
  const hechos = lista.filter((x) => x.hecho).length;
  const run = (o: Op, fn: () => Promise<unknown>) => start(async () => { aplicar(o); await fn(); router.refresh(); });

  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-vid-500 transition-all" style={{ width: `${lista.length ? (hechos / lista.length) * 100 : 0}%` }} />
        </div>
        <span className="text-xs font-semibold text-stone-500 tabular-nums">{hechos}/{lista.length}</span>
      </div>
      <ul className="space-y-1">
        {lista.map((x) => (
          <li key={x.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-50">
            <input type="checkbox" checked={x.hecho} className="h-4 w-4 accent-[var(--color-vid-600)]" aria-label={x.texto}
              onChange={(e) => run({ t: "marcar", id: x.id, hecho: e.target.checked }, () => accTareaMarcar(x.id, e.target.checked))} />
            <span className={`flex-1 text-sm ${x.hecho ? "text-stone-400 line-through" : "text-stone-800"}`}>{x.texto}</span>
            <button type="button" aria-label={`Eliminar ${x.texto}`} className="grid h-7 w-7 place-items-center rounded-lg text-stone-400 opacity-100 hover:bg-vino-50 hover:text-vino-700 sm:opacity-0 sm:group-hover:opacity-100"
              onClick={() => run({ t: "borrar", id: x.id }, () => accTareaBorrar(x.id))}><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = texto.trim(); if (!t) return; setTexto(""); run({ t: "nueva", texto: t }, () => accTareaNueva(segId, t)); }}>
        <input className="input min-w-0 flex-1 py-1.5 text-sm" placeholder="Añadir tarea (p. ej., visita de obra)" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} />
        <button className="btn btn-secundario py-1.5 text-sm" aria-label="Añadir tarea"><Plus className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

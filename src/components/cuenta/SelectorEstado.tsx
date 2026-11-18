"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Loader2, X } from "lucide-react";
import { accEstado, accSeguir } from "@/app/mi/acciones";
import type { EstadoSeg } from "@/lib/queries/usuario";
import { ESTADOS_UI } from "./estados";

/** Cambia el estado de un seguimiento (o lo crea). Pide motivo al descartar. */
export function SelectorEstado({ licitacionId, segId, estado, compacto = false, className = "" }: { licitacionId: string; segId?: string | null; estado?: EstadoSeg | null; compacto?: boolean; className?: string }) {
  const [pend, start] = useTransition();
  const [pidiendo, setPidiendo] = useState<EstadoSeg | null>(null);
  const [motivo, setMotivo] = useState("");
  const router = useRouter();

  const aplicar = (e: EstadoSeg, m?: string) =>
    start(async () => {
      if (segId) await accEstado(segId, e, m);
      else {
        await accSeguir(licitacionId, e, m);
      }
      setPidiendo(null);
      setMotivo("");
      router.refresh();
    });

  const elegir = (e: EstadoSeg) => (e === "descartada" ? setPidiendo(e) : aplicar(e));

  if (pidiendo)
    return (
      <form className={`flex flex-wrap items-center gap-2 ${className}`} onSubmit={(ev) => { ev.preventDefault(); aplicar("descartada", motivo); }}>
        <input autoFocus className="input min-w-0 flex-1 py-1.5 text-sm" placeholder="Motivo (p. ej., sin solvencia, plazo corto…)" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} list="motivos-descarte" />
        <datalist id="motivos-descarte">
          {["No es nuestro sector", "Importe fuera de rango", "Sin solvencia suficiente", "Plazo demasiado corto", "Pliegos poco favorables", "Ya vamos en UTE con otro"].map((m) => <option key={m} value={m} />)}
        </datalist>
        <button className="btn btn-primario py-1.5 text-sm" disabled={pend}>{pend ? <Loader2 className="h-4 w-4 animate-spin" /> : "Descartar"}</button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-100" onClick={() => setPidiendo(null)} aria-label="Cancelar"><X className="h-4 w-4" /></button>
      </form>
    );

  if (!segId && compacto)
    return (
      <button type="button" disabled={pend} onClick={() => aplicar("interesa")} className={`btn btn-secundario py-1.5 text-sm ${className}`}>
        {pend ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />} Me interesa
      </button>
    );

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">Estado del seguimiento</span>
      <select
        className="input cursor-pointer py-1.5 pr-8 text-sm font-medium"
        value={estado ?? ""}
        disabled={pend}
        onChange={(e) => e.target.value && elegir(e.target.value as EstadoSeg)}
      >
        {!segId && <option value="">Seguir esta licitación…</option>}
        {ESTADOS_UI.map((e) => <option key={e.v} value={e.v}>{e.t}</option>)}
      </select>
      {pend && <Loader2 className="pointer-events-none absolute right-8 h-4 w-4 animate-spin text-stone-400" />}
    </label>
  );
}

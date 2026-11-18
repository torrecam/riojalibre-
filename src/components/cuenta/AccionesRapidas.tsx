"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Check, Loader2, ThumbsDown, X } from "lucide-react";
import { accSeguir } from "@/app/mi/acciones";

const MOTIVOS = ["No es nuestro sector", "Importe fuera de rango", "Sin solvencia suficiente", "Plazo demasiado corto", "Zona lejana"];

/** «Me interesa» / «Descartar» en un clic desde las sugeridas. */
export function AccionesRapidas({ licitacionId }: { licitacionId: string }) {
  const [pend, start] = useTransition();
  const [descartando, setDescartando] = useState(false);
  const [hecho, setHecho] = useState<string | null>(null);
  const router = useRouter();
  const ir = (estado: string, motivo?: string) =>
    start(async () => {
      await accSeguir(licitacionId, estado, motivo);
      setHecho(estado === "descartada" ? "Descartada" : "Añadida al tablero");
      setDescartando(false);
      router.refresh();
    });

  if (hecho) return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-vid-700"><Check className="h-4 w-4" /> {hecho}</span>;
  if (descartando)
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {MOTIVOS.map((m) => (
          <button key={m} type="button" disabled={pend} onClick={() => ir("descartada", m)} className="chip hover:bg-vino-50 hover:text-vino-800">{m}</button>
        ))}
        <button type="button" onClick={() => setDescartando(false)} className="grid h-7 w-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100" aria-label="Cancelar"><X className="h-4 w-4" /></button>
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <button type="button" disabled={pend} onClick={() => ir("interesa")} className="btn btn-primario py-1.5 text-sm">
        {pend ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />} Me interesa
      </button>
      <button type="button" disabled={pend} onClick={() => setDescartando(true)} className="btn btn-secundario py-1.5 text-sm">
        <ThumbsDown className="h-4 w-4" /> Descartar
      </button>
    </div>
  );
}

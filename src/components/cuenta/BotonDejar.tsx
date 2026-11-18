"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { accDejar } from "@/app/mi/acciones";

export function BotonDejar({ segId }: { segId: string }) {
  const [pend, start] = useTransition();
  return (
    <button type="button" disabled={pend} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-vino-700"
      onClick={() => { if (confirm("¿Dejar de seguir esta licitación? Se borrarán notas, checklist e historial.")) start(() => accDejar(segId, "/mi/tablero")); }}>
      <Trash2 className="h-4 w-4" /> Dejar de seguir
    </button>
  );
}

import type { EstadoSeg } from "@/lib/queries/usuario";
import { ESTADO_UI } from "./estados";

export function EstadoChip({ e, className = "" }: { e: EstadoSeg; className?: string }) {
  const u = ESTADO_UI[e];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${u.color} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: u.punto }} aria-hidden />
      {u.t}
    </span>
  );
}

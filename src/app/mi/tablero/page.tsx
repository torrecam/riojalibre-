import Link from "next/link";
import type { Metadata } from "next";
import { KanbanSquare, Sparkles } from "lucide-react";
import { Contenedor, Vacio } from "@/components/ui";
import { Tablero, type Tarjeta } from "@/components/cuenta/Tablero";
import { eurosCompacto, suavizarMayusculas } from "@/lib/format";
import { diasHasta, textoDias } from "@/lib/plazos";
import { requerirUsuario } from "@/lib/usuario";
import { seguimientosDe } from "@/lib/queries/usuario";

export const metadata: Metadata = { title: "Tablero" };
export const dynamic = "force-dynamic";

export default async function PaginaTablero() {
  const u = await requerirUsuario("/mi/tablero");
  const segs = await seguimientosDe(u.id);
  const tarjetas: Tarjeta[] = segs.map((s) => {
    const limite = s.fecha_limite_interna ?? s.fecha_fin_ofertas;
    const d = diasHasta(limite);
    const activo = ["interesa", "preparando", "presentada"].includes(s.estado);
    return {
      id: s.id, licitacion_id: s.licitacion_id, estado: s.estado, objeto: suavizarMayusculas(s.objeto), organismo: s.organismo,
      importe: eurosCompacto(s.importe_ofertado ?? s.presupuesto_base), plazo: activo ? textoDias(d) : "—",
      urgente: activo && d !== null && d <= 7, hechos: s.hechos, total: s.total, puntuacion: s.puntuacion_inicial, motivo: s.motivo_descarte,
    };
  });
  return (
    <>
      <div className="fondo-aurora border-b border-stone-200/70">
        <Contenedor className="flex flex-col gap-3 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-vino-500 to-vino-800 text-white shadow-lg shadow-vino-900/20"><KanbanSquare className="h-5 w-5" /></span>
              Tablero
            </h1>
            <p className="mt-2 text-stone-500"><span className="hidden md:inline">Arrastra las tarjetas entre columnas.</span><span className="md:hidden">Cambia el estado desde cada tarjeta.</span> Las anuladas o desiertas se mueven solas.</p>
          </div>
          <Link href="/mi/sugeridas" className="btn btn-primario"><Sparkles className="h-4 w-4" /> Añadir desde sugeridas</Link>
        </Contenedor>
      </div>
      <Contenedor className="py-6">
        {tarjetas.length === 0 ? (
          <Vacio titulo="Tu tablero está vacío">Marca «Me interesa» en una licitación sugerida para empezar a seguirla.</Vacio>
        ) : (
          <Tablero tarjetas={tarjetas} />
        )}
      </Contenedor>
    </>
  );
}

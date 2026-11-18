import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Contenedor } from "@/components/ui";
import { usuarioActual } from "@/lib/usuario";
import { idoneidadDe, perfilDe, seguimientoDe } from "@/lib/queries/usuario";
import { Anillo, Desglose, textoTono } from "./Idoneidad";
import { SelectorEstado } from "./SelectorEstado";

/** Bloque de idoneidad y seguimiento en la ficha pública de una licitación. */
export async function BloqueIdoneidad({ licitacionId }: { licitacionId: string }) {
  const u = await usuarioActual();
  if (!u)
    return (
      <Contenedor className="pt-6">
        <div className="card relative flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-vino-50 to-transparent" aria-hidden />
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-vino-500 to-vino-800 text-white"><Lock className="h-5 w-5" /></span>
          <div className="relative flex-1">
            <div className="font-semibold text-stone-900">¿Encaja con tu empresa?</div>
            <p className="text-sm text-stone-500">Regístrate para ver tu idoneidad (0–100), por qué encaja o no, y seguirla en tu tablero.</p>
          </div>
          <Link href={`/registro`} className="btn btn-primario relative">Regístrate para ver tu idoneidad <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </Contenedor>
    );
  const [{ perfil }, ido, seg] = await Promise.all([perfilDe(u.id), idoneidadDe(u.id, [licitacionId]), seguimientoDe(u.id, licitacionId)]);
  const i = ido.get(licitacionId);
  return (
    <Contenedor className="pt-6">
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start">
          {i ? (
            <div className="flex items-center gap-4 lg:w-60 lg:shrink-0">
              <Anillo p={i.puntuacion} />
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-stone-500 uppercase"><Sparkles className="h-3.5 w-3.5 text-vino-600" /> Tu idoneidad</div>
                <div className="font-semibold text-stone-900">{textoTono(i.puntuacion)}</div>
                <Link href="/mi/perfil" className="text-xs enlace">Ajustar perfil</Link>
              </div>
            </div>
          ) : (
            <div className="lg:w-60 lg:shrink-0">
              <div className="font-semibold text-stone-900">Tu idoneidad</div>
              <p className="text-sm text-stone-500">{perfil ? "No se pudo calcular." : <><Link href="/mi/bienvenida" className="enlace">Configura tu perfil</Link> para calcularla.</>}</p>
            </div>
          )}
          <div className="min-w-0 flex-1">{i && <Desglose positivos={i.positivos} negativos={i.negativos} />}</div>
          <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
            <SelectorEstado licitacionId={licitacionId} segId={seg?.s.id} estado={seg?.s.estado} />
            {seg && <Link href={`/mi/licitaciones/${licitacionId}`} className="inline-flex items-center gap-1 text-sm enlace">Abrir seguimiento <ArrowRight className="h-4 w-4" /></Link>}
          </div>
        </div>
      </section>
    </Contenedor>
  );
}

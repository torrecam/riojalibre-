import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, ClipboardCheck, Euro, ExternalLink, History, Landmark, NotebookPen, Sparkles } from "lucide-react";
import { Contenedor, Kpi, Seccion } from "@/components/ui";
import { Anillo, Desglose, textoTono } from "@/components/cuenta/Idoneidad";
import { SelectorEstado } from "@/components/cuenta/SelectorEstado";
import { EstadoChip } from "@/components/cuenta/EstadoChip";
import { Checklist } from "@/components/cuenta/Checklist";
import { BotonDejar } from "@/components/cuenta/BotonDejar";
import { ESTADO_UI } from "@/components/cuenta/estados";
import { accActualizar } from "@/app/mi/acciones";
import { eurosCompacto, fecha, fechaHora, suavizarMayusculas } from "@/lib/format";
import { esUuid } from "@/lib/params";
import { diasHasta, textoDias } from "@/lib/plazos";
import { requerirUsuario } from "@/lib/usuario";
import { licitacion } from "@/lib/queries/licitaciones";
import { idoneidadDe, seguimientoDe } from "@/lib/queries/usuario";

export const metadata: Metadata = { title: "Seguimiento" };
export const dynamic = "force-dynamic";

export default async function Seguimiento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!esUuid(id)) notFound();
  const u = await requerirUsuario(`/mi/licitaciones/${id}`);
  const [d, seg, ido] = await Promise.all([licitacion(id), seguimientoDe(u.id, id), idoneidadDe(u.id, [id])]);
  if (!d) notFound();
  const { l } = d;
  const i = ido.get(id);
  const s = seg?.s;
  const dias = diasHasta(l.fecha_fin_ofertas);

  return (
    <>
      <div className="fondo-aurora border-b border-stone-200/70">
        <Contenedor className="py-8">
          <nav className="mb-3 text-xs text-stone-500"><Link href="/mi/tablero" className="hover:text-vino-700">Tablero</Link> / Seguimiento</nav>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight font-extrabold tracking-tight text-balance text-stone-900 sm:text-3xl">{suavizarMayusculas(l.objeto)}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                {s && <EstadoChip e={s.estado} />}
                <span className="flex items-center gap-1"><Landmark className="h-4 w-4" />{l.organismo}</span>
                <Link href={`/licitaciones/${id}`} className="inline-flex items-center gap-1 enlace">Ficha pública <ExternalLink className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
              <SelectorEstado licitacionId={id} segId={s?.id} estado={s?.estado} />
              {s && <BotonDejar segId={s.id} />}
            </div>
          </div>
          {s?.estado === "descartada" && s.motivo_descarte && <p className="mt-4 inline-block rounded-xl bg-vino-50 px-3 py-2 text-sm text-vino-800">Descartada: {s.motivo_descarte}</p>}
        </Contenedor>
      </div>
      <Contenedor className="grid grid-cols-2 gap-3 pt-6 lg:grid-cols-4">
        <Kpi etiqueta="Presupuesto" icono={<Euro />} valor={eurosCompacto(l.presupuesto_base)} detalle="sin IVA" />
        <Kpi etiqueta="Fin de ofertas" icono={<CalendarClock />} valor={<span className="text-xl sm:text-2xl">{textoDias(dias)}</span>} detalle={l.fecha_fin_ofertas ? fechaHora(l.fecha_fin_ofertas) : undefined} />
        <Kpi etiqueta="Plazo interno" icono={<CalendarClock />} valor={<span className="text-xl sm:text-2xl">{s?.fecha_limite_interna ? textoDias(diasHasta(s.fecha_limite_interna)) : "—"}</span>} detalle={s?.fecha_limite_interna ? fecha(s.fecha_limite_interna) : "sin fijar"} />
        <Kpi etiqueta="Tu oferta" icono={<Euro />} valor={s?.importe_ofertado ? eurosCompacto(s.importe_ofertado) : "—"} detalle={s?.importe_ofertado && l.presupuesto_base ? `${Math.round((1 - s.importe_ofertado / l.presupuesto_base) * 1000) / 10} % de baja` : undefined} />
      </Contenedor>
      <Contenedor className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {s ? (
            <>
              <Seccion titulo="Notas y oferta" icono={<NotebookPen />}>
                <form action={accActualizar} className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                  <input type="hidden" name="id" value={s.id} />
                  <label className="block"><span className="label">Plazo interno</span>
                    <input type="date" name="fecha_limite_interna" defaultValue={s.fecha_limite_interna ?? ""} className="input mt-1.5 w-full" /></label>
                  <label className="block"><span className="label">Importe ofertado (€ sin IVA)</span>
                    <input name="importe_ofertado" inputMode="decimal" defaultValue={s.importe_ofertado ?? ""} placeholder={l.presupuesto_base ? String(l.presupuesto_base) : ""} className="input mt-1.5 w-full" /></label>
                  <label className="block sm:col-span-2"><span className="label">Notas</span>
                    <textarea name="notas" rows={5} defaultValue={s.notas ?? ""} placeholder="Contactos, dudas a los pliegos, socios de UTE…" className="input mt-1.5 w-full" /></label>
                  <div className="sm:col-span-2"><button className="btn btn-primario">Guardar</button></div>
                </form>
              </Seccion>
              <Seccion titulo="Checklist de la oferta" icono={<ClipboardCheck />}>
                <Checklist segId={s.id} tareas={seg!.tareas} />
              </Seccion>
            </>
          ) : (
            <div className="card p-6 text-sm text-stone-600">Aún no sigues esta licitación. Elige un estado arriba para crear el seguimiento con notas, checklist e historial.</div>
          )}
        </div>
        <div className="space-y-6">
          <Seccion titulo="Idoneidad" icono={<Sparkles />}>
            {i ? (
              <div className="px-5 py-4">
                <div className="mb-4 flex items-center gap-4">
                  <Anillo p={i.puntuacion} />
                  <div>
                    <div className="font-semibold text-stone-900">{textoTono(i.puntuacion)}</div>
                    {s?.puntuacion_inicial != null && s.puntuacion_inicial !== i.puntuacion && <div className="text-xs text-stone-500">Al empezar a seguirla: {s.puntuacion_inicial}</div>}
                    <Link href="/mi/perfil" className="text-xs enlace">Ajustar perfil</Link>
                  </div>
                </div>
                <Desglose positivos={i.positivos} negativos={i.negativos} compacto />
              </div>
            ) : <p className="px-5 py-4 text-sm text-stone-500"><Link className="enlace" href="/mi/bienvenida">Completa tu perfil</Link> para calcularla.</p>}
          </Seccion>
          {seg && (
            <Seccion titulo="Historial" icono={<History />}>
              <ol className="relative space-y-4 px-5 py-4 before:absolute before:top-5 before:bottom-5 before:left-[1.6rem] before:w-px before:bg-stone-200">
                {seg.eventos.map((e) => (
                  <li key={e.id} className="relative flex gap-3">
                    <span className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-surface" style={{ background: ESTADO_UI[e.estado_nuevo].punto }} />
                    <div className="text-sm">
                      <div className="font-medium text-stone-800">{e.estado_anterior ? <>{ESTADO_UI[e.estado_anterior].t} → {ESTADO_UI[e.estado_nuevo].t}</> : <>Empiezas a seguirla · {ESTADO_UI[e.estado_nuevo].t}</>}</div>
                      <div className="text-xs text-stone-500">{fechaHora(e.created_at)}{e.automatico ? " · automático" : ""}</div>
                      {e.nota && <div className="mt-0.5 text-xs text-stone-600">«{e.nota}»</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </Seccion>
          )}
        </div>
      </Contenedor>
    </>
  );
}

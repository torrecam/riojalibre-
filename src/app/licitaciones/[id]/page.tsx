import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarClock, ClipboardList, Euro, Gavel, Layers, Tags, Users } from "lucide-react";
import { Cabecera, Contenedor, Dato, EnlaceExterno, Estado, Fuente, Kpi, Seccion } from "@/components/ui";
import { euros, eurosCompacto, fecha, fechaHora, numero } from "@/lib/format";
import { licitacion } from "@/lib/queries/licitaciones";
import { BloqueIdoneidad } from "@/components/cuenta/BloqueIdoneidad";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const d = await licitacion((await params).id);
  return { title: d ? String(d.l.objeto).slice(0, 80) : "Licitación no encontrada" };
}

export default async function FichaLicitacion({ params }: { params: Promise<{ id: string }> }) {
  const d = await licitacion((await params).id);
  if (!d) notFound();
  const { l, cpvs, adjudicaciones, relacionadas } = d;
  const totalAdj = adjudicaciones.reduce((a, x) => a + (x.importe ?? 0), 0);
  const duracion = l.duracion_meses ? `${l.duracion_meses} meses` : l.duracion_dias ? `${l.duracion_dias} días` : null;

  return (
    <>
      <Cabecera
        migas={[{ href: "/licitaciones", label: "Licitaciones" }]}
        titulo={<span className="block text-2xl leading-tight sm:text-3xl">{l.objeto}</span>}
        subtitulo={
          <div className="flex flex-wrap items-center gap-3">
            <Estado v={l.estado} />
            <Fuente v={l.fuente} />
            {l.organismo_id && <Link href={`/organismos/${l.organismo_id}`} className="enlace">{l.organismo}</Link>}
          </div>
        }
        acciones={
          <div className="flex flex-col items-end gap-1">
            <EnlaceExterno href={l.url_origen} />
            {l.url_place && <EnlaceExterno href={l.url_place}>Ver también en PLACE</EnlaceExterno>}
          </div>
        }
      />
      <Contenedor className="grid grid-cols-2 gap-3 pt-6 lg:grid-cols-4">
        <Kpi etiqueta="Presupuesto" icono={<Euro />} valor={eurosCompacto(l.presupuesto_base)} detalle="sin IVA" />
        <Kpi etiqueta="Adjudicado" icono={<Gavel />} valor={totalAdj ? eurosCompacto(totalAdj) : "—"} detalle={totalAdj && l.presupuesto_base && totalAdj <= l.presupuesto_base ? `${Math.round((1 - totalAdj / l.presupuesto_base) * 100)} % de baja` : `${adjudicaciones.length} adjudicaciones`} />
        <Kpi etiqueta="Ofertas" icono={<Users />} valor={l.num_licitadores !== null ? numero(l.num_licitadores) : "—"} />
        <Kpi etiqueta={l.fecha_fin_ofertas ? "Fin de ofertas" : "Publicada"} icono={<CalendarClock />} valor={<span className="text-xl sm:text-2xl">{fecha(l.fecha_fin_ofertas ?? l.fecha_publicacion)}</span>} detalle={duracion ?? undefined} />
      </Contenedor>
      <BloqueIdoneidad licitacionId={l.id} />
      <Contenedor className="grid gap-6 py-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Seccion titulo="Expediente" icono={<ClipboardList />}>
            <dl className="divide-y divide-stone-100 px-5">
              <Dato etiqueta="Nº de expediente"><span className="font-mono">{l.codigo_expediente ?? "—"}</span></Dato>
              <Dato etiqueta="Organismo">{l.organismo_id ? <Link className="enlace" href={`/organismos/${l.organismo_id}`}>{l.organismo}</Link> : "—"}</Dato>
              {l.organismo_jerarquia && <Dato etiqueta="Depende de">{l.organismo_jerarquia}</Dato>}
              {l.unidad_competente && <Dato etiqueta="Unidad competente">{l.unidad_competente}</Dato>}
              {l.unidad_proponente && l.unidad_proponente !== l.unidad_competente && <Dato etiqueta="Unidad proponente">{l.unidad_proponente}</Dato>}
              <Dato etiqueta="Tipo de contrato">{l.tipo ?? "—"}{l.tipo_origen && l.tipo_origen !== l.tipo && !/^\d+$/.test(l.tipo_origen) ? <span className="text-stone-500"> · {l.tipo_origen}</span> : null}</Dato>
              <Dato etiqueta="Procedimiento">{l.procedimiento ?? "—"}</Dato>
              <Dato etiqueta="Estado">{l.estado ?? "—"}{l.resultado_adjudica ? <span className="text-stone-500"> · {l.resultado_adjudica}</span> : null}</Dato>
              <Dato etiqueta="Presupuesto base (sin IVA)"><span className="font-semibold">{euros(l.presupuesto_base, true)}</span>{l.presupuesto_con_iva ? <span className="text-stone-500"> · con IVA {euros(l.presupuesto_con_iva, true)}</span> : null}</Dato>
              <Dato etiqueta="Valor estimado">{euros(l.valor_estimado, true)}</Dato>
              <Dato etiqueta="Fecha de publicación">{fecha(l.fecha_publicacion)}</Dato>
              {l.fecha_fin_ofertas && <Dato etiqueta="Fin de presentación de ofertas">{fechaHora(l.fecha_fin_ofertas)}</Dato>}
              <Dato etiqueta="Fecha de adjudicación">{fecha(l.fecha_adjudicacion)}</Dato>
              {l.fecha_formalizacion && <Dato etiqueta="Fecha de formalización">{fecha(l.fecha_formalizacion)}</Dato>}
              {duracion && <Dato etiqueta="Duración">{duracion}</Dato>}
              {l.num_licitadores !== null && <Dato etiqueta="Nº de ofertas recibidas">{l.num_licitadores}</Dato>}
              {l.lugar_ejecucion && <Dato etiqueta="Lugar de ejecución">{l.lugar_ejecucion}</Dato>}
              <Dato etiqueta="Fuente"><Fuente v={l.fuente} /> <span className="ml-2 text-xs text-stone-500">id {l.id_fuente}</span></Dato>
            </dl>
          </Seccion>

          <Seccion icono={<Gavel />} titulo={`Adjudicaciones (${adjudicaciones.length})`} accion={totalAdj ? <span className="text-sm font-semibold tabular-nums">{euros(totalAdj)}</span> : null}>
            {adjudicaciones.length === 0 ? (
              <p className="px-5 py-6 text-sm text-stone-500">Aún sin adjudicar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tabla">
                  <thead>
                    <tr><th>Lote</th><th>Adjudicatario</th><th>NIF</th><th>Fecha</th><th className="num">Importe</th></tr>
                  </thead>
                  <tbody>
                    {adjudicaciones.map((a) => (
                      <tr key={a.id}>
                        <td className="text-stone-500">{a.lote_numero || "—"}{a.lote_descripcion && <div className="max-w-56 truncate text-xs" title={a.lote_descripcion}>{a.lote_descripcion}</div>}</td>
                        <td>
                          <div className="font-medium">{a.nombre_origen}</div>
                          {a.empresa_id && <Link href={a.empresa_nif ? `/empresas/${encodeURIComponent(a.empresa_nif)}` : `/empresas/${a.empresa_id}`} className="text-xs enlace">Ver perfil de empresa</Link>}
                        </td>
                        <td className="font-mono text-xs">{a.nif_origen ?? "—"}</td>
                        <td className="whitespace-nowrap">{fecha(a.fecha)}</td>
                        <td className="num font-medium">{euros(a.importe, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>

          {l.criterios_valoracion && (
            <Seccion titulo="Criterios de valoración" icono={<Layers />}>
              <p className="px-5 py-4 text-sm whitespace-pre-line text-stone-700">{l.criterios_valoracion}</p>
            </Seccion>
          )}
        </div>

        <div className="space-y-6">
          <Seccion titulo="CPV" icono={<Tags />}>
            {cpvs.length === 0 ? (
              <p className="px-5 py-4 text-sm text-stone-500">Sin CPV.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {cpvs.map((c) => (
                  <li key={c.codigo} className="px-5 py-2.5 text-sm">
                    <Link href={`/licitaciones?cpv=${c.codigo}`} className="font-mono enlace">{c.codigo}</Link>
                    {c.descripcion && <span className="ml-2 text-stone-600">{c.descripcion}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Seccion>
          {relacionadas.length > 0 && (
            <Seccion titulo="Del mismo organismo" icono={<ClipboardList />}>
              <ul className="divide-y divide-stone-100">
                {relacionadas.map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <Link href={`/licitaciones/${r.id}`} className="line-clamp-2 text-sm text-stone-800 hover:text-vino-700">{r.objeto}</Link>
                    <div className="mt-1 flex justify-between text-xs text-stone-500"><span>{fecha(r.fecha_publicacion)}</span><span className="tabular-nums">{euros(r.presupuesto_base)}</span></div>
                  </li>
                ))}
              </ul>
            </Seccion>
          )}
          <p className="px-1 text-xs text-stone-500">
            Copia de la fuente oficial: ante dudas, manda el expediente.
          </p>
        </div>
      </Contenedor>
    </>
  );
}

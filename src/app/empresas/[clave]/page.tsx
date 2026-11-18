import { Building2, Euro, Gavel, HandCoins, Receipt, Tags, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BarrasH, ColumnasLinea } from "@/components/graficos";
import { Cabecera, Contenedor, Estado, Kpi, Seccion } from "@/components/ui";
import { euros, eurosCompacto, fecha, numero, suavizarMayusculas } from "@/lib/format";
import { empresa } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ clave: string }> }): Promise<Metadata> {
  const d = await empresa((await params).clave);
  return { title: d ? d.e.nombre : "Empresa no encontrada" };
}

export default async function FichaEmpresa({ params }: { params: Promise<{ clave: string }> }) {
  const d = await empresa((await params).clave);
  if (!d) notFound();
  const { e, contratos, organismos, anual, menores, subvenciones, nombres } = d;
  return (
    <>
      <Cabecera
        migas={[{ href: "/empresas", label: "Empresas" }]}
        titulo={e.nombre}
        subtitulo={
          <span className="flex flex-wrap items-center gap-3 text-sm">
            {e.nif ? <span className="font-mono">NIF {e.nif}</span> : <span>Sin NIF en la fuente (agrupado por nombre exacto)</span>}
            <Link href={`/red?empresa=${e.id}`} className="enlace">Ver en la red de adjudicatarios</Link>
            <Link href={`/licitaciones?adjudicatario=${encodeURIComponent(e.nif ?? e.nombre)}`} className="enlace">Buscar sus licitaciones</Link>
          </span>
        }
      />
      <Contenedor className="space-y-6 py-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi etiqueta="Contratos" icono={<Gavel />} valor={numero(e.contratos)} />
          <Kpi etiqueta="Importe" icono={<Euro />} valor={eurosCompacto(e.importe_contratos)} />
          <Kpi etiqueta="Menores" icono={<Receipt />} valor={numero(e.menores)} detalle={e.menores ? eurosCompacto(e.importe_menores) : undefined} />
          <Kpi etiqueta="Subvenciones" icono={<HandCoins />} valor={numero(e.subvenciones)} detalle={e.subvenciones ? eurosCompacto(e.importe_subvenciones) : undefined} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="Evolución anual" icono={<TrendingUp />}>
            <div className="p-5">
              <ColumnasLinea
                datos={anual.map((a) => ({ x: a.anio, barras: a.contratos + a.menores, linea: a.importe_contratos + a.importe_menores }))}
                etiquetaBarras="Nº de contratos"
                etiquetaLinea="Importe"
              />
            </div>
          </Seccion>
          <Seccion icono={<Building2 />} titulo={`Organismos (${organismos.length})`}>
            <div className="p-5">
              {organismos.length ? (
                <BarrasH formato="euros" datos={organismos.slice(0, 12).map((o) => ({ etiqueta: o.nombre, valor: o.importe, href: `/organismos/${o.id}`, extra: `${o.n} contr.` }))} />
              ) : (
                <p className="text-sm text-stone-500">Sin adjudicaciones en licitaciones.</p>
              )}
            </div>
          </Seccion>
        </div>

        {contratos.length > 0 && (
          <Seccion icono={<Gavel />} titulo={`Contratos${contratos.length === 200 ? " (últimos 200)" : ""}`}>
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead><tr><th>Objeto</th><th>Organismo</th><th>Fecha</th><th>Tipo</th><th className="num">Importe</th></tr></thead>
                <tbody>
                  {contratos.map((c, i) => (
                    <tr key={`${c.licitacion_id}-${i}`}>
                      <td className="min-w-72"><Link href={`/licitaciones/${c.licitacion_id}`} className="line-clamp-2 hover:text-vino-700">{c.objeto}</Link><Estado v={c.estado} />{c.lote_numero && <span className="ml-2 text-xs text-stone-500">Lote {c.lote_numero}</span>}</td>
                      <td className="min-w-48 text-stone-600">{c.organismo_id ? <Link href={`/organismos/${c.organismo_id}`} className="hover:text-vino-700">{c.organismo}</Link> : "—"}</td>
                      <td className="whitespace-nowrap">{fecha(c.fecha)}</td>
                      <td className="text-stone-600">{c.tipo}</td>
                      <td className="num font-medium">{euros(c.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        )}

        {menores.length > 0 && (
          <Seccion icono={<Receipt />} titulo={`Menores${menores.length === 100 ? " (últimos 100)" : ""}`} accion={<Link className="text-sm enlace" href={`/contratos-menores?q=${encodeURIComponent(e.nif ?? e.nombre)}`}>Ver todos</Link>}>
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead><tr><th>Concepto</th><th>Departamento</th><th>Fecha</th><th className="num">Importe</th></tr></thead>
                <tbody>
                  {menores.map((m) => (
                    <tr key={m.cod_contrato}>
                      <td className="min-w-72">{suavizarMayusculas(m.concepto)}</td>
                      <td className="text-stone-600">{m.departamento}</td>
                      <td className="whitespace-nowrap">{fecha(m.fecha)}</td>
                      <td className="num font-medium">{euros(m.importe, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        )}

        {subvenciones.length > 0 && (
          <Seccion titulo="Subvenciones" icono={<HandCoins />}>
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead><tr><th>Convocatoria</th><th>Concedente</th><th>Fecha</th><th className="num">Importe</th></tr></thead>
                <tbody>
                  {subvenciones.map((s) => (
                    <tr key={s.id}>
                      <td className="min-w-72"><Link href={`/subvenciones/${s.id}`} className="line-clamp-2 hover:text-vino-700">{suavizarMayusculas(s.convocatoria)}</Link></td>
                      <td className="text-stone-600">{suavizarMayusculas(s.nivel3)}</td>
                      <td className="whitespace-nowrap">{fecha(s.fecha_concesion)}</td>
                      <td className="num font-medium">{euros(s.importe, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        )}

        {nombres.length > 1 && (
          <Seccion titulo="Otros nombres" icono={<Tags />}>
            <ul className="flex flex-wrap gap-2 p-5 text-sm">
              {nombres.map((n) => (
                <li key={n.nombre}><Link href={`/historia?empresa=${encodeURIComponent(n.nombre)}`} className="rounded-full bg-stone-100 px-3 py-1 hover:bg-vino-50">{n.nombre} <span className="text-stone-500">({n.n})</span></Link></li>
              ))}
            </ul>
          </Seccion>
        )}
      </Contenedor>
    </>
  );
}

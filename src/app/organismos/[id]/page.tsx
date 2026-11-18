import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BarrasH, ColumnasLinea, Donut } from "@/components/graficos";
import { Cabecera, Contenedor, Kpi, Seccion } from "@/components/ui";
import { euros, eurosCompacto, fecha, numero } from "@/lib/format";
import { organismo } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const d = await organismo((await params).id);
  return { title: d ? d.o.nombre : "Organismo no encontrado" };
}

export default async function FichaOrganismo({ params }: { params: Promise<{ id: string }> }) {
  const d = await organismo((await params).id);
  if (!d) notFound();
  const { o, top, anual, tipos, ultimas } = d;
  return (
    <>
      <Cabecera
        migas={[{ href: "/organismos", label: "Organismos" }]}
        titulo={o.nombre}
        subtitulo={<span className="text-sm">{[o.jerarquia, o.ciudad, o.dir3 && `DIR3 ${o.dir3}`, o.nif && `NIF ${o.nif}`].filter(Boolean).join(" · ")}</span>}
        acciones={<Link className="btn-secundario" href={`/licitaciones?organismo=${o.id}`}>Ver sus licitaciones</Link>}
      />
      <Contenedor className="space-y-6 py-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi etiqueta="Total adjudicado" valor={eurosCompacto(o.importe_adjudicado)} />
          <Kpi etiqueta="Adjudicaciones" valor={numero(o.adjudicaciones)} />
          <Kpi etiqueta="Licitaciones" valor={numero(o.licitaciones)} detalle={`Presupuesto: ${eurosCompacto(o.presupuesto)}`} />
          <Kpi etiqueta="Contratos menores" valor={numero(o.menores)} detalle={o.menores ? eurosCompacto(o.importe_menores) : undefined} href={o.menores ? `/contratos-menores?departamento=${encodeURIComponent(o.nombre)}` : undefined} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="A quién adjudica (top 20 por importe)">
            <div className="p-5">
              {top.length ? <BarrasH formato="euros" datos={top.map((t) => ({ etiqueta: t.nombre, valor: t.importe, href: t.empresa_id ? (t.nif ? `/empresas/${encodeURIComponent(t.nif)}` : `/empresas/${t.empresa_id}`) : undefined, extra: `${t.n}` }))} /> : <p className="text-sm text-stone-500">Sin adjudicaciones registradas.</p>}
            </div>
          </Seccion>
          <div className="space-y-6">
            <Seccion titulo="Por año">
              <div className="p-5"><ColumnasLinea datos={anual.map((a) => ({ x: a.anio, barras: a.n, linea: a.importe }))} etiquetaBarras="Adjudicaciones" etiquetaLinea="Importe" /></div>
            </Seccion>
            <Seccion titulo="Para qué (tipo de contrato)">
              <div className="p-5"><Donut datos={tipos.map((t) => ({ etiqueta: `${t.tipo} · ${eurosCompacto(t.importe)}`, valor: t.n }))} /></div>
            </Seccion>
          </div>
        </div>
        <Seccion titulo="Últimas adjudicaciones">
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Objeto</th><th>Empresa</th><th>Fecha</th><th className="num">Importe</th></tr></thead>
              <tbody>
                {ultimas.map((u, i) => (
                  <tr key={i}>
                    <td className="min-w-72"><Link href={`/licitaciones/${u.licitacion_id}`} className="line-clamp-2 hover:text-vino-700">{u.objeto}</Link></td>
                    <td className="min-w-48">{u.empresa_id ? <Link href={`/empresas/${u.empresa_id}`} className="hover:text-vino-700">{u.nombre_origen}</Link> : u.nombre_origen}</td>
                    <td className="whitespace-nowrap">{fecha(u.fecha)}</td>
                    <td className="num font-medium">{euros(u.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>
      </Contenedor>
    </>
  );
}

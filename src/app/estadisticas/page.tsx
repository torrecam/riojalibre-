import type { Metadata } from "next";
import { BarrasH, ColumnasLinea, Donut } from "@/components/graficos";
import { Cabecera, Conmutador, Contenedor, Kpi, Seccion, SinBD } from "@/components/ui";
import Link from "next/link";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, eurosCompacto, numero } from "@/lib/format";
import { str, type SP } from "@/lib/params";
import { estadisticas, kpisGenerales } from "@/lib/queries/estadisticas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estadísticas" };

export default async function Estadisticas({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const mTipo = str(sp, "tipo") ?? "n";
  const mOrg = str(sp, "org") ?? "n";
  const [k, s] = await Promise.all([kpisGenerales(), estadisticas()]);
  const orgs = [...s.topOrganismos].sort((a, b) => (mOrg === "eur" ? b.importe - a.importe : b.n - a.n)).slice(0, 15);
  const opc = [{ v: "n", label: "Nº" }, { v: "eur", label: "€" }];
  return (
    <>
      <Cabecera titulo="Estadísticas" subtitulo="Una vista de conjunto de la contratación y las ayudas públicas en La Rioja con los datos cargados." />
      <Contenedor className="space-y-6 py-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi etiqueta="Licitaciones" valor={numero(k.licitaciones)} />
          <Kpi etiqueta="Presupuesto total" valor={eurosCompacto(k.presupuesto)} />
          <Kpi etiqueta="Adjudicadas o resueltas" valor={numero(k.adjudicadas)} detalle={`${Math.round((k.adjudicadas / Math.max(1, k.licitaciones)) * 100)} % del total`} />
          <Kpi etiqueta="Presupuesto medio" valor={euros(k.presupuesto_medio)} />
        </div>

        <Seccion titulo="Licitaciones y presupuesto por año de publicación">
          <div className="p-5"><ColumnasLinea datos={s.anual.map((a) => ({ x: a.anio, barras: a.n, linea: a.presupuesto }))} etiquetaBarras="Nº de licitaciones" etiquetaLinea="Presupuesto base" /></div>
        </Seccion>

        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="Por tipo de contrato" accion={<Conmutador sp={sp} base="/estadisticas" param="tipo" actual={mTipo} opciones={opc} />}>
            <div className="p-5">
              <BarrasH formato={mTipo === "eur" ? "euros" : "numero"} datos={[...s.tipos].sort((a, b) => (mTipo === "eur" ? b.importe - a.importe : b.n - a.n)).map((t) => ({ etiqueta: t.v, valor: mTipo === "eur" ? t.importe : t.n, href: t.v !== "Sin tipo" ? `/licitaciones?tipo=${encodeURIComponent(t.v)}` : undefined }))} />
            </div>
          </Seccion>
          <Seccion titulo="Por estado">
            <div className="p-5"><Donut datos={s.estados.map((e) => ({ etiqueta: e.v, valor: e.n }))} /></div>
          </Seccion>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="Top organismos contratantes" accion={<Conmutador sp={sp} base="/estadisticas" param="org" actual={mOrg} opciones={opc} />}>
            <div className="p-5">
              <BarrasH formato={mOrg === "eur" ? "euros" : "numero"} datos={orgs.map((o) => ({ etiqueta: o.nombre, valor: mOrg === "eur" ? o.importe : o.n, href: `/organismos/${o.id}` }))} />
            </div>
          </Seccion>
          <Seccion titulo="Top empresas adjudicatarias" accion={<Link href="/empresas" className="text-sm enlace">Ranking completo</Link>}>
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead><tr><th>#</th><th>Empresa</th><th className="num">Contratos</th><th className="num">Importe</th></tr></thead>
                <tbody>
                  {s.topEmpresas.map((e, i) => (
                    <tr key={e.id}>
                      <td className="text-stone-400">{i + 1}</td>
                      <td><Link href={e.nif ? `/empresas/${encodeURIComponent(e.nif)}` : `/empresas/${e.id}`} className="hover:text-vino-700">{e.nombre}</Link></td>
                      <td className="num">{numero(e.contratos)}</td>
                      <td className="num font-medium">{eurosCompacto(e.importe_contratos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Seccion titulo="Contratos menores por año">
            <div className="p-5"><ColumnasLinea datos={s.menoresAnual.map((a) => ({ x: a.anio, barras: a.n, linea: a.importe }))} etiquetaBarras="Nº de contratos menores" etiquetaLinea="Importe" /></div>
          </Seccion>
          <Seccion titulo="Subvenciones por año de concesión">
            <div className="p-5"><ColumnasLinea datos={s.subvAnual.map((a) => ({ x: a.anio, barras: a.n, linea: a.importe }))} etiquetaBarras="Nº de concesiones" etiquetaLinea="Importe concedido" /></div>
          </Seccion>
        </div>
        <p className="text-xs text-stone-500">
          Licitaciones por fuente: {s.fuentes.map((f) => `${f.v === "place" ? "PLACE" : f.v} ${numero(f.n)}`).join(" · ")}. Los importes de licitación son presupuestos base sin IVA.
        </p>
      </Contenedor>
    </>
  );
}

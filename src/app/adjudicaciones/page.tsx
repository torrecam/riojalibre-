import Link from "next/link";
import type { Metadata } from "next";
import { Cabecera, Contenedor, Paginacion, SinBD, Vacio } from "@/components/ui";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, fecha, numero } from "@/lib/format";
import { fechaParam, numParam, pagina, qs, str, type SP } from "@/lib/params";
import { buscarAdjudicaciones, TAM_PAGINA } from "@/lib/queries/licitaciones";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Adjudicaciones" };

export default async function Adjudicaciones({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const pag = pagina(sp);
  const { filas, total } = await buscarAdjudicaciones(sp, pag);
  return (
    <>
      <Cabecera
        titulo="Adjudicaciones"
        subtitulo="Cada contrato (o lote) adjudicado, con la empresa, el importe sin IVA y el organismo. Ordenado por fecha de adjudicación."
        acciones={<a className="btn-secundario" href={`/api/adjudicaciones/csv${qs(sp, { pagina: undefined })}`}>⬇ Exportar CSV</a>}
      />
      <Contenedor className="py-6">
        <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_160px_160px_160px_auto] sm:items-end" action="/adjudicaciones">
          <div>
            <label className="label" htmlFor="q">Empresa, NIF u objeto</label>
            <input className="input" id="q" name="q" defaultValue={str(sp, "q")} />
          </div>
          <div>
            <label className="label" htmlFor="desde">Desde</label>
            <input className="input" type="date" id="desde" name="desde" defaultValue={fechaParam(sp, "desde")} />
          </div>
          <div>
            <label className="label" htmlFor="hasta">Hasta</label>
            <input className="input" type="date" id="hasta" name="hasta" defaultValue={fechaParam(sp, "hasta")} />
          </div>
          <div>
            <label className="label" htmlFor="importe">Importe mín. €</label>
            <input className="input" id="importe" name="importe" inputMode="numeric" defaultValue={numParam(sp, "importe")} />
          </div>
          <button className="btn-primario">Buscar</button>
        </form>
        <p className="mb-3 text-sm text-stone-600"><strong className="text-stone-900">{numero(total)}</strong> adjudicaciones</p>
        {filas.length === 0 ? (
          <Vacio titulo="Sin resultados" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Empresa</th><th className="num">Importe</th><th>Objeto</th><th>Organismo</th><th>Fecha</th></tr></thead>
              <tbody>
                {filas.map((a) => (
                  <tr key={a.id}>
                    <td className="min-w-48">
                      {a.empresa_id ? <Link className="font-medium hover:text-vino-700" href={`/empresas/${a.empresa_id}`}>{a.nombre_origen}</Link> : <span className="font-medium">{a.nombre_origen}</span>}
                      {a.nif_origen && <div className="font-mono text-xs text-stone-500">{a.nif_origen}</div>}
                    </td>
                    <td className="num font-semibold">{euros(a.importe)}</td>
                    <td className="min-w-72">
                      <Link href={`/licitaciones/${a.licitacion_id}`} className="line-clamp-2 hover:text-vino-700">{a.objeto}</Link>
                      {a.tipo && <span className="text-xs text-stone-500">{a.tipo}</span>}
                    </td>
                    <td className="min-w-48 text-stone-600">{a.organismo_id ? <Link className="hover:text-vino-700" href={`/organismos/${a.organismo_id}`}>{a.organismo}</Link> : "—"}</td>
                    <td className="whitespace-nowrap text-stone-600">{fecha(a.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion sp={sp} base="/adjudicaciones" pagina={pag} total={total} tam={TAM_PAGINA} />
      </Contenedor>
    </>
  );
}

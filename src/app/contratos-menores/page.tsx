import Link from "next/link";
import type { Metadata } from "next";
import { Cabecera, Contenedor, Etiqueta, Paginacion, SinBD, Vacio } from "@/components/ui";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, eurosCompacto, fecha, numero, suavizarMayusculas } from "@/lib/format";
import { fechaParam, numParam, pagina, qs, str, type SP } from "@/lib/params";
import { TAM_PAGINA } from "@/lib/queries/licitaciones";
import { buscarMenores, opcionesMenores } from "@/lib/queries/menores";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contratos menores" };

export default async function Menores({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const pag = pagina(sp);
  const [{ filas, total, importe }, op] = await Promise.all([buscarMenores(sp, pag), opcionesMenores()]);
  return (
    <>
      <Cabecera
        titulo="Contratos menores"
        subtitulo="Contratos menores del Gobierno de La Rioja según la ejecución presupuestaria publicada por la Intervención General (desde 2021, importes desde 500 €)."
        acciones={<a className="btn-secundario" href={`/api/contratos-menores/csv${qs(sp, { pagina: undefined })}`}>⬇ Exportar CSV</a>}
      />
      <Contenedor className="py-6">
        <form className="card mb-4 grid gap-3 p-4 md:grid-cols-6 md:items-end" action="/contratos-menores">
          <div className="md:col-span-2">
            <label className="label" htmlFor="q">Concepto, proveedor o NIF</label>
            <input className="input" id="q" name="q" defaultValue={str(sp, "q")} />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="departamento">Departamento</label>
            <select className="input" id="departamento" name="departamento" defaultValue={str(sp, "departamento") ?? ""}>
              <option value="">Todos</option>
              {op.departamentos.map((d) => <option key={d.v} value={d.v}>{d.v} ({numero(d.n)})</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tipo">Tipo</label>
            <select className="input" id="tipo" name="tipo" defaultValue={str(sp, "tipo") ?? ""}>
              <option value="">Todos</option>
              {op.tipos.map((d) => <option key={d.v} value={d.v}>{d.v}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="anio">Año</label>
            <select className="input" id="anio" name="anio" defaultValue={str(sp, "anio") ?? ""}>
              <option value="">Todos</option>
              {op.anios.map((d) => <option key={d.v} value={d.v}>{d.v}</option>)}
            </select>
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
          <div>
            <label className="label" htmlFor="orden">Orden</label>
            <select className="input" id="orden" name="orden" defaultValue={str(sp, "orden") ?? ""}>
              <option value="">Más recientes</option>
              <option value="fecha_asc">Más antiguos</option>
              <option value="importe_desc">Mayor importe</option>
              <option value="importe_asc">Menor importe</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button className="btn-primario flex-1">Buscar</button>
            <Link href="/contratos-menores" className="btn-secundario">Limpiar</Link>
          </div>
        </form>
        <p className="mb-3 text-sm text-stone-600">
          <strong className="text-stone-900">{numero(total)}</strong> contratos menores · <strong className="text-stone-900">{eurosCompacto(importe)}</strong>
        </p>
        {filas.length === 0 ? (
          <Vacio titulo="Sin resultados" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Concepto</th><th>Proveedor</th><th>Departamento</th><th>Fecha</th><th className="num">Importe</th></tr></thead>
              <tbody>
                {filas.map((m) => (
                  <tr key={m.cod_contrato}>
                    <td className="min-w-72">
                      <div className="line-clamp-2">{suavizarMayusculas(m.concepto)}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Etiqueta tono="vino">contrato menor</Etiqueta>
                        {m.tipo && <Etiqueta>{m.tipo}</Etiqueta>}
                        <span className="font-mono text-[11px] text-stone-400">{m.cod_contrato}</span>
                      </div>
                    </td>
                    <td className="min-w-48">
                      {m.empresa_id ? (
                        <Link className="font-medium hover:text-vino-700" href={m.empresa_nif ? `/empresas/${encodeURIComponent(m.empresa_nif)}` : `/empresas/${m.empresa_id}`}>{m.nombre_origen}</Link>
                      ) : (
                        <span className="font-medium">{m.nombre_origen ?? "—"}</span>
                      )}
                      <div className="font-mono text-xs text-stone-500">{m.persona_fisica ? "Persona física (NIF oculto)" : m.nif_origen}</div>
                    </td>
                    <td className="min-w-48 text-stone-600">{m.organismo_id ? <Link className="hover:text-vino-700" href={`/organismos/${m.organismo_id}`}>{m.departamento}</Link> : m.departamento}</td>
                    <td className="whitespace-nowrap text-stone-600">{fecha(m.fecha)}</td>
                    <td className="num font-semibold">{euros(m.importe, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion sp={sp} base="/contratos-menores" pagina={pag} total={total} tam={TAM_PAGINA} />
      </Contenedor>
    </>
  );
}

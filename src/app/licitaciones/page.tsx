import Link from "next/link";
import type { Metadata } from "next";
import { Cabecera, Contenedor, Estado, Fuente, Paginacion, SinBD, Vacio } from "@/components/ui";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, fecha, numero } from "@/lib/format";
import { pagina, qs, type SP } from "@/lib/params";
import { buscarLicitaciones, filtrosDesde, opcionesFiltros, TAM_PAGINA } from "@/lib/queries/licitaciones";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Licitaciones" };

const ORDENES = [
  { v: "", label: "Más recientes" },
  { v: "fecha_asc", label: "Más antiguas" },
  { v: "importe_desc", label: "Mayor importe" },
  { v: "importe_asc", label: "Menor importe" },
  { v: "estado", label: "Estado" },
];

export default async function Licitaciones({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const f = filtrosDesde(sp);
  const pag = pagina(sp);
  const [{ filas, total }, op] = await Promise.all([buscarLicitaciones(f, pag), opcionesFiltros()]);
  const hayFiltros = Object.entries(f).some(([k, v]) => k !== "orden" && v !== undefined);
  const csv = `/api/licitaciones/csv${qs(sp, { pagina: undefined })}`;

  return (
    <>
      <Cabecera
        titulo="Licitaciones"
        subtitulo="Contratación pública del Gobierno de La Rioja, sus organismos, los ayuntamientos riojanos y los órganos estatales con sede o ejecución en La Rioja."
        acciones={<a href={csv} className="btn-secundario">⬇ Exportar CSV</a>}
      />
      <Contenedor className="py-6">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside id="filtros" className="order-last lg:order-none">
            <form className="card space-y-4 p-5 lg:sticky lg:top-20" action="/licitaciones">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Filtros</h2>
                {hayFiltros && <Link href="/licitaciones" className="text-xs enlace">Limpiar</Link>}
              </div>
              <div>
                <label className="label" htmlFor="q">Texto</label>
                <input className="input" id="q" name="q" defaultValue={f.q} placeholder="Objeto, expediente, organismo…" />
              </div>
              <div>
                <label className="label" htmlFor="adjudicatario">Adjudicatario (nombre o NIF)</label>
                <input className="input" id="adjudicatario" name="adjudicatario" defaultValue={f.adjudicatario} placeholder="p. ej. B26120964" />
              </div>
              <div>
                <label className="label" htmlFor="organismo">Organismo</label>
                <select className="input" id="organismo" name="organismo" defaultValue={f.organismo ?? ""}>
                  <option value="">Todos</option>
                  {op.organismos.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre} ({numero(o.n)})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="estado">Estado</label>
                  <select className="input" id="estado" name="estado" defaultValue={f.estado ?? ""}>
                    <option value="">Todos</option>
                    {op.estados.map((o) => <option key={o.v} value={o.v}>{o.v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="tipo">Tipo</label>
                  <select className="input" id="tipo" name="tipo" defaultValue={f.tipo ?? ""}>
                    <option value="">Todos</option>
                    {op.tipos.map((o) => <option key={o.v} value={o.v}>{o.v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="procedimiento">Procedimiento</label>
                <select className="input" id="procedimiento" name="procedimiento" defaultValue={f.procedimiento ?? ""}>
                  <option value="">Todos</option>
                  {op.procedimientos.map((o) => <option key={o.v} value={o.v}>{o.v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="cpv">CPV</label>
                  <input className="input" id="cpv" name="cpv" inputMode="numeric" defaultValue={f.cpv} placeholder="45, 7231…" />
                </div>
                <div>
                  <label className="label" htmlFor="fuente">Fuente</label>
                  <select className="input" id="fuente" name="fuente" defaultValue={f.fuente ?? ""}>
                    <option value="">Todas</option>
                    <option value="larioja.org">larioja.org</option>
                    <option value="place">PLACE</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="importe">Importe mín. €</label>
                  <input className="input" id="importe" name="importe" inputMode="numeric" defaultValue={f.importeMin} />
                </div>
                <div>
                  <label className="label" htmlFor="importe_max">Importe máx. €</label>
                  <input className="input" id="importe_max" name="importe_max" inputMode="numeric" defaultValue={f.importeMax} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="desde">Desde</label>
                  <input className="input" type="date" id="desde" name="desde" defaultValue={f.desde} />
                </div>
                <div>
                  <label className="label" htmlFor="hasta">Hasta</label>
                  <input className="input" type="date" id="hasta" name="hasta" defaultValue={f.hasta} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="orden">Ordenar por</label>
                <select className="input" id="orden" name="orden" defaultValue={f.orden ?? ""}>
                  {ORDENES.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
              </div>
              <button className="btn-primario w-full">Aplicar filtros</button>
            </form>
          </aside>

          <div className="min-w-0">
            <form action="/licitaciones" className="mb-4 flex gap-2 lg:hidden">
              {Object.entries(sp).filter(([k, v]) => k !== "q" && k !== "pagina" && typeof v === "string" && v).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v as string} />
              ))}
              <input className="input" name="q" defaultValue={f.q} placeholder="Buscar licitaciones…" aria-label="Buscar licitaciones" />
              <button className="btn-primario">Buscar</button>
              <a href="#filtros" className="btn-secundario whitespace-nowrap">Filtros ↓</a>
            </form>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600"><strong className="text-stone-900">{numero(total)}</strong> licitaciones encontradas</p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[[10000, "> 10 mil €"], [100000, "> 100 mil €"], [1000000, "> 1 M€"]].map(([v, l]) => (
                  <Link key={v} href={`/licitaciones${qs(sp, { importe: f.importeMin === v ? undefined : v, pagina: undefined })}`}
                    className={`rounded-full px-3 py-1 ring-1 ${f.importeMin === v ? "bg-vino-700 text-white ring-vino-700" : "bg-white text-stone-600 ring-stone-300 hover:bg-stone-100"}`}>
                    {l}
                  </Link>
                ))}
              </div>
            </div>
            {filas.length === 0 ? (
              <Vacio titulo="No hay licitaciones con esos filtros">Prueba a quitar algún filtro o a buscar con menos palabras.</Vacio>
            ) : (
              <ul className="space-y-3">
                {filas.map((l) => (
                  <li key={l.id} className="card p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <Estado v={l.estado} />
                          {l.tipo && <span className="text-xs text-stone-500">{l.tipo}</span>}
                          <Fuente v={l.fuente} />
                          {l.codigo_expediente && <span className="font-mono text-[11px] text-stone-400">{l.codigo_expediente}</span>}
                        </div>
                        <Link href={`/licitaciones/${l.id}`} className="line-clamp-2 font-medium text-stone-900 hover:text-vino-800">{l.objeto}</Link>
                        {l.organismo_id && (
                          <Link href={`/organismos/${l.organismo_id}`} className="mt-1 block truncate text-sm text-stone-500 hover:text-vino-700">{l.organismo}</Link>
                        )}
                        {l.adjudicatarios && l.adjudicatarios.length > 0 && (
                          <p className="mt-1.5 truncate text-sm text-stone-600">
                            <span className="text-stone-400">Adjudicada a </span>
                            {l.adjudicatarios.map((a, i) => (
                              <span key={i}>
                                {i > 0 && ", "}
                                {a.empresa_id ? <Link href={`/empresas/${a.empresa_id}`} className="hover:text-vino-700">{a.nombre}</Link> : a.nombre}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-row justify-between gap-4 sm:flex-col sm:items-end sm:text-right">
                        <div>
                          <div className="text-lg font-semibold tabular-nums">{euros(l.presupuesto_base)}</div>
                          {l.importe_adjudicado ? <div className="text-xs text-stone-500">Adjudicado: {euros(l.importe_adjudicado)}</div> : null}
                        </div>
                        <div className="text-xs text-stone-500">{fecha(l.fecha_publicacion)}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Paginacion sp={sp} base="/licitaciones" pagina={pag} total={total} tam={TAM_PAGINA} />
          </div>
        </div>
      </Contenedor>
    </>
  );
}

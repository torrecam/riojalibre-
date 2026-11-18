import Link from "next/link";
import { Contenedor, Estado, Fuente, Kpi, SinBD } from "@/components/ui";
import { actividadReciente, kpisGenerales } from "@/lib/queries/estadisticas";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, eurosCompacto, fecha, fechaHora, numero, suavizarMayusculas } from "@/lib/format";
import { enlaceEmpresa } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  if (!hayBaseDeDatos()) return <SinBD />;
  const [k, act] = await Promise.all([kpisGenerales(), actividadReciente()]);
  return (
    <>
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-br from-vino-800 via-vino-700 to-vino-900 text-white">
        <svg className="absolute -right-24 -bottom-24 h-96 w-96 opacity-10" viewBox="0 0 100 100" aria-hidden>
          {[...Array(6)].map((_, i) => (
            <circle key={i} cx={30 + (i % 3) * 20 + (i >= 3 ? 10 : 0)} cy={30 + Math.floor(i / 3) * 18} r="9" fill="white" />
          ))}
        </svg>
        <Contenedor className="relative py-14 sm:py-20">
          <p className="text-sm font-medium tracking-wider text-vino-200 uppercase">Transparencia ciudadana · La Rioja</p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-3xl leading-tight font-semibold text-balance sm:text-5xl">
            Qué contrata y a quién ayuda el dinero público en La Rioja
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-vino-100">
            Licitaciones, adjudicaciones, contratos menores y subvenciones reunidos desde las fuentes oficiales, en un solo buscador y sin registro.
          </p>
          <form action="/licitaciones" className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <label htmlFor="q-home" className="sr-only">Buscar</label>
            <input id="q-home" name="q" placeholder="Busca por objeto, organismo, empresa o NIF…" className="flex-1 rounded-xl border-0 px-4 py-3 text-stone-900 shadow-lg placeholder:text-stone-400 focus:ring-4 focus:ring-vino-300 focus:outline-none" />
            <button className="rounded-xl bg-white px-6 py-3 font-semibold text-vino-800 shadow-lg hover:bg-vino-50">Buscar</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {[
              ["Más de 1 M€", "/licitaciones?importe=1000000"],
              ["En plazo", "/licitaciones?estado=En+plazo"],
              ["Obras", "/licitaciones?tipo=Obras"],
              ["Ayudas a empresas", "/subvenciones?beneficiario=juridicas"],
            ].map(([l, h]) => (
              <Link key={h} href={h} className="rounded-full bg-white/10 px-3 py-1 text-vino-50 ring-1 ring-white/20 hover:bg-white/20">{l}</Link>
            ))}
          </div>
        </Contenedor>
      </section>

      <Contenedor className="-mt-8 relative">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi etiqueta="Licitaciones" valor={numero(k.licitaciones)} detalle={`${numero(k.adjudicadas)} adjudicadas o resueltas`} href="/licitaciones" />
          <Kpi etiqueta="Presupuesto licitado" valor={eurosCompacto(k.presupuesto)} detalle={`Medio: ${euros(k.presupuesto_medio)}`} href="/estadisticas" />
          <Kpi etiqueta="Organismos" valor={numero(k.organismos)} detalle="con contratos registrados" href="/organismos" />
          <Kpi etiqueta="Contratos menores" valor={numero(k.menores)} detalle={eurosCompacto(k.importe_menores)} href="/contratos-menores" />
          <Kpi etiqueta="Subvenciones" valor={numero(k.subvenciones)} detalle={`${eurosCompacto(k.importe_subvenciones)} concedidos`} href="/subvenciones" />
        </div>
        {k.ultima_actualizacion && (
          <p className="mt-3 text-right text-xs text-stone-500">
            Última carga de datos: {fechaHora(k.ultima_actualizacion)} (hora peninsular) · <Link href="/actualizaciones" className="enlace">ver detalle</Link>
          </p>
        )}
      </Contenedor>

      <Contenedor className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">Actividad reciente</h2>
          <Link href="/licitaciones" className="text-sm enlace">Ver todas las licitaciones →</Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {act.licitaciones.map((l) => (
            <Link key={l.id} href={`/licitaciones/${l.id}`} className="card group flex flex-col p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <Estado v={l.estado} />
                <span className="text-xs text-stone-500">{fecha(l.fecha_publicacion)}</span>
              </div>
              <h3 className="mt-3 line-clamp-3 font-medium text-stone-900 group-hover:text-vino-800">{l.objeto}</h3>
              <p className="mt-2 line-clamp-1 text-sm text-stone-500">{l.organismo}</p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-lg font-semibold tabular-nums">{euros(l.presupuesto_base)}</span>
                <span className="flex gap-1">{l.tipo && <span className="text-xs text-stone-500">{l.tipo}</span>} <Fuente v={l.fuente} /></span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
              <h2 className="font-semibold">Últimas adjudicaciones</h2>
              <Link href="/adjudicaciones" className="text-sm enlace">Ver más</Link>
            </div>
            <ul className="divide-y divide-stone-100">
              {act.adjudicaciones.map((a, i) => {
                const href = enlaceEmpresa({ empresa_id: a.empresa_id });
                return (
                  <li key={i} className="flex items-start justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      {href ? <Link href={href} className="font-medium text-stone-900 hover:text-vino-700">{a.nombre_origen}</Link> : <span className="font-medium">{a.nombre_origen}</span>}
                      <Link href={`/licitaciones/${a.licitacion_id}`} className="mt-0.5 line-clamp-1 block text-sm text-stone-500 hover:text-vino-700">{a.objeto}</Link>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold tabular-nums">{euros(a.importe)}</div>
                      <div className="text-xs text-stone-500">{fecha(a.fecha)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
              <h2 className="font-semibold">Últimas ayudas a entidades</h2>
              <Link href="/subvenciones" className="text-sm enlace">Ver más</Link>
            </div>
            <ul className="divide-y divide-stone-100">
              {act.subvenciones.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/subvenciones/${s.id}`} className="font-medium text-stone-900 hover:text-vino-700">{suavizarMayusculas(s.beneficiario_nombre)}</Link>
                    <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">{suavizarMayusculas(s.convocatoria)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums">{euros(s.importe)}</div>
                    <div className="text-xs text-stone-500">{fecha(s.fecha_concesion)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card mt-10 grid gap-6 p-6 md:grid-cols-3">
          <div>
            <h2 className="font-semibold">Datos abiertos, con su fuente</h2>
            <p className="mt-2 text-sm text-stone-600">Cada registro enlaza al expediente oficial. Puedes descargar cualquier listado filtrado en CSV.</p>
          </div>
          <div>
            <h2 className="font-semibold">Actualización diaria</h2>
            <p className="mt-2 text-sm text-stone-600">Un proceso automático consulta cada día los conjuntos de datos del Gobierno de La Rioja, PLACE y la BDNS.</p>
          </div>
          <div>
            <h2 className="font-semibold">Sin registro ni rastreo</h2>
            <p className="mt-2 text-sm text-stone-600">No pedimos datos personales ni usamos analítica de terceros. <Link href="/metodologia" className="enlace">Cómo trabajamos</Link>.</p>
          </div>
        </section>
      </Contenedor>
    </>
  );
}

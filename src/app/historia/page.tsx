import Link from "next/link";
import type { Metadata } from "next";
import { Cabecera, Contenedor, Estado, SinBD, Vacio } from "@/components/ui";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, fecha, numero } from "@/lib/format";
import { str, type SP } from "@/lib/params";
import { historialPorNombre, sugerirNombres } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Historial por adjudicatario" };

export default async function Historia({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const empresa = str(sp, "empresa");
  const q = str(sp, "q");
  const [filas, sugerencias] = await Promise.all([empresa ? historialPorNombre(empresa) : [], q ? sugerirNombres(q) : []]);
  const total = filas.reduce((a, f) => a + (f.importe ?? 0), 0);
  return (
    <>
      <Cabecera titulo="Historial por adjudicatario" subtitulo="Cronología de adjudicaciones por denominación exacta, tal como figura en la fuente. Útil cuando la empresa no tiene NIF publicado." />
      <Contenedor className="py-6">
        <form className="card mb-4 flex gap-2 p-4" action="/historia">
          <input className="input" name="q" placeholder="Escribe parte del nombre…" defaultValue={q ?? empresa} aria-label="Nombre del adjudicatario" />
          <button className="btn-primario">Buscar</button>
        </form>
        {sugerencias.length > 0 && (
          <div className="card mb-6 p-4">
            <p className="mb-2 text-sm text-stone-500">Elige la denominación exacta:</p>
            <ul className="flex flex-wrap gap-2 text-sm">
              {sugerencias.map((s) => (
                <li key={s.nombre}><Link className="rounded-full bg-stone-100 px-3 py-1 hover:bg-vino-50" href={`/historia?empresa=${encodeURIComponent(s.nombre)}`}>{s.nombre} <span className="text-stone-500">({s.n})</span></Link></li>
              ))}
            </ul>
          </div>
        )}
        {empresa && (filas.length === 0 ? <Vacio titulo={`Sin adjudicaciones para «${empresa}»`} /> : (
          <>
            <p className="mb-3 text-sm text-stone-600"><strong>{empresa}</strong>: {numero(filas.length)} adjudicaciones · {euros(total)}{filas.length === 500 && " (se muestran las 500 más recientes)"}</p>
            <ol className="relative space-y-4 border-l-2 border-vino-100 pl-6">
              {filas.map((f, i) => (
                <li key={i} className="card relative p-4">
                  <span className="absolute top-5 -left-[31px] h-3 w-3 rounded-full border-2 border-white bg-vino-600" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500"><span className="font-medium text-stone-700">{fecha(f.fecha)}</span><Estado v={f.estado} />{f.nif_origen && <span className="font-mono">NIF {f.nif_origen}</span>}</div>
                  <Link href={`/licitaciones/${f.licitacion_id}`} className="mt-1 block font-medium hover:text-vino-700">{f.objeto}</Link>
                  <div className="mt-1 flex flex-wrap justify-between gap-2 text-sm text-stone-600"><span>{f.organismo}</span><span className="tabular-nums">Adjudicado {euros(f.importe)} · Presupuesto {euros(f.presupuesto_base)}</span></div>
                </li>
              ))}
            </ol>
          </>
        ))}
      </Contenedor>
    </>
  );
}

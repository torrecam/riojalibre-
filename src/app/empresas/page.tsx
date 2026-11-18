import Link from "next/link";
import type { Metadata } from "next";
import { Cabecera, Conmutador, Contenedor, SinBD, Vacio } from "@/components/ui";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, numero } from "@/lib/format";
import { str, type SP } from "@/lib/params";
import { enlaceEmpresa, rankingEmpresas } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Empresas" };

export default async function Empresas({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const por = str(sp, "por") ?? "importe";
  const filas = await rankingEmpresas(sp);
  return (
    <>
      <Cabecera
        titulo="Empresas y entidades"
        subtitulo="Las 300 principales por importe adjudicado. Se agrupan por NIF cuando la fuente lo publica; si no hay NIF, por nombre exacto."
      />
      <Contenedor className="py-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form action="/empresas" className="flex w-full max-w-lg gap-2">
            {por !== "importe" && <input type="hidden" name="por" value={por} />}
            <label htmlFor="q" className="sr-only">Buscar empresa</label>
            <input className="input" id="q" name="q" placeholder="Nombre o NIF…" defaultValue={str(sp, "q")} />
            <button className="btn-primario">Buscar</button>
          </form>
          <Conmutador
            sp={sp}
            base="/empresas"
            param="por"
            actual={por}
            opciones={[
              { v: "importe", label: "Importe contratos" },
              { v: "contratos", label: "Nº contratos" },
              { v: "menores", label: "Menores" },
              { v: "subvenciones", label: "Subvenciones" },
            ]}
          />
        </div>
        {filas.length === 0 ? (
          <Vacio titulo="No hay empresas que coincidan" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr><th>#</th><th>Empresa</th><th>NIF</th><th className="num">Contratos</th><th className="num">Importe contratos</th><th className="num">Menores</th><th className="num">Subvenciones</th></tr>
              </thead>
              <tbody>
                {filas.map((e, i) => (
                  <tr key={e.id}>
                    <td className="text-stone-400 tabular-nums">{i + 1}</td>
                    <td className="min-w-64"><Link href={enlaceEmpresa(e)!} className="font-medium hover:text-vino-700">{e.nombre}</Link></td>
                    <td className="font-mono text-xs whitespace-nowrap">{e.nif ?? <span className="text-stone-400">sin NIF</span>}</td>
                    <td className="num">{numero(e.contratos)}</td>
                    <td className="num font-semibold">{euros(e.importe_contratos)}</td>
                    <td className="num text-stone-600">{e.menores ? euros(e.importe_menores) : "—"}</td>
                    <td className="num text-stone-600">{e.subvenciones ? euros(e.importe_subvenciones) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-stone-500">
          Limitación: una misma empresa puede aparecer con variantes de razón social cuando la fuente no publica NIF. Las UTE tienen NIF propio y
          figuran aparte de sus socias.
        </p>
      </Contenedor>
    </>
  );
}

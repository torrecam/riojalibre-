import type { Metadata } from "next";
import { Network } from "lucide-react";
import { Cabecera, Contenedor, SinBD } from "@/components/ui";
import { Grafo } from "@/components/Grafo";
import { hayBaseDeDatos } from "@/lib/db";
import { numParam, str, type SP } from "@/lib/params";
import { red } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Red de adjudicatarios" };

export default async function Red({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const nOrg = Math.min(60, Math.max(5, numParam(sp, "organismos") ?? 25));
  const nEmp = Math.min(40, Math.max(3, numParam(sp, "empresas") ?? 15));
  const aristas = await red(nOrg, nEmp);
  const organismos = new Set(aristas.map((a) => a.organismo_id)).size;
  const empresas = new Set(aristas.map((a) => a.empresa_id)).size;
  return (
    <>
      <Cabecera
        titulo="Red de adjudicatarios"
        icono={<Network />}
        subtitulo="Quién contrata con quién"
        chips={<><span className="chip bg-vino-50 text-vino-700">{organismos} organismos</span><span className="chip bg-vid-50 text-vid-700">{empresas} empresas</span><span className="chip bg-stone-100 text-stone-600">{aristas.length} relaciones</span></>}
      />
      <Contenedor className="py-6">
        <form className="mb-4 flex flex-wrap items-end gap-3 text-sm" action="/red">
          <div>
            <label className="label" htmlFor="organismos">Organismos</label>
            <input className="input w-24" type="number" min={5} max={60} id="organismos" name="organismos" defaultValue={nOrg} />
          </div>
          <div>
            <label className="label" htmlFor="empresas">Empresas por organismo</label>
            <input className="input w-24" type="number" min={3} max={40} id="empresas" name="empresas" defaultValue={nEmp} />
          </div>
          <button className="btn-secundario">Actualizar</button>
          <span className="text-stone-500">Arrastra nodos · rueda para zoom · clic para ver conexiones</span>
        </form>
        <Grafo key={`${nOrg}-${nEmp}`} aristas={aristas} destacada={str(sp, "empresa")} />
      </Contenedor>
    </>
  );
}

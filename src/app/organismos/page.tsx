import Link from "next/link";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { Cabecera, Conmutador, Contenedor, Etiqueta, SinBD, Vacio } from "@/components/ui";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, numero } from "@/lib/format";
import { str, type SP } from "@/lib/params";
import { listaOrganismos } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Organismos" };

const AMBITOS: Record<string, string> = { autonomico: "Autonómico", local: "Local", estatal: "Estatal", otros: "Otros" };

export default async function Organismos({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const filas = await listaOrganismos(sp);
  return (
    <>
      <Cabecera titulo="Organismos" icono={<Building2 />} subtitulo="Consejerías, ayuntamientos y órganos estatales" />
      <Contenedor className="py-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form action="/organismos" className="flex w-full max-w-lg gap-2">
            {str(sp, "ambito") && <input type="hidden" name="ambito" value={str(sp, "ambito")} />}
            <input className="input" name="q" placeholder="Buscar organismo…" defaultValue={str(sp, "q")} aria-label="Buscar organismo" />
            <button className="btn-primario">Buscar</button>
          </form>
          <Conmutador sp={sp} base="/organismos" param="ambito" actual={str(sp, "ambito") ?? ""}
            opciones={[{ v: "", label: "Todos" }, { v: "autonomico", label: "Autonómicos" }, { v: "local", label: "Locales" }, { v: "estatal", label: "Estatales" }, { v: "otros", label: "Otros" }]} />
        </div>
        <p className="mb-3 text-sm text-stone-600"><strong className="text-stone-900">{numero(filas.length)}</strong> organismos</p>
        {filas.length === 0 ? <Vacio titulo="Sin resultados" /> : (
          <div className="card overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Organismo</th><th>Ámbito</th><th className="num">Licitaciones</th><th className="num">Adjudicado</th><th className="num">Menores</th></tr></thead>
              <tbody>
                {filas.map((o) => (
                  <tr key={o.id}>
                    <td className="min-w-72"><Link href={`/organismos/${o.id}`} className="font-medium hover:text-vino-700">{o.nombre}</Link>{o.ciudad && <div className="text-xs text-stone-500">{o.ciudad}</div>}</td>
                    <td><Etiqueta>{AMBITOS[o.ambito ?? ""] ?? "—"}</Etiqueta></td>
                    <td className="num">{numero(o.licitaciones)}</td>
                    <td className="num font-semibold">{euros(o.importe_adjudicado)}</td>
                    <td className="num text-stone-600">{o.menores ? euros(o.importe_menores) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Contenedor>
    </>
  );
}

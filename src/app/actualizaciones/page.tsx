import type { Metadata } from "next";
import { Cabecera, Contenedor, SinBD } from "@/components/ui";
import { hayBaseDeDatos } from "@/lib/db";
import { fechaHora, numero } from "@/lib/format";
import { ultimasEjecuciones } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estado de las cargas", robots: { index: false } };

const NOMBRES: Record<string, string> = { "larioja.org": "Gobierno de La Rioja (opd-179)", place: "PLACE (sindicación)", menores: "Contratos menores", bdns: "BDNS" };

export default async function Actualizaciones() {
  if (!hayBaseDeDatos()) return <SinBD />;
  const runs = await ultimasEjecuciones();
  return (
    <>
      <Cabecera titulo="Estado de las cargas de datos" subtitulo="Últimas ejecuciones del proceso automático de ingesta (GitHub Actions). Horas en horario peninsular español." />
      <Contenedor className="py-6">
        <div className="card overflow-x-auto">
          <table className="tabla">
            <thead><tr><th>Inicio</th><th>Fuente</th><th>Modo</th><th>Resultado</th><th className="num">Leídos</th><th className="num">Nuevos</th><th className="num">Actualizados</th><th className="num">Descartados</th></tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{fechaHora(r.started_at)}</td>
                  <td>{NOMBRES[r.fuente] ?? r.fuente}</td>
                  <td className="text-stone-500">{r.modo}</td>
                  <td>{r.ok === null ? <span className="text-amber-600">En curso…</span> : r.ok ? <span className="text-emerald-700">Correcto</span> : <span className="text-red-700" title={r.error ?? ""}>Error</span>}</td>
                  <td className="num">{numero(r.leidos)}</td>
                  <td className="num">{numero(r.insertados)}</td>
                  <td className="num">{numero(r.actualizados)}</td>
                  <td className="num">{numero(r.omitidos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Contenedor>
    </>
  );
}

import Link from "next/link";
import { Download, HandCoins } from "lucide-react";
import type { Metadata } from "next";
import { Cabecera, Contenedor, Etiqueta, Paginacion, SinBD, Vacio } from "@/components/ui";
import { hayBaseDeDatos } from "@/lib/db";
import { euros, eurosCompacto, fecha, numero, suavizarMayusculas } from "@/lib/format";
import { fechaParam, numParam, pagina, qs, str, type SP } from "@/lib/params";
import { TAM_PAGINA } from "@/lib/queries/licitaciones";
import { buscarSubvenciones, nivelesSubvenciones } from "@/lib/queries/subvenciones";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subvenciones" };

const NIVELES: Record<string, string> = { ESTADO: "Estado", AUTONOMICA: "Autonómica", LOCAL: "Local", OTROS: "Otros" };

export default async function Subvenciones({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hayBaseDeDatos()) return <SinBD />;
  const sp = await searchParams;
  const pag = pagina(sp);
  const [{ filas, total, importe }, niveles] = await Promise.all([buscarSubvenciones(sp, pag), nivelesSubvenciones()]);
  return (
    <>
      <Cabecera
        titulo="Subvenciones y ayudas"
        icono={<HandCoins />}
        subtitulo={<>Ayudas con impacto en La Rioja · fuente <a className="enlace" href="https://www.infosubvenciones.es/" target="_blank" rel="noreferrer">BDNS</a></>}
        acciones={<a className="btn-secundario" href={`/api/subvenciones/csv${qs(sp, { pagina: undefined })}`}><Download className="h-4 w-4" /> CSV</a>}
      />
      <Contenedor className="py-6">
        <form className="card mb-4 grid gap-3 p-4 md:grid-cols-6 md:items-end" action="/subvenciones">
          <div className="md:col-span-2">
            <label className="label" htmlFor="q">Beneficiario, NIF o convocatoria</label>
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
            <label className="label" htmlFor="nivel">Administración</label>
            <select className="input" id="nivel" name="nivel" defaultValue={str(sp, "nivel") ?? ""}>
              <option value="">Todas</option>
              {niveles.map((n) => <option key={n.v} value={n.v}>{NIVELES[n.v] ?? n.v} ({numero(n.n)})</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="beneficiario">Beneficiario</label>
            <select className="input" id="beneficiario" name="beneficiario" defaultValue={str(sp, "beneficiario") ?? ""}>
              <option value="">Todos</option>
              <option value="juridicas">Empresas y entidades</option>
              <option value="fisicas">Personas físicas</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="importe">Importe mín. €</label>
            <input className="input" id="importe" name="importe" inputMode="numeric" defaultValue={numParam(sp, "importe")} />
          </div>
          <div>
            <label className="label" htmlFor="orden">Orden</label>
            <select className="input" id="orden" name="orden" defaultValue={str(sp, "orden") ?? ""}>
              <option value="">Más recientes</option>
              <option value="fecha_asc">Más antiguas</option>
              <option value="importe_desc">Mayor importe</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button className="btn-primario flex-1">Buscar</button>
            <Link href="/subvenciones" className="btn-secundario">Limpiar</Link>
          </div>
        </form>
        <p className="mb-3 text-sm text-stone-600">
          <strong className="text-stone-900">{numero(total)}</strong> concesiones · <strong className="text-stone-900">{eurosCompacto(importe)}</strong>
        </p>
        {filas.length === 0 ? (
          <Vacio titulo="Sin resultados">Filtra por fecha, beneficiario o NIF.</Vacio>
        ) : (
          <div className="card overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Beneficiario</th><th>Convocatoria</th><th>Concedente</th><th>Fecha</th><th className="num">Importe</th></tr></thead>
              <tbody>
                {filas.map((s) => (
                  <tr key={s.id}>
                    <td className="min-w-52">
                      <Link href={`/subvenciones/${s.id}`} className="font-medium hover:text-vino-700">{suavizarMayusculas(s.beneficiario_nombre)}</Link>
                      <div className="font-mono text-xs text-stone-500">{s.es_persona_fisica ? "Persona física" : s.beneficiario_nif}</div>
                    </td>
                    <td className="min-w-72">
                      <div className="line-clamp-2 text-stone-700">{suavizarMayusculas(s.convocatoria)}</div>
                      {s.instrumento && <Etiqueta>{suavizarMayusculas(s.instrumento).slice(0, 40)}</Etiqueta>}
                    </td>
                    <td className="min-w-48 text-stone-600">
                      <div className="line-clamp-2">{suavizarMayusculas(s.nivel3 ?? s.nivel2)}</div>
                      <div className="text-xs text-stone-400">{NIVELES[s.nivel1 ?? ""] ?? s.nivel1}</div>
                    </td>
                    <td className="whitespace-nowrap text-stone-600">{fecha(s.fecha_concesion)}</td>
                    <td className="num font-semibold">{euros(s.importe, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion sp={sp} base="/subvenciones" pagina={pag} total={total} tam={TAM_PAGINA} />
      </Contenedor>
    </>
  );
}

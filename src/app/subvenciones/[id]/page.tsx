import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Cabecera, Contenedor, Dato, EnlaceExterno, Seccion } from "@/components/ui";
import { euros, fecha, suavizarMayusculas } from "@/lib/format";
import { subvencion } from "@/lib/queries/subvenciones";

export const dynamic = "force-dynamic";

const NIVELES: Record<string, string> = { ESTADO: "Administración General del Estado", AUTONOMICA: "Comunidad autónoma", LOCAL: "Entidad local", OTROS: "Otros" };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const d = await subvencion((await params).id);
  return { title: d ? `Subvención a ${d.s.beneficiario_nombre}` : "Subvención no encontrada" };
}

export default async function FichaSubvencion({ params }: { params: Promise<{ id: string }> }) {
  const d = await subvencion((await params).id);
  if (!d) notFound();
  const { s, otras } = d;
  const urlBdns = s.numero_convocatoria ? `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${s.numero_convocatoria}` : null;
  const urlBases = s.url_bases ? (String(s.url_bases).startsWith("http") ? s.url_bases : `https://${s.url_bases}`) : null;
  return (
    <>
      <Cabecera
        migas={[{ href: "/subvenciones", label: "Subvenciones" }]}
        titulo={suavizarMayusculas(s.convocatoria) || "Concesión de subvención"}
        subtitulo={<>Concesión de {suavizarMayusculas(s.nivel3 ?? s.nivel2)}</>}
        acciones={<div className="flex flex-col items-end gap-1"><EnlaceExterno href={urlBdns}>Ver convocatoria en la BDNS</EnlaceExterno>{urlBases && <EnlaceExterno href={urlBases}>Bases reguladoras</EnlaceExterno>}</div>}
      />
      <Contenedor className="grid gap-6 py-6 lg:grid-cols-3">
        <Seccion titulo="Datos de la concesión" className="lg:col-span-2">
          <dl className="divide-y divide-stone-100 px-5">
            <Dato etiqueta="Importe concedido"><span className="text-lg font-semibold">{euros(s.importe, true)}</span></Dato>
            {s.ayuda_equivalente !== null && s.ayuda_equivalente !== s.importe && <Dato etiqueta="Ayuda equivalente">{euros(s.ayuda_equivalente, true)}</Dato>}
            <Dato etiqueta="Beneficiario">{suavizarMayusculas(s.beneficiario_nombre)}</Dato>
            <Dato etiqueta="NIF">
              {s.es_persona_fisica ? <span className="text-stone-500">Persona física (dato seudonimizado en la fuente)</span> : (
                <>
                  <span className="font-mono">{s.beneficiario_nif ?? "—"}</span>
                  {s.empresa_id && <Link className="ml-3 text-sm enlace" href={s.empresa_nif ? `/empresas/${encodeURIComponent(s.empresa_nif)}` : `/empresas/${s.empresa_id}`}>Ver perfil</Link>}
                </>
              )}
            </Dato>
            <Dato etiqueta="Instrumento">{suavizarMayusculas(s.instrumento)}</Dato>
            <Dato etiqueta="Fecha de concesión">{fecha(s.fecha_concesion)}</Dato>
            <Dato etiqueta="Administración">{NIVELES[s.nivel1] ?? s.nivel1}</Dato>
            <Dato etiqueta="Concedente">{[s.nivel2, s.nivel3].filter(Boolean).map((x: string) => suavizarMayusculas(x)).join(" · ")}</Dato>
            <Dato etiqueta="Convocatoria (código BDNS)"><span className="font-mono">{s.numero_convocatoria ?? "—"}</span></Dato>
            <Dato etiqueta="Código de concesión"><span className="font-mono">{s.cod_concesion}</span></Dato>
            <Dato etiqueta="Registrada en la BDNS">{fecha(s.fecha_alta)}</Dato>
          </dl>
        </Seccion>
        <Seccion titulo="Otras concesiones de la convocatoria">
          {otras.length === 0 ? (
            <p className="px-5 py-4 text-sm text-stone-500">No hay más concesiones de esta convocatoria en La Rioja.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {otras.map((o) => (
                <li key={o.id} className="flex justify-between gap-3 px-5 py-2.5 text-sm">
                  <Link href={`/subvenciones/${o.id}`} className="min-w-0 truncate hover:text-vino-700">{suavizarMayusculas(o.beneficiario_nombre)}</Link>
                  <span className="shrink-0 tabular-nums">{euros(o.importe)}</span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </Contenedor>
    </>
  );
}

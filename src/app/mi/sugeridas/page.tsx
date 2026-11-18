import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarClock, Euro, Landmark, Sparkles } from "lucide-react";
import { Contenedor, Vacio } from "@/components/ui";
import { Anillo, textoTono } from "@/components/cuenta/Idoneidad";
import { AccionesRapidas } from "@/components/cuenta/AccionesRapidas";
import { EstadoChip } from "@/components/cuenta/EstadoChip";
import { eurosCompacto, suavizarMayusculas } from "@/lib/format";
import { qs, str, type SP } from "@/lib/params";
import { diasHasta, textoDias } from "@/lib/plazos";
import { requerirUsuario } from "@/lib/usuario";
import { perfilDe, sugeridas } from "@/lib/queries/usuario";
import { TIPOS_CONTRATO } from "@/lib/catalogos";

export const metadata: Metadata = { title: "Sugeridas" };
export const dynamic = "force-dynamic";

const NIVELES = [{ v: "0", t: "Todas" }, { v: "45", t: "≥ 45" }, { v: "70", t: "≥ 70" }];
const ORDENES = [{ v: "", t: "Idoneidad" }, { v: "plazo", t: "Plazo" }, { v: "importe", t: "Importe" }];

export default async function Sugeridas({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const u = await requerirUsuario("/mi/sugeridas");
  const { perfil } = await perfilDe(u.id);
  if (!perfil?.onboarding_completo) redirect("/mi/bienvenida");
  const min = Number(str(sp, "min") ?? 0) || 0;
  const tipo = str(sp, "tipo");
  const q = str(sp, "q")?.toLowerCase();
  const verSeguidas = str(sp, "seguidas") === "1";
  const orden = str(sp, "orden") ?? "";
  const todas = await sugeridas(u.id);
  let filas = todas.filter((s) => s.puntuacion >= min && (!tipo || s.tipo === tipo) && (verSeguidas || !s.seguimiento)
    && (!q || `${s.objeto} ${s.organismo}`.toLowerCase().includes(q)));
  if (orden === "plazo") filas = [...filas].sort((a, b) => +(a.fecha_fin_ofertas ?? 8e15) - +(b.fecha_fin_ofertas ?? 8e15));
  if (orden === "importe") filas = [...filas].sort((a, b) => (b.presupuesto_base ?? 0) - (a.presupuesto_base ?? 0));
  const enlace = (cambios: Record<string, string | undefined>) => `/mi/sugeridas${qs(sp, cambios)}`;

  return (
    <>
      <div className="fondo-aurora border-b border-stone-200/70">
        <Contenedor className="py-8">
          <h1 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-vino-500 to-vino-800 text-white shadow-lg shadow-vino-900/20"><Sparkles className="h-5 w-5" /></span>
            Sugeridas para ti
          </h1>
          <p className="mt-2 text-stone-500">{todas.length} licitaciones abiertas puntuadas con tu perfil. <Link href="/mi/perfil" className="enlace">Ajustar perfil</Link></p>
          <form className="mt-5 flex flex-wrap items-center gap-2" action="/mi/sugeridas">
            <input name="q" defaultValue={str(sp, "q")} placeholder="Filtrar por texto…" className="input w-full py-2 text-sm sm:w-64" />
            {min ? <input type="hidden" name="min" value={min} /> : null}
            <select name="tipo" defaultValue={tipo ?? ""} className="input w-full py-2 text-sm sm:w-56">
              <option value="">Todos los tipos</option>
              {TIPOS_CONTRATO.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-secundario py-2 text-sm">Filtrar</button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-stone-500">Idoneidad:</span>
            {NIVELES.map((n) => (
              <Link key={n.v} href={enlace({ min: n.v === "0" ? undefined : n.v })} className={`chip ${String(min) === n.v ? "!bg-vino-700 !text-white" : ""}`}>{n.t}</Link>
            ))}
            <span className="ml-2 text-stone-500">Orden:</span>
            {ORDENES.map((n) => (
              <Link key={n.v} href={enlace({ orden: n.v || undefined })} className={`chip ${orden === n.v ? "!bg-vino-700 !text-white" : ""}`}>{n.t}</Link>
            ))}
            <Link href={enlace({ seguidas: verSeguidas ? undefined : "1" })} className={`chip ${verSeguidas ? "!bg-vino-700 !text-white" : ""}`}>{verSeguidas ? "Incluye seguidas" : "Ocultando seguidas"}</Link>
          </div>
        </Contenedor>
      </div>
      <Contenedor className="py-6">
        {filas.length === 0 ? (
          <Vacio titulo="Nada con estos filtros">Baja el umbral de idoneidad o amplía sectores y palabras clave en tu perfil.</Vacio>
        ) : (
          <ul className="grid gap-3">
            {filas.slice(0, 80).map((s) => {
              const d = diasHasta(s.fecha_fin_ofertas);
              return (
                <li key={s.licitacion_id} className="card card-hover flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1">
                    <Anillo p={s.puntuacion} tam={72} />
                    <span className="text-xs font-medium text-stone-500">{textoTono(s.puntuacion)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/mi/licitaciones/${s.licitacion_id}`} className="line-clamp-2 font-semibold text-stone-900 hover:text-vino-700">{suavizarMayusculas(s.objeto)}</Link>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1"><Landmark className="h-3.5 w-3.5" />{s.organismo ?? "—"}</span>
                      <span className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" />{eurosCompacto(s.presupuesto_base)}</span>
                      <span className={`flex items-center gap-1 ${d !== null && d < perfil.plazo_preparacion_dias ? "font-semibold text-vino-700" : ""}`}><CalendarClock className="h-3.5 w-3.5" />{textoDias(d)}</span>
                      {s.tipo && <span>{s.tipo}</span>}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {s.positivos.slice(0, 3).map((m, i) => <span key={i} className="rounded-full bg-vid-50 px-2 py-0.5 text-xs text-vid-700">✓ {m.criterio === "Tipo" ? `Tipo ${m.texto}` : m.texto.length > 56 ? m.texto.slice(0, 54) + "…" : m.texto}</span>)}
                      {s.negativos.filter((m) => m.puntos < 0).slice(0, 2).map((m, i) => <span key={i} className="rounded-full bg-vino-50 px-2 py-0.5 text-xs text-vino-800">✗ {m.texto}</span>)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center sm:items-start">
                    {s.seguimiento ? <EstadoChip e={s.seguimiento} /> : <AccionesRapidas licitacionId={s.licitacion_id} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Contenedor>
    </>
  );
}

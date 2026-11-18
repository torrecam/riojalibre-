import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, KanbanSquare, Sparkles, Trophy } from "lucide-react";
import { Contenedor, Kpi, Seccion } from "@/components/ui";
import { Insignia } from "@/components/cuenta/Idoneidad";
import { EstadoChip } from "@/components/cuenta/EstadoChip";
import { ESTADOS_UI } from "@/components/cuenta/estados";
import { eurosCompacto, fecha, suavizarMayusculas } from "@/lib/format";
import { diasHasta, textoDias } from "@/lib/plazos";
import { requerirUsuario } from "@/lib/usuario";
import { kpisPanel, perfilDe, seguimientosDe } from "@/lib/queries/usuario";

export const metadata: Metadata = { title: "Panel" };
export const dynamic = "force-dynamic";

export default async function Panel() {
  const u = await requerirUsuario("/mi");
  const { perfil } = await perfilDe(u.id);
  if (!perfil?.onboarding_completo) redirect("/mi/bienvenida");
  const [k, segs] = await Promise.all([kpisPanel(u.id), seguimientosDe(u.id)]);
  const umbral = perfil.alertas_umbral ?? 60;
  const nuevas = k.sugeridas.filter((s) => !s.seguimiento && s.puntuacion >= umbral);
  const activos = segs.filter((s) => ["interesa", "preparando", "presentada"].includes(s.estado));
  const proximos = activos
    .map((s) => ({ ...s, limite: s.fecha_limite_interna ?? s.fecha_fin_ofertas }))
    .filter((s) => s.limite)
    .sort((a, b) => +new Date(a.limite as string) - +new Date(b.limite as string))
    .slice(0, 6);
  const exito = k.resueltas ? Math.round((k.ganadas / k.resueltas) * 100) : null;

  return (
    <>
      <div className="fondo-aurora border-b border-stone-200/70">
        <Contenedor className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-entrar">
            <p className="text-sm font-medium text-vino-700">Hola{perfil.empresa ? `, ${perfil.empresa}` : ""} 👋</p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">Tu panel de licitaciones</h1>
            <p className="mt-1.5 text-stone-500">{nuevas.length ? `Tienes ${nuevas.length} licitaciones abiertas con idoneidad ≥ ${umbral}.` : "Ninguna licitación nueva supera tu umbral ahora mismo."}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/mi/sugeridas" className="btn btn-primario"><Sparkles className="h-4 w-4" /> Ver sugeridas</Link>
            <Link href="/mi/tablero" className="btn btn-secundario"><KanbanSquare className="h-4 w-4" /> Tablero</Link>
          </div>
        </Contenedor>
      </div>
      <Contenedor className="grid grid-cols-2 gap-3 pt-6 lg:grid-cols-4">
        <Kpi etiqueta="Nuevas sugerencias" icono={<Sparkles />} valor={nuevas.length} detalle={`idoneidad ≥ ${umbral}, sin seguir`} href="/mi/sugeridas" />
        <Kpi etiqueta="En curso" icono={<KanbanSquare />} valor={k.activos} detalle="interesa · preparando · presentada" href="/mi/tablero" />
        <Kpi etiqueta="Vencen en 7 días" icono={<CalendarClock />} valor={k.plazo7} detalle="plazo interno u oficial" />
        <Kpi etiqueta="Tasa de éxito" icono={<Trophy />} valor={exito === null ? "—" : `${exito} %`} detalle={k.resueltas ? `${k.ganadas} ganadas de ${k.resueltas} resueltas` : "aún sin resultados"} />
      </Contenedor>
      <Contenedor className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-3">
        <Seccion className="lg:col-span-2" titulo="Mejores oportunidades abiertas" icono={<Sparkles />} accion={<Link href="/mi/sugeridas" className="text-sm enlace">Ver todas</Link>}>
          {nuevas.length === 0 && k.sugeridas.length === 0 ? (
            <p className="px-5 py-6 text-sm text-stone-500">No hay licitaciones abiertas que puntuar. <Link className="enlace" href="/mi/perfil">Revisa tu perfil</Link>.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {(nuevas.length ? nuevas : k.sugeridas).slice(0, 6).map((s) => {
                const d = diasHasta(s.fecha_fin_ofertas);
                return (
                  <li key={s.licitacion_id}>
                    <Link href={`/mi/licitaciones/${s.licitacion_id}`} className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-stone-50">
                      <Insignia p={s.puntuacion} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm font-medium text-stone-900">{suavizarMayusculas(s.objeto)}</div>
                        <div className="mt-0.5 truncate text-xs text-stone-500">{s.organismo} · {eurosCompacto(s.presupuesto_base)} · {textoDias(d)}</div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Seccion>
        <div className="space-y-6">
          <Seccion titulo="Próximos plazos" icono={<CalendarClock />}>
            {proximos.length === 0 ? <p className="px-5 py-6 text-sm text-stone-500">Sin plazos pendientes.</p> : (
              <ul className="divide-y divide-stone-100">
                {proximos.map((s) => {
                  const d = diasHasta(s.limite);
                  return (
                    <li key={s.id}>
                      <Link href={`/mi/licitaciones/${s.licitacion_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50">
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-center text-xs leading-tight font-bold ${d !== null && d <= 3 ? "bg-vino-50 text-vino-800" : "bg-stone-100 text-stone-700"}`}>{textoDias(d)}</div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{suavizarMayusculas(s.objeto)}</div>
                          <div className="text-xs text-stone-500">{s.fecha_limite_interna ? "Plazo interno" : "Fin de ofertas"} · {fecha(s.limite)}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Seccion>
          <Seccion titulo="Tu embudo" icono={<KanbanSquare />}>
            <ul className="space-y-2 px-5 py-4">
              {ESTADOS_UI.map((e) => {
                const n = segs.filter((s) => s.estado === e.v).length;
                const max = Math.max(1, segs.length);
                return (
                  <li key={e.v} className="flex items-center gap-3">
                    <EstadoChip e={e.v} className="w-36 shrink-0 justify-start" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: e.punto }} /></div>
                    <span className="w-6 text-right text-sm font-semibold tabular-nums">{n}</span>
                  </li>
                );
              })}
            </ul>
          </Seccion>
        </div>
      </Contenedor>
    </>
  );
}

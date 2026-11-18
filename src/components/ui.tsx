import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronRight as Sep, DatabaseZap, ExternalLink, SearchX } from "lucide-react";
import { qs, type SP } from "@/lib/params";
import { numero } from "@/lib/format";

export function Contenedor({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Cabecera({ titulo, subtitulo, migas, acciones, icono, chips }: { titulo: ReactNode; subtitulo?: ReactNode; migas?: { href: string; label: string }[]; acciones?: ReactNode; icono?: ReactNode; chips?: ReactNode }) {
  return (
    <div className="fondo-aurora relative overflow-hidden border-b border-stone-200/70">
      <div className="punteado pointer-events-none absolute inset-0 text-stone-300/40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <Contenedor className="relative py-8 sm:py-10">
        {migas && (
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-stone-500" aria-label="Migas de pan">
            <Link href="/" className="hover:text-vino-700">Inicio</Link>
            {migas.map((m) => (
              <span key={m.href} className="flex items-center gap-1">
                <Sep className="h-3 w-3 opacity-60" aria-hidden />
                <Link href={m.href} className="hover:text-vino-700">{m.label}</Link>
              </span>
            ))}
          </nav>
        )}
        <div className="flex animate-entrar flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            {icono && (
              <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-vino-500 to-vino-800 text-white shadow-lg shadow-vino-900/20 sm:grid [&>svg]:h-6 [&>svg]:w-6">
                {icono}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-balance text-stone-900 sm:text-4xl">{titulo}</h1>
              {subtitulo && <div className="mt-2 max-w-2xl text-stone-500">{subtitulo}</div>}
              {chips && <div className="mt-3 flex flex-wrap gap-2">{chips}</div>}
            </div>
          </div>
          {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
        </div>
      </Contenedor>
    </div>
  );
}

export function Kpi({ etiqueta, valor, detalle, href, icono }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode; href?: string; icono?: ReactNode }) {
  const cuerpo = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">{etiqueta}</div>
        {icono && <span className="grid h-8 w-8 place-items-center rounded-xl bg-vino-50 text-vino-700 [&>svg]:h-4 [&>svg]:w-4">{icono}</span>}
      </div>
      <div className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-stone-900 tabular-nums sm:text-3xl">{valor}</div>
      {detalle && <div className="mt-1 text-xs text-stone-500">{detalle}</div>}
    </>
  );
  return href ? (
    <Link href={href} className="card card-hover block p-5">{cuerpo}</Link>
  ) : (
    <div className="card p-5">{cuerpo}</div>
  );
}

const ESTILOS_ESTADO: Record<string, string> = {
  "En plazo": "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  "Anuncio previo": "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  "Pendiente de adjudicación": "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  Adjudicada: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/25 dark:text-indigo-300",
  Resuelta: "bg-stone-500/10 text-stone-600 ring-stone-500/20",
  Anulada: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300",
};

export function Estado({ v }: { v: string | null | undefined }) {
  if (!v) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${ESTILOS_ESTADO[v] ?? "bg-stone-500/10 text-stone-600 ring-stone-500/20"}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${v === "En plazo" ? "animate-pulse" : ""}`} aria-hidden />
      {v}
    </span>
  );
}

export function Etiqueta({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | "vino" | "vid" }) {
  const t = tono === "vino" ? "bg-vino-50 text-vino-700" : tono === "vid" ? "bg-vid-50 text-vid-700" : "bg-stone-100 text-stone-600";
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${t}`}>{children}</span>;
}

export function Fuente({ v }: { v: string }) {
  return <Etiqueta tono={v === "place" ? "vid" : "vino"}>{v === "place" ? "PLACE" : v === "larioja.org" ? "larioja.org" : v}</Etiqueta>;
}

export function EnlaceExterno({ href, children = "Ver en la fuente original" }: { href: string | null | undefined; children?: ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="group inline-flex items-center gap-1.5 text-sm enlace">
      {children}
      <ExternalLink className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
    </a>
  );
}

export function Paginacion({ sp, base, pagina, total, tam }: { sp: SP; base: string; pagina: number; total: number; tam: number }) {
  const paginas = Math.max(1, Math.ceil(total / tam));
  if (paginas <= 1) return null;
  const nums = new Set([1, paginas, pagina - 2, pagina - 1, pagina, pagina + 1, pagina + 2].filter((n) => n >= 1 && n <= paginas));
  const lista = [...nums].sort((a, b) => a - b);
  const link = (p: number) => `${base}${qs(sp, { pagina: p === 1 ? undefined : p })}`;
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm" aria-label="Paginación">
      <span className="text-stone-500 tabular-nums">
        {numero(pagina)} / {numero(paginas)}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {pagina > 1 && (
          <Link className="btn-secundario px-2.5 py-1.5" href={link(pagina - 1)} rel="prev" aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
        {lista.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            {i > 0 && lista[i - 1] !== p - 1 && <span className="px-1 text-stone-400">…</span>}
            <Link
              href={link(p)}
              aria-current={p === pagina ? "page" : undefined}
              className={`min-w-9 rounded-xl px-3 py-1.5 text-center font-medium tabular-nums transition ${p === pagina ? "bg-gradient-to-br from-vino-600 to-vino-800 text-white shadow-md shadow-vino-900/20" : "border border-stone-200 bg-surface hover:border-vino-300 hover:text-vino-700"}`}
            >
              {p}
            </Link>
          </span>
        ))}
        {pagina < paginas && (
          <Link className="btn-secundario px-2.5 py-1.5" href={link(pagina + 1)} rel="next" aria-label="Siguiente">
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-vino-50 text-vino-700">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold text-stone-900">{titulo}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function Seccion({ titulo, children, accion, className = "", icono }: { titulo: ReactNode; children: ReactNode; accion?: ReactNode; className?: string; icono?: ReactNode }) {
  return (
    <section className={`card revelar overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] font-bold text-stone-900">
          {icono && <span className="text-vino-600 [&>svg]:h-4 [&>svg]:w-4">{icono}</span>}
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-stone-500">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-medium text-stone-900 sm:col-span-2 sm:mt-0">{children ?? "—"}</dd>
    </div>
  );
}

export function Conmutador({ opciones, actual, sp, param, base }: { opciones: { v: string; label: string }[]; actual: string; sp: SP; param: string; base: string }) {
  return (
    <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100/70 p-0.5 text-xs">
      {opciones.map((o) => (
        <Link
          key={o.v}
          href={`${base}${qs(sp, { [param]: o.v === opciones[0].v ? undefined : o.v })}`}
          scroll={false}
          className={`rounded-lg px-2.5 py-1 font-semibold transition ${actual === o.v ? "bg-surface text-vino-800 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

export function SinBD() {
  return (
    <Contenedor className="py-16">
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <DatabaseZap className="h-10 w-10 text-vino-600" aria-hidden />
        <h3 className="mt-4 text-lg font-bold">Base de datos no configurada</h3>
        <p className="mt-2 max-w-md text-sm text-stone-500">Define <code>DATABASE_URL</code> y lanza la carga inicial (ver README).</p>
      </div>
    </Contenedor>
  );
}

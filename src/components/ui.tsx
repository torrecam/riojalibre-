import Link from "next/link";
import type { ReactNode } from "react";
import { qs, type SP } from "@/lib/params";
import { numero } from "@/lib/format";

export function Contenedor({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Cabecera({ titulo, subtitulo, migas, acciones }: { titulo: ReactNode; subtitulo?: ReactNode; migas?: { href: string; label: string }[]; acciones?: ReactNode }) {
  return (
    <div className="border-b border-stone-200 bg-white">
      <Contenedor className="py-8">
        {migas && (
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-stone-500" aria-label="Migas de pan">
            <Link href="/" className="hover:text-vino-700">Inicio</Link>
            {migas.map((m) => (
              <span key={m.href} className="flex items-center gap-1">
                <span aria-hidden>›</span>
                <Link href={m.href} className="hover:text-vino-700">{m.label}</Link>
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-balance text-stone-900 sm:text-3xl">{titulo}</h1>
            {subtitulo && <div className="mt-2 max-w-3xl text-stone-600">{subtitulo}</div>}
          </div>
          {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
        </div>
      </Contenedor>
    </div>
  );
}

export function Kpi({ etiqueta, valor, detalle, href }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode; href?: string }) {
  const cuerpo = (
    <>
      <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{etiqueta}</div>
      <div className="mt-1.5 text-2xl font-semibold text-stone-900 tabular-nums sm:text-3xl">{valor}</div>
      {detalle && <div className="mt-1 text-xs text-stone-500">{detalle}</div>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition-shadow hover:shadow-md">{cuerpo}</Link>
  ) : (
    <div className="card p-5">{cuerpo}</div>
  );
}

const ESTILOS_ESTADO: Record<string, string> = {
  "En plazo": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Anuncio previo": "bg-sky-50 text-sky-700 ring-sky-200",
  "Pendiente de adjudicación": "bg-amber-50 text-amber-700 ring-amber-200",
  Adjudicada: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Resuelta: "bg-stone-100 text-stone-700 ring-stone-200",
  Anulada: "bg-red-50 text-red-700 ring-red-200",
};

export function Estado({ v }: { v: string | null | undefined }) {
  if (!v) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${ESTILOS_ESTADO[v] ?? "bg-stone-100 text-stone-700 ring-stone-200"}`}>
      {v}
    </span>
  );
}

export function Etiqueta({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | "vino" | "vid" }) {
  const t = tono === "vino" ? "bg-vino-50 text-vino-700" : tono === "vid" ? "bg-vid-50 text-vid-700" : "bg-stone-100 text-stone-600";
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${t}`}>{children}</span>;
}

export function Fuente({ v }: { v: string }) {
  return <Etiqueta tono={v === "place" ? "vid" : "vino"}>{v === "place" ? "PLACE" : v === "larioja.org" ? "larioja.org" : v}</Etiqueta>;
}

export function EnlaceExterno({ href, children = "Ver en la fuente original" }: { href: string | null | undefined; children?: ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm enlace">
      {children}
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        <path d="M11 3h6v6h-2V6.41l-7.29 7.3-1.42-1.42L13.59 5H11V3z" />
        <path d="M5 5h4v2H5v8h8v-4h2v6H3V5h2z" />
      </svg>
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
    <nav className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm" aria-label="Paginación">
      <span className="text-stone-500">
        Página {numero(pagina)} de {numero(paginas)}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {pagina > 1 && <Link className="btn-secundario px-3 py-1.5" href={link(pagina - 1)} rel="prev">‹ Anterior</Link>}
        {lista.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            {i > 0 && lista[i - 1] !== p - 1 && <span className="px-1 text-stone-400">…</span>}
            <Link
              href={link(p)}
              aria-current={p === pagina ? "page" : undefined}
              className={`min-w-9 rounded-lg px-3 py-1.5 text-center ${p === pagina ? "bg-vino-700 text-white" : "border border-stone-300 bg-white hover:bg-stone-100"}`}
            >
              {p}
            </Link>
          </span>
        ))}
        {pagina < paginas && <Link className="btn-secundario px-3 py-1.5" href={link(pagina + 1)} rel="next">Siguiente ›</Link>}
      </div>
    </nav>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="text-3xl" aria-hidden>🔍</div>
      <h3 className="mt-3 font-semibold text-stone-900">{titulo}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function Seccion({ titulo, children, accion, className = "" }: { titulo: ReactNode; children: ReactNode; accion?: ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5">
        <h2 className="font-semibold text-stone-900">{titulo}</h2>
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
      <dd className="mt-1 text-sm text-stone-900 sm:col-span-2 sm:mt-0">{children ?? "—"}</dd>
    </div>
  );
}

export function Conmutador({ opciones, actual, sp, param, base }: { opciones: { v: string; label: string }[]; actual: string; sp: SP; param: string; base: string }) {
  return (
    <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
      {opciones.map((o) => (
        <Link
          key={o.v}
          href={`${base}${qs(sp, { [param]: o.v === opciones[0].v ? undefined : o.v })}`}
          scroll={false}
          className={`rounded-md px-2.5 py-1 font-medium ${actual === o.v ? "bg-white text-vino-800 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
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
      <Vacio titulo="Base de datos no configurada">
        Define la variable <code>DATABASE_URL</code> (cadena de conexión de Supabase o Postgres) y ejecuta la carga inicial. Consulta el README.
      </Vacio>
    </Contenedor>
  );
}

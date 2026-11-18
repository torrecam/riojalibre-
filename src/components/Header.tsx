"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

export const NAV = [
  { href: "/licitaciones", label: "Licitaciones" },
  { href: "/adjudicaciones", label: "Adjudicaciones" },
  { href: "/contratos-menores", label: "Contratos menores" },
  { href: "/subvenciones", label: "Subvenciones" },
  { href: "/organismos", label: "Organismos" },
  { href: "/empresas", label: "Empresas" },
  { href: "/estadisticas", label: "Estadísticas" },
  { href: "/red", label: "Red" },
  { href: "/metodologia", label: "Metodología" },
];

export function Header() {
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  const activo = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setAbierto(false)}>
          <Logo />
          <span className="leading-tight">
            <span className="block font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">Rioja Abierta</span>
            <span className="hidden text-[11px] text-stone-500 sm:block">Contratos y ayudas públicas en La Rioja</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-end gap-1 xl:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                activo(n.href) ? "bg-vino-50 font-medium text-vino-800" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="ml-auto rounded-md p-2 text-stone-600 hover:bg-stone-100 xl:hidden"
          aria-expanded={abierto}
          aria-label="Abrir menú"
          onClick={() => setAbierto((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {abierto && (
        <nav className="border-t border-stone-200 bg-white px-4 py-3 xl:hidden" aria-label="Principal móvil">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setAbierto(false)}
                className={`rounded-md px-3 py-2 text-sm ${activo(n.href) ? "bg-vino-50 font-medium text-vino-800" : "text-stone-700 hover:bg-stone-100"}`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

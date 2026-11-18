"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Building2, FileSearch, Gavel, HandCoins, Menu, Network, Receipt, Search, Users, X } from "lucide-react";
import { Logo } from "./Logo";
import { BotonTema } from "./Tema";
import { ENLACES_MI, MenuUsuario, useSesion } from "./cuenta/MenuUsuario";

export const NAV = [
  { href: "/licitaciones", label: "Licitaciones", icono: FileSearch },
  { href: "/adjudicaciones", label: "Adjudicaciones", icono: Gavel },
  { href: "/contratos-menores", label: "Menores", icono: Receipt },
  { href: "/subvenciones", label: "Subvenciones", icono: HandCoins },
  { href: "/organismos", label: "Organismos", icono: Building2 },
  { href: "/empresas", label: "Empresas", icono: Users },
  { href: "/estadisticas", label: "Estadísticas", icono: BarChart3 },
  { href: "/red", label: "Red", icono: Network },
  { href: "/metodologia", label: "Metodología", icono: BookOpen },
];

export function Header() {
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [scroll, setScroll] = useState(false);
  const activo = (href: string) => path === href || path.startsWith(href + "/");
  const portada = path === "/";
  const email = useSesion();

  useEffect(() => {
    const f = () => setScroll(window.scrollY > 12);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const transparente = portada && !scroll && !abierto;

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ${portada ? "-mb-16" : ""} ${
        transparente ? "border-b border-transparent bg-transparent text-white" : "border-b border-stone-200/70 bg-surface/80 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" onClick={() => setAbierto(false)}>
          <Logo className="h-9 w-9 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-8deg]" />
          <span className={`font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight ${transparente ? "text-white" : "text-stone-900"}`}>
            Rioja<span className={transparente ? "text-[#f7c6d4]" : "text-vino-700"}>Abierta</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-0.5 xl:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={activo(n.href) ? "page" : undefined}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                activo(n.href)
                  ? transparente ? "bg-white/15 text-white" : "bg-vino-50 text-vino-800"
                  : transparente ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 xl:ml-0">
          <Link href="/licitaciones" aria-label="Buscar" title="Buscar"
            className={`hidden h-9 w-9 place-items-center rounded-xl transition sm:grid ${transparente ? "text-white hover:bg-white/15" : "text-stone-600 hover:bg-stone-100 hover:text-vino-700"}`}>
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <BotonTema className={transparente ? "!text-white hover:!bg-white/15" : ""} />
          <MenuUsuario key={path} email={email} transparente={transparente} />
          <button
            type="button"
            className={`grid h-9 w-9 place-items-center rounded-xl xl:hidden ${transparente ? "text-white hover:bg-white/15" : "text-stone-700 hover:bg-stone-100"}`}
            aria-expanded={abierto}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {abierto && (
        <nav className="animate-entrar border-t border-stone-200 bg-surface px-4 pt-3 pb-5 xl:hidden" aria-label="Principal móvil">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium ${activo(n.href) ? "bg-vino-50 text-vino-800" : "bg-stone-50 text-stone-700 hover:bg-stone-100"}`}
              >
                <n.icono className="h-4 w-4 shrink-0 text-vino-600" />
                {n.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-200 pt-3 sm:grid-cols-4">
            {(email ? ENLACES_MI : [{ href: "/entrar", t: "Entrar", i: ENLACES_MI[0].i }, { href: "/registro", t: "Crear cuenta", i: ENLACES_MI[1].i }]).map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setAbierto(false)} className="flex items-center gap-2.5 rounded-xl bg-vino-50 px-3 py-3 text-sm font-medium text-vino-800">
                <n.i className="h-4 w-4 shrink-0" /> {n.t}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

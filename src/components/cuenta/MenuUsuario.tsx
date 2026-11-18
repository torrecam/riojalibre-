"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KanbanSquare, LayoutDashboard, LogIn, LogOut, SlidersHorizontal, Sparkles } from "lucide-react";
import { salir } from "@/lib/acciones-auth";

const hayCookie = () => typeof document !== "undefined" && /(?:^|;\s*)sb-[^=]*auth-token/.test(document.cookie);

export const ENLACES_MI = [
  { href: "/mi", t: "Mi panel", i: LayoutDashboard },
  { href: "/mi/sugeridas", t: "Sugeridas", i: Sparkles },
  { href: "/mi/tablero", t: "Tablero", i: KanbanSquare },
  { href: "/mi/perfil", t: "Perfil", i: SlidersHorizontal },
];

/** Estado de sesión en el cliente, sin volver dinámicas las páginas estáticas. */
export function useSesion() {
  const path = usePathname();
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    if (!hayCookie()) { queueMicrotask(() => vivo && setEmail(null)); return () => { vivo = false; }; }
    fetch("/api/yo", { cache: "no-store" }).then((r) => r.json()).then((d) => vivo && setEmail(d?.email ?? null)).catch(() => vivo && setEmail(null));
    return () => { vivo = false; };
  }, [path]);
  return email;
}

export function MenuUsuario({ email, transparente }: { email: string | null | undefined; transparente: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [abierto]);

  if (email === undefined) return <span className="h-9 w-9" aria-hidden />;
  if (!email)
    return (
      <Link href="/entrar" className={`ml-1 inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${transparente ? "bg-white/15 text-white hover:bg-white/25" : "bg-vino-700 text-white hover:bg-vino-800"}`}>
        <LogIn className="h-4 w-4" /> Entrar
      </Link>
    );
  return (
    <div className="relative ml-1" ref={ref}>
      <button type="button" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)} title={email}
        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-vino-500 to-vino-800 text-sm font-bold text-white uppercase shadow-md ring-2 ring-white/60">
        {email[0]}
      </button>
      {abierto && (
        <div role="menu" className="animate-entrar absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-stone-200 bg-surface text-stone-800 shadow-2xl">
          <div className="border-b border-stone-100 px-4 py-3 text-xs text-stone-500">Sesión iniciada como<div className="truncate text-sm font-medium text-stone-900">{email}</div></div>
          {ENLACES_MI.map((n) => (
            <Link key={n.href} href={n.href} role="menuitem" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-stone-50">
              <n.i className="h-4 w-4 text-vino-600" /> {n.t}
            </Link>
          ))}
          <form action={salir} className="border-t border-stone-100">
            <button role="menuitem" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50"><LogOut className="h-4 w-4" /> Salir</button>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KanbanSquare, LayoutDashboard, SlidersHorizontal, Sparkles } from "lucide-react";

const ITEMS = [
  { href: "/mi", t: "Panel", i: LayoutDashboard },
  { href: "/mi/sugeridas", t: "Sugeridas", i: Sparkles },
  { href: "/mi/tablero", t: "Tablero", i: KanbanSquare },
  { href: "/mi/perfil", t: "Perfil", i: SlidersHorizontal },
];

export function MiNav() {
  const path = usePathname();
  return (
    <nav aria-label="Mi área" className="sticky top-16 z-30 border-b border-stone-200/70 bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none]">
        {ITEMS.map((n) => {
          const activo = n.href === "/mi" ? path === "/mi" : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={activo ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${activo ? "border-vino-600 text-vino-800" : "border-transparent text-stone-500 hover:text-stone-900"}`}>
              <n.i className="h-4 w-4" /> {n.t}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

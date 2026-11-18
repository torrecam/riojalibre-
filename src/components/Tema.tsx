"use client";
import { Moon, Sun } from "lucide-react";

export function BotonTema({ className = "" }: { className?: string }) {
  const cambiar = () => {
    const raiz = document.documentElement;
    const oscuro = !raiz.classList.contains("dark");
    raiz.classList.toggle("dark", oscuro);
    try {
      localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
    } catch {}
  };
  return (
    <button type="button" onClick={cambiar} aria-label="Cambiar modo claro u oscuro" title="Modo claro / oscuro"
      className={`grid h-9 w-9 place-items-center rounded-xl text-stone-600 transition hover:bg-stone-100 hover:text-vino-700 ${className}`}>
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
      <Moon className="h-[18px] w-[18px] dark:hidden" />
    </button>
  );
}

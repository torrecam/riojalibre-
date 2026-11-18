"use client";
import { useEffect, useRef, useState } from "react";
import { eurosCompacto, numero } from "@/lib/format";

type Formato = "numero" | "euros";

function formatear(v: number, formato: Formato) {
  return formato === "euros" ? eurosCompacto(v) : numero(Math.round(v));
}

/** Contador que sube desde 0 cuando entra en pantalla. Sin JS muestra el valor final. */
export function Contador({ valor, formato = "numero", duracion = 1600, className = "" }: { valor: number; formato?: Formato; duracion?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [actual, setActual] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = requestAnimationFrame(() => setActual(0));
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const t0 = performance.now();
        const paso = (t: number) => {
          const p = Math.min(1, (t - t0) / duracion);
          setActual(valor * (1 - Math.pow(1 - p, 4)));
          if (p < 1) raf = requestAnimationFrame(paso);
        };
        raf = requestAnimationFrame(paso);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [valor, duracion]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`} aria-label={formatear(valor, formato)}>
      {formatear(actual ?? valor, formato)}
    </span>
  );
}

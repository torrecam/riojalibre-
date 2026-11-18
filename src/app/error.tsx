"use client";
import { Contenedor } from "@/components/ui";

export default function ErrorPagina({ reset }: { error: Error; reset: () => void }) {
  return (
    <Contenedor className="py-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">Algo ha fallado</h1>
      <p className="mt-3 text-stone-600">No hemos podido cargar los datos. Inténtalo de nuevo en unos segundos.</p>
      <button onClick={reset} className="btn-primario mt-6">Reintentar</button>
    </Contenedor>
  );
}

import type { Metadata } from "next";
import { ArrowUpRight, Palette, Shapes } from "lucide-react";
import { Cabecera, Contenedor } from "@/components/ui";
import { IlustEstadisticas, IlustLicitaciones, IlustSubvenciones } from "@/components/Ilustraciones";

export const metadata: Metadata = { title: "Créditos" };

export default function Creditos() {
  return (
    <>
      <Cabecera titulo="Créditos" icono={<Palette />} subtitulo="Sin fotos de terceros: todo el arte es propio." />
      <Contenedor className="grid gap-5 py-8 md:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="grid grid-cols-3 bg-gradient-to-br from-vino-50 via-surface to-vid-50">
            <IlustLicitaciones />
            <IlustSubvenciones />
            <IlustEstadisticas />
          </div>
          <div className="p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Ilustraciones y logotipo</h2>
            <p className="mt-1 text-sm text-stone-500">SVG hechos a mano para Rioja Abierta. La silueta de La Rioja es estilizada, no cartográfica.</p>
          </div>
        </section>
        <section className="card p-5">
          <Shapes className="h-8 w-8 text-vino-600" aria-hidden />
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold">Iconos</h2>
          <p className="mt-1 text-sm text-stone-500">Lucide, con licencia ISC.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="https://lucide.dev/" target="_blank" rel="noreferrer" className="chip bg-stone-100 text-stone-600 hover:underline">lucide.dev <ArrowUpRight className="h-3 w-3" /></a>
            <a href="https://github.com/lucide-icons/lucide/blob/main/LICENSE" target="_blank" rel="noreferrer" className="chip bg-vid-50 text-vid-700 hover:underline">ISC <ArrowUpRight className="h-3 w-3" /></a>
          </div>
        </section>
      </Contenedor>
    </>
  );
}

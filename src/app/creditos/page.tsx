import type { Metadata } from "next";
import Image from "next/image";
import { Camera } from "lucide-react";
import { Cabecera, Contenedor } from "@/components/ui";
import { CREDITOS_IMAGENES } from "@/lib/creditos";

export const metadata: Metadata = { title: "Créditos de imágenes" };

export default function Creditos() {
  return (
    <>
      <Cabecera titulo="Créditos de imágenes" icono={<Camera />} subtitulo="Fotos libres de Wikimedia Commons, redimensionadas y en WebP." />
      <Contenedor className="py-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDITOS_IMAGENES.map((c) => (
            <li key={c.archivo} className="card overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image src={c.archivo} alt={c.titulo} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="space-y-1 p-4 text-sm">
                <p className="font-semibold text-stone-900">{c.titulo}</p>
                <p className="text-stone-500">{c.autor}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a href={c.licenciaUrl} target="_blank" rel="noreferrer" className="chip bg-vid-50 text-vid-700 hover:underline">{c.licencia}</a>
                  <a href={c.fuente} target="_blank" rel="noreferrer" className="chip bg-stone-100 text-stone-600 hover:underline">Commons</a>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-stone-500">Las obras derivadas de fotos CC BY-SA se comparten con la misma licencia. Iconos: Lucide (ISC).</p>
      </Contenedor>
    </>
  );
}

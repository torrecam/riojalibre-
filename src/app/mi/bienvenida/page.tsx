import type { Metadata } from "next";
import { Contenedor } from "@/components/ui";
import { EditorPerfil } from "@/components/cuenta/EditorPerfil";
import { requerirUsuario } from "@/lib/usuario";
import { datosEditor } from "@/lib/queries/perfil-editor";

export const metadata: Metadata = { title: "Configura tu perfil" };
export const dynamic = "force-dynamic";

export default async function Bienvenida() {
  const u = await requerirUsuario("/mi/bienvenida");
  const d = await datosEditor(u.id);
  return (
    <div className="fondo-aurora min-h-[calc(100vh-7rem)]">
      <Contenedor className="py-8 sm:py-12">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-sm font-semibold text-vino-700">¡Bienvenido a Rioja Abierta!</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-balance text-stone-900 sm:text-4xl">Cuéntanos qué buscas y puntuaremos cada licitación para ti</h1>
          <p className="mt-2 text-stone-500">4 pasos, unos 2 minutos. Todo es opcional y podrás cambiarlo cuando quieras.</p>
        </div>
        <EditorPerfil modo="asistente" inicial={d.inicial} nombresOrganismos={d.organismos} procedimientos={d.procedimientos} cpvSugeridos={d.sugeridos} />
      </Contenedor>
    </div>
  );
}

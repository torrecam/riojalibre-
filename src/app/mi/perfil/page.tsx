import Link from "next/link";
import type { Metadata } from "next";
import { KeyRound, LogOut, SlidersHorizontal } from "lucide-react";
import { Contenedor } from "@/components/ui";
import { EditorPerfil } from "@/components/cuenta/EditorPerfil";
import { salir } from "@/lib/acciones-auth";
import { requerirUsuario } from "@/lib/usuario";
import { datosEditor } from "@/lib/queries/perfil-editor";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function Perfil() {
  const u = await requerirUsuario("/mi/perfil");
  const d = await datosEditor(u.id);
  return (
    <>
      <div className="fondo-aurora border-b border-stone-200/70">
        <Contenedor className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-vino-500 to-vino-800 text-white shadow-lg shadow-vino-900/20"><SlidersHorizontal className="h-5 w-5" /></span>
              Perfil de búsqueda
            </h1>
            <p className="mt-2 text-stone-500">Cada cambio recalcula tu idoneidad en todas las licitaciones. Sesión: {u.email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/mi/clave" className="btn btn-secundario"><KeyRound className="h-4 w-4" /> Contraseña</Link>
            <form action={salir}><button className="btn btn-secundario"><LogOut className="h-4 w-4" /> Salir</button></form>
          </div>
        </Contenedor>
      </div>
      <Contenedor className="py-6">
        <EditorPerfil modo="completo" inicial={d.inicial} nombresOrganismos={d.organismos} procedimientos={d.procedimientos} cpvSugeridos={d.sugeridos} />
      </Contenedor>
    </>
  );
}

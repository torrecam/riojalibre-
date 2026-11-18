import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarcoCuenta } from "@/components/cuenta/MarcoCuenta";
import { FormRegistro } from "@/components/cuenta/Formularios";
import { usuarioActual } from "@/lib/usuario";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function Registro() {
  if (await usuarioActual()) redirect("/mi");
  return (
    <MarcoCuenta titulo="Crea tu cuenta" subtitulo="Gratis. En 2 minutos configuras tu perfil y ves tu idoneidad en cada licitación."
      pie={<>¿Ya tienes cuenta? <Link href="/entrar" className="enlace font-semibold">Entra</Link></>}>
      <FormRegistro />
    </MarcoCuenta>
  );
}

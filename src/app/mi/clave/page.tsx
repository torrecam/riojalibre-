import type { Metadata } from "next";
import { MarcoCuenta } from "@/components/cuenta/MarcoCuenta";
import { FormClave } from "@/components/cuenta/Formularios";
import { requerirUsuario } from "@/lib/usuario";

export const metadata: Metadata = { title: "Cambiar contraseña" };

export default async function Clave() {
  const u = await requerirUsuario("/mi/clave");
  return (
    <MarcoCuenta titulo="Nueva contraseña" subtitulo={u.email ?? undefined}>
      <FormClave />
    </MarcoCuenta>
  );
}

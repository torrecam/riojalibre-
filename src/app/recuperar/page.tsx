import Link from "next/link";
import type { Metadata } from "next";
import { MarcoCuenta } from "@/components/cuenta/MarcoCuenta";
import { FormRecuperar } from "@/components/cuenta/Formularios";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function Recuperar() {
  return (
    <MarcoCuenta titulo="Recupera tu contraseña" subtitulo="Te enviaremos un enlace para crear una nueva."
      pie={<Link href="/entrar" className="enlace font-semibold">Volver a entrar</Link>}>
      <FormRecuperar />
    </MarcoCuenta>
  );
}

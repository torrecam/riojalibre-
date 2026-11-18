import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarcoCuenta } from "@/components/cuenta/MarcoCuenta";
import { FormEntrar } from "@/components/cuenta/Formularios";
import { destinoSeguro } from "@/lib/supabase";
import { usuarioActual } from "@/lib/usuario";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = destinoSeguro(sp.next);
  if (await usuarioActual()) redirect(next);
  return (
    <MarcoCuenta titulo="Entrar" subtitulo="Accede a tus licitaciones sugeridas y a tu tablero."
      pie={<>¿Aún no tienes cuenta? <Link href="/registro" className="enlace font-semibold">Regístrate gratis</Link></>}>
      <FormEntrar next={next} error={typeof sp.error === "string" ? sp.error : undefined} />
    </MarcoCuenta>
  );
}

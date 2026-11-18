import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BellOff, BellRing, SlidersHorizontal } from "lucide-react";
import { MarcoCuenta } from "@/components/cuenta/MarcoCuenta";
import { cambiarAlertasPorToken } from "@/lib/baja";

export const metadata: Metadata = { title: "Baja de alertas", robots: { index: false } };
export const dynamic = "force-dynamic";

async function reactivar(f: FormData) {
  "use server";
  const t = String(f.get("t") ?? "");
  const ok = await cambiarAlertasPorToken(t, true);
  redirect(`/baja?t=${encodeURIComponent(t)}&${ok ? "reactivadas=1" : "error=1"}`);
}

export default async function Baja({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const t = typeof sp.t === "string" ? sp.t : undefined;
  if (sp.reactivadas)
    return (
      <MarcoCuenta titulo="Alertas reactivadas" subtitulo="Volverás a recibir cada mañana a las 9:00 las licitaciones nuevas que encajen con tu empresa.">
        <div className="flex flex-wrap gap-2">
          <Link href="/mi/perfil" className="btn btn-primario"><SlidersHorizontal className="h-4 w-4" /> Ajustar mi perfil</Link>
          <Link href="/licitaciones" className="btn btn-secundario">Ver licitaciones</Link>
        </div>
      </MarcoCuenta>
    );
  const ok = await cambiarAlertasPorToken(t, false);
  if (!ok)
    return (
      <MarcoCuenta titulo="Enlace no válido" subtitulo="No hemos encontrado ninguna suscripción con este enlace. Puedes gestionar las alertas desde tu perfil.">
        <Link href="/mi/perfil" className="btn btn-primario"><SlidersHorizontal className="h-4 w-4" /> Ir a mi perfil</Link>
      </MarcoCuenta>
    );
  return (
    <MarcoCuenta titulo="Te has dado de baja" subtitulo="No volverás a recibir las alertas diarias de licitaciones. Tu cuenta, tu perfil y tu tablero siguen intactos.">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
          <BellOff className="h-5 w-5 shrink-0 text-vino-600" /> ¿Ha sido sin querer? Puedes reactivarlas con un clic.
        </div>
        <form action={reactivar}>
          <input type="hidden" name="t" value={t} />
          <button className="btn btn-primario w-full justify-center py-3"><BellRing className="h-4 w-4" /> Volver a activar las alertas</button>
        </form>
        <Link href="/mi/perfil" className="btn btn-secundario w-full justify-center">Cambiar la idoneidad mínima en mi perfil</Link>
      </div>
    </MarcoCuenta>
  );
}

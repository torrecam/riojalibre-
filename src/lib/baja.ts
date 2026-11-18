import "server-only";
import { db } from "./db";
import { esUuid } from "./params";

/** Activa o desactiva las alertas del usuario dueño del token de baja. */
export async function cambiarAlertasPorToken(t: string | undefined, activar: boolean) {
  if (!t || !esUuid(t)) return false;
  const [r] = await db()<{ ok: boolean }[]>`select public.alertas_baja(${t}::uuid, ${activar}) ok`;
  return !!r?.ok;
}

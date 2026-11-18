import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type postgres from "postgres";
import { db } from "./db";
import { authConfigurada, supabaseServidor } from "./supabase";

export type Usuario = { id: string; email: string | null };
export type Tx = postgres.TransactionSql;

/** Usuario de la sesión, con el JWT verificado por Supabase (getClaims). */
export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  if (!authConfigurada()) return null;
  const almacen = await cookies();
  if (!almacen.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))) return null;
  try {
    const sb = await supabaseServidor();
    const { data, error } = await sb.auth.getClaims();
    const c = data?.claims;
    if (error || !c?.sub) return null;
    return { id: String(c.sub), email: typeof c.email === "string" ? c.email : null };
  } catch {
    return null;
  }
});

export async function requerirUsuario(desde = "/mi"): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u) redirect(`/entrar?next=${encodeURIComponent(desde)}`);
  return u;
}

/**
 * Ejecuta consultas como el usuario: rol `authenticated` + claims en la transacción,
 * de modo que las políticas RLS (user_id = auth.uid()) se aplican de verdad.
 */
export async function conUsuario<T>(uid: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const r = await db().begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: uid, role: "authenticated" })}, true)`;
    await tx`set local role authenticated`;
    return fn(tx);
  });
  return r as T;
}

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function authConfigurada() {
  return !!(SUPABASE_URL && SUPABASE_KEY);
}

/** Cliente de Supabase Auth ligado a las cookies de la petición (Server Components, acciones y rutas). */
export async function supabaseServidor() {
  const almacen = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // En Server Components no se pueden escribir cookies; el proxy ya refresca la sesión.
        }
      },
    },
  });
}

/** Origen público de la petición (para los enlaces de los correos de Supabase). */
export async function origen() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "rioja-abierta.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (/^localhost|^127\./.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/** Solo rutas internas: evita redirecciones abiertas. */
export function destinoSeguro(next: unknown, defecto = "/mi") {
  const s = typeof next === "string" ? next : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : defecto;
}

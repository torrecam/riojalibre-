import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY_SB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Refresca la sesión de Supabase (si hay cookie) y protege el área privada /mi. */
export async function proxy(req: NextRequest) {
  const privada = req.nextUrl.pathname === "/mi" || req.nextUrl.pathname.startsWith("/mi/");
  const hayCookie = req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  const aEntrar = () => {
    const u = req.nextUrl.clone();
    u.pathname = "/entrar";
    u.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(u);
  };

  if (!hayCookie || !URL_SB || !KEY_SB) return privada ? aEntrar() : NextResponse.next();

  let res = NextResponse.next({ request: req });
  const sb = createServerClient(URL_SB, KEY_SB, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await sb.auth.getClaims();
  if (privada && !data?.claims?.sub) {
    const r = aEntrar();
    res.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|robots|api/(?!yo)|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml|csv)$).*)"],
};

import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { destinoSeguro, supabaseServidor } from "@/lib/supabase";

/** Destino de los enlaces de los correos de Supabase (confirmación, enlace mágico, recuperación). */
export async function GET(req: NextRequest) {
  const u = req.nextUrl;
  const next = destinoSeguro(u.searchParams.get("next"));
  const code = u.searchParams.get("code");
  const tokenHash = u.searchParams.get("token_hash");
  const type = u.searchParams.get("type") as EmailOtpType | null;
  const sb = await supabaseServidor();
  let ok = false;
  if (code) ok = !(await sb.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await sb.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  const destino = new URL(ok ? (type === "recovery" ? "/mi/clave" : next) : "/entrar?error=enlace", req.nextUrl.origin);
  return NextResponse.redirect(destino);
}

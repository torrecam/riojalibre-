import { NextResponse, type NextRequest } from "next/server";
import { cambiarAlertasPorToken } from "@/lib/baja";

export const dynamic = "force-dynamic";

/** Baja con un clic desde el cliente de correo (RFC 8058: List-Unsubscribe-Post). */
export async function POST(req: NextRequest) {
  const ok = await cambiarAlertasPorToken(req.nextUrl.searchParams.get("t") ?? undefined, false);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.clone();
  u.pathname = "/baja";
  return NextResponse.redirect(u, 303);
}

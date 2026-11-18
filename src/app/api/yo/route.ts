import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/usuario";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await usuarioActual();
  return NextResponse.json(u ? { email: u.email } : null, { headers: { "Cache-Control": "private, no-store" } });
}

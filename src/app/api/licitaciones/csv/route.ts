import type { NextRequest } from "next/server";
import { respuestaCsv } from "@/lib/csv";
import { filtrosDesde, licitacionesParaCsv } from "@/lib/queries/licitaciones";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const filas = await licitacionesParaCsv(filtrosDesde(sp));
  return respuestaCsv("licitaciones", filas);
}

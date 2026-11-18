import type { NextRequest } from "next/server";
import { respuestaCsv } from "@/lib/csv";
import { subvencionesParaCsv } from "@/lib/queries/subvenciones";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return respuestaCsv("subvenciones", await subvencionesParaCsv(Object.fromEntries(req.nextUrl.searchParams)));
}

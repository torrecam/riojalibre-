import type { NextRequest } from "next/server";
import { respuestaCsv } from "@/lib/csv";
import { menoresParaCsv } from "@/lib/queries/menores";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return respuestaCsv("contratos_menores", await menoresParaCsv(Object.fromEntries(req.nextUrl.searchParams)));
}

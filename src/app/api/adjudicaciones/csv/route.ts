import type { NextRequest } from "next/server";
import { respuestaCsv } from "@/lib/csv";
import { adjudicacionesParaCsv } from "@/lib/queries/licitaciones";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return respuestaCsv("adjudicaciones", await adjudicacionesParaCsv(Object.fromEntries(req.nextUrl.searchParams)));
}

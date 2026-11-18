import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** El workflow de ingesta llama aquí al terminar para refrescar KPIs y estadísticas cacheados. */
export async function POST(req: NextRequest) {
  const secreto = process.env.REVALIDATE_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag("estadisticas", { expire: 0 });
  return Response.json({ ok: true, revalidado: "estadisticas" });
}

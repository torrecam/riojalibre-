import { sql } from "./db";

export type Contadores = { leidos: number; insertados: number; actualizados: number; omitidos: number; detalle?: Record<string, unknown> };

/** Registra una ejecución en ingest_runs y captura errores. */
export async function ejecutar(fuente: string, modo: string, fn: () => Promise<Contadores>) {
  const [run] = await sql<{ id: string }[]>`insert into ingest_runs (fuente, modo) values (${fuente}, ${modo}) returning id`;
  const t0 = Date.now();
  try {
    const c = await fn();
    await sql`update ingest_runs set finished_at = now(), ok = true, leidos = ${c.leidos}, insertados = ${c.insertados},
      actualizados = ${c.actualizados}, omitidos = ${c.omitidos}, detalle = ${sql.json((c.detalle ?? {}) as never)} where id = ${run.id}`;
    console.log(`[${fuente}] OK en ${((Date.now() - t0) / 1000).toFixed(1)} s`, c);
    return c;
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
    await sql`update ingest_runs set finished_at = now(), ok = false, error = ${msg.slice(0, 4000)} where id = ${run.id}`;
    console.error(`[${fuente}] ERROR`, e);
    throw e;
  }
}

export function args() {
  const a = process.argv.slice(2);
  const get = (k: string) => {
    const i = a.findIndex((x) => x === `--${k}` || x.startsWith(`--${k}=`));
    if (i < 0) return undefined;
    const v = a[i].includes("=") ? a[i].split("=").slice(1).join("=") : a[i + 1];
    return v && !v.startsWith("--") ? v : "true";
  };
  return { get, has: (k: string) => get(k) !== undefined };
}

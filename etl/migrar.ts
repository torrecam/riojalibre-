/** Aplica las migraciones de supabase/migrations en orden (registro en public._migraciones). */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "./lib/db";

export async function migrar() {
  await sql`create table if not exists public._migraciones (nombre text primary key, aplicada_at timestamptz default now())`;
  const dir = path.join(process.cwd(), "supabase", "migrations");
  const ficheros = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const hechas = new Set((await sql<{ nombre: string }[]>`select nombre from public._migraciones`).map((r) => r.nombre));
  for (const f of ficheros) {
    if (hechas.has(f)) continue;
    console.log(`Aplicando ${f}…`);
    const contenido = await readFile(path.join(dir, f), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(contenido);
      await tx`insert into public._migraciones (nombre) values (${f})`;
    });
  }
  console.log("Migraciones al día.");
}

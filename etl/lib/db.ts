import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL (cadena de conexión Postgres/Supabase).");
  process.exit(1);
}

// prepare:false permite usar el pooler de Supabase en modo transacción (puerto 6543).
export const sql = postgres(url, {
  max: 4,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 30,
  // Supavisor en modo transacción se cuelga con consultas en pipeline: una consulta en vuelo por conexión.
  max_pipeline: /localhost|127\.0\.0\.1/.test(url) ? 100 : 1,
  onnotice: () => {},
  ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
});

export async function cerrar() {
  await sql.end({ timeout: 5 });
}

export function trozos<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** Protección del plan gratuito de Supabase (500 MB): aborta si la base supera el límite (por defecto 450 MB). */
export async function comprobarTamano(contexto = "") {
  const limite = Number(process.env.DB_MAX_MB ?? 450);
  const [{ mb }] = await sql<{ mb: number }[]>`select (pg_database_size(current_database()) / 1048576.0)::float8 as mb`;
  console.log(`  Tamaño de la base ${contexto}: ${mb.toFixed(1)} MB (límite ${limite} MB)`);
  if (mb > limite) {
    throw new Error(`Base de datos en ${mb.toFixed(1)} MB, por encima del límite de ${limite} MB (plan gratuito: 500 MB). Carga detenida para no agotar el espacio.`);
  }
  return mb;
}

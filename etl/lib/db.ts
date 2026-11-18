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

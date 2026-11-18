import "server-only";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __rioja_sql: postgres.Sql | undefined;
}

function crear() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. Usa la cadena de conexión del pooler de Supabase (modo transacción, puerto 6543) o un Postgres local.",
    );
  }
  const local = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, {
    max: local ? 5 : 3,
    prepare: false, // compatible con el pooler de Supabase (pgbouncer/supavisor en modo transacción)
    idle_timeout: 20,
    connect_timeout: 15,
    // Supavisor (pooler de Supabase, puerto 6543) se cuelga con consultas en pipeline en modo transacción:
    // una consulta en vuelo por conexión, y un límite para no agotar los 300 s de la función.
    max_pipeline: local ? 100 : 1,
    query_timeout: local ? 0 : 25,
    ssl: local ? false : "require",
    types: {
      // numeric e int8 como number (los importes caben de sobra en float64)
      numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
      int8: { to: 20, from: [20], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
      // date como texto YYYY-MM-DD, sin desplazamientos de zona horaria
      date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    },
  });
}

export function db(): postgres.Sql {
  if (!globalThis.__rioja_sql) globalThis.__rioja_sql = crear();
  return globalThis.__rioja_sql;
}

export function hayBaseDeDatos() {
  return !!process.env.DATABASE_URL;
}

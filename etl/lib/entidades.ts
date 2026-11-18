import { sql, trozos } from "./db";
import { claveNombre, normalizarNif } from "./normaliza";

export type OrganismoIn = {
  nombre: string;
  nif?: string | null;
  dir3?: string | null;
  postal?: string | null;
  ciudad?: string | null;
  nuts?: string | null;
  jerarquia?: string | null;
  ambito?: string | null;
  fuente_alta: string;
};

export function claveOrganismo(o: { nombre: string; dir3?: string | null }) {
  return o.dir3 ? `dir3:${o.dir3.toUpperCase()}` : `nom:${claveNombre(o.nombre)}`;
}

/** Inserta/actualiza organismos y devuelve mapa clave → id. */
export async function upsertOrganismos(lista: OrganismoIn[]): Promise<Map<string, string>> {
  const unicos = new Map<string, OrganismoIn & { clave: string }>();
  for (const o of lista) {
    const clave = claveOrganismo(o);
    if (!unicos.has(clave)) unicos.set(clave, { ...o, clave });
  }
  const mapa = new Map<string, string>();
  for (const lote of trozos([...unicos.values()], 500)) {
    const filas = lote.map((o) => ({
      clave: o.clave,
      nombre: o.nombre,
      nif: o.nif ?? null,
      dir3: o.dir3 ?? null,
      postal: o.postal ?? null,
      ciudad: o.ciudad ?? null,
      nuts: o.nuts ?? null,
      jerarquia: o.jerarquia ?? null,
      ambito: o.ambito ?? null,
      fuente_alta: o.fuente_alta,
    }));
    const res = await sql<{ id: string; clave: string }[]>`
      insert into organismos ${sql(filas)}
      on conflict (clave) do update set
        nombre = excluded.nombre,
        nif = coalesce(excluded.nif, organismos.nif),
        postal = coalesce(excluded.postal, organismos.postal),
        ciudad = coalesce(excluded.ciudad, organismos.ciudad),
        nuts = coalesce(excluded.nuts, organismos.nuts),
        jerarquia = coalesce(excluded.jerarquia, organismos.jerarquia),
        ambito = coalesce(organismos.ambito, excluded.ambito),
        updated_at = now()
      returning id, clave`;
    for (const r of res) mapa.set(r.clave, r.id);
  }
  return mapa;
}

export type EmpresaIn = { nombre: string; nif?: string | null; tipo_id?: string | null };

export function claveEmpresa(e: EmpresaIn): string {
  const nif = normalizarNif(e.nif);
  return nif ?? `nom:${claveNombre(e.nombre)}`;
}

/** Inserta/actualiza empresas y devuelve mapa clave → id. */
export async function upsertEmpresas(lista: EmpresaIn[]): Promise<Map<string, string>> {
  const unicos = new Map<string, { clave: string; nombre: string; nif: string | null; tipo_id: string | null }>();
  for (const e of lista) {
    if (!e.nombre) continue;
    const nif = normalizarNif(e.nif);
    const clave = claveEmpresa(e);
    if (!unicos.has(clave))
      unicos.set(clave, { clave, nombre: e.nombre, nif, tipo_id: e.tipo_id ?? (nif ? (nif.includes("UTE") ? "UTE" : "NIF") : "NOMBRE") });
  }
  const mapa = new Map<string, string>();
  for (const lote of trozos([...unicos.values()], 500)) {
    const res = await sql<{ id: string; clave: string }[]>`
      insert into empresas ${sql(lote)}
      on conflict (clave) do update set updated_at = now()
      returning id, clave`;
    for (const r of res) mapa.set(r.clave, r.id);
  }
  return mapa;
}

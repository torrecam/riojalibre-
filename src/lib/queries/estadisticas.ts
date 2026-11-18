import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "../db";

const CACHE = { revalidate: 900, tags: ["estadisticas"] };

export const kpisGenerales = unstable_cache(
  async () => {
    const sql = db();
    const [k] = await sql<{
      licitaciones: number; presupuesto: number; adjudicadas: number; presupuesto_medio: number;
      organismos: number; empresas: number; adjudicaciones: number; importe_adjudicado: number;
      menores: number; importe_menores: number; subvenciones: number; importe_subvenciones: number;
      ultima_actualizacion: string | null;
    }[]>`
      select
        (select count(*)::int from licitaciones) licitaciones,
        (select coalesce(sum(presupuesto_base),0)::float8 from licitaciones) presupuesto,
        (select count(*)::int from licitaciones where estado in ('Adjudicada','Resuelta')) adjudicadas,
        (select coalesce(avg(presupuesto_base),0)::float8 from licitaciones where presupuesto_base > 0) presupuesto_medio,
        (select count(*)::int from mv_organismos_totales where licitaciones + menores > 0) organismos,
        (select count(*)::int from mv_empresas_totales where contratos + menores > 0) empresas,
        (select count(*)::int from adjudicaciones) adjudicaciones,
        (select coalesce(sum(importe),0)::float8 from adjudicaciones) importe_adjudicado,
        (select count(*)::int from contratos_menores) menores,
        (select coalesce(sum(importe),0)::float8 from contratos_menores) importe_menores,
        (select count(*)::int from subvenciones) subvenciones,
        (select coalesce(sum(importe),0)::float8 from subvenciones) importe_subvenciones,
        (select max(finished_at)::text from ingest_runs where ok) ultima_actualizacion`;
    return k;
  },
  ["kpis-generales"],
  CACHE,
);

export const actividadReciente = unstable_cache(
  async () => {
    const sql = db();
    const [licitaciones, adjudicaciones, subvenciones] = await Promise.all([
      sql<{ id: string; objeto: string; organismo: string | null; organismo_id: string | null; presupuesto_base: number | null; fecha_publicacion: string | null; estado: string | null; tipo: string | null; fuente: string }[]>`
        select l.id, l.objeto, o.nombre organismo, l.organismo_id, l.presupuesto_base, l.fecha_publicacion, l.estado, l.tipo, l.fuente
        from licitaciones l left join organismos o on o.id = l.organismo_id
        where l.fecha_publicacion <= current_date order by l.fecha_publicacion desc nulls last, l.updated_at desc limit 9`,
      sql<{ licitacion_id: string; objeto: string; nombre_origen: string; nif_origen: string | null; empresa_id: string | null; importe: number | null; fecha: string | null; organismo: string | null }[]>`
        select a.licitacion_id, l.objeto, a.nombre_origen, a.nif_origen, a.empresa_id, a.importe, coalesce(a.fecha, l.fecha_adjudicacion) fecha, o.nombre organismo
        from adjudicaciones a join licitaciones l on l.id = a.licitacion_id left join organismos o on o.id = l.organismo_id
        where coalesce(a.fecha, l.fecha_adjudicacion) <= current_date order by 7 desc nulls last limit 6`,
      sql<{ id: number; beneficiario_nombre: string; importe: number | null; fecha_concesion: string | null; convocatoria: string | null; es_persona_fisica: boolean }[]>`
        select id, beneficiario_nombre, importe, fecha_concesion, convocatoria, es_persona_fisica from subvenciones
        where not es_persona_fisica order by fecha_concesion desc nulls last, id desc limit 6`,
    ]);
    return { licitaciones, adjudicaciones, subvenciones };
  },
  ["actividad-reciente"],
  CACHE,
);

export const estadisticas = unstable_cache(
  async () => {
    const sql = db();
    const [anual, tipos, estados, topOrganismos, topEmpresas, menoresAnual, subvAnual, fuentes] = await Promise.all([
      sql<{ anio: number; n: number; presupuesto: number }[]>`
        select extract(year from fecha_publicacion)::int anio, count(*)::int n, coalesce(sum(presupuesto_base),0)::float8 presupuesto
        from licitaciones where fecha_publicacion between '2014-01-01' and current_date + 365 group by 1 order by 1`,
      sql<{ v: string; n: number; importe: number }[]>`
        select coalesce(tipo,'Sin tipo') v, count(*)::int n, coalesce(sum(presupuesto_base),0)::float8 importe from licitaciones group by 1 order by 2 desc`,
      sql<{ v: string; n: number }[]>`select coalesce(estado,'Sin estado') v, count(*)::int n from licitaciones group by 1 order by 2 desc`,
      sql<{ id: string; nombre: string; n: number; importe: number }[]>`
        select o.id, o.nombre, count(*)::int n, coalesce(sum(l.presupuesto_base),0)::float8 importe
        from licitaciones l join organismos o on o.id = l.organismo_id group by 1, 2 order by 3 desc limit 40`,
      sql<{ id: string; nombre: string; nif: string | null; contratos: number; importe_contratos: number }[]>`
        select id, nombre, nif, contratos, importe_contratos::float8 from mv_empresas_totales order by importe_contratos desc nulls last limit 15`,
      sql<{ anio: number; n: number; importe: number }[]>`
        select extract(year from fecha)::int anio, count(*)::int n, coalesce(sum(importe),0)::float8 importe from contratos_menores
        where fecha >= '2015-01-01' group by 1 order by 1`,
      sql<{ anio: number; n: number; importe: number }[]>`
        select extract(year from fecha_concesion)::int anio, count(*)::int n, coalesce(sum(importe),0)::float8 importe from subvenciones
        where fecha_concesion >= '2010-01-01' group by 1 order by 1`,
      sql<{ v: string; n: number }[]>`select fuente v, count(*)::int n from licitaciones group by 1 order by 2 desc`,
    ]);
    return { anual, tipos, estados, topOrganismos, topEmpresas, menoresAnual, subvAnual, fuentes };
  },
  ["estadisticas"],
  CACHE,
);

/** Ranking ligero para la portada (lee la vista materializada, sin agregaciones). */
export const topAdjudicatarios = unstable_cache(
  async () => {
    const sql = db();
    return sql<{ id: string; nombre: string; nif: string | null; contratos: number; importe_contratos: number }[]>`
      select id, nombre, nif, contratos, importe_contratos::float8 from mv_empresas_totales
      where importe_contratos > 0 order by importe_contratos desc nulls last limit 6`;
  },
  ["top-adjudicatarios"],
  CACHE,
);

import "server-only";
import { db } from "../db";
import { esUuid, str, type SP } from "../params";

export type EmpresaTotales = {
  id: string;
  clave: string;
  nombre: string;
  nif: string | null;
  tipo_id: string | null;
  contratos: number;
  importe_contratos: number;
  menores: number;
  importe_menores: number;
  subvenciones: number;
  importe_subvenciones: number;
};

export function enlaceEmpresa(e: { nif?: string | null; id?: string | null; empresa_id?: string | null }) {
  if (e.nif) return `/empresas/${encodeURIComponent(e.nif)}`;
  const id = e.id ?? e.empresa_id;
  return id ? `/empresas/${id}` : null;
}

export async function rankingEmpresas(sp: SP, limite = 300) {
  const sql = db();
  const q = str(sp, "q");
  const por = str(sp, "por");
  const col =
    por === "menores" ? sql`importe_menores` : por === "subvenciones" ? sql`importe_subvenciones` : por === "contratos" ? sql`contratos` : sql`importe_contratos`;
  const filtro = q
    ? sql`(upper(nif) = upper(${q.replace(/[\s.\-]/g, "")}) or public.f_norm(nombre) like '%' || public.f_norm(${q}) || '%')`
    : sql`true`;
  return sql<EmpresaTotales[]>`
    select * from mv_empresas_totales where ${filtro} and (contratos + menores + subvenciones) > 0
    order by ${col} desc nulls last, nombre limit ${limite}`;
}

export async function empresa(clave: string) {
  const sql = db();
  const dec = decodeURIComponent(clave);
  const [e] = esUuid(dec)
    ? await sql<EmpresaTotales[]>`select * from mv_empresas_totales where id = ${dec}`
    : await sql<EmpresaTotales[]>`select * from mv_empresas_totales where nif = ${dec.toUpperCase()}`;
  if (!e) return null;
  const [contratos, organismos, anual, menores, subvenciones, nombres] = await Promise.all([
    sql<{ licitacion_id: string; objeto: string; organismo: string | null; organismo_id: string | null; fecha: string | null; tipo: string | null; importe: number | null; estado: string | null; lote_numero: string }[]>`
      select a.licitacion_id, l.objeto, o.nombre organismo, l.organismo_id, coalesce(a.fecha, l.fecha_adjudicacion, l.fecha_publicacion) fecha,
             l.tipo, a.importe, l.estado, a.lote_numero
      from adjudicaciones a join licitaciones l on l.id = a.licitacion_id left join organismos o on o.id = l.organismo_id
      where a.empresa_id = ${e.id} order by 5 desc nulls last limit 200`,
    sql<{ id: string; nombre: string; n: number; importe: number }[]>`
      select o.id, o.nombre, count(*)::int n, coalesce(sum(a.importe),0)::float8 importe
      from adjudicaciones a join licitaciones l on l.id = a.licitacion_id join organismos o on o.id = l.organismo_id
      where a.empresa_id = ${e.id} group by 1, 2 order by 4 desc limit 30`,
    sql<{ anio: number; contratos: number; importe_contratos: number; menores: number; importe_menores: number; subvenciones: number; importe_subvenciones: number }[]>`
      with c as (select extract(year from coalesce(a.fecha, l.fecha_adjudicacion, l.fecha_publicacion))::int anio, count(*) n, sum(a.importe) s
                 from adjudicaciones a join licitaciones l on l.id = a.licitacion_id where a.empresa_id = ${e.id} group by 1),
           m as (select extract(year from fecha)::int anio, count(*) n, sum(importe) s from contratos_menores where empresa_id = ${e.id} group by 1),
           v as (select extract(year from fecha_concesion)::int anio, count(*) n, sum(importe) s from subvenciones where empresa_id = ${e.id} group by 1)
      select anio, coalesce(c.n,0)::int contratos, coalesce(c.s,0)::float8 importe_contratos,
             coalesce(m.n,0)::int menores, coalesce(m.s,0)::float8 importe_menores,
             coalesce(v.n,0)::int subvenciones, coalesce(v.s,0)::float8 importe_subvenciones
      from c full join m using (anio) full join v using (anio) where anio is not null order by anio`,
    sql<{ cod_contrato: string; concepto: string; departamento: string | null; fecha: string | null; importe: number | null; tipo: string | null }[]>`
      select cod_contrato, concepto, departamento, fecha, importe, tipo from contratos_menores where empresa_id = ${e.id} order by fecha desc nulls last limit 100`,
    sql<{ id: number; convocatoria: string | null; nivel3: string | null; fecha_concesion: string | null; importe: number | null; instrumento: string | null }[]>`
      select id, convocatoria, nivel3, fecha_concesion, importe, instrumento from subvenciones where empresa_id = ${e.id} order by fecha_concesion desc nulls last limit 100`,
    sql<{ nombre: string; n: number }[]>`
      select nombre, sum(n)::int n from (
        select nombre_origen nombre, count(*) n from adjudicaciones where empresa_id = ${e.id} group by 1
        union all select nombre_origen, count(*) from contratos_menores where empresa_id = ${e.id} group by 1
        union all select beneficiario_nombre, count(*) from subvenciones where empresa_id = ${e.id} group by 1) x
      where nombre is not null group by 1 order by 2 desc limit 10`,
  ]);
  return { e, contratos, organismos, anual, menores, subvenciones, nombres };
}

/** Historial por nombre exacto (como en el original) — útil cuando no hay NIF. */
export async function historialPorNombre(nombre: string) {
  const sql = db();
  return sql<{ licitacion_id: string; objeto: string; organismo: string | null; fecha: string | null; estado: string | null; importe: number | null; presupuesto_base: number | null; nif_origen: string | null }[]>`
    select a.licitacion_id, l.objeto, o.nombre organismo, coalesce(a.fecha, l.fecha_adjudicacion, l.fecha_publicacion) fecha, l.estado,
           a.importe, l.presupuesto_base, a.nif_origen
    from adjudicaciones a join licitaciones l on l.id = a.licitacion_id left join organismos o on o.id = l.organismo_id
    where a.nombre_origen = ${nombre} order by 4 desc nulls last limit 500`;
}

export async function sugerirNombres(q: string) {
  const sql = db();
  return sql<{ nombre: string; n: number }[]>`
    select nombre_origen nombre, count(*)::int n from adjudicaciones
    where public.f_norm(nombre_origen) like '%' || public.f_norm(${q}) || '%' group by 1 order by 2 desc limit 30`;
}

export type OrganismoTotales = {
  id: string;
  nombre: string;
  ambito: string | null;
  ciudad: string | null;
  licitaciones: number;
  presupuesto: number;
  adjudicaciones: number;
  importe_adjudicado: number;
  menores: number;
  importe_menores: number;
};

export async function listaOrganismos(sp: SP) {
  const sql = db();
  const q = str(sp, "q");
  const ambito = str(sp, "ambito");
  const c = [sql`(licitaciones + menores) > 0`];
  if (q) c.push(sql`public.f_norm(nombre) like '%' || public.f_norm(${q}) || '%'`);
  if (ambito) c.push(sql`ambito = ${ambito}`);
  const w = c.reduce((acc, x) => sql`${acc} and ${x}`);
  return sql<OrganismoTotales[]>`select * from mv_organismos_totales where ${w} order by (importe_adjudicado + importe_menores) desc, nombre limit 1000`;
}

export async function organismo(id: string) {
  if (!esUuid(id)) return null;
  const sql = db();
  const [o] = await sql`select o.*, t.licitaciones, t.presupuesto, t.adjudicaciones, t.importe_adjudicado, t.menores, t.importe_menores
                        from organismos o join mv_organismos_totales t on t.id = o.id where o.id = ${id}`;
  if (!o) return null;
  const [top, anual, tipos, ultimas] = await Promise.all([
    sql<{ empresa_id: string | null; nif: string | null; nombre: string; n: number; importe: number }[]>`
      select a.empresa_id, e.nif, coalesce(e.nombre, a.nombre_origen) nombre, count(*)::int n, coalesce(sum(a.importe),0)::float8 importe
      from adjudicaciones a join licitaciones l on l.id = a.licitacion_id left join empresas e on e.id = a.empresa_id
      where l.organismo_id = ${id} group by 1, 2, 3 order by 5 desc limit 20`,
    sql<{ anio: number; n: number; importe: number }[]>`
      select anio, count(*)::int n, coalesce(sum(importe),0)::float8 importe from (
        select extract(year from coalesce(a.fecha, l.fecha_adjudicacion, l.fecha_publicacion))::int anio, a.importe
        from adjudicaciones a join licitaciones l on l.id = a.licitacion_id where l.organismo_id = ${id}) x
      where anio is not null group by 1 order by 1`,
    sql<{ tipo: string; n: number; importe: number }[]>`
      select coalesce(l.tipo, 'Sin tipo') tipo, count(*)::int n, coalesce(sum(a.importe),0)::float8 importe
      from adjudicaciones a join licitaciones l on l.id = a.licitacion_id where l.organismo_id = ${id} group by 1 order by 3 desc`,
    sql<{ licitacion_id: string; objeto: string; nombre_origen: string; nif_origen: string | null; empresa_id: string | null; importe: number | null; fecha: string | null }[]>`
      select a.licitacion_id, l.objeto, a.nombre_origen, a.nif_origen, a.empresa_id, a.importe, coalesce(a.fecha, l.fecha_adjudicacion) fecha
      from adjudicaciones a join licitaciones l on l.id = a.licitacion_id where l.organismo_id = ${id}
      order by 7 desc nulls last limit 25`,
  ]);
  return { o, top, anual, tipos, ultimas };
}

export async function red(nOrganismos = 25, nEmpresas = 15) {
  const sql = db();
  const aristas = await sql<{ organismo_id: string; organismo: string; empresa_id: string; empresa: string; nif: string | null; contratos: number; importe: number }[]>`
    with top_org as (
      select organismo_id, sum(importe) total from v_red_aristas group by 1 order by 2 desc nulls last limit ${nOrganismos}
    ), ranked as (
      select r.*, row_number() over (partition by r.organismo_id order by r.importe desc nulls last) rn
      from v_red_aristas r join top_org t using (organismo_id)
    )
    select r.organismo_id, o.nombre organismo, r.empresa_id, e.nombre empresa, e.nif, r.contratos, coalesce(r.importe,0)::float8 importe
    from ranked r join organismos o on o.id = r.organismo_id join empresas e on e.id = r.empresa_id
    where rn <= ${nEmpresas}`;
  return aristas;
}

export async function ultimasEjecuciones() {
  const sql = db();
  return sql<{ id: string; fuente: string; modo: string | null; started_at: Date; finished_at: Date | null; ok: boolean | null; leidos: number; insertados: number; actualizados: number; omitidos: number; error: string | null }[]>`
    select id, fuente, modo, started_at, finished_at, ok, leidos, insertados, actualizados, omitidos, left(error, 300) error
    from ingest_runs order by started_at desc limit 60`;
}

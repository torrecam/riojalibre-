import "server-only";
import { db } from "../db";
import { esUuid, fechaParam, numParam, str, type SP } from "../params";

export const TAM_PAGINA = 25;

export type FiltrosLicitacion = {
  q?: string;
  organismo?: string;
  estado?: string;
  tipo?: string;
  fuente?: string;
  procedimiento?: string;
  cpv?: string;
  importeMin?: number;
  importeMax?: number;
  desde?: string;
  hasta?: string;
  adjudicatario?: string;
  orden?: string;
};

export function filtrosDesde(sp: SP): FiltrosLicitacion {
  return {
    q: str(sp, "q"),
    organismo: str(sp, "organismo"),
    estado: str(sp, "estado"),
    tipo: str(sp, "tipo"),
    fuente: str(sp, "fuente"),
    procedimiento: str(sp, "procedimiento"),
    cpv: str(sp, "cpv")?.replace(/\D/g, "").slice(0, 8) || undefined,
    importeMin: numParam(sp, "importe") ?? numParam(sp, "importe_min"),
    importeMax: numParam(sp, "importe_max"),
    desde: fechaParam(sp, "desde"),
    hasta: fechaParam(sp, "hasta"),
    adjudicatario: str(sp, "adjudicatario"),
    orden: str(sp, "orden"),
  };
}

function where(f: FiltrosLicitacion) {
  const sql = db();
  const c = [sql`true`];
  if (f.q) c.push(sql`l.busqueda like '%' || public.f_norm(${f.q}) || '%'`);
  if (f.organismo && esUuid(f.organismo)) c.push(sql`l.organismo_id = ${f.organismo}`);
  if (f.estado) c.push(sql`l.estado = ${f.estado}`);
  if (f.tipo) c.push(sql`l.tipo = ${f.tipo}`);
  if (f.fuente) c.push(sql`l.fuente = ${f.fuente}`);
  if (f.procedimiento) c.push(sql`l.procedimiento = ${f.procedimiento}`);
  if (f.cpv) c.push(sql`exists (select 1 from licitacion_cpvs c where c.licitacion_id = l.id and c.codigo like ${f.cpv + "%"})`);
  if (f.importeMin !== undefined) c.push(sql`l.presupuesto_base >= ${f.importeMin}`);
  if (f.importeMax !== undefined) c.push(sql`l.presupuesto_base <= ${f.importeMax}`);
  if (f.desde) c.push(sql`l.fecha_publicacion >= ${f.desde}`);
  if (f.hasta) c.push(sql`l.fecha_publicacion <= ${f.hasta}`);
  if (f.adjudicatario) {
    const nif = f.adjudicatario.toUpperCase().replace(/[\s.\-]/g, "");
    c.push(sql`exists (select 1 from adjudicaciones a where a.licitacion_id = l.id and
      (upper(a.nif_origen) = ${nif} or public.f_norm(a.nombre_origen) like '%' || public.f_norm(${f.adjudicatario}) || '%'))`);
  }
  return c.reduce((acc, x) => sql`${acc} and ${x}`);
}

function orden(o?: string) {
  const sql = db();
  switch (o) {
    case "fecha_asc":
      return sql`l.fecha_publicacion asc nulls last, l.id`;
    case "importe_desc":
      return sql`l.presupuesto_base desc nulls last, l.id`;
    case "importe_asc":
      return sql`l.presupuesto_base asc nulls last, l.id`;
    case "estado":
      return sql`l.estado asc nulls last, l.fecha_publicacion desc nulls last, l.id`;
    default:
      return sql`l.fecha_publicacion desc nulls last, l.id`;
  }
}

export type LicitacionFila = {
  id: string;
  objeto: string;
  estado: string | null;
  tipo: string | null;
  fuente: string;
  procedimiento: string | null;
  codigo_expediente: string | null;
  presupuesto_base: number | null;
  importe_adjudicado: number | null;
  fecha_publicacion: string | null;
  organismo_id: string | null;
  organismo: string | null;
  url_origen: string | null;
  adjudicatarios: { nombre: string; nif: string | null; empresa_id: string | null }[] | null;
};

export async function buscarLicitaciones(f: FiltrosLicitacion, pag: number, tam = TAM_PAGINA) {
  const sql = db();
  const w = where(f);
  const [filas, [{ total }]] = await Promise.all([
    sql<LicitacionFila[]>`
      select l.id, l.objeto, l.estado, l.tipo, l.fuente, l.procedimiento, l.codigo_expediente,
             l.presupuesto_base, l.importe_adjudicado, l.fecha_publicacion, l.organismo_id, o.nombre as organismo, l.url_origen,
             (select json_agg(json_build_object('nombre', a.nombre_origen, 'nif', a.nif_origen, 'empresa_id', a.empresa_id) order by a.importe desc nulls last)
                from (select * from adjudicaciones a where a.licitacion_id = l.id order by a.importe desc nulls last limit 3) a) as adjudicatarios
      from licitaciones l left join organismos o on o.id = l.organismo_id
      where ${w}
      order by ${orden(f.orden)}
      limit ${tam} offset ${(pag - 1) * tam}`,
    sql<{ total: number }[]>`select count(*)::int as total from licitaciones l where ${w}`,
  ]);
  return { filas, total };
}

export async function licitacionesParaCsv(f: FiltrosLicitacion, limite = 20000) {
  const sql = db();
  return sql`
    select l.codigo_expediente as expediente, l.objeto, o.nombre as organismo, l.estado, l.tipo, l.procedimiento,
           l.presupuesto_base, l.valor_estimado, l.importe_adjudicado, l.fecha_publicacion, l.fecha_adjudicacion,
           (select string_agg(a.nombre_origen || coalesce(' (' || a.nif_origen || ')', ''), '; ') from adjudicaciones a where a.licitacion_id = l.id) as adjudicatarios,
           (select string_agg(c.codigo, ' ') from licitacion_cpvs c where c.licitacion_id = l.id) as cpv,
           l.fuente, l.url_origen
    from licitaciones l left join organismos o on o.id = l.organismo_id
    where ${where(f)}
    order by ${orden(f.orden)}
    limit ${limite}`;
}

export async function opcionesFiltros() {
  const sql = db();
  const [estados, tipos, procedimientos, organismos] = await Promise.all([
    sql<{ v: string; n: number }[]>`select estado v, count(*)::int n from licitaciones where estado is not null group by 1 order by 2 desc`,
    sql<{ v: string; n: number }[]>`select tipo v, count(*)::int n from licitaciones where tipo is not null group by 1 order by 2 desc`,
    sql<{ v: string; n: number }[]>`select procedimiento v, count(*)::int n from licitaciones where procedimiento is not null group by 1 order by 2 desc limit 40`,
    sql<{ id: string; nombre: string; n: number }[]>`
      select o.id, o.nombre, count(*)::int n from licitaciones l join organismos o on o.id = l.organismo_id
      group by 1, 2 order by 3 desc limit 300`,
  ]);
  return { estados, tipos, procedimientos, organismos };
}

export async function licitacion(id: string) {
  if (!esUuid(id)) return null;
  const sql = db();
  const [l] = await sql`
    select l.*, o.nombre as organismo, o.ambito as organismo_ambito, o.jerarquia as organismo_jerarquia
    from licitaciones l left join organismos o on o.id = l.organismo_id where l.id = ${id}`;
  if (!l) return null;
  const [cpvs, adjudicaciones, relacionadas] = await Promise.all([
    sql<{ codigo: string; descripcion: string | null }[]>`select codigo, descripcion from licitacion_cpvs where licitacion_id = ${id} order by codigo`,
    sql<{ id: string; nombre_origen: string; nif_origen: string | null; empresa_id: string | null; empresa_nif: string | null; importe: number | null; importe_con_iva: number | null; fecha: string | null; lote_numero: string; lote_descripcion: string | null }[]>`
      select a.id, a.nombre_origen, a.nif_origen, a.empresa_id, e.nif as empresa_nif, a.importe, a.importe_con_iva, a.fecha, a.lote_numero, a.lote_descripcion
      from adjudicaciones a left join empresas e on e.id = a.empresa_id
      where a.licitacion_id = ${id}
      order by nullif(regexp_replace(a.lote_numero, '\\D', '', 'g'), '')::int nulls first, a.importe desc nulls last`,
    sql<{ id: string; objeto: string; fecha_publicacion: string | null; presupuesto_base: number | null; estado: string | null }[]>`
      select id, objeto, fecha_publicacion, presupuesto_base, estado from licitaciones
      where organismo_id = ${l.organismo_id} and id <> ${id}
      order by fecha_publicacion desc nulls last limit 5`,
  ]);
  return { l, cpvs, adjudicaciones, relacionadas };
}

export type AdjudicacionFila = {
  id: string;
  licitacion_id: string;
  objeto: string;
  tipo: string | null;
  organismo_id: string | null;
  organismo: string | null;
  nombre_origen: string;
  nif_origen: string | null;
  empresa_id: string | null;
  importe: number | null;
  fecha: string | null;
};

export async function buscarAdjudicaciones(sp: SP, pag: number, tam = TAM_PAGINA) {
  const sql = db();
  const q = str(sp, "q");
  const desde = fechaParam(sp, "desde");
  const hasta = fechaParam(sp, "hasta");
  const importeMin = numParam(sp, "importe");
  const c = [sql`true`];
  if (q) c.push(sql`(public.f_norm(a.nombre_origen) like '%' || public.f_norm(${q}) || '%' or upper(a.nif_origen) = upper(${q}) or l.busqueda like '%' || public.f_norm(${q}) || '%')`);
  if (desde) c.push(sql`coalesce(a.fecha, l.fecha_adjudicacion) >= ${desde}`);
  if (hasta) c.push(sql`coalesce(a.fecha, l.fecha_adjudicacion) <= ${hasta}`);
  if (importeMin !== undefined) c.push(sql`a.importe >= ${importeMin}`);
  const w = c.reduce((acc, x) => sql`${acc} and ${x}`);
  const [filas, [{ total }]] = await Promise.all([
    sql<AdjudicacionFila[]>`
      select a.id, a.licitacion_id, l.objeto, l.tipo, l.organismo_id, o.nombre as organismo, a.nombre_origen, a.nif_origen, a.empresa_id,
             a.importe, coalesce(a.fecha, l.fecha_adjudicacion) as fecha
      from adjudicaciones a join licitaciones l on l.id = a.licitacion_id left join organismos o on o.id = l.organismo_id
      where ${w}
      order by coalesce(a.fecha, l.fecha_adjudicacion) desc nulls last, a.id
      limit ${tam} offset ${(pag - 1) * tam}`,
    sql<{ total: number }[]>`select count(*)::int total from adjudicaciones a join licitaciones l on l.id = a.licitacion_id where ${w}`,
  ]);
  return { filas, total };
}

export async function adjudicacionesParaCsv(sp: SP) {
  const { filas } = await buscarAdjudicaciones(sp, 1, 20000);
  return filas.map(({ id: _i, licitacion_id: _l, organismo_id: _o, empresa_id: _e, ...r }) => r);
}

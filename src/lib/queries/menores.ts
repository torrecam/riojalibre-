import "server-only";
import { db } from "../db";
import { fechaParam, numParam, str, type SP } from "../params";
import { TAM_PAGINA } from "./licitaciones";

export type MenorFila = {
  cod_contrato: string;
  concepto: string;
  importe: number | null;
  fecha: string | null;
  departamento: string | null;
  organismo_id: string | null;
  tipo: string | null;
  empresa_id: string | null;
  empresa_nif: string | null;
  nombre_origen: string | null;
  nif_origen: string | null;
  persona_fisica: boolean;
};

function where(sp: SP) {
  const sql = db();
  const c = [sql`true`];
  const q = str(sp, "q");
  const depto = str(sp, "departamento");
  const tipo = str(sp, "tipo");
  const anio = numParam(sp, "anio");
  const desde = fechaParam(sp, "desde");
  const hasta = fechaParam(sp, "hasta");
  const imp = numParam(sp, "importe");
  if (q) c.push(sql`m.busqueda like '%' || public.f_norm(${q}) || '%'`);
  if (depto) c.push(sql`m.departamento = ${depto}`);
  if (tipo) c.push(sql`m.tipo = ${tipo}`);
  if (anio) c.push(sql`extract(year from m.fecha) = ${anio}`);
  if (desde) c.push(sql`m.fecha >= ${desde}`);
  if (hasta) c.push(sql`m.fecha <= ${hasta}`);
  if (imp !== undefined) c.push(sql`m.importe >= ${imp}`);
  return c.reduce((acc, x) => sql`${acc} and ${x}`);
}

function orden(o?: string) {
  const sql = db();
  if (o === "importe_desc") return sql`m.importe desc nulls last, m.cod_contrato`;
  if (o === "importe_asc") return sql`m.importe asc nulls last, m.cod_contrato`;
  if (o === "fecha_asc") return sql`m.fecha asc nulls last, m.cod_contrato`;
  return sql`m.fecha desc nulls last, m.cod_contrato`;
}

export async function buscarMenores(sp: SP, pag: number, tam = TAM_PAGINA) {
  const sql = db();
  const w = where(sp);
  const [filas, [tot]] = await Promise.all([
    sql<MenorFila[]>`
      select m.cod_contrato, m.concepto, m.importe, m.fecha, m.departamento, m.organismo_id, m.tipo, m.empresa_id, e.nif as empresa_nif,
             m.nombre_origen, m.nif_origen, m.persona_fisica
      from contratos_menores m left join empresas e on e.id = m.empresa_id
      where ${w} order by ${orden(str(sp, "orden"))}
      limit ${tam} offset ${(pag - 1) * tam}`,
    sql<{ total: number; importe: number }[]>`select count(*)::int total, coalesce(sum(m.importe),0)::float8 importe from contratos_menores m where ${w}`,
  ]);
  return { filas, total: tot.total, importe: tot.importe };
}

export async function menoresParaCsv(sp: SP) {
  const sql = db();
  return sql`
    select m.cod_contrato, m.fecha, m.concepto, m.departamento, m.tipo, m.nombre_origen as adjudicatario, m.nif_origen as nif, m.importe
    from contratos_menores m where ${where(sp)} order by ${orden(str(sp, "orden"))} limit 50000`;
}

export async function opcionesMenores() {
  const sql = db();
  const [departamentos, tipos, anios] = await Promise.all([
    sql<{ v: string; n: number }[]>`select departamento v, count(*)::int n from contratos_menores where departamento is not null group by 1 order by 2 desc`,
    sql<{ v: string; n: number }[]>`select tipo v, count(*)::int n from contratos_menores where tipo is not null group by 1 order by 2 desc`,
    sql<{ v: number }[]>`select distinct extract(year from fecha)::int v from contratos_menores where fecha is not null order by 1 desc`,
  ]);
  return { departamentos, tipos, anios };
}

import "server-only";
import { db } from "../db";
import { fechaParam, numParam, str, type SP } from "../params";
import { TAM_PAGINA } from "./licitaciones";

export type SubvencionFila = {
  id: number;
  convocatoria: string | null;
  instrumento: string | null;
  importe: number | null;
  fecha_concesion: string | null;
  beneficiario_nombre: string | null;
  beneficiario_nif: string | null;
  es_persona_fisica: boolean;
  empresa_id: string | null;
  nivel1: string | null;
  nivel2: string | null;
  nivel3: string | null;
};

function where(sp: SP) {
  const sql = db();
  const c = [sql`true`];
  const q = str(sp, "q");
  const desde = fechaParam(sp, "desde");
  const hasta = fechaParam(sp, "hasta");
  const nivel = str(sp, "nivel");
  const imp = numParam(sp, "importe");
  const ambito = str(sp, "beneficiario");
  if (q) {
    const nif = q.toUpperCase().replace(/[\s.\-]/g, "");
    c.push(sql`(s.beneficiario_nif = ${nif} or s.busqueda like '%' || public.f_norm(${q}) || '%')`);
  }
  if (desde) c.push(sql`s.fecha_concesion >= ${desde}`);
  if (hasta) c.push(sql`s.fecha_concesion <= ${hasta}`);
  if (nivel) c.push(sql`s.nivel1 = ${nivel}`);
  if (imp !== undefined) c.push(sql`s.importe >= ${imp}`);
  if (ambito === "juridicas") c.push(sql`not s.es_persona_fisica`);
  if (ambito === "fisicas") c.push(sql`s.es_persona_fisica`);
  return c.reduce((acc, x) => sql`${acc} and ${x}`);
}

function orden(o?: string) {
  const sql = db();
  if (o === "importe_desc") return sql`s.importe desc nulls last, s.id`;
  if (o === "fecha_asc") return sql`s.fecha_concesion asc nulls last, s.id`;
  return sql`s.fecha_concesion desc nulls last, s.id desc`;
}

export async function buscarSubvenciones(sp: SP, pag: number, tam = TAM_PAGINA) {
  const sql = db();
  const w = where(sp);
  const [filas, [tot]] = await Promise.all([
    sql<SubvencionFila[]>`
      select s.id, s.convocatoria, s.instrumento, s.importe, s.fecha_concesion, s.beneficiario_nombre, s.beneficiario_nif,
             s.es_persona_fisica, s.empresa_id, s.nivel1, s.nivel2, s.nivel3
      from subvenciones s where ${w} order by ${orden(str(sp, "orden"))}
      limit ${tam} offset ${(pag - 1) * tam}`,
    sql<{ total: number; importe: number }[]>`select count(*)::int total, coalesce(sum(s.importe),0)::float8 importe from subvenciones s where ${w}`,
  ]);
  return { filas, total: tot.total, importe: tot.importe };
}

export async function subvencionesParaCsv(sp: SP) {
  const sql = db();
  return sql`
    select s.id as id_bdns, s.cod_concesion, s.fecha_concesion, s.beneficiario_nombre, s.beneficiario_nif, s.importe, s.ayuda_equivalente,
           s.instrumento, s.convocatoria, s.numero_convocatoria, s.nivel1, s.nivel2, s.nivel3
    from subvenciones s where ${where(sp)} order by ${orden(str(sp, "orden"))} limit 50000`;
}

export async function subvencion(id: string) {
  if (!/^\d{1,18}$/.test(id)) return null;
  const sql = db();
  const [s] = await sql`select s.*, e.nif as empresa_nif from subvenciones s left join empresas e on e.id = s.empresa_id where s.id = ${id}`;
  if (!s) return null;
  const otras = await sql<{ id: number; beneficiario_nombre: string; importe: number; fecha_concesion: string }[]>`
    select id, beneficiario_nombre, importe, fecha_concesion from subvenciones
    where id_convocatoria = ${s.id_convocatoria} and id <> ${s.id} order by importe desc nulls last limit 8`;
  return { s, otras };
}

export async function nivelesSubvenciones() {
  const sql = db();
  return sql<{ v: string; n: number }[]>`select nivel1 v, count(*)::int n from subvenciones where nivel1 is not null group by 1 order by 2 desc`;
}

import { sql, trozos } from "./db";

export type LicitacionIn = {
  fuente: "larioja.org" | "place";
  id_fuente: string;
  codigo_expediente: string | null;
  anio_expediente: number | null;
  objeto: string;
  organismo_clave: string | null;
  unidad_competente?: string | null;
  unidad_proponente?: string | null;
  tipo: string | null;
  tipo_origen: string | null;
  procedimiento: string | null;
  estado: string | null;
  estado_origen: string | null;
  presupuesto_base: number | null;
  presupuesto_con_iva?: number | null;
  valor_estimado: number | null;
  fecha_publicacion: string | null;
  fecha_fin_ofertas: string | null;
  fecha_adjudicacion: string | null;
  fecha_formalizacion: string | null;
  fecha_actualizacion?: string | null;
  lugar_ejecucion: string | null;
  nuts: string | null;
  duracion_dias: number | null;
  duracion_meses: number | null;
  criterios_valoracion: string | null;
  num_licitadores: number | null;
  resultado_adjudica: string | null;
  url_origen: string | null;
  url_perfil: string | null;
  raw: unknown;
  cpvs: { codigo: string; descripcion: string | null }[];
  adjudicaciones: {
    empresa_clave: string | null;
    nombre_origen: string;
    nif_origen: string | null;
    importe: number | null;
    importe_con_iva?: number | null;
    fecha: string | null;
    lote_numero: string;
    lote_descripcion: string | null;
  }[];
};

/** Upsert idempotente de licitaciones + reemplazo de sus CPV y adjudicaciones. */
export async function guardarLicitaciones(
  lista: LicitacionIn[],
  orgs: Map<string, string>,
  emps: Map<string, string>,
): Promise<{ insertados: number; actualizados: number }> {
  let insertados = 0;
  let actualizados = 0;
  for (let lote of trozos(lista, 300)) {
    const filas = lote.map(({ cpvs: _c, adjudicaciones: _a, organismo_clave, raw, ...l }) => ({
      ...l,
      presupuesto_con_iva: l.presupuesto_con_iva ?? null,
      fecha_actualizacion: l.fecha_actualizacion ?? null,
      unidad_competente: l.unidad_competente ?? null,
      unidad_proponente: l.unidad_proponente ?? null,
      organismo_id: organismo_clave ? orgs.get(organismo_clave) ?? null : null,
      raw: raw === undefined || raw === null ? null : sql.json(raw as never),
    }));
    const res = await sql<{ id: string; id_fuente: string; nuevo: boolean }[]>`
      insert into licitaciones ${sql(filas as never)}
      on conflict (fuente, id_fuente) do update set
        codigo_expediente = excluded.codigo_expediente, anio_expediente = excluded.anio_expediente,
        objeto = excluded.objeto, organismo_id = excluded.organismo_id,
        unidad_competente = excluded.unidad_competente, unidad_proponente = excluded.unidad_proponente,
        tipo = excluded.tipo, tipo_origen = excluded.tipo_origen, procedimiento = excluded.procedimiento,
        estado = excluded.estado, estado_origen = excluded.estado_origen,
        presupuesto_base = excluded.presupuesto_base, presupuesto_con_iva = excluded.presupuesto_con_iva,
        valor_estimado = excluded.valor_estimado,
        fecha_publicacion = excluded.fecha_publicacion, fecha_fin_ofertas = excluded.fecha_fin_ofertas,
        fecha_adjudicacion = excluded.fecha_adjudicacion, fecha_formalizacion = excluded.fecha_formalizacion,
        fecha_actualizacion = excluded.fecha_actualizacion,
        lugar_ejecucion = excluded.lugar_ejecucion, nuts = excluded.nuts,
        duracion_dias = excluded.duracion_dias, duracion_meses = excluded.duracion_meses,
        criterios_valoracion = excluded.criterios_valoracion, num_licitadores = excluded.num_licitadores,
        resultado_adjudica = excluded.resultado_adjudica, url_origen = excluded.url_origen, url_perfil = excluded.url_perfil,
        raw = excluded.raw, updated_at = now()
      where licitaciones.fecha_actualizacion is null or excluded.fecha_actualizacion is null
         or excluded.fecha_actualizacion >= licitaciones.fecha_actualizacion
      returning id, id_fuente, (xmax = 0) as nuevo`;
    const ids = new Map(res.map((r) => [r.id_fuente, r.id]));
    for (const r of res) r.nuevo ? insertados++ : actualizados++;
    const idsLote = res.map((r) => r.id);
    if (!idsLote.length) continue;
    // Solo se reemplazan hijos de las filas realmente escritas (las más antiguas se ignoran).
    lote = lote.filter((l) => ids.has(l.id_fuente));

    await sql`delete from licitacion_cpvs where licitacion_id in ${sql(idsLote)}`;
    await sql`delete from adjudicaciones where licitacion_id in ${sql(idsLote)}`;

    const cpvs = lote.flatMap((l) => l.cpvs.map((c) => ({ licitacion_id: ids.get(l.id_fuente)!, ...c })));
    for (const t of trozos(cpvs, 1000)) await sql`insert into licitacion_cpvs ${sql(t)} on conflict do nothing`;

    // Un mismo adjudicatario puede repetirse en el mismo lote: se agregan importes.
    const agregadas = new Map<string, Record<string, unknown> & { importe: number | null }>();
    for (const l of lote)
      for (const a of l.adjudicaciones) {
        const k = `${l.id_fuente}|${a.nombre_origen}|${a.lote_numero}`;
        const prev = agregadas.get(k);
        if (prev) {
          if (a.importe !== null) prev.importe = (prev.importe ?? 0) + a.importe;
          continue;
        }
        agregadas.set(k, {
          licitacion_id: ids.get(l.id_fuente)!,
          empresa_id: a.empresa_clave ? emps.get(a.empresa_clave) ?? null : null,
          nombre_origen: a.nombre_origen,
          nif_origen: a.nif_origen,
          importe: a.importe,
          importe_con_iva: a.importe_con_iva ?? null,
          fecha: a.fecha,
          lote_numero: a.lote_numero,
          lote_descripcion: a.lote_descripcion,
        });
      }
    const adjs = [...agregadas.values()];
    for (const t of trozos(adjs, 1000)) await sql`insert into adjudicaciones ${sql(t as never)} on conflict do nothing`;
  }
  return { insertados, actualizados };
}

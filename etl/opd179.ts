/**
 * Conector: Contratación electrónica del Gobierno de La Rioja (dato abierto opd-179).
 * Snapshot completo en JSON (~26 MB). Cada fila es un expediente × lote/adjudicatario.
 * Uso: tsx etl/opd179.ts [--archivo ruta.json]
 */
import { descargar, leerJsonLocal } from "./lib/http";
import { upsertEmpresas, upsertOrganismos, claveEmpresa, claveOrganismo } from "./lib/entidades";
import { guardarLicitaciones, type LicitacionIn } from "./lib/licitaciones";
import { ejecutar } from "./lib/runs";
import { entero, estadoOpd, fecha, fechaHora, limpiarTexto, num, parsearCpvs, tipoNormalizado } from "./lib/normaliza";

export const URL_OPD179 = "https://ias1.larioja.org/opendata/download?r=Y2Q9MTc5fGNmPTA0";

type Fila = Record<string, string | number | null>;

export async function cargarOpd179(archivo?: string) {
  return ejecutar("larioja.org", "snapshot", async () => {
    const ruta = archivo ?? (await descargar(URL_OPD179, "opd179.json"));
    const json = await leerJsonLocal<{ data: Fila[] } | Fila[]>(ruta);
    const filas = Array.isArray(json) ? json : json.data;

    const grupos = new Map<string, Fila[]>();
    for (const f of filas) {
      const id = limpiarTexto(f.IDENTIFICADOR) ?? limpiarTexto(f.CODIGO_EXPEDIENTE);
      if (!id) continue;
      (grupos.get(id) ?? grupos.set(id, []).get(id)!).push(f);
    }

    const orgsIn = [];
    const empsIn = [];
    const lics: LicitacionIn[] = [];
    for (const [id, gs] of grupos) {
      const f = gs[0];
      const organismo = limpiarTexto(f.ORGANO_CONTRATACION) ?? "Gobierno de La Rioja";
      orgsIn.push({ nombre: organismo, ambito: "autonomico", fuente_alta: "larioja.org", nuts: "ES230" });
      const adjudicaciones = [];
      for (const g of gs) {
        const nombre = limpiarTexto(g.ADJUDICA_NOMBRE);
        if (!nombre) continue;
        const nif = limpiarTexto(g.ADJUDICA_IDENTIFICADOR);
        const tipoIden = limpiarTexto(g.ADJUDICA_TIPO_IDEN);
        empsIn.push({ nombre, nif, tipo_id: tipoIden === "UTE" ? "UTE" : undefined });
        adjudicaciones.push({
          empresa_clave: claveEmpresa({ nombre, nif }),
          nombre_origen: nombre,
          nif_origen: nif,
          importe: num(g.ADJUDICA_IMPORTE),
          fecha: fecha(g.ADJUDICA_FECHA_RESOLUCION) ?? fecha(g.FECHA_PUBLICA_ADJUDICACION),
          lote_numero: limpiarTexto(g.ADJUDICA_NUMERO_LOTE) ?? "",
          lote_descripcion: limpiarTexto(g.ADJUDICA_DESCRIPCION_LOTE),
        });
      }
      const cpvs = parsearCpvs(limpiarTexto(f.CPVS));
      const fechaPub =
        fecha(f.FECHA_PUBLICA_LICITACION) ??
        fecha(f.FECHA_PUBLICA_PREVIO) ??
        fecha(f.ADJUDICA_FECHA_RESOLUCION) ??
        fecha(f.FECHA_PUBLICA_ADJUDICACION) ??
        fecha(f.ADJUDICA_FECHA_CONTRATO);
      const tipoOrigen = limpiarTexto(f.TIPO_CONTRATO);
      const estadoOrigen = limpiarTexto(f.ESTADO_LICITACION);
      const { ...raw } = f;
      lics.push({
        fuente: "larioja.org",
        id_fuente: id,
        codigo_expediente: limpiarTexto(f.CODIGO_EXPEDIENTE),
        anio_expediente: entero(f.ANO_EXPEDIENTE),
        objeto: limpiarTexto(f.OBJETO_CONTRATO) ?? "(sin objeto)",
        organismo_clave: claveOrganismo({ nombre: organismo }),
        unidad_competente: limpiarTexto(f.UNIDAD_COMPETENTE),
        unidad_proponente: limpiarTexto(f.UNIDAD_PROPONENTE),
        tipo: tipoNormalizado(tipoOrigen),
        tipo_origen: tipoOrigen,
        procedimiento: limpiarTexto(f.FORMA_ADJUDICACION),
        estado: estadoOpd(estadoOrigen),
        estado_origen: estadoOrigen,
        presupuesto_base: num(f.PRESUPUESTO_LICITACION),
        valor_estimado: num(f.VALOR_ESTIMADO),
        fecha_publicacion: fechaPub,
        fecha_fin_ofertas: fechaHora(f.FECHA_HORA_FIN_OFERTAS),
        fecha_adjudicacion: fecha(f.ADJUDICA_FECHA_RESOLUCION) ?? fecha(f.FECHA_PUBLICA_ADJUDICACION),
        fecha_formalizacion: fecha(f.FECHA_PUBLICA_FORMALIZACION) ?? fecha(f.ADJUDICA_FECHA_CONTRATO),
        lugar_ejecucion: limpiarTexto(f.LUGAR_EJECUCION),
        nuts: limpiarTexto(f.LUGAR_EJECUCION)?.match(/ES\d{2,3}/)?.[0] ?? null,
        duracion_dias: entero(f.DURACION_DIAS),
        duracion_meses: entero(f.DURACION_MESES),
        criterios_valoracion: limpiarTexto(f.CRITERIOS_VALORACION),
        num_licitadores: entero(f.ADJUDICA_NUM_LICITADORES),
        resultado_adjudica: limpiarTexto(f.ADJUDICA_RESULTADO),
        url_origen: limpiarTexto(f.ENLACE_LICITACION),
        url_perfil: limpiarTexto(f.ENLACE_PERFIL_CONTRATANTE),
        raw: { ...raw, _filas: gs.length, ANUNCIOS: f.ANUNCIOS },
        cpvs,
        adjudicaciones,
      });
    }

    const orgs = await upsertOrganismos(orgsIn);
    const emps = await upsertEmpresas(empsIn);
    const r = await guardarLicitaciones(lics, orgs, emps);
    return { leidos: filas.length, insertados: r.insertados, actualizados: r.actualizados, omitidos: 0, detalle: { expedientes: lics.length } };
  });
}


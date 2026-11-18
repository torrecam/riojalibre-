/**
 * Conector: contratos menores (ejecución presupuestaria) de la Intervención General del Gobierno de La Rioja.
 * Un JSON por año (contratos_CAR_AAAA.json). Se importan solo importes >= 500 € (criterio de ruido).
 */
import { sql, trozos } from "./lib/db";
import { descargar, leerJsonLocal } from "./lib/http";
import { claveEmpresa, claveOrganismo, upsertEmpresas, upsertOrganismos } from "./lib/entidades";
import { ejecutar } from "./lib/runs";
import { fecha, limpiarTexto, normalizarNif, num, tipoNormalizado } from "./lib/normaliza";

const PREFIJO = "https://ias1.larioja.org/opendata/download?r=";
// r = base64("cd=<opd>|cf=04") → JSON
export const DATASETS_MENORES: Record<number, { opd: number; url: string }> = {
  2021: { opd: 866, url: PREFIJO + "Y2Q9ODY2fGNmPTA0" },
  2022: { opd: 910, url: PREFIJO + "Y2Q9OTEwfGNmPTA0" },
  2023: { opd: 963, url: PREFIJO + "Y2Q9OTYzfGNmPTA0" },
  2024: { opd: 979, url: PREFIJO + "Y2Q9OTc5fGNmPTA0" },
  2025: { opd: 1151, url: PREFIJO + "Y2Q9MTE1MXxjZj0wNA%3D%3D" },
  2026: { opd: 1175, url: PREFIJO + "Y2Q9MTE3NXxjZj0wNA%3D%3D" },
};

export const UMBRAL_MENORES = Number(process.env.UMBRAL_MENORES ?? 500);

type Fila = {
  COD_CONTRATO: string;
  TERC_NOMBRE: string | null;
  CONCEPTO: string | null;
  IMPORTE_EJERCICIO: number | string | null;
  FECHA: string | null;
  DEPARTAMENTO: string | null;
  TERC_CIF: string | null;
  TIPO_EXPEDIENTE: string | null;
};

function tituloDepartamento(s: string) {
  // "SALUD Y PORTAVOCIA DEL GOBIERNO" → "Salud y Portavocia del Gobierno"
  const menores = new Set(["y", "de", "del", "la", "las", "los", "el", "e", "en", "para", "a"]);
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && menores.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export async function cargarMenores(anio: number, archivo?: string) {
  const ds = DATASETS_MENORES[anio];
  if (!ds && !archivo) throw new Error(`No hay dataset de menores configurado para ${anio}`);
  return ejecutar("menores", `anio ${anio}`, async () => {
    const ruta = archivo ?? (await descargar(ds.url, `menores_${anio}.json`));
    const json = await leerJsonLocal<{ data: Fila[] } | Fila[]>(ruta);
    const filas = Array.isArray(json) ? json : json.data;

    const porCodigo = new Map<string, Fila>();
    for (const f of filas) if (f.COD_CONTRATO && (num(f.IMPORTE_EJERCICIO) ?? 0) >= UMBRAL_MENORES) porCodigo.set(f.COD_CONTRATO.trim(), f);
    const validas = [...porCodigo.values()];
    const deptos = [...new Set(validas.map((f) => limpiarTexto(f.DEPARTAMENTO)).filter(Boolean) as string[])];
    const orgs = await upsertOrganismos(
      deptos.map((d) => ({ nombre: tituloDepartamento(d), ambito: "autonomico", fuente_alta: "menores", nuts: "ES230" })),
    );
    const empsIn = validas
      .filter((f) => limpiarTexto(f.TERC_NOMBRE) && normalizarNif(f.TERC_CIF))
      .map((f) => ({ nombre: limpiarTexto(f.TERC_NOMBRE)!, nif: f.TERC_CIF }));
    const emps = await upsertEmpresas(empsIn);

    let insertados = 0;
    let actualizados = 0;
    for (const lote of trozos(validas, 1000)) {
      const rows = lote.map((f) => {
        const nombre = limpiarTexto(f.TERC_NOMBRE);
        const cif = limpiarTexto(f.TERC_CIF);
        const nif = normalizarNif(cif);
        const depto = limpiarTexto(f.DEPARTAMENTO);
        const tipoOrigen = limpiarTexto(f.TIPO_EXPEDIENTE);
        return {
          cod_contrato: f.COD_CONTRATO.trim(),
          anio_dataset: anio,
          concepto: limpiarTexto(f.CONCEPTO) ?? "(sin concepto)",
          importe: num(f.IMPORTE_EJERCICIO),
          fecha: fecha(f.FECHA),
          departamento: depto ? tituloDepartamento(depto) : null,
          organismo_id: depto ? orgs.get(claveOrganismo({ nombre: tituloDepartamento(depto) })) ?? null : null,
          tipo: tipoNormalizado(tipoOrigen),
          tipo_origen: tipoOrigen,
          empresa_id: nombre && nif ? emps.get(claveEmpresa({ nombre, nif })) ?? null : null,
          nombre_origen: nombre,
          nif_origen: cif,
          persona_fisica: !nif && !!cif?.includes("*"),
        };
      });
      const res = await sql<{ nuevo: boolean }[]>`
        insert into contratos_menores ${sql(rows)}
        on conflict (cod_contrato) do update set
          anio_dataset = excluded.anio_dataset, concepto = excluded.concepto, importe = excluded.importe,
          fecha = excluded.fecha, departamento = excluded.departamento, organismo_id = excluded.organismo_id,
          tipo = excluded.tipo, tipo_origen = excluded.tipo_origen, empresa_id = excluded.empresa_id,
          nombre_origen = excluded.nombre_origen, nif_origen = excluded.nif_origen,
          persona_fisica = excluded.persona_fisica, updated_at = now()
        returning (xmax = 0) as nuevo`;
      for (const r of res) r.nuevo ? insertados++ : actualizados++;
    }
    return { leidos: filas.length, insertados, actualizados, omitidos: filas.length - validas.length, detalle: { umbral: UMBRAL_MENORES, opd: ds?.opd } };
  });
}

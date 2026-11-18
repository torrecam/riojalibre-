/**
 * Conector: Base de Datos Nacional de Subvenciones (BDNS / SNPSAP), concesiones con impacto en La Rioja.
 * API pública: https://www.infosubvenciones.es/bdnstrans/api  (sin clave; máx. ~10 GET/s, paginación hasta 10.000)
 * Región por defecto 20 = "ES230 - La Rioja" (NUTS-3). Configurable con BDNS_REGIONES="19,20".
 */
import { sql, trozos } from "./lib/db";
import { espera, obtenerJson } from "./lib/http";
import { claveEmpresa, upsertEmpresas } from "./lib/entidades";
import { ejecutar } from "./lib/runs";
import { fecha, limpiarTexto, normalizarNif, num } from "./lib/normaliza";

const API = "https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda";
const PAGE = 1000;

type Concesion = {
  id: number;
  codConcesion: string;
  fechaConcesion: string;
  fechaAlta: string;
  beneficiario: string;
  idPersona: number | null;
  instrumento: string | null;
  importe: number | null;
  ayudaEquivalente: number | null;
  urlBR: string | null;
  numeroConvocatoria: string | null;
  idConvocatoria: number | null;
  convocatoria: string | null;
  nivel1: string | null;
  nivel2: string | null;
  nivel3: string | null;
  codigoInvente: string | null;
};

/** "B26120964 AGUA Y JARDIN SL" → { nif, nombre }; "***9033** NOMBRE" → persona física. */
export function parsearBeneficiario(b: string) {
  const t = (b ?? "").replace(/\s+/g, " ").trim();
  const m = t.match(/^(\S+)\s+(.*)$/);
  if (!m) return { nif: null, nombre: t, personaFisica: false };
  const [, ident, nombre] = m;
  if (ident.includes("*")) return { nif: null, nombre, personaFisica: true };
  const nif = normalizarNif(ident);
  if (nif) {
    // Personas físicas con DNI completo (8 dígitos + letra) también se tratan como personas físicas.
    const personaFisica = /^\d{8}[A-Z]$/.test(nif) || /^[XYZ]\d{7}[A-Z]$/.test(nif);
    return { nif, nombre, personaFisica };
  }
  return { nif: null, nombre: t, personaFisica: false };
}

export async function cargarBdns(opts: { desde?: string; hasta?: string; regiones?: number[] } = {}) {
  const regiones = opts.regiones ?? (process.env.BDNS_REGIONES ?? "20").split(",").map(Number);
  const modo = opts.desde ? `incremental desde ${opts.desde}` : "histórico";
  return ejecutar("bdns", modo, async () => {
    let leidos = 0;
    let insertados = 0;
    let actualizados = 0;
    for (const region of regiones) {
      // La API limita la paginación profunda: se trocea por años si hay muchos resultados.
      const tramos = opts.desde ? [[opts.desde, opts.hasta]] : tramosAnuales();
      for (const [desde, hasta] of tramos) {
        for (let page = 0; ; page++) {
          const q = new URLSearchParams({
            regiones: String(region),
            page: String(page),
            pageSize: String(PAGE),
            order: "fechaConcesion",
            direccion: "desc",
          });
          if (desde) q.set("fechaDesde", ddmmyyyy(desde));
          if (hasta) q.set("fechaHasta", ddmmyyyy(hasta));
          const data = await obtenerJson<{ content: Concesion[]; totalPages: number; last: boolean }>(`${API}?${q}`);
          const contenido = data.content ?? [];
          leidos += contenido.length;
          const r = await guardar(contenido, region);
          insertados += r.insertados;
          actualizados += r.actualizados;
          await espera(250);
          if (data.last || contenido.length === 0 || page + 1 >= (data.totalPages ?? 0)) break;
        }
      }
    }
    return { leidos, insertados, actualizados, omitidos: 0, detalle: { regiones } };
  });
}

function tramosAnuales(): [string | undefined, string | undefined][] {
  const hoy = new Date().getFullYear();
  const out: [string | undefined, string | undefined][] = [[undefined, "2014-12-31"]];
  for (let y = 2015; y <= hoy; y++) out.push([`${y}-01-01`, `${y}-12-31`]);
  return out;
}

function ddmmyyyy(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function guardar(lista: Concesion[], region: number) {
  if (!lista.length) return { insertados: 0, actualizados: 0 };
  const parsed = lista.map((c) => ({ c, b: parsearBeneficiario(c.beneficiario) }));
  const emps = await upsertEmpresas(
    parsed.filter((p) => p.b.nif && !p.b.personaFisica).map((p) => ({ nombre: p.b.nombre, nif: p.b.nif })),
  );
  let insertados = 0;
  let actualizados = 0;
  const unicos = new Map(parsed.map((p) => [p.c.id, p]));
  for (const lote of trozos([...unicos.values()], 1000)) {
    const rows = lote.map(({ c, b }) => ({
      id: c.id,
      cod_concesion: limpiarTexto(c.codConcesion),
      id_convocatoria: c.idConvocatoria ?? null,
      numero_convocatoria: limpiarTexto(c.numeroConvocatoria),
      convocatoria: limpiarTexto(c.convocatoria),
      instrumento: limpiarTexto(c.instrumento),
      importe: num(c.importe),
      ayuda_equivalente: num(c.ayudaEquivalente),
      fecha_concesion: fecha(c.fechaConcesion),
      fecha_alta: fecha(c.fechaAlta),
      beneficiario_nombre: b.nombre,
      beneficiario_nif: b.personaFisica ? null : b.nif,
      id_persona_bdns: c.idPersona ?? null,
      es_persona_fisica: b.personaFisica,
      empresa_id: b.nif && !b.personaFisica ? emps.get(claveEmpresa({ nombre: b.nombre, nif: b.nif })) ?? null : null,
      nivel1: limpiarTexto(c.nivel1),
      nivel2: limpiarTexto(c.nivel2),
      nivel3: limpiarTexto(c.nivel3),
      codigo_invente: limpiarTexto(c.codigoInvente),
      url_bases: limpiarTexto(c.urlBR),
      region_id: region,
    }));
    const res = await sql<{ nuevo: boolean }[]>`
      insert into subvenciones ${sql(rows)}
      on conflict (id) do update set
        cod_concesion = excluded.cod_concesion, id_convocatoria = excluded.id_convocatoria,
        numero_convocatoria = excluded.numero_convocatoria, convocatoria = excluded.convocatoria,
        instrumento = excluded.instrumento, importe = excluded.importe, ayuda_equivalente = excluded.ayuda_equivalente,
        fecha_concesion = excluded.fecha_concesion, fecha_alta = excluded.fecha_alta,
        beneficiario_nombre = excluded.beneficiario_nombre, beneficiario_nif = excluded.beneficiario_nif,
        id_persona_bdns = excluded.id_persona_bdns, es_persona_fisica = excluded.es_persona_fisica,
        empresa_id = excluded.empresa_id, nivel1 = excluded.nivel1, nivel2 = excluded.nivel2, nivel3 = excluded.nivel3,
        codigo_invente = excluded.codigo_invente, url_bases = excluded.url_bases,
        region_id = least(subvenciones.region_id, excluded.region_id), updated_at = now()
      returning (xmax = 0) as nuevo`;
    for (const r of res) r.nuevo ? insertados++ : actualizados++;
  }
  return { insertados, actualizados };
}

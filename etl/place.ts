/**
 * Conector: Plataforma de Contratación del Sector Público (PLACE), sindicación Atom/CODICE
 * "licitacionesPerfilesContratanteCompleto3" (toda España, excluye menores) filtrada a La Rioja:
 *   - código postal del órgano 26xxx, o
 *   - lugar de ejecución NUTS ES23x, o
 *   - mención de «Rioja» en el nombre o la jerarquía del órgano (excluye «Rioja Alavesa»).
 * Modos: feed vivo (siguiendo rel="next") o ZIP mensual del histórico (AAAAMM).
 */
import { XMLParser } from "fast-xml-parser";
import yauzl from "yauzl";
import { descargar, espera, obtenerTexto } from "./lib/http";
import { claveEmpresa, claveOrganismo, upsertEmpresas, upsertOrganismos, type OrganismoIn } from "./lib/entidades";
import { guardarLicitaciones, type LicitacionIn } from "./lib/licitaciones";
import { ejecutar } from "./lib/runs";
import { entero, fecha, limpiarTexto, num, PLACE_ESTADOS, PLACE_PROCEDIMIENTOS, PLACE_TIPOS } from "./lib/normaliza";
import { sql } from "./lib/db";

export const FEED_PLACE =
  "https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom";
export const zipPlace = (aaaamm: string) =>
  `https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3_${aaaamm}.zip`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  textNodeName: "#text",
  parseTagValue: false,
  isArray: (name) =>
    [
      "entry",
      "link",
      "PartyIdentification",
      "TenderResult",
      "RequiredCommodityClassification",
      "ProcurementProjectLot",
      "ValidNoticeInfo",
      "AdditionalPublicationStatus",
      "AdditionalPublicationDocumentReference",
      "WinningParty",
      "AwardedTenderedProject",
    ].includes(name),
});

type X = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const t = (x: X): string | null => {
  if (x === null || x === undefined) return null;
  if (typeof x === "string" || typeof x === "number") return limpiarTexto(x);
  if (Array.isArray(x)) return t(x[0]);
  if (typeof x === "object" && "#text" in x) return limpiarTexto(x["#text"]);
  return null;
};
const arr = (x: X): X[] => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);
const ident = (party: X, scheme: string) =>
  t(arr(party?.PartyIdentification).find((p: X) => p?.ID?.["@_schemeName"] === scheme)?.ID);

const AMBITOS: Record<string, string> = { "1": "estatal", "2": "autonomico", "3": "local" };

export function esDeLaRioja(info: { postal: string | null; nuts: string[]; nombres: string[] }) {
  if (info.postal?.startsWith("26")) return true;
  if (info.nuts.some((n) => n.startsWith("ES23"))) return true;
  return info.nombres.some((n) => /\brioja\b/i.test(n) && !/rioja alavesa/i.test(n));
}

type Parseada = { lic: LicitacionIn; org: OrganismoIn; empresas: { nombre: string; nif: string | null }[] };

export function parsearEntrada(e: X): Parseada | null {
  const cfs = e.ContractFolderStatus;
  if (!cfs) return null;
  const lcp = cfs.LocatedContractingParty ?? {};
  const party = lcp.Party ?? {};
  const nombreOrg = t(party.PartyName?.Name) ?? "Órgano sin nombre";
  const padres: string[] = [];
  let p = lcp.ParentLocatedParty;
  while (p) {
    const n = t(p.PartyName?.Name);
    if (n) padres.push(n);
    p = p.ParentLocatedParty;
  }
  const pp = cfs.ProcurementProject ?? {};
  const lotes = arr(cfs.ProcurementProjectLot);
  const nuts = [
    t(pp.RealizedLocation?.CountrySubentityCode),
    ...lotes.map((l: X) => t(l.ProcurementProject?.RealizedLocation?.CountrySubentityCode)),
  ].filter(Boolean) as string[];
  const postal = t(party.PostalAddress?.PostalZone);
  if (!esDeLaRioja({ postal, nuts, nombres: [nombreOrg, ...padres] })) return null;

  const idAtom = t(e.id) ?? "";
  const idFuente = idAtom.split("/").pop() || idAtom;
  const enlace = arr(e.link).find((l: X) => l?.["@_href"])?.["@_href"] ?? null;
  const dir3 = ident(party, "DIR3");
  const org: OrganismoIn = {
    nombre: nombreOrg,
    nif: ident(party, "NIF"),
    dir3,
    postal,
    ciudad: t(party.PostalAddress?.CityName),
    nuts: nuts[0] ?? null,
    jerarquia: padres.length ? padres.join(" > ") : null,
    ambito: AMBITOS[t(lcp.ContractingPartyTypeCode) ?? ""] ?? "otros",
    fuente_alta: "place",
  };

  const tipoCod = t(pp.TypeCode);
  const estadoCod = t(cfs.ContractFolderStatusCode);
  const procCod = t(cfs.TenderingProcess?.ProcedureCode);
  const budget = pp.BudgetAmount ?? {};
  const dur = pp.PlannedPeriod?.DurationMeasure;
  const durUnit = dur?.["@_unitCode"];
  const durN = entero(t(dur));

  // Fecha de publicación: primer anuncio publicado
  const fechasAnuncio = arr(cfs.ValidNoticeInfo)
    .flatMap((v: X) => arr(v.AdditionalPublicationStatus))
    .flatMap((s: X) => arr(s.AdditionalPublicationDocumentReference))
    .map((d: X) => fecha(t(d.IssueDate)))
    .filter(Boolean)
    .sort() as string[];

  const lotesDesc = new Map<string, string | null>(
    lotes.map((l: X) => [t(l.ID) ?? "", t(l.ProcurementProject?.Name)]),
  );
  const empresas: { nombre: string; nif: string | null }[] = [];
  const adjudicaciones: LicitacionIn["adjudicaciones"] = [];
  let fechaAdj: string | null = null;
  let fechaForm: string | null = null;
  let numLic: number | null = null;
  let resultado: string | null = null;
  for (const tr of arr(cfs.TenderResult)) {
    const fAdj = fecha(t(tr.AwardDate));
    const fForm = fecha(t(tr.Contract?.IssueDate));
    if (fAdj && (!fechaAdj || fAdj > fechaAdj)) fechaAdj = fAdj;
    if (fForm && (!fechaForm || fForm > fechaForm)) fechaForm = fForm;
    const n = entero(t(tr.ReceivedTenderQuantity));
    if (n !== null) numLic = (numLic ?? 0) + n;
    resultado = t(tr.Description) ?? resultado;
    const lote = t(arr(tr.AwardedTenderedProject)[0]?.ProcurementProjectLotID) ?? "";
    const lmt = arr(tr.AwardedTenderedProject)[0]?.LegalMonetaryTotal ?? {};
    for (const wp of arr(tr.WinningParty)) {
      const nombre = t(wp.PartyName?.Name);
      if (!nombre) continue;
      const nif = t(arr(wp.PartyIdentification)[0]?.ID);
      empresas.push({ nombre, nif });
      adjudicaciones.push({
        empresa_clave: claveEmpresa({ nombre, nif }),
        nombre_origen: nombre,
        nif_origen: nif,
        importe: num(t(lmt.TaxExclusiveAmount)),
        importe_con_iva: num(t(lmt.PayableAmount)),
        fecha: fAdj,
        lote_numero: lote,
        lote_descripcion: lote ? lotesDesc.get(lote) ?? null : null,
      });
    }
  }

  const cpvs = new Map<string, null>();
  for (const c of [pp, ...lotes.map((l: X) => l.ProcurementProject ?? {})])
    for (const rc of arr(c.RequiredCommodityClassification)) {
      const cod = t(rc.ItemClassificationCode);
      if (cod) cpvs.set(cod.slice(0, 8), null);
    }

  const deadline = cfs.TenderingProcess?.TenderSubmissionDeadlinePeriod;
  const fd = fecha(t(deadline?.EndDate));
  const lic: LicitacionIn = {
    fuente: "place",
    id_fuente: idFuente,
    codigo_expediente: t(cfs.ContractFolderID),
    anio_expediente: null,
    objeto: t(pp.Name) ?? t(e.title) ?? "(sin objeto)",
    organismo_clave: claveOrganismo(org),
    tipo: tipoCod ? PLACE_TIPOS[tipoCod] ?? "Otro" : null,
    tipo_origen: tipoCod,
    procedimiento: procCod ? PLACE_PROCEDIMIENTOS[procCod] ?? procCod : null,
    estado: estadoCod ? PLACE_ESTADOS[estadoCod] ?? estadoCod : null,
    estado_origen: estadoCod,
    presupuesto_base: num(t(budget.TaxExclusiveAmount)),
    presupuesto_con_iva: num(t(budget.TotalAmount)),
    valor_estimado: num(t(budget.EstimatedOverallContractAmount)),
    fecha_publicacion: fechasAnuncio[0] ?? fecha(t(e.updated)),
    fecha_fin_ofertas: fd ? `${fd}T${(t(deadline?.EndTime) ?? "00:00:00").slice(0, 8)}+01:00` : null,
    fecha_adjudicacion: fechaAdj,
    fecha_formalizacion: fechaForm,
    fecha_actualizacion: t(e.updated),
    lugar_ejecucion: t(pp.RealizedLocation?.CountrySubentity),
    nuts: nuts[0] ?? null,
    duracion_dias: durUnit === "DAY" ? durN : null,
    duracion_meses: durUnit === "MON" ? durN : durUnit === "ANN" && durN !== null ? durN * 12 : null,
    criterios_valoracion: null,
    num_licitadores: numLic,
    resultado_adjudica: resultado,
    url_origen: enlace,
    url_perfil: t(lcp.BuyerProfileURIID),
    raw: { summary: t(e.summary), organo: { nombre: nombreOrg, dir3, padres }, nuts, tipoCod, subtipo: t(pp.SubTypeCode), procCod },
    cpvs: [...cpvs.keys()].map((codigo) => ({ codigo, descripcion: null })),
    adjudicaciones,
  };
  return { lic, org, empresas };
}

function parsearAtom(xml: string) {
  const doc = parser.parse(xml);
  const feed = doc.feed ?? {};
  const next = arr(feed.link).find((l: X) => l?.["@_rel"] === "next")?.["@_href"] ?? null;
  return { entries: arr(feed.entry), next, updated: t(feed.updated) };
}

class Acumulador {
  porId = new Map<string, Parseada>();
  vistas = 0;
  add(entries: X[]) {
    for (const e of entries) {
      this.vistas++;
      const p = parsearEntrada(e);
      if (!p) continue;
      const prev = this.porId.get(p.lic.id_fuente);
      if (!prev || (p.lic.fecha_actualizacion ?? "") >= (prev.lic.fecha_actualizacion ?? "")) this.porId.set(p.lic.id_fuente, p);
    }
  }
  async volcar() {
    const lista = [...this.porId.values()];
    this.porId.clear();
    if (!lista.length) return { insertados: 0, actualizados: 0, n: 0 };
    const orgs = await upsertOrganismos(lista.map((p) => p.org));
    const emps = await upsertEmpresas(lista.flatMap((p) => p.empresas));
    const r = await guardarLicitaciones(lista.map((p) => p.lic), orgs, emps);
    return { ...r, n: lista.length };
  }
}

/** Marca como duplicados de opd-179 los expedientes PLACE que ya vienen del Gobierno de La Rioja. */
async function enlazarDuplicados() {
  await sql`
    update licitaciones l set url_place = p.url_origen
    from licitaciones p
    where l.fuente = 'larioja.org' and p.fuente = 'place'
      and l.codigo_expediente = p.codigo_expediente and l.url_place is distinct from p.url_origen`;
}

/** Feed vivo: sigue rel="next" hasta `paginas` o hasta que las entradas sean anteriores a `desde`. */
export async function cargarPlaceFeed(opts: { paginas?: number; desde?: string; url?: string } = {}) {
  const max = opts.paginas ?? 200;
  return ejecutar("place", `feed${opts.desde ? ` desde ${opts.desde}` : ""} (máx ${max} páginas)`, async () => {
    const acc = new Acumulador();
    let url: string | null = opts.url ?? FEED_PLACE;
    let paginas = 0;
    let ins = 0;
    let act = 0;
    let rioja = 0;
    while (url && paginas < max) {
      let texto: string;
      try {
        texto = await obtenerTexto(url);
      } catch (e) {
        // Guarda lo acumulado antes de fallar para no perder las páginas ya leídas.
        await acc.volcar();
        await enlazarDuplicados();
        throw e;
      }
      const { entries, next } = parsearAtom(texto);
      acc.add(entries);
      paginas++;
      const masAntigua = entries.map((e: X) => t(e.updated) ?? "").sort()[0];
      if (paginas % 20 === 0 || !next) {
        const r = await acc.volcar();
        ins += r.insertados;
        act += r.actualizados;
        rioja += r.n;
        console.log(`  PLACE página ${paginas}: ${acc.vistas} entradas vistas, ${rioja} de La Rioja (hasta ${masAntigua})`);
      }
      if (opts.desde && masAntigua && masAntigua.slice(0, 10) < opts.desde) break;
      url = next;
      await espera(300);
    }
    const r = await acc.volcar();
    ins += r.insertados;
    act += r.actualizados;
    rioja += r.n;
    await enlazarDuplicados();
    return { leidos: acc.vistas, insertados: ins, actualizados: act, omitidos: acc.vistas - rioja, detalle: { paginas, rioja } };
  });
}

/** Histórico mensual: descarga el ZIP AAAAMM y procesa todos sus .atom. */
export async function cargarPlaceZip(aaaamm: string, opts: { archivo?: string; borrarDespues?: boolean } = {}) {
  return ejecutar("place", `zip ${aaaamm}`, async () => {
    const ruta = opts.archivo ?? (await descargar(zipPlace(aaaamm), `place_${aaaamm}.zip`, true));
    const acc = new Acumulador();
    let ficheros = 0;
    let ins = 0;
    let act = 0;
    let rioja = 0;
    const zip = await new Promise<yauzl.ZipFile>((res, rej) =>
      yauzl.open(ruta, { lazyEntries: true }, (err, z) => (err || !z ? rej(err) : res(z))),
    );
    await new Promise<void>((resolve, reject) => {
      zip.on("error", reject);
      zip.on("end", () => resolve());
      zip.on("entry", (entry: yauzl.Entry) => {
        if (!entry.fileName.endsWith(".atom")) return zip.readEntry();
        zip.openReadStream(entry, (err, stream) => {
          if (err || !stream) return reject(err);
          const chunks: Buffer[] = [];
          stream.on("data", (c: Buffer) => chunks.push(c));
          stream.on("error", reject);
          stream.on("end", async () => {
            try {
              acc.add(parsearAtom(Buffer.concat(chunks).toString("utf8")).entries);
              ficheros++;
              if (ficheros % 50 === 0) {
                const r = await acc.volcar();
                ins += r.insertados;
                act += r.actualizados;
                rioja += r.n;
                console.log(`  ZIP ${aaaamm}: ${ficheros} ficheros, ${acc.vistas} entradas, ${rioja} de La Rioja`);
              }
              zip.readEntry();
            } catch (e) {
              reject(e);
            }
          });
        });
      });
      zip.readEntry();
    });
    const r = await acc.volcar();
    ins += r.insertados;
    act += r.actualizados;
    rioja += r.n;
    await enlazarDuplicados();
    if (opts.borrarDespues && !opts.archivo) await import("node:fs/promises").then((fs) => fs.rm(ruta, { force: true }));
    return { leidos: acc.vistas, insertados: ins, actualizados: act, omitidos: acc.vistas - rioja, detalle: { ficheros, rioja } };
  });
}

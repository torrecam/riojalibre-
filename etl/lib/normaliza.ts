// Normalizaciones compartidas por los conectores.

export function limpiarTexto(s: unknown): string | null {
  if (s === null || s === undefined) return null;
  let t = String(s).replace(/\s+/g, " ").trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1).trim();
  return t || null;
}

export function claveNombre(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,;:"'`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** NIF normalizado si parece válido (no enmascarado). */
export function normalizarNif(s: unknown): string | null {
  if (!s) return null;
  const t = String(s).toUpperCase().replace(/[\s.\-\/]/g, "");
  if (!t || t.includes("*")) return null;
  if (!/^[A-Z0-9]{8,14}$/.test(t)) return null;
  if (/^0+$/.test(t)) return null;
  return t;
}

export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/\s/g, "");
  const n = Number(s.includes(",") && !s.includes(".") ? s.replace(",", ".") : s);
  return Number.isFinite(n) ? n : null;
}

export function entero(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.trunc(n);
}

/** Acepta "2016/10/26 00:00:00.000", "2026-11-17", ISO… y devuelve YYYY-MM-DD. */
export function fecha(v: unknown): string | null {
  if (!v) return null;
  const m = String(v).match(/(\d{4})[\/-](\d{2})[\/-](\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  if (y < 1990 || y > 2100) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function fechaHora(v: unknown): string | null {
  if (!v) return null;
  const s = String(v);
  const m = s.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})[ T](\d{2}):(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+01:00`;
  const d = fecha(s);
  return d ? `${d}T00:00:00+01:00` : null;
}

// ---- Tipos de contrato ----
export function tipoNormalizado(origen: string | null): string | null {
  if (!origen) return null;
  const t = claveNombre(origen);
  if (t.includes("suministro")) return "Suministros";
  if (t.includes("concesion de servicio") || t.includes("gestion de servicio")) return "Concesión de servicios";
  if (t.includes("concesion de obra")) return "Concesión de obras";
  if (t.includes("servicio")) return "Servicios";
  if (t.includes("obra")) return "Obras";
  if (t.includes("administrativo especial")) return "Administrativo especial";
  if (t.includes("patrimonial")) return "Patrimonial";
  if (t.includes("privado")) return "Privado";
  return "Otro";
}

// Codelist PLACE ContractCode-2.08
export const PLACE_TIPOS: Record<string, string> = {
  "1": "Suministros",
  "2": "Servicios",
  "3": "Obras",
  "21": "Gestión de servicios públicos",
  "22": "Concesión de servicios",
  "31": "Concesión de obras públicas",
  "32": "Concesión de obras",
  "40": "Colaboración público-privada",
  "7": "Administrativo especial",
  "8": "Privado",
  "50": "Patrimonial",
  "999": "Otros",
};

// Codelist PLACE SyndicationTenderingProcessCode-2.07
export const PLACE_PROCEDIMIENTOS: Record<string, string> = {
  "1": "Abierto",
  "2": "Restringido",
  "3": "Negociado sin publicidad",
  "4": "Negociado con publicidad",
  "5": "Diálogo competitivo",
  "6": "Contrato menor",
  "7": "Derivado de acuerdo marco",
  "8": "Concurso de proyectos",
  "9": "Abierto simplificado",
  "10": "Asociación para la innovación",
  "11": "Derivado de asociación para la innovación",
  "12": "Basado en sistema dinámico de adquisición",
  "13": "Licitación con negociación",
  "100": "Normas internas",
  "999": "Otros",
};

// ---- Estados ----
// Estados normalizados de la UI.
export const ESTADOS = ["Anuncio previo", "En plazo", "Pendiente de adjudicación", "Adjudicada", "Resuelta", "Anulada"] as const;

// Codelist PLACE SyndicationContractFolderStatusCode
export const PLACE_ESTADOS: Record<string, string> = {
  PRE: "Anuncio previo",
  PUB: "En plazo",
  EV: "Pendiente de adjudicación",
  ADJ: "Adjudicada",
  RES: "Resuelta",
  ANUL: "Anulada",
};

export function estadoOpd(origen: string | null): string | null {
  if (!origen) return null;
  const t = claveNombre(origen);
  if (t.startsWith("resuelta")) return "Resuelta";
  if (t.startsWith("adjudicada")) return "Adjudicada";
  if (t.startsWith("pendiente")) return "Pendiente de adjudicación";
  if (t.startsWith("anulada") || t.includes("desist") || t.includes("renuncia")) return "Anulada";
  if (t.startsWith("en plazo")) return "En plazo";
  if (t.includes("previo")) return "Anuncio previo";
  return origen;
}

/** Interpreta "45233140, Obras viales; 45000000, ..." */
export function parsearCpvs(s: string | null): { codigo: string; descripcion: string | null }[] {
  if (!s) return [];
  const out = new Map<string, string | null>();
  const re = /(\d{8})(?:-\d)?\s*,?\s*([^;|\d]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const desc = m[2]?.replace(/[;,|\s]+$/, "").trim() || null;
    if (!out.has(m[1]) || (!out.get(m[1]) && desc)) out.set(m[1], desc);
  }
  return [...out].map(([codigo, descripcion]) => ({ codigo, descripcion }));
}

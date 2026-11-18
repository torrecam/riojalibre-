const TZ = "Europe/Madrid";

// useGrouping "always": en es-ES Intl no agrupa los números de 4 cifras (1234 → 1.234).
const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
const eur2 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
const entero = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: "always" });
const dec = (max: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: max, useGrouping: "always" });

export function euros(n: number | null | undefined, decimales = false) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return (decimales ? eur2 : eur).format(n);
}

/** 4.067.314.956 → "4.067 M€" ; 212.345 → "212 mil €" */
export function eurosCompacto(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  const a = Math.abs(n);
  if (a >= 1e6) return `${dec(a >= 1e8 ? 0 : 1).format(n / 1e6)} M€`;
  if (a >= 1e4) return `${dec(0).format(n / 1e3)} mil €`;
  return euros(n);
}

export function numero(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return entero.format(n);
}

export function fecha(d: string | Date | null | undefined) {
  if (!d) return "—";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("es-ES", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fechaHora(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("es-ES", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " h";
}

export function porcentaje(parte: number, total: number) {
  if (!total) return "0 %";
  return `${((parte / total) * 100).toLocaleString("es-ES", { maximumFractionDigits: parte / total < 0.01 ? 1 : 0 })} %`;
}

export function capitalizar(s: string | null | undefined) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Limpia el texto en mayúsculas de las fuentes ("CONSEJERIA DE SALUD" → "Consejeria de Salud"). */
export function suavizarMayusculas(s: string | null | undefined) {
  if (!s) return "";
  const letras = s.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, "");
  if (!letras || letras !== letras.toUpperCase()) return s;
  const menores = new Set(["y", "de", "del", "la", "las", "los", "el", "e", "en", "para", "a", "con", "por", "o", "u", "al"]);
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) => (i > 0 && menores.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("")
    .replace(/\b(S\.?l\.?u?|S\.?a\.?|Sl|Sa|Slu|Ute|Sau|Scl|Sll|Cb|Sc)\b\.?/gi, (m) => m.toUpperCase());
}

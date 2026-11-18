function celda(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : typeof v === "number" ? String(v).replace(".", ",") : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // evita inyección de fórmulas en hojas de cálculo
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV con separador «;» y BOM UTF-8 (se abre bien en Excel en español). */
export function aCsv(filas: readonly Record<string, unknown>[]): string {
  if (!filas.length) return "\uFEFF";
  const cols = Object.keys(filas[0]);
  const lineas = [cols.join(";"), ...filas.map((f) => cols.map((c) => celda(f[c])).join(";"))];
  return "\uFEFF" + lineas.join("\r\n") + "\r\n";
}

export function respuestaCsv(nombre: string, filas: readonly Record<string, unknown>[]) {
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  return new Response(aCsv(filas), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nombre}_${hoy}.csv"`,
      "cache-control": "public, max-age=300",
    },
  });
}

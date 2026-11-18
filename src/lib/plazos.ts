export function diasHasta(f: Date | string | null | undefined) {
  if (!f) return null;
  const d = typeof f === "string" ? new Date(f.length === 10 ? f + "T23:59:59" : f) : f;
  return Math.floor((d.getTime() - Date.now()) / 86_400_000);
}
export function textoDias(n: number | null) {
  if (n === null) return "sin plazo";
  if (n < 0) return "cerrado";
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  return `${n} días`;
}

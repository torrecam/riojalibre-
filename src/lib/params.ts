export type SP = Record<string, string | string[] | undefined>;

export function str(sp: SP, k: string): string | undefined {
  const v = sp[k];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

export function numParam(sp: SP, k: string): number | undefined {
  const s = str(sp, k);
  if (!s) return undefined;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function fechaParam(sp: SP, k: string): string | undefined {
  const s = str(sp, k);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
}

export function pagina(sp: SP): number {
  const n = Number(str(sp, "pagina") ?? "1");
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 10_000) : 1;
}

export function esUuid(s: string | undefined): boolean {
  return !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Construye un querystring conservando los filtros actuales y sustituyendo algunos. */
export function qs(sp: SP, cambios: Record<string, string | number | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s) u.set(k, s);
  }
  for (const [k, v] of Object.entries(cambios)) {
    if (v === undefined || v === null || v === "") u.delete(k);
    else u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

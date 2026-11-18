import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const UA = "RiojaAbierta-ETL/1.0 (+https://github.com/torrecam/riojalibre-; datos abiertos)";
export const CACHE_DIR = process.env.ETL_CACHE_DIR || path.join(process.cwd(), "data");

export const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function obtener(url: string, opts: { intentos?: number; timeoutMs?: number } = {}): Promise<Response> {
  const intentos = opts.intentos ?? 4;
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, accept: "*/*" },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status} en ${url}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      return res;
    } catch (e) {
      ultimo = e;
      await espera(1500 * (i + 1) ** 2);
    }
  }
  throw ultimo;
}

export async function obtenerJson<T = unknown>(url: string): Promise<T> {
  const res = await obtener(url);
  return (await res.json()) as T;
}

/** Descarga el cuerpo completo como texto, reintentando también si falla la lectura del cuerpo
 *  (las páginas "next" del feed de PLACE pesan 14-17 MB y pueden tardar más de un minuto). */
export async function obtenerTexto(url: string, opts: { intentos?: number; timeoutMs?: number } = {}): Promise<string> {
  const intentos = opts.intentos ?? 4;
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await obtener(url, { intentos: 1, timeoutMs: opts.timeoutMs ?? 10 * 60_000 });
      return await res.text();
    } catch (e) {
      ultimo = e;
      await espera(2000 * (i + 1) ** 2);
    }
  }
  throw ultimo;
}

/** Descarga a disco (con caché opcional por nombre). Devuelve la ruta local. */
export async function descargar(url: string, nombre: string, usarCache = false): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const destino = path.join(CACHE_DIR, nombre);
  if (usarCache) {
    try {
      const s = await stat(destino);
      if (s.size > 0) return destino;
    } catch {}
  }
  const res = await obtener(url, { timeoutMs: 30 * 60_000 });
  if (!res.body) throw new Error("Respuesta sin cuerpo");
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(destino));
  return destino;
}

export async function leerJsonLocal<T = unknown>(ruta: string): Promise<T> {
  return JSON.parse(await readFile(ruta, "utf8")) as T;
}

export async function guardar(ruta: string, contenido: string) {
  await writeFile(ruta, contenido);
}

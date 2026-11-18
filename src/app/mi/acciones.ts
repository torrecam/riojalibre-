"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { esUuid } from "@/lib/params";
import { requerirUsuario } from "@/lib/usuario";
import {
  ESTADOS, actualizarSeguimiento, cambiarEstado, dejarDeSeguir, guardarPerfil, seguir,
  tareaBorrar, tareaMarcar, tareaNueva, type DatosPerfil, type EstadoSeg,
} from "@/lib/queries/usuario";

const refrescar = () => revalidatePath("/mi", "layout");
const estadoValido = (e: unknown): e is EstadoSeg => typeof e === "string" && (ESTADOS as readonly string[]).includes(e);

export async function accSeguir(licitacionId: string, estado: string = "interesa", motivo?: string | null) {
  const u = await requerirUsuario();
  if (!esUuid(licitacionId) || !estadoValido(estado)) return { error: "Datos no válidos" };
  await seguir(u.id, licitacionId, estado, motivo ? String(motivo).slice(0, 300) : null);
  refrescar();
  revalidatePath(`/licitaciones/${licitacionId}`);
  return { ok: true };
}

export async function accEstado(segId: string, estado: string, motivo?: string | null) {
  const u = await requerirUsuario();
  if (!esUuid(segId) || !estadoValido(estado)) return { error: "Datos no válidos" };
  await cambiarEstado(u.id, segId, estado, motivo ? String(motivo).slice(0, 300) : null);
  refrescar();
  return { ok: true };
}

export async function accDejar(segId: string, volverA?: string) {
  const u = await requerirUsuario();
  if (!esUuid(segId)) return;
  await dejarDeSeguir(u.id, segId);
  refrescar();
  if (volverA) redirect(volverA);
}

export async function accActualizar(f: FormData) {
  const u = await requerirUsuario();
  const id = String(f.get("id") ?? "");
  if (!esUuid(id)) return;
  const notas = String(f.get("notas") ?? "").slice(0, 5000).trim() || null;
  const fecha = String(f.get("fecha_limite_interna") ?? "");
  const imp = Number(String(f.get("importe_ofertado") ?? "").replace(/\./g, "").replace(",", "."));
  await actualizarSeguimiento(u.id, id, {
    notas,
    fecha_limite_interna: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
    importe_ofertado: Number.isFinite(imp) && imp > 0 ? Math.round(imp * 100) / 100 : null,
  });
  refrescar();
}

export async function accTareaNueva(segId: string, texto: string) {
  const u = await requerirUsuario();
  const t = texto.trim();
  if (!esUuid(segId) || !t) return;
  await tareaNueva(u.id, segId, t);
  refrescar();
}
export async function accTareaMarcar(id: string, hecho: boolean) {
  const u = await requerirUsuario();
  if (!esUuid(id)) return;
  await tareaMarcar(u.id, id, !!hecho);
  refrescar();
}
export async function accTareaBorrar(id: string) {
  const u = await requerirUsuario();
  if (!esUuid(id)) return;
  await tareaBorrar(u.id, id);
  refrescar();
}

// ---------- Perfil ----------

const lista = (v: unknown, max = 40, largo = 80) =>
  Array.isArray(v) ? [...new Set(v.map((x) => String(x).trim().slice(0, largo)).filter(Boolean))].slice(0, max) : [];
const num = (v: unknown, max = 1e12) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && String(v ?? "") !== "" ? Math.min(n, max) : null;
};

export async function accGuardarPerfil(d: Partial<DatosPerfil>, final = false) {
  const u = await requerirUsuario();
  const cif = String(d.cif ?? "").toUpperCase().replace(/[\s.\-]/g, "").slice(0, 12) || null;
  if (cif && !/^[A-Z0-9]{8,12}$/.test(cif)) return { error: "El CIF/NIF no parece válido." };
  const min = num(d.importe_min), max = num(d.importe_max);
  if (min !== null && max !== null && min > max) return { error: "El importe mínimo no puede superar al máximo." };
  const cpvs = Array.isArray(d.cpvs)
    ? d.cpvs.filter((c) => /^\d{2,8}$/.test(String(c.codigo))).slice(0, 60).map((c) => ({ codigo: String(c.codigo), descripcion: c.descripcion ? String(c.descripcion).slice(0, 200) : null }))
    : undefined;
  await guardarPerfil(u.id, {
    empresa: String(d.empresa ?? "").trim().slice(0, 160) || null,
    cif,
    palabras_clave: lista(d.palabras_clave),
    palabras_negativas: lista(d.palabras_negativas),
    zonas: lista(d.zonas, 30),
    organismos_preferidos: lista(d.organismos_preferidos, 50).filter(esUuid),
    organismos_excluidos: lista(d.organismos_excluidos, 50).filter(esUuid),
    tipos: lista(d.tipos, 10),
    procedimientos: lista(d.procedimientos, 20, 120),
    importe_min: min,
    importe_max: max,
    facturacion_anual: num(d.facturacion_anual),
    plantilla: num(d.plantilla, 1e6) === null ? null : Math.round(num(d.plantilla, 1e6)!),
    clasificacion: String(d.clasificacion ?? "").trim().slice(0, 200) || null,
    plazo_preparacion_dias: Math.max(0, Math.min(180, Math.round(num(d.plazo_preparacion_dias, 180) ?? 10))),
    alertas_email: !!d.alertas_email,
    alertas_frecuencia: d.alertas_frecuencia === "diaria" ? "diaria" : "semanal",
    alertas_umbral: Math.max(0, Math.min(100, Math.round(num(d.alertas_umbral, 100) ?? 60))),
    ...(final ? { onboarding_completo: true } : {}),
    cpvs,
  });
  refrescar();
  return { ok: true };
}

export async function accBuscarCpv(q: string) {
  await requerirUsuario();
  const t = q.trim().slice(0, 60);
  if (t.length < 2) return [];
  const sql = db();
  const dig = t.replace(/\D/g, "");
  return sql<{ codigo: string; descripcion: string | null; n: number }[]>`
    select left(codigo, 8) codigo, max(descripcion) descripcion, count(*)::int n from licitacion_cpvs
    where ${/^\d+$/.test(t) ? sql`codigo like ${dig + "%"}` : sql`public.f_norm(descripcion) like '%' || public.f_norm(${t}) || '%'`}
    group by 1 order by n desc limit 15`;
}

export async function accBuscarOrganismo(q: string) {
  await requerirUsuario();
  const t = q.trim().slice(0, 60);
  if (t.length < 2) return [];
  return db()<{ id: string; nombre: string }[]>`
    select o.id, o.nombre from organismos o
    where public.f_norm(o.nombre) like '%' || public.f_norm(${t}) || '%'
    order by (select count(*) from licitaciones l where l.organismo_id = o.id) desc limit 12`;
}

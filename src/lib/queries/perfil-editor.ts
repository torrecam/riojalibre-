import "server-only";
import { db } from "../db";
import { cpvSugeridos, perfilDe } from "./usuario";
import type { PerfilEditable } from "@/components/cuenta/EditorPerfil";

export async function datosEditor(uid: string) {
  const [{ perfil, cpvs, organismos }, sugeridos, procs] = await Promise.all([
    perfilDe(uid),
    cpvSugeridos(uid),
    db()<{ v: string }[]>`select procedimiento v from licitaciones where procedimiento is not null group by 1 order by count(*) desc limit 10`,
  ]);
  const inicial: PerfilEditable = {
    empresa: perfil?.empresa ?? "",
    cif: perfil?.cif ?? "",
    palabras_clave: perfil?.palabras_clave ?? [],
    palabras_negativas: perfil?.palabras_negativas ?? [],
    zonas: perfil?.zonas ?? [],
    organismos_preferidos: perfil?.organismos_preferidos ?? [],
    organismos_excluidos: perfil?.organismos_excluidos ?? [],
    tipos: perfil?.tipos ?? [],
    procedimientos: perfil?.procedimientos ?? [],
    importe_min: perfil?.importe_min ?? null,
    importe_max: perfil?.importe_max ?? null,
    facturacion_anual: perfil?.facturacion_anual ?? null,
    plantilla: perfil?.plantilla ?? null,
    clasificacion: perfil?.clasificacion ?? "",
    plazo_preparacion_dias: perfil?.plazo_preparacion_dias ?? 10,
    alertas_email: perfil?.alertas_email ?? false,
    alertas_frecuencia: perfil?.alertas_frecuencia ?? "semanal",
    alertas_umbral: perfil?.alertas_umbral ?? 60,
    cpvs: cpvs.map((c) => ({ codigo: c.codigo, descripcion: c.descripcion })),
  };
  return { perfil, inicial, organismos, sugeridos, procedimientos: procs.map((p) => p.v) };
}

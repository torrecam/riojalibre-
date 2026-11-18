import type { EstadoSeg } from "@/lib/queries/usuario";

export const ESTADOS_UI: { v: EstadoSeg; t: string; color: string; punto: string }[] = [
  { v: "interesa", t: "Me interesa", color: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800", punto: "#3b82f6" },
  { v: "preparando", t: "Preparando", color: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800", punto: "#d89b2b" },
  { v: "presentada", t: "Presentada", color: "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-800", punto: "#8b5cf6" },
  { v: "ganada", t: "Ganada", color: "bg-vid-50 text-vid-700 ring-vid-300/60", punto: "var(--color-vid-500)" },
  { v: "perdida", t: "Perdida", color: "bg-stone-100 text-stone-600 ring-stone-300", punto: "var(--color-stone-400)" },
  { v: "descartada", t: "Descartada", color: "bg-vino-50 text-vino-800 ring-vino-200", punto: "var(--color-vino-500)" },
  { v: "desierta", t: "Desierta / anulada", color: "bg-stone-100 text-stone-500 ring-stone-300", punto: "var(--color-stone-300)" },
];
export const ESTADO_UI = Object.fromEntries(ESTADOS_UI.map((e) => [e.v, e])) as Record<EstadoSeg, (typeof ESTADOS_UI)[number]>;

/** Estados que el usuario puede elegir a mano («desierta» la pone el sistema, aunque también se permite). */
export const ESTADOS_MANUALES = ESTADOS_UI.map((e) => e.v);

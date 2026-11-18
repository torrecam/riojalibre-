import "server-only";
import { conUsuario, type Tx } from "../usuario";

export const ESTADOS = ["interesa", "preparando", "presentada", "ganada", "perdida", "descartada", "desierta"] as const;
export type EstadoSeg = (typeof ESTADOS)[number];
export const ESTADOS_ACTIVOS: EstadoSeg[] = ["interesa", "preparando", "presentada"];

export const ETIQUETA_ESTADO: Record<EstadoSeg, string> = {
  interesa: "Me interesa",
  preparando: "Preparando",
  presentada: "Presentada",
  ganada: "Ganada",
  perdida: "Perdida",
  descartada: "Descartada",
  desierta: "Desierta / anulada",
};

export type Perfil = {
  user_id: string;
  empresa: string | null;
  cif: string | null;
  palabras_clave: string[];
  palabras_negativas: string[];
  zonas: string[];
  organismos_preferidos: string[];
  organismos_excluidos: string[];
  tipos: string[];
  procedimientos: string[];
  importe_min: number | null;
  importe_max: number | null;
  facturacion_anual: number | null;
  plantilla: number | null;
  clasificacion: string | null;
  plazo_preparacion_dias: number;
  alertas_email: boolean;
  alertas_frecuencia: "diaria" | "semanal";
  alertas_umbral: number;
  onboarding_completo: boolean;
};
export type CpvPerfil = { codigo: string; descripcion: string | null; origen: string };
export type Motivo = { criterio: string; puntos: number; texto: string };
export type Idoneidad = { licitacion_id: string; puntuacion: number; positivos: Motivo[]; negativos: Motivo[] };

export async function perfilDe(uid: string) {
  return conUsuario(uid, async (tx) => {
    const [p] = await tx<Perfil[]>`select * from perfiles where user_id = ${uid}`;
    const cpvs = await tx<CpvPerfil[]>`select codigo, descripcion, origen from perfil_cpv where user_id = ${uid} order by codigo`;
    const orgs = p && (p.organismos_preferidos.length || p.organismos_excluidos.length)
      ? await tx<{ id: string; nombre: string }[]>`select id, nombre from organismos where id = any(${[...p.organismos_preferidos, ...p.organismos_excluidos]}::uuid[])`
      : [];
    return { perfil: p ?? null, cpvs, organismos: Object.fromEntries(orgs.map((o) => [o.id, o.nombre])) as Record<string, string> };
  });
}

export type DatosPerfil = Omit<Perfil, "user_id" | "onboarding_completo"> & { onboarding_completo?: boolean; cpvs: { codigo: string; descripcion: string | null }[] };

export async function guardarPerfil(uid: string, d: Partial<DatosPerfil>) {
  return conUsuario(uid, async (tx) => {
    await tx`insert into perfiles (user_id) values (${uid}) on conflict (user_id) do nothing`;
    const campos = { ...d } as Record<string, unknown>;
    delete campos.cpvs;
    const claves = Object.keys(campos).filter((k) => campos[k] !== undefined);
    if (claves.length) await tx`update perfiles set ${tx(campos as Record<string, never>, claves)} where user_id = ${uid}`;
    if (d.cpvs) {
      await tx`delete from perfil_cpv where user_id = ${uid}`;
      for (const c of d.cpvs) {
        await tx`insert into perfil_cpv (user_id, codigo, descripcion) values (${uid}, ${c.codigo}, ${c.descripcion}) on conflict do nothing`;
      }
    }
  });
}

export type Sugerida = Idoneidad & {
  objeto: string;
  organismo: string | null;
  tipo: string | null;
  presupuesto_base: number | null;
  fecha_fin_ofertas: Date | null;
  estado_lic: string | null;
  seguimiento: EstadoSeg | null;
  seguimiento_id: string | null;
};

async function idoneidadCon(tx: Tx, ids: string[] | null, limite = 300) {
  return tx<Sugerida[]>`
    select i.licitacion_id, i.puntuacion, i.positivos, i.negativos,
      l.objeto, o.nombre organismo, l.tipo, l.presupuesto_base, l.fecha_fin_ofertas, l.estado estado_lic,
      s.estado seguimiento, s.id seguimiento_id
    from public.idoneidad(${ids}::uuid[], ${limite}) i
    join licitaciones l on l.id = i.licitacion_id
    left join organismos o on o.id = l.organismo_id
    left join seguimientos s on s.licitacion_id = i.licitacion_id and s.user_id = (select auth.uid())
    order by i.puntuacion desc, l.fecha_fin_ofertas asc nulls last`;
}

/** Licitaciones abiertas ordenadas por idoneidad. */
export async function sugeridas(uid: string) {
  return conUsuario(uid, (tx) => idoneidadCon(tx, null, 400));
}

/** Idoneidad de licitaciones concretas (fichas y listados). */
export async function idoneidadDe(uid: string, ids: string[]) {
  if (!ids.length) return new Map<string, Sugerida>();
  const filas = await conUsuario(uid, (tx) => idoneidadCon(tx, ids, ids.length));
  return new Map(filas.map((f) => [f.licitacion_id, f]));
}

export type SeguimientoFila = {
  id: string;
  licitacion_id: string;
  estado: EstadoSeg;
  motivo_descarte: string | null;
  notas: string | null;
  fecha_limite_interna: string | null;
  importe_ofertado: number | null;
  puntuacion_inicial: number | null;
  updated_at: Date;
  created_at: Date;
  objeto: string;
  organismo: string | null;
  presupuesto_base: number | null;
  fecha_fin_ofertas: Date | null;
  hechos: number;
  total: number;
};

export async function seguimientosDe(uid: string) {
  return conUsuario(uid, (tx) => tx<SeguimientoFila[]>`
    select s.id, s.licitacion_id, s.estado, s.motivo_descarte, s.notas, s.fecha_limite_interna, s.importe_ofertado,
      s.puntuacion_inicial, s.updated_at, s.created_at,
      l.objeto, o.nombre organismo, l.presupuesto_base, l.fecha_fin_ofertas,
      (select count(*) filter (where c.hecho) from seguimiento_checklist c where c.seguimiento_id = s.id)::int hechos,
      (select count(*) from seguimiento_checklist c where c.seguimiento_id = s.id)::int total
    from seguimientos s join licitaciones l on l.id = s.licitacion_id left join organismos o on o.id = l.organismo_id
    order by s.updated_at desc`);
}

export type Evento = { id: number; estado_anterior: EstadoSeg | null; estado_nuevo: EstadoSeg; nota: string | null; automatico: boolean; created_at: Date };
export type Tarea = { id: string; texto: string; hecho: boolean; orden: number };

export async function seguimientoDe(uid: string, licitacionId: string) {
  return conUsuario(uid, async (tx) => {
    const [s] = await tx<SeguimientoFila[]>`
      select s.*, l.objeto, o.nombre organismo, l.presupuesto_base, l.fecha_fin_ofertas, 0 hechos, 0 total
      from seguimientos s join licitaciones l on l.id = s.licitacion_id left join organismos o on o.id = l.organismo_id
      where s.licitacion_id = ${licitacionId}`;
    if (!s) return null;
    const tareas = await tx<Tarea[]>`select id, texto, hecho, orden from seguimiento_checklist where seguimiento_id = ${s.id} order by orden, texto`;
    const eventos = await tx<Evento[]>`select id, estado_anterior, estado_nuevo, nota, automatico, created_at from seguimiento_eventos where seguimiento_id = ${s.id} order by created_at desc, id desc`;
    return { s, tareas, eventos };
  });
}

export async function kpisPanel(uid: string) {
  return conUsuario(uid, async (tx) => {
    const [k] = await tx<{ activos: number; plazo7: number; ganadas: number; resueltas: number; total: number }[]>`
      select count(*) filter (where s.estado in ('interesa','preparando','presentada'))::int activos,
        count(*) filter (where s.estado in ('interesa','preparando','presentada')
          and (coalesce(s.fecha_limite_interna::timestamptz, l.fecha_fin_ofertas) between now() and now() + interval '7 days'))::int plazo7,
        count(*) filter (where s.estado = 'ganada')::int ganadas,
        count(*) filter (where s.estado in ('ganada','perdida'))::int resueltas,
        count(*)::int total
      from seguimientos s join licitaciones l on l.id = s.licitacion_id`;
    const sug = await idoneidadCon(tx, null, 400);
    return { ...k, sugeridas: sug };
  });
}

// ---------- Mutaciones (siempre con RLS) ----------

export async function seguir(uid: string, licitacionId: string, estado: EstadoSeg = "interesa", motivo: string | null = null) {
  return conUsuario(uid, async (tx) => {
    const [i] = await tx<{ puntuacion: number }[]>`select puntuacion from public.idoneidad(${[licitacionId]}::uuid[], 1)`;
    const [s] = await tx<{ id: string }[]>`
      insert into seguimientos (user_id, licitacion_id, estado, puntuacion_inicial, motivo_descarte)
      values (${uid}, ${licitacionId}, ${estado}, ${i?.puntuacion ?? null}, ${estado === "descartada" ? (motivo?.trim() || "Sin motivo") : null})
      on conflict (user_id, licitacion_id) do update set estado = excluded.estado, motivo_descarte = excluded.motivo_descarte
      returning id`;
    return s.id;
  });
}

export async function cambiarEstado(uid: string, segId: string, estado: EstadoSeg, motivo?: string | null) {
  return conUsuario(uid, (tx) => tx`
    update seguimientos set estado = ${estado},
      motivo_descarte = ${estado === "descartada" ? (motivo?.trim() || "Sin motivo") : null}
    where id = ${segId}`);
}

export async function actualizarSeguimiento(uid: string, segId: string, d: { notas: string | null; fecha_limite_interna: string | null; importe_ofertado: number | null }) {
  return conUsuario(uid, (tx) => tx`
    update seguimientos set notas = ${d.notas}, fecha_limite_interna = ${d.fecha_limite_interna}, importe_ofertado = ${d.importe_ofertado}
    where id = ${segId}`);
}

export async function dejarDeSeguir(uid: string, segId: string) {
  return conUsuario(uid, (tx) => tx`delete from seguimientos where id = ${segId}`);
}

export async function tareaNueva(uid: string, segId: string, texto: string) {
  return conUsuario(uid, (tx) => tx`
    insert into seguimiento_checklist (seguimiento_id, user_id, texto, orden)
    select ${segId}, ${uid}, ${texto.slice(0, 200)}, coalesce(max(orden), 0) + 1 from seguimiento_checklist where seguimiento_id = ${segId}`);
}
export async function tareaMarcar(uid: string, id: string, hecho: boolean) {
  return conUsuario(uid, (tx) => tx`update seguimiento_checklist set hecho = ${hecho} where id = ${id}`);
}
export async function tareaBorrar(uid: string, id: string) {
  return conUsuario(uid, (tx) => tx`delete from seguimiento_checklist where id = ${id}`);
}

/** Sugerencias de CPV a partir de licitaciones marcadas «me interesa» que aún no cubre el perfil. */
export async function cpvSugeridos(uid: string) {
  return conUsuario(uid, (tx) => tx<{ codigo: string; descripcion: string | null; n: number }[]>`
    select c.codigo, max(c.descripcion) descripcion, count(*)::int n
    from seguimientos s join licitacion_cpvs c on c.licitacion_id = s.licitacion_id
    where s.estado <> 'descartada'
      and not exists (select 1 from perfil_cpv p where p.user_id = (select auth.uid()) and c.codigo like p.codigo || '%')
    group by c.codigo order by n desc, c.codigo limit 8`);
}

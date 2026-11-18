"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bell, Building2, Check, Loader2, MapPin, Plus, Search, Tags, X } from "lucide-react";
import { accBuscarCpv, accBuscarOrganismo, accGuardarPerfil } from "@/app/mi/acciones";
import type { DatosPerfil } from "@/lib/queries/usuario";
import { DIVISIONES_CPV, TIPOS_CONTRATO, ZONAS } from "@/lib/catalogos";

export type PerfilEditable = Omit<DatosPerfil, "onboarding_completo">;
type Props = {
  inicial: PerfilEditable;
  nombresOrganismos: Record<string, string>;
  procedimientos: string[];
  cpvSugeridos: { codigo: string; descripcion: string | null; n: number }[];
  modo: "asistente" | "completo";
};

const PASOS = [
  { t: "Tu empresa", d: "Para medir tu solvencia y reconocer tus adjudicaciones.", i: Building2 },
  { t: "Qué haces", d: "Sectores CPV y palabras que buscamos en el objeto.", i: Tags },
  { t: "Dónde y cuánto", d: "Zonas, tipos de contrato, importes y plazos.", i: MapPin },
  { t: "Organismos y alertas", d: "A quién prefieres venderle y cómo avisarte.", i: Bell },
];

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));

export function EditorPerfil({ inicial, nombresOrganismos, procedimientos, cpvSugeridos, modo }: Props) {
  const router = useRouter();
  const [p, setP] = useState<PerfilEditable>(inicial);
  const [nombres, setNombres] = useState(nombresOrganismos);
  const [paso, setPaso] = useState(0);
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const set = <K extends keyof PerfilEditable>(k: K, v: PerfilEditable[K]) => { setP((x) => ({ ...x, [k]: v })); setMsg(null); };

  const guardar = (final: boolean, luego?: () => void) =>
    start(async () => {
      const r = await accGuardarPerfil(p, final);
      if (r?.error) return setMsg({ error: r.error });
      setMsg({ ok: "Perfil guardado. Las puntuaciones ya están recalculadas." });
      luego?.();
      if (modo === "completo") router.refresh();
    });

  const secciones = [
    <div key="0" className="grid gap-4 sm:grid-cols-2">
      <Texto label="Nombre de la empresa" value={p.empresa ?? ""} onChange={(v) => set("empresa", v)} placeholder="Construcciones Ebro S.L." />
      <Texto label="CIF / NIF (opcional)" value={p.cif ?? ""} onChange={(v) => set("cif", v)} placeholder="B26123456" ayuda="Detecta automáticamente las licitaciones que ganes." />
      <Numero label="Facturación anual (€)" value={fmt(p.facturacion_anual)} onChange={(v) => set("facturacion_anual", v as never)} ayuda="Avisa si un contrato supera tu solvencia económica." />
      <Numero label="Plantilla (personas)" value={fmt(p.plantilla)} onChange={(v) => set("plantilla", v as never)} />
      <div className="sm:col-span-2"><Texto label="Clasificación de contratista (opcional)" value={p.clasificacion ?? ""} onChange={(v) => set("clasificacion", v)} placeholder="Grupo C, subgrupo 2, categoría 3" /></div>
    </div>,
    <div key="1" className="space-y-6">
      <SelectorCpv valor={p.cpvs} onChange={(v) => set("cpvs", v)} sugeridos={cpvSugeridos} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Etiquetas label="Palabras clave" ayuda="Suman puntos si aparecen en el objeto." valor={p.palabras_clave} onChange={(v) => set("palabras_clave", v)} placeholder="mantenimiento, alumbrado…" tono="vid" />
        <Etiquetas label="Palabras a evitar" ayuda="Restan 25 puntos." valor={p.palabras_negativas} onChange={(v) => set("palabras_negativas", v)} placeholder="vehículos, renting…" tono="vino" />
      </div>
    </div>,
    <div key="2" className="space-y-6">
      <Opciones label="Zonas o municipios" ayuda="«Toda La Rioja» acepta cualquier lugar. Los organismos autonómicos cuentan en todas las zonas." opciones={ZONAS} valor={p.zonas} onChange={(v) => set("zonas", v)} libre />
      <Opciones label="Tipos de contrato" opciones={TIPOS_CONTRATO} valor={p.tipos} onChange={(v) => set("tipos", v)} />
      <Opciones label="Procedimientos preferidos (opcional)" ayuda="Si eliges alguno, el resto resta 5 puntos." opciones={procedimientos} valor={p.procedimientos} onChange={(v) => set("procedimientos", v)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Numero label="Importe mínimo (€)" value={fmt(p.importe_min)} onChange={(v) => set("importe_min", v as never)} />
        <Numero label="Importe máximo (€)" value={fmt(p.importe_max)} onChange={(v) => set("importe_max", v as never)} />
        <Numero label="Días mínimos para preparar" value={fmt(p.plazo_preparacion_dias)} onChange={(v) => set("plazo_preparacion_dias", v as never)} ayuda="Penaliza plazos más cortos." />
      </div>
    </div>,
    <div key="3" className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectorOrganismos label="Organismos preferidos (+10)" valor={p.organismos_preferidos} nombres={nombres} onNombre={(id, n) => setNombres((x) => ({ ...x, [id]: n }))} onChange={(v) => set("organismos_preferidos", v)} />
        <SelectorOrganismos label="Organismos excluidos (−40)" valor={p.organismos_excluidos} nombres={nombres} onNombre={(id, n) => setNombres((x) => ({ ...x, [id]: n }))} onChange={(v) => set("organismos_excluidos", v)} />
      </div>
      <div className="rounded-2xl border border-stone-200 p-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={p.alertas_email} onChange={(e) => set("alertas_email", e.target.checked)} className="h-5 w-5 accent-[var(--color-vino-600)]" />
          <span><span className="font-semibold text-stone-900">Alertas por correo</span><span className="block text-xs text-stone-500">Cada mañana a las 9:00, las licitaciones nuevas en plazo que superen tu idoneidad mínima. Si no hay ninguna, no te escribimos.</span></span>
        </label>
        {p.alertas_email && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">Frecuencia</span>
              <select className="input mt-1.5 w-full" value={p.alertas_frecuencia} onChange={(e) => set("alertas_frecuencia", e.target.value as "diaria" | "semanal")}>
                <option value="diaria">Diaria (9:00)</option><option value="semanal">Semanal (lunes, 9:00)</option>
              </select></label>
            <label className="block"><span className="label">Idoneidad mínima: {p.alertas_umbral}</span>
              <input type="range" min={0} max={100} step={5} value={p.alertas_umbral} onChange={(e) => set("alertas_umbral", Number(e.target.value))} className="mt-3 w-full accent-[var(--color-vino-600)]" /></label>
          </div>
        )}
      </div>
    </div>,
  ];

  const aviso = msg && (
    <p role={msg.error ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm ${msg.error ? "bg-vino-50 text-vino-800" : "bg-vid-50 text-vid-700"}`}>{msg.error ?? msg.ok}</p>
  );

  if (modo === "asistente") {
    const P = PASOS[paso];
    const ultimo = paso === PASOS.length - 1;
    return (
      <div className="mx-auto max-w-3xl">
        <ol className="mb-6 grid grid-cols-4 gap-2">
          {PASOS.map((x, i) => (
            <li key={x.t}>
              <button type="button" onClick={() => setPaso(i)} className="w-full text-left">
                <div className={`h-1.5 rounded-full transition-colors ${i <= paso ? "bg-vino-600" : "bg-stone-200"}`} />
                <div className={`mt-2 hidden text-xs font-semibold sm:block ${i === paso ? "text-vino-800" : "text-stone-400"}`}>{i + 1}. {x.t}</div>
              </button>
            </li>
          ))}
        </ol>
        <div className="card animate-entrar p-5 sm:p-8" key={paso}>
          <div className="mb-6 flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-vino-500 to-vino-800 text-white shadow-lg shadow-vino-900/20"><P.i className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Paso {paso + 1} de {PASOS.length}</p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-stone-900">{P.t}</h2>
              <p className="text-sm text-stone-500">{P.d}</p>
            </div>
          </div>
          {secciones[paso]}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-stone-100 pt-5">
            <button type="button" className="btn btn-secundario" disabled={paso === 0} onClick={() => setPaso(paso - 1)}><ArrowLeft className="h-4 w-4" /> Atrás</button>
            <div className="flex items-center gap-3">
              {!ultimo && <button type="button" className="hidden text-sm text-stone-500 hover:text-stone-800 sm:inline" onClick={() => guardar(true, () => router.push("/mi/sugeridas"))}>Terminar más tarde</button>}
              <button type="button" className="btn btn-primario" disabled={pend}
                onClick={() => (ultimo ? guardar(true, () => router.push("/mi/sugeridas")) : guardar(false, () => setPaso(paso + 1)))}>
                {pend ? <Loader2 className="h-4 w-4 animate-spin" /> : ultimo ? <Check className="h-4 w-4" /> : null}
                {ultimo ? "Ver mis licitaciones" : "Siguiente"} {!ultimo && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {msg?.error && <div className="mt-3">{aviso}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {PASOS.map((x, i) => (
        <section key={x.t} className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-vino-50 text-vino-700"><x.i className="h-4 w-4" /></span>
            <div><h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-stone-900">{x.t}</h2><p className="text-xs text-stone-500">{x.d}</p></div>
          </div>
          {secciones[i]}
        </section>
      ))}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-stone-200 bg-surface/90 p-3 shadow-xl backdrop-blur">
        {aviso}
        <button type="button" className="btn btn-primario" disabled={pend} onClick={() => guardar(true)}>{pend ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar perfil</button>
      </div>
    </div>
  );
}

function Texto({ label, value, onChange, placeholder, ayuda }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; ayuda?: string }) {
  return (
    <label className="block"><span className="label">{label}</span>
      <input className="input mt-1.5 w-full" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {ayuda && <span className="mt-1 block text-xs text-stone-500">{ayuda}</span>}
    </label>
  );
}
function Numero({ label, value, onChange, ayuda }: { label: string; value: string; onChange: (v: number | null) => void; ayuda?: string }) {
  return (
    <label className="block"><span className="label">{label}</span>
      <input className="input mt-1.5 w-full tabular-nums" inputMode="numeric" value={value}
        onChange={(e) => { const s = e.target.value.replace(/[^\d]/g, ""); onChange(s === "" ? null : Number(s)); }} />
      {ayuda && <span className="mt-1 block text-xs text-stone-500">{ayuda}</span>}
    </label>
  );
}

function Etiquetas({ label, ayuda, valor, onChange, placeholder, tono }: { label: string; ayuda?: string; valor: string[]; onChange: (v: string[]) => void; placeholder?: string; tono: "vid" | "vino" }) {
  const [t, setT] = useState("");
  const add = () => {
    const nuevos = t.split(",").map((x) => x.trim()).filter((x) => x.length > 1 && !valor.includes(x));
    if (nuevos.length) onChange([...valor, ...nuevos]);
    setT("");
  };
  return (
    <div>
      <span className="label">{label}</span>
      <div className="input mt-1.5 flex min-h-11 flex-wrap items-center gap-1.5 py-1.5">
        {valor.map((v) => (
          <span key={v} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tono === "vid" ? "bg-vid-50 text-vid-700" : "bg-vino-50 text-vino-800"}`}>
            {v}<button type="button" aria-label={`Quitar ${v}`} onClick={() => onChange(valor.filter((x) => x !== v))}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input aria-label={label} className="min-w-28 flex-1 bg-transparent text-sm outline-none" value={t} placeholder={valor.length ? "" : placeholder}
          onChange={(e) => setT(e.target.value)} onBlur={add}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } else if (e.key === "Backspace" && !t && valor.length) onChange(valor.slice(0, -1)); }} />
      </div>
      {ayuda && <span className="mt-1 block text-xs text-stone-500">{ayuda} Pulsa Intro para añadir.</span>}
    </div>
  );
}

function Opciones({ label, ayuda, opciones, valor, onChange, libre }: { label: string; ayuda?: string; opciones: string[]; valor: string[]; onChange: (v: string[]) => void; libre?: boolean }) {
  const [t, setT] = useState("");
  const todas = [...opciones, ...valor.filter((v) => !opciones.includes(v))];
  const alternar = (o: string) => onChange(valor.includes(o) ? valor.filter((x) => x !== o) : [...valor, o]);
  return (
    <div>
      <span className="label">{label}</span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {todas.map((o) => (
          <button key={o} type="button" aria-pressed={valor.includes(o)} onClick={() => alternar(o)}
            className={`rounded-full px-3 py-1 text-sm ring-1 transition ${valor.includes(o) ? "bg-vino-700 text-white ring-vino-700" : "bg-surface text-stone-600 ring-stone-200 hover:ring-vino-300"}`}>
            {valor.includes(o) && <Check className="mr-1 inline h-3.5 w-3.5" />}{o}
          </button>
        ))}
        {libre && (
          <form className="inline-flex" onSubmit={(e) => { e.preventDefault(); const x = t.trim(); if (x && !valor.includes(x)) onChange([...valor, x]); setT(""); }}>
            <input className="w-40 rounded-full bg-transparent px-3 py-1 text-sm ring-1 ring-stone-200 outline-none focus:ring-vino-400" placeholder="Otro municipio…" value={t} onChange={(e) => setT(e.target.value)} />
          </form>
        )}
      </div>
      {ayuda && <span className="mt-1.5 block text-xs text-stone-500">{ayuda}</span>}
    </div>
  );
}

function useBusqueda<T>(fn: (q: string) => Promise<T[]>) {
  const [q, setQEstado] = useState("");
  const [res, setRes] = useState<T[]>([]);
  const [cargando, setCargando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ultimo = useRef("");
  const setQ = (v: string) => {
    setQEstado(v);
    clearTimeout(temporizador.current);
    ultimo.current = v;
    if (v.trim().length < 2) { setRes([]); setCargando(false); return; }
    setCargando(true);
    temporizador.current = setTimeout(async () => {
      const r = await fn(v).catch(() => [] as T[]);
      if (ultimo.current === v) { setRes(r); setCargando(false); }
    }, 250);
  };
  return { q, setQ, res, cargando };
}

function SelectorCpv({ valor, onChange, sugeridos }: { valor: { codigo: string; descripcion: string | null }[]; onChange: (v: { codigo: string; descripcion: string | null }[]) => void; sugeridos: Props["cpvSugeridos"] }) {
  const b = useBusqueda(accBuscarCpv);
  const tiene = (c: string) => valor.some((v) => v.codigo === c);
  const alternar = (codigo: string, descripcion: string | null) =>
    onChange(tiene(codigo) ? valor.filter((v) => v.codigo !== codigo) : [...valor, { codigo, descripcion }]);
  const div = useMemo(() => Object.fromEntries(DIVISIONES_CPV.map((d) => [d.codigo, d.nombre])), []);
  const especificos = valor.filter((v) => v.codigo.length > 2);
  const sug = sugeridos.filter((s) => !tiene(s.codigo));
  return (
    <div>
      <span className="label">Sectores (CPV)</span>
      <p className="mt-0.5 text-xs text-stone-500">Marca divisiones generales o busca códigos concretos: cuanto más específico, más puntos (hasta 30).</p>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input className="input w-full pl-9" placeholder="Busca «limpieza», «alumbrado» o un código como 5023…" value={b.q} onChange={(e) => b.setQ(e.target.value)} />
        {b.cargando && <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-stone-400" />}
      </div>
      {b.res.length > 0 && (
        <ul className="mt-2 max-h-56 divide-y divide-stone-100 overflow-auto rounded-xl border border-stone-200">
          {b.res.map((r) => (
            <li key={r.codigo}>
              <button type="button" onClick={() => alternar(r.codigo, r.descripcion)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50">
                <span className="font-mono text-xs text-stone-500">{r.codigo}</span>
                <span className="flex-1">{r.descripcion}</span>
                <span className="text-xs text-stone-400">{r.n} lic.</span>
                {tiene(r.codigo) ? <Check className="h-4 w-4 text-vid-600" /> : <Plus className="h-4 w-4 text-stone-400" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {especificos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {especificos.map((v) => (
            <span key={v.codigo} className="inline-flex items-center gap-1.5 rounded-full bg-vino-700 px-2.5 py-1 text-xs text-white">
              <span className="font-mono">{v.codigo}</span> {v.descripcion?.slice(0, 40)}
              <button type="button" aria-label={`Quitar ${v.codigo}`} onClick={() => alternar(v.codigo, null)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      {sug.length > 0 && (
        <div className="mt-4 rounded-xl bg-vid-50/70 p-3">
          <p className="text-xs font-semibold text-vid-700">Sugeridos por las licitaciones que te interesan</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sug.map((s) => (
              <button key={s.codigo} type="button" onClick={() => alternar(s.codigo, s.descripcion)} className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs ring-1 ring-vid-300/60 hover:ring-vid-500">
                <Plus className="h-3 w-3" /><span className="font-mono">{s.codigo}</span> {s.descripcion?.slice(0, 36)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {DIVISIONES_CPV.map((d) => (
          <button key={d.codigo} type="button" aria-pressed={tiene(d.codigo)} onClick={() => alternar(d.codigo, d.nombre)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ring-1 transition ${tiene(d.codigo) ? "bg-vino-50 text-vino-900 ring-vino-300" : "text-stone-600 ring-stone-200 hover:ring-vino-200"}`}>
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-bold ${tiene(d.codigo) ? "bg-vino-700 text-white" : "bg-stone-100 text-stone-500"}`}>{tiene(d.codigo) ? <Check className="h-3 w-3" /> : d.codigo}</span>
            <span className="min-w-0 truncate">{div[d.codigo]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectorOrganismos({ label, valor, nombres, onNombre, onChange }: { label: string; valor: string[]; nombres: Record<string, string>; onNombre: (id: string, n: string) => void; onChange: (v: string[]) => void }) {
  const b = useBusqueda(accBuscarOrganismo);
  return (
    <div>
      <span className="label">{label}</span>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input className="input w-full pl-9" placeholder="Ayuntamiento de…, Consejería…" value={b.q} onChange={(e) => b.setQ(e.target.value)} />
      </div>
      {b.res.length > 0 && (
        <ul className="mt-2 max-h-48 divide-y divide-stone-100 overflow-auto rounded-xl border border-stone-200">
          {b.res.filter((r) => !valor.includes(r.id)).map((r) => (
            <li key={r.id}><button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50"
              onClick={() => { onNombre(r.id, r.nombre); onChange([...valor, r.id]); b.setQ(""); }}><Plus className="h-4 w-4 text-stone-400" />{r.nombre}</button></li>
          ))}
        </ul>
      )}
      <ul className="mt-2 space-y-1">
        {valor.map((id) => (
          <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-1.5 text-sm">
            <span className="truncate">{nombres[id] ?? id}</span>
            <button type="button" aria-label="Quitar" onClick={() => onChange(valor.filter((x) => x !== id))}><X className="h-4 w-4 text-stone-400" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import {
  ArrowRight, BarChart3, Building2, Download, FileSearch, Filter, HandCoins, Receipt, Search, ShieldCheck, Sparkles, Trophy, Users, Zap,
} from "lucide-react";
import { Contenedor, Estado, SinBD } from "@/components/ui";
import { Contador } from "@/components/Animado";
import { FondoHero, IlustCTA, IlustEstadisticas, IlustGanadores, IlustLicitaciones, IlustMenores, IlustOrganismo, IlustSubvenciones } from "@/components/Ilustraciones";
import { actividadReciente, kpisGenerales, topAdjudicatarios } from "@/lib/queries/estadisticas";
import { hayBaseDeDatos } from "@/lib/db";
import { eurosCompacto, fecha, fechaHora, numero } from "@/lib/format";
import { enlaceEmpresa } from "@/lib/queries/entidades";

export const dynamic = "force-dynamic";

const USOS = [
  { titulo: "Licitaciones abiertas", texto: "Concursos en plazo, hoy.", href: "/licitaciones?estado=En+plazo", Ilust: IlustLicitaciones, icono: FileSearch, color: "from-emerald-500 to-emerald-700" },
  { titulo: "Quién gana contratos", texto: "Ranking de empresas por importe.", href: "/empresas", Ilust: IlustGanadores, icono: Trophy, color: "from-amber-500 to-orange-600" },
  { titulo: "Sigue a un organismo", texto: "Todo lo que contrata cada uno.", href: "/organismos", Ilust: IlustOrganismo, icono: Building2, color: "from-sky-500 to-indigo-600" },
  { titulo: "Subvenciones", texto: "Ayudas concedidas y a quién.", href: "/subvenciones", Ilust: IlustSubvenciones, icono: HandCoins, color: "from-vid-500 to-vid-700" },
  { titulo: "Contratos menores", texto: "El gasto pequeño, uno a uno.", href: "/contratos-menores", Ilust: IlustMenores, icono: Receipt, color: "from-vino-500 to-vino-700" },
  { titulo: "Compara en gráficos", texto: "Años, tipos y organismos.", href: "/estadisticas", Ilust: IlustEstadisticas, icono: BarChart3, color: "from-fuchsia-500 to-purple-700" },
];

const PASOS = [
  { icono: Search, titulo: "Busca", texto: "Un objeto, una empresa, un NIF o un organismo." },
  { icono: Filter, titulo: "Filtra", texto: "Estado, tipo, importe, fechas y fuente." },
  { icono: Download, titulo: "Comprueba y descarga", texto: "Enlace al expediente oficial y CSV." },
];

const ATAJOS = [
  ["En plazo", "/licitaciones?estado=En+plazo"],
  ["Más de 1 M€", "/licitaciones?importe=1000000"],
  ["Obras", "/licitaciones?tipo=Obras"],
  ["Ayudas a empresas", "/subvenciones?beneficiario=juridicas"],
];

export default async function Inicio() {
  if (!hayBaseDeDatos()) return <SinBD />;
  const [k, act, top] = await Promise.all([kpisGenerales(), actividadReciente(), topAdjudicatarios()]);
  const total = k.presupuesto + k.importe_menores + k.importe_subvenciones;
  const maxTop = Math.max(1, ...top.map((t) => t.importe_contratos));
  const cifras = [
    { etiqueta: "Licitaciones", valor: k.licitaciones, formato: "numero" as const, href: "/licitaciones", icono: FileSearch },
    { etiqueta: "Contratos menores", valor: k.menores, formato: "numero" as const, href: "/contratos-menores", icono: Receipt },
    { etiqueta: "Subvenciones", valor: k.subvenciones, formato: "numero" as const, href: "/subvenciones", icono: HandCoins },
    { etiqueta: "Importe total", valor: total, formato: "euros" as const, href: "/estadisticas", icono: Sparkles },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-vino-950 text-white">
        <FondoHero />

        <Contenedor className="relative pt-28 pb-14 sm:pt-36 sm:pb-20">
          <div className="max-w-3xl animate-entrar">
            <span className="glass chip text-white/90">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a3c47a]" /> Datos oficiales · actualizados a diario
            </span>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              El dinero público de La Rioja, <span className="texto-gradiente">a la vista</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80 sm:text-xl">Contratos, adjudicaciones y ayudas en un solo buscador.</p>
          </div>

          <form action="/licitaciones" className="mt-8 max-w-2xl animate-entrar [animation-delay:120ms]" role="search">
            <label htmlFor="q-home" className="sr-only">Buscar</label>
            <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-2xl shadow-black/30 focus-within:ring-4 focus-within:ring-white/25">
              <Search className="ml-2 h-5 w-5 shrink-0 text-white/70" aria-hidden />
              <input id="q-home" name="q" placeholder="Objeto, organismo, empresa o NIF…"
                className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-white placeholder:text-white/60 focus:outline-none sm:text-lg" />
              <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-[#632139] shadow-lg transition hover:scale-[1.03] hover:bg-[#fbf3f5] sm:px-6">
                <span className="hidden sm:inline">Buscar</span>
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </form>
          <div className="mt-4 flex animate-entrar flex-wrap gap-2 [animation-delay:200ms]">
            {ATAJOS.map(([l, h]) => (
              <Link key={h} href={h} className="glass chip text-white/90 transition hover:-translate-y-0.5 hover:bg-white/20">{l}</Link>
            ))}
          </div>

          <div className="mt-12 grid animate-entrar grid-cols-2 gap-3 [animation-delay:280ms] lg:grid-cols-4">
            {cifras.map((c) => (
              <Link key={c.etiqueta} href={c.href} className="glass group rounded-2xl p-4 transition hover:-translate-y-1 hover:bg-white/15 sm:p-5">
                <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-white/70 uppercase">
                  {c.etiqueta}
                  <c.icono className="h-4 w-4 text-white/60 transition group-hover:text-white" aria-hidden />
                </div>
                <div className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">
                  <Contador valor={c.valor} formato={c.formato} />
                </div>
              </Link>
            ))}
          </div>
          {k.ultima_actualizacion && (
            <p className="mt-4 text-xs text-white/60">
              Última carga: {fechaHora(k.ultima_actualizacion)} (hora peninsular) · <Link href="/actualizaciones" className="underline-offset-2 hover:text-white hover:underline">detalle</Link>
            </p>
          )}
        </Contenedor>
      </section>

      {/* QUÉ PUEDES HACER */}
      <Contenedor className="py-16 sm:py-20">
        <Titulo eyebrow="Qué puedes hacer" titulo="Seis formas de seguir el dinero" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USOS.map((u) => (
            <Link key={u.href} href={u.href} className="card card-hover revelar group flex flex-col overflow-hidden">
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-vino-50 via-surface to-vid-50">
                <u.Ilust />
                <span className={`absolute top-4 left-4 grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${u.color} text-white shadow-lg transition duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]`}>
                  <u.icono className="h-5 w-5" aria-hidden />
                </span>
              </div>
              <div className="flex flex-1 flex-col border-t border-stone-100 p-5">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-stone-900 group-hover:text-vino-700">{u.titulo}</h3>
                <p className="mt-1 text-stone-500">{u.texto}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-vino-700">
                  Explorar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Contenedor>

      {/* CÓMO FUNCIONA */}
      <section className="fondo-aurora border-y border-stone-200/70">
        <Contenedor className="py-16 sm:py-20">
          <Titulo eyebrow="Cómo funciona" titulo="Tres pasos. Sin registro." />
          <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
            <div className="absolute top-8 right-[16%] left-[16%] hidden h-0.5 bg-gradient-to-r from-vino-300 via-vino-500 to-vid-500 md:block" aria-hidden />
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="revelar relative flex flex-col items-center text-center">
                <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-vino-500 to-vino-800 text-white shadow-xl shadow-vino-900/25 ring-8 ring-stone-50">
                  <p.icono className="h-7 w-7" aria-hidden />
                  <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-vid-500 text-xs font-bold text-white">{i + 1}</span>
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-bold">{p.titulo}</h3>
                <p className="mt-1 max-w-xs text-stone-500">{p.texto}</p>
              </li>
            ))}
          </ol>
        </Contenedor>
      </section>

      {/* DESTACADOS */}
      <Contenedor className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <Titulo eyebrow="Recién publicado" titulo="Últimas licitaciones" alineado="izquierda" />
              <Link href="/licitaciones" className="btn-secundario shrink-0">Ver todas <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {act.licitaciones.slice(0, 6).map((l) => (
                <Link key={l.id} href={`/licitaciones/${l.id}`} className="card card-hover revelar group flex flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Estado v={l.estado} />
                    <span className="text-xs text-stone-400">{fecha(l.fecha_publicacion)}</span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-semibold text-stone-900 transition group-hover:text-vino-700">{l.objeto}</h3>
                  <p className="mt-1 line-clamp-1 text-sm text-stone-500">{l.organismo}</p>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <span className="font-[family-name:var(--font-display)] text-xl font-extrabold tabular-nums">{eurosCompacto(l.presupuesto_base)}</span>
                    {l.tipo && <span className="chip bg-stone-100 text-stone-600">{l.tipo}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <Titulo eyebrow="Ranking" titulo="Top adjudicatarios" alineado="izquierda" />
              <Link href="/empresas" className="btn-secundario shrink-0">Ranking <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <ol className="card revelar mt-6 divide-y divide-stone-100 overflow-hidden">
              {top.map((e, i) => {
                const href = enlaceEmpresa(e) ?? "/empresas";
                return (
                  <li key={e.id}>
                    <Link href={href} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-vino-50/60">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${i === 0 ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950" : i < 3 ? "bg-vino-100 text-vino-800" : "bg-stone-100 text-stone-500"}`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-stone-900 group-hover:text-vino-700">{e.nombre}</div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-vino-400 to-vino-700" style={{ width: `${Math.max(4, (e.importe_contratos / maxTop) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-bold tabular-nums">{eurosCompacto(e.importe_contratos)}</div>
                        <div className="text-xs text-stone-400">{numero(e.contratos)} contratos</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { i: ShieldCheck, t: "Fuente oficial" },
                { i: Zap, t: "Diario" },
                { i: Users, t: "Sin registro" },
              ].map((b) => (
                <div key={b.t} className="card flex flex-col items-center gap-1.5 px-2 py-3 text-xs font-semibold text-stone-600">
                  <b.i className="h-5 w-5 text-vid-600" aria-hidden />
                  {b.t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Contenedor>

      {/* CTA */}
      <Contenedor>
        <section className="revelar relative isolate grid items-center gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#521d31] via-[#772541] to-[#385726] px-6 py-14 text-center text-white shadow-2xl shadow-vino-900/20 sm:px-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:text-left">
          <div className="punteado pointer-events-none absolute inset-0 -z-10 text-white/10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
          <div className="pointer-events-none absolute -right-16 -bottom-24 -z-10 h-72 w-72 animate-flotar rounded-full bg-[#a3c47a]/25 blur-3xl" aria-hidden />
          <div>
          <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-balance sm:text-5xl lg:mx-0">
            ¿A quién contrata tu ayuntamiento?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/80 lg:mx-0">Descúbrelo en segundos.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href="/organismos" className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#632139] shadow-lg transition hover:scale-[1.03]">
              <Building2 className="h-5 w-5" /> Elegir organismo
            </Link>
            <Link href="/licitaciones" className="glass flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition hover:bg-white/20">
              <Search className="h-5 w-5" /> Buscar contratos
            </Link>
          </div>
          </div>
          <IlustCTA className="mx-auto w-full max-w-md" />
        </section>
      </Contenedor>
    </>
  );
}

function Titulo({ eyebrow, titulo, alineado = "centro" }: { eyebrow: string; titulo: string; alineado?: "centro" | "izquierda" }) {
  return (
    <div className={alineado === "centro" ? "text-center" : ""}>
      <p className="text-xs font-bold tracking-[0.2em] text-vino-600 uppercase">{eyebrow}</p>
      <h2 className={`mt-2 font-[family-name:var(--font-display)] font-extrabold tracking-tight text-balance text-stone-900 ${alineado === "centro" ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>{titulo}</h2>
    </div>
  );
}

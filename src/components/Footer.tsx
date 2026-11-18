import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";

const EXPLORAR = [
  ["/licitaciones", "Licitaciones"],
  ["/adjudicaciones", "Adjudicaciones"],
  ["/contratos-menores", "Contratos menores"],
  ["/subvenciones", "Subvenciones"],
  ["/empresas", "Empresas"],
  ["/organismos", "Organismos"],
];
const PROYECTO = [
  ["/metodologia", "Metodología"],
  ["/actualizaciones", "Estado de las cargas"],
  ["/creditos", "Créditos de imágenes"],
  ["/aviso-legal", "Aviso legal"],
  ["/privacidad", "Privacidad"],
  ["/cookies", "Cookies"],
];
const FUENTES = [
  ["https://web.larioja.org/dato-abierto/datoabierto?n=opd-179", "Dato abierto La Rioja"],
  ["https://contrataciondelestado.es", "PLACE"],
  ["https://www.larioja.org/contratacion-publica/es", "Contratación La Rioja"],
  ["https://www.infosubvenciones.es/", "BDNS"],
];

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-stone-200 bg-surface">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vino-400 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
              Rioja<span className="text-vino-700">Abierta</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-stone-500">Iniciativa ciudadana e independiente. Ante cualquier duda, manda la fuente oficial.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip bg-vid-50 text-vid-700">CC BY 4.0</span>
            <span className="chip bg-vino-50 text-vino-700">Sin cookies de rastreo</span>
          </div>
        </div>
        {[
          ["Explorar", EXPLORAR],
          ["Proyecto", PROYECTO],
        ].map(([t, items]) => (
          <div key={t as string}>
            <h3 className="text-xs font-semibold tracking-wider text-stone-400 uppercase">{t as string}</h3>
            <ul className="mt-3 space-y-2">
              {(items as string[][]).map(([h, l]) => (
                <li key={h}><Link className="text-stone-600 transition hover:text-vino-700" href={h}>{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Fuentes</h3>
          <ul className="mt-3 space-y-2">
            {FUENTES.map(([h, l]) => (
              <li key={h}>
                <a className="group inline-flex items-center gap-1 text-stone-600 transition hover:text-vino-700" href={h} target="_blank" rel="noreferrer">
                  {l}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-100 py-5 text-center text-xs text-stone-400">
        Datos reutilizados bajo CC BY 4.0 y Ley 37/2007 · Fotos: Wikimedia Commons (<Link href="/creditos" className="underline-offset-2 hover:underline">créditos</Link>) · Código abierto
      </div>
    </footer>
  );
}

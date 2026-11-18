import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-[family-name:var(--font-display)] text-base font-semibold">Rioja Abierta</span>
          </div>
          <p className="mt-3 text-stone-500">
            Iniciativa ciudadana independiente, sin vínculo con ninguna administración. Los datos proceden de fuentes oficiales públicas; ante cualquier
            discrepancia, prevalece la fuente original.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">Explorar</h3>
          <ul className="mt-3 space-y-2 text-stone-600">
            <li><Link className="hover:text-vino-700" href="/licitaciones">Licitaciones</Link></li>
            <li><Link className="hover:text-vino-700" href="/adjudicaciones">Adjudicaciones</Link></li>
            <li><Link className="hover:text-vino-700" href="/contratos-menores">Contratos menores</Link></li>
            <li><Link className="hover:text-vino-700" href="/subvenciones">Subvenciones</Link></li>
            <li><Link className="hover:text-vino-700" href="/empresas">Empresas</Link></li>
            <li><Link className="hover:text-vino-700" href="/organismos">Organismos</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">Proyecto</h3>
          <ul className="mt-3 space-y-2 text-stone-600">
            <li><Link className="hover:text-vino-700" href="/metodologia">Fuentes y metodología</Link></li>
            <li><Link className="hover:text-vino-700" href="/actualizaciones">Estado de las cargas</Link></li>
            <li><Link className="hover:text-vino-700" href="/aviso-legal">Aviso legal</Link></li>
            <li><Link className="hover:text-vino-700" href="/privacidad">Privacidad</Link></li>
            <li><Link className="hover:text-vino-700" href="/cookies">Cookies</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">Fuentes oficiales</h3>
          <ul className="mt-3 space-y-2 text-stone-600">
            <li><a className="hover:text-vino-700" href="https://web.larioja.org/dato-abierto/datoabierto?n=opd-179" target="_blank" rel="noreferrer">Dato abierto La Rioja (opd-179)</a></li>
            <li><a className="hover:text-vino-700" href="https://contrataciondelestado.es" target="_blank" rel="noreferrer">Plataforma de Contratación del Sector Público</a></li>
            <li><a className="hover:text-vino-700" href="https://www.larioja.org/contratacion-publica/es" target="_blank" rel="noreferrer">Contratación pública de La Rioja</a></li>
            <li><a className="hover:text-vino-700" href="https://www.infosubvenciones.es/" target="_blank" rel="noreferrer">BDNS · Infosubvenciones</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
        Datos reutilizados bajo licencia CC BY 4.0 y Ley 37/2007 · Código abierto
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Contenedor } from "@/components/ui";

export default function NoEncontrado() {
  return (
    <Contenedor className="py-24 text-center">
      <p className="text-sm font-semibold text-vino-700">404</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">No encontramos esa página</h1>
      <p className="mt-3 text-stone-600">Puede que el registro ya no exista en la fuente o que el enlace esté mal escrito.</p>
      <Link href="/" className="btn-primario mt-6">Volver al inicio</Link>
    </Contenedor>
  );
}

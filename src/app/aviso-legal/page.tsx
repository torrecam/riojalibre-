import type { Metadata } from "next";
import { Cabecera, Contenedor } from "@/components/ui";

export const metadata: Metadata = { title: "Aviso legal" };

export default function AvisoLegal() {
  return (
    <>
      <Cabecera titulo="Aviso legal" />
      <Contenedor className="py-8">
        <article className="prosa max-w-3xl">
          <h2>Naturaleza del proyecto</h2>
          <p>
            Rioja Abierta es una iniciativa ciudadana, independiente y sin ánimo de lucro. No tiene relación con el Gobierno de La Rioja, con ningún
            ayuntamiento ni con la Administración General del Estado, y no representa a ninguna administración.
          </p>
          <h2>Origen de la información</h2>
          <p>
            Todos los datos proceden de fuentes públicas oficiales reutilizables conforme a la Ley 37/2007, sobre reutilización de la información del sector
            público, y a las licencias de cada conjunto de datos (CC BY 4.0 en el caso de los datos abiertos de La Rioja). En cada ficha se enlaza el registro
            original.
          </p>
          <h2>Exactitud y responsabilidad</h2>
          <p>
            Los datos se reproducen y normalizan de forma automática y pueden contener errores, omisiones o retrasos respecto a la fuente. La información tiene
            carácter divulgativo: no constituye certificación oficial ni prejuzga la legalidad de ningún contrato o ayuda. Las agregaciones y estadísticas son
            orientativas y pueden tener explicaciones perfectamente lícitas.
          </p>
          <h2>Rectificación</h2>
          <p>
            Si eres una persona o entidad afectada y detectas un dato incorrecto, puedes solicitar su corrección indicando el registro y la fuente oficial que lo
            acredita. Los cambios se aplicarán cuando la fuente original se corrija o se verifique el error de tratamiento.
          </p>
          <h2>Contacto</h2>
          <p>Define aquí el correo de contacto del titular del proyecto antes de publicarlo.</p>
        </article>
      </Contenedor>
    </>
  );
}

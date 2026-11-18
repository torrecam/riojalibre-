import type { Metadata } from "next";
import { Cabecera, Contenedor } from "@/components/ui";

export const metadata: Metadata = { title: "Cookies" };

export default function Cookies() {
  return (
    <>
      <Cabecera titulo="Política de cookies" />
      <Contenedor className="py-8">
        <article className="prosa max-w-3xl">
          <p>
            Rioja Abierta no instala cookies de analítica, publicidad ni seguimiento. La navegación pública no requiere ninguna cookie, por lo que no se muestra
            banner de consentimiento.
          </p>
          <p>
            Si eliges el modo claro u oscuro, esa preferencia se guarda solo en tu navegador (almacenamiento local), no se envía a ningún servidor y es
            estrictamente técnica.
          </p>
          <p>
            Si inicias sesión, se guardan cookies técnicas de sesión de Supabase Auth (<code>sb-…-auth-token</code>), estrictamente necesarias para
            mantenerte identificado y exentas de consentimiento según el artículo 22.2 de la LSSI. Se borran al salir.
          </p>
        </article>
      </Contenedor>
    </>
  );
}

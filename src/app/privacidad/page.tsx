import type { Metadata } from "next";
import { Cabecera, Contenedor } from "@/components/ui";

export const metadata: Metadata = { title: "Privacidad" };

export default function Privacidad() {
  return (
    <>
      <Cabecera titulo="Política de privacidad" />
      <Contenedor className="py-8">
        <article className="prosa max-w-3xl">
          <h2>Usuarios del portal</h2>
          <p>
            La consulta es libre y anónima. Si creas una cuenta, guardamos tu correo (para identificarte y enviarte los enlaces de acceso) y el perfil de
            empresa y los seguimientos que tú introduces, con el único fin de calcular la idoneidad de las licitaciones y mostrarte tu tablero. Solo tú
            puedes ver esos datos (control de acceso por fila en la base de datos) y se borran al eliminar la cuenta. Base jurídica: ejecución del servicio
            que solicitas (art. 6.1.b RGPD). No se usa analítica de terceros ni publicidad.
          </p>
          <h2>Datos publicados</h2>
          <p>
            Los registros mostrados proceden de publicaciones oficiales obligatorias en materia de transparencia y contratación pública (Ley 9/2017, de
            Contratos del Sector Público; Ley 19/2013, de transparencia; Ley 38/2003, General de Subvenciones). Las personas físicas beneficiarias de ayudas
            aparecen con el identificador seudonimizado tal como lo publica la BDNS, y no se elaboran perfiles sobre ellas.
          </p>
          <h2>Infraestructura</h2>
          <p>
            El sitio se aloja en Vercel y la base de datos en Supabase (Unión Europea si se elige esa región). Los registros técnicos de acceso (dirección IP,
            fecha y página) los gestionan estos proveedores con fines de seguridad.
          </p>
          <h2>Derechos</h2>
          <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición y limitación ante el titular del proyecto, y reclamar ante la AEPD.</p>
        </article>
      </Contenedor>
    </>
  );
}

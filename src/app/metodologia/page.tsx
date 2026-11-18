import type { Metadata } from "next";
import { Cabecera, Contenedor } from "@/components/ui";

export const metadata: Metadata = { title: "Fuentes y metodología" };

export default function Metodologia() {
  return (
    <>
      <Cabecera titulo="Fuentes y metodología" subtitulo="De dónde salen los datos, cómo se procesan y qué limitaciones tienen." />
      <Contenedor className="py-8">
        <article className="prosa max-w-3xl">
          <h2>Fuentes oficiales</h2>
          <ul>
            <li>
              <strong>Contratación electrónica del Gobierno de La Rioja</strong> — conjunto de datos abiertos{" "}
              <a href="https://web.larioja.org/dato-abierto/datoabierto?n=opd-179" target="_blank" rel="noreferrer">opd-179</a> (licencia CC BY 4.0). Se descarga
              completo cada día en JSON. Cada fila del fichero es un expediente por lote o adjudicatario; aquí se agrupan por identificador de expediente.
            </li>
            <li>
              <strong>Plataforma de Contratación del Sector Público (PLACE)</strong> — sindicación Atom/CODICE de licitaciones publicadas en perfiles del
              contratante (excluye contratos menores). Se procesa el histórico mensual en ZIP y el feed vivo para lo reciente.
            </li>
            <li>
              <strong>Contratos menores (ejecución presupuestaria)</strong> — ficheros anuales de la Intervención General del Gobierno de La Rioja desde 2021
              (opd-866, opd-910, opd-963, opd-979, opd-1151 y opd-1175).
            </li>
            <li>
              <strong>Base de Datos Nacional de Subvenciones (BDNS)</strong> — API pública del Sistema Nacional de Publicidad de Subvenciones y Ayudas Públicas
              (<a href="https://www.infosubvenciones.es/" target="_blank" rel="noreferrer">infosubvenciones.es</a>), concesiones con región de impacto «ES230 – La Rioja».
            </li>
          </ul>

          <h2>Qué se considera «de La Rioja» en PLACE</h2>
          <p>PLACE publica contratos de toda España. Se incluye una licitación si se cumple al menos una de estas condiciones:</p>
          <ul>
            <li>el código postal del órgano de contratación empieza por 26;</li>
            <li>el lugar de ejecución tiene código NUTS ES23 (La Rioja);</li>
            <li>el nombre del órgano o de alguno de sus órganos superiores menciona «Rioja» (se excluye «Rioja Alavesa»).</li>
          </ul>
          <p>El último criterio puede incluir órganos estatales con sede o denominación riojana (Delegación de la AEAT, aeropuerto de Logroño-Agoncillo, etc.).</p>

          <h2>Normalización</h2>
          <ul>
            <li>
              <strong>Estados</strong>: se unifican en Anuncio previo, En plazo, Pendiente de adjudicación, Adjudicada, Resuelta y Anulada. Siempre se conserva el
              valor original de la fuente.
            </li>
            <li><strong>Tipos</strong>: «Suministros inventariables» y «no inventariables» se agrupan en Suministros; el resto se mapea a la clasificación de la LCSP.</li>
            <li><strong>Importes</strong>: presupuesto base y adjudicaciones sin IVA cuando la fuente lo distingue.</li>
            <li><strong>Duplicados</strong>: cada registro se identifica por fuente e identificador de origen. Si un expediente del Gobierno de La Rioja aparece también en PLACE con el mismo número, se enlazan ambas fuentes desde la ficha.</li>
            <li><strong>Empresas</strong>: se agrupan por NIF cuando existe. Sin NIF, por denominación exacta (pueden aparecer variantes de una misma empresa).</li>
            <li><strong>Contratos menores</strong>: solo se importan los de 500 € o más, para evitar ruido. Puede haber importes negativos (abonos o regularizaciones).</li>
            <li>
              <strong>Subvenciones</strong>: las personas físicas llegan seudonimizadas desde la BDNS; no se intenta reidentificarlas y no se enlazan a perfiles.
              La administración concedente puede ser estatal, autonómica o local.
            </li>
          </ul>

          <h2>Actualización</h2>
          <p>
            Un flujo programado de GitHub Actions se ejecuta a diario: vuelve a descargar opd-179 y el fichero de menores del año en curso, recorre el feed de PLACE
            de los últimos días y consulta las concesiones de la BDNS de las últimas semanas. Todas las cargas son idempotentes (si se repiten, no duplican datos).
            El estado de cada carga se puede consultar en <a href="/actualizaciones">Estado de las cargas</a>.
          </p>

          <h2>Limitaciones</h2>
          <ul>
            <li>Los datos son tan completos y correctos como las fuentes. Ante cualquier discrepancia, prevalece la publicación oficial.</li>
            <li>Algunas fechas de publicación no constan en opd-179; en ese caso se usa la de anuncio previo o la de adjudicación.</li>
            <li>El histórico de PLACE cargado depende de cuántos meses se hayan procesado (configurable).</li>
          </ul>

          <h2>Reutilización</h2>
          <p>
            Puedes descargar cualquier listado en CSV (separador «;», UTF-8). Si reutilizas los datos, cita la fuente oficial original. El código del proyecto es
            abierto.
          </p>
        </article>
      </Contenedor>
    </>
  );
}

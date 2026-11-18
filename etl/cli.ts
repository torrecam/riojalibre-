/**
 * Punto de entrada del ETL de Rioja Abierta.
 *
 *   npm run etl -- migrar
 *   npm run etl -- opd179 [--archivo f.json]
 *   npm run etl -- menores [--anios 2021-2026 | --anio 2026] [--archivo f.json]
 *   npm run etl -- place-feed [--paginas 200] [--desde AAAA-MM-DD]
 *   npm run etl -- place-zip --mes AAAAMM [--archivo f.zip] | --desde-mes AAAAMM --hasta-mes AAAAMM
 *   npm run etl -- bdns [--desde AAAA-MM-DD] [--hasta AAAA-MM-DD]
 *   npm run etl -- derivados
 *   npm run etl -- inicial      (carga histórica completa)
 *   npm run etl -- diario       (incremental)
 */
import { cerrar, sql } from "./lib/db";
import { args } from "./lib/runs";
import { migrar } from "./migrar";
import { cargarOpd179 } from "./opd179";
import { cargarMenores, DATASETS_MENORES } from "./menores";
import { cargarPlaceFeed, cargarPlaceZip } from "./place";
import { cargarBdns } from "./bdns";

const a = args();

function rangoAnios(s: string | undefined): number[] {
  if (!s || s === "true") return Object.keys(DATASETS_MENORES).map(Number);
  const [d, h] = s.split("-").map(Number);
  return h ? Array.from({ length: h - d + 1 }, (_, i) => d + i) : [d];
}

function mesesEntre(desde: string, hasta: string): string[] {
  const out: string[] = [];
  let y = Number(desde.slice(0, 4));
  let m = Number(desde.slice(4, 6));
  const fin = Number(hasta);
  while (y * 100 + m <= fin) {
    out.push(`${y}${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

function haceDias(n: number) {
  const d = new Date(Date.now() - n * 86400_000);
  return d.toISOString().slice(0, 10);
}

async function derivados() {
  console.log("Recalculando derivados (búsqueda, totales, vistas)…");
  await sql`select public.refrescar_derivados()`;
}

async function main() {
  const cmd = process.argv[2];
  switch (cmd) {
    case "migrar":
      await migrar();
      break;
    case "opd179":
      await cargarOpd179(a.get("archivo"));
      await derivados();
      break;
    case "menores":
      for (const anio of a.has("anio") ? [Number(a.get("anio"))] : rangoAnios(a.get("anios")))
        await cargarMenores(anio, a.get("archivo"));
      await derivados();
      break;
    case "place-feed":
      await cargarPlaceFeed({ paginas: Number(a.get("paginas") ?? 200), desde: a.get("desde") });
      await derivados();
      break;
    case "place-zip": {
      const meses = a.has("mes")
        ? [a.get("mes")!]
        : mesesEntre(a.get("desde-mes") ?? "201801", a.get("hasta-mes") ?? new Date().toISOString().slice(0, 7).replace("-", ""));
      for (const mes of meses) await cargarPlaceZip(mes, { archivo: a.get("archivo"), borrarDespues: a.has("borrar") });
      await derivados();
      break;
    }
    case "bdns":
      await cargarBdns({ desde: a.get("desde"), hasta: a.get("hasta") });
      await derivados();
      break;
    case "derivados":
      await derivados();
      break;
    case "inicial": {
      await migrar();
      await cargarOpd179();
      for (const anio of rangoAnios(undefined)) await cargarMenores(anio);
      await cargarBdns();
      const desdeMes = a.get("place-desde-mes") ?? process.env.PLACE_DESDE_MES;
      if (desdeMes) {
        const hasta = new Date().toISOString().slice(0, 7).replace("-", "");
        for (const mes of mesesEntre(desdeMes, hasta)) {
          try {
            await cargarPlaceZip(mes, { borrarDespues: true });
          } catch (e) {
            console.error(`ZIP ${mes} no disponible, se continúa`, e instanceof Error ? e.message : e);
          }
        }
      }
      await cargarPlaceFeed({ paginas: Number(a.get("paginas") ?? 400) });
      await derivados();
      break;
    }
    case "diario": {
      await migrar();
      const errores: string[] = [];
      const paso = async (n: string, f: () => Promise<unknown>) => {
        try {
          await f();
        } catch (e) {
          errores.push(`${n}: ${e instanceof Error ? e.message : e}`);
        }
      };
      await paso("opd179", () => cargarOpd179());
      await paso("menores", () => cargarMenores(new Date().getFullYear()));
      await paso("place", () => cargarPlaceFeed({ desde: haceDias(Number(a.get("dias") ?? 2)), paginas: 600 }));
      await paso("bdns", () => cargarBdns({ desde: haceDias(Number(a.get("dias") ?? 30)) }));
      await derivados();
      if (errores.length) {
        console.error("Pasos con error:\n" + errores.join("\n"));
        process.exitCode = 1;
      }
      break;
    }
    default:
      console.log("Comando desconocido. Revisa la cabecera de etl/cli.ts");
      process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(cerrar);

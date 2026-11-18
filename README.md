# Rioja Abierta

Portal ciudadano de transparencia sobre **contratación pública y subvenciones en La Rioja**. Reúne en un único buscador:

- **Licitaciones** del Gobierno de La Rioja (dato abierto *opd-179*) y de la **Plataforma de Contratación del Sector Público** (PLACE) filtradas a La Rioja (ayuntamientos, órganos estatales con sede o ejecución en la comunidad…).
- **Adjudicaciones** por lote y empresa.
- **Contratos menores** de ejecución presupuestaria (Intervención General, 2021 → hoy, importes ≥ 500 €).
- **Subvenciones** de la Base de Datos Nacional de Subvenciones (BDNS) con impacto en La Rioja.
- Fichas de **organismos** y **empresas** (por NIF), **estadísticas**, **red** organismo–empresa, historial por adjudicatario y **exportación CSV**.

Todo funciona en planes gratuitos: **Next.js en Vercel Hobby**, **Postgres en Supabase Free** y **GitHub Actions** para la ingesta diaria.

> Proyecto independiente, sin relación con ninguna administración. Los datos proceden de fuentes oficiales; ante discrepancias prevalece la fuente.

---

## Arquitectura

```
Fuentes oficiales (HTTP, sin clave)
  ├─ opd-179 (JSON, snapshot diario)          ─┐
  ├─ Contratos menores CAR 2021-… (JSON anual) ─┤
  ├─ PLACE Atom/CODICE (feed + ZIP mensual)    ─┼─► ETL TypeScript (etl/) ──► Postgres (Supabase)
  └─ API BDNS concesiones (regiones=20)        ─┘    GitHub Actions diario        │
                                                                                   ▼
                                                     Next.js App Router (src/) en Vercel (lectura)
```

| Carpeta | Contenido |
|---|---|
| `src/app` | Páginas (App Router) y rutas `/api/*/csv` |
| `src/lib/queries` | Consultas SQL de la web (librería `postgres`) |
| `etl/` | Conectores idempotentes: `opd179.ts`, `menores.ts`, `place.ts`, `bdns.ts`, `cli.ts` |
| `supabase/migrations` | Esquema SQL (tablas, índices trigram, vistas materializadas, RLS) |
| `.github/workflows/ingesta.yml` | Ingesta programada y manual |

## Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `DATABASE_URL` | Vercel + GitHub Actions + local | Cadena de conexión Postgres. En Supabase usa el **Transaction pooler** (puerto 6543). |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (opcional) | URL del proyecto Supabase (reservada para el panel de admin con Supabase Auth). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (opcional) | Clave pública *anon* (solo lectura gracias a RLS). |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor/Actions (opcional) | Clave de servicio; **nunca** en el cliente. Hoy el ETL no la necesita porque escribe por `DATABASE_URL`. |
| `REVALIDATE_SECRET` | Vercel + GitHub Actions | Secreto para que la ingesta refresque la caché de KPIs (`POST /api/revalidar`). |
| `BDNS_REGIONES`, `UMBRAL_MENORES`, `PLACE_DESDE_MES`, `ETL_CACHE_DIR` | ETL (opcional) | Ajustes, ver `.env.example`. |

Copia `.env.example` a `.env.local` para desarrollo.

## Puesta en marcha en local

Requisitos: Node 20+ y un Postgres 15+ con las extensiones `unaccent`, `pg_trgm` y `pgcrypto` (vienen en `postgresql-contrib`).

```bash
npm install
createdb riojaabierta
export DATABASE_URL=postgres://postgres@localhost:5432/riojaabierta

npm run etl -- migrar            # crea el esquema
npm run etl -- opd179            # ~6.500 expedientes del Gobierno de La Rioja (1 min)
npm run etl -- menores           # contratos menores 2021-2026 (≈110.000 registros ≥ 500 €)
npm run etl -- bdns              # ≈8.300 concesiones BDNS región ES230
npm run etl -- place-zip --mes 202610 --borrar   # un mes de histórico PLACE (~200 MB de descarga)
npm run etl -- place-feed --desde 2026-11-01     # feed vivo de PLACE hasta esa fecha

npm run dev                      # http://localhost:3000
```

Todos los comandos del ETL están documentados en la cabecera de `etl/cli.ts`. Son **idempotentes**: se pueden repetir sin duplicar datos (upsert por `(fuente, id_fuente)`, `cod_contrato` o id BDNS).

## 1. Crear el proyecto Supabase (gratis)

1. Entra en <https://supabase.com/dashboard> → **New project**. Región recomendada: *West EU (Paris)* o *Central EU (Frankfurt)*. Guarda la contraseña de la base de datos.
2. En **Project Settings → Database → Connection string** copia la del **Transaction pooler** (puerto **6543**) y sustituye `[YOUR-PASSWORD]`. Esa es tu `DATABASE_URL`.
3. En **Project Settings → API** copia *Project URL* (`NEXT_PUBLIC_SUPABASE_URL`), la clave `anon` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) y, si la vas a usar, la `service_role` (`SUPABASE_SERVICE_ROLE_KEY`).

## 2. Aplicar las migraciones

Opción A (recomendada, desde tu equipo):

```bash
DATABASE_URL="postgresql://postgres.<ref>:<pass>@aws-0-eu-west-3.pooler.supabase.com:6543/postgres" npm run etl -- migrar
```

Opción B: lanza el workflow **Ingesta de datos** con modo `migrar` (ver paso 4).

Opción C: pega en el **SQL Editor** de Supabase, en orden, los ficheros de `supabase/migrations/`. (También vale `supabase db push` con la CLI de Supabase.)

## 3. Carga inicial

La carga histórica completa es larga (sobre todo PLACE: ~200 MB por mes). Recomendado hacerla con GitHub Actions:

1. Workflow **Ingesta de datos** → *Run workflow* → modo `inicial`. Carga opd-179, menores 2021-hoy, BDNS y PLACE desde `PLACE_DESDE_MES` (por defecto 202401) más el feed vivo.
2. Si quieres más histórico de PLACE, lanza otras ejecuciones con modo `place-zip` y argumentos `--desde-mes 202001 --hasta-mes 202312 --borrar` (por tramos de 2-3 años para no pasar del límite de 6 h por job).

Tamaño orientativo en Postgres: ~210 MB con opd-179 + menores + BDNS + un mes de PLACE; cada año de PLACE añade ~25-40 MB. Cabe en los 500 MB del plan gratuito con varios años de histórico. Si te acercas al límite, sube `UMBRAL_MENORES` o reduce meses de PLACE.

## 4. Configurar GitHub Actions

En el repositorio: **Settings → Secrets and variables → Actions**.

*Secrets*:

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | Cadena del Transaction pooler de Supabase |
| `REVALIDATE_SECRET` | Una cadena aleatoria larga (la misma que en Vercel) |

*Variables* (opcionales):

| Nombre | Ejemplo |
|---|---|
| `SITE_URL` | `https://rioja-abierta.vercel.app` (para refrescar la caché al terminar) |
| `BDNS_REGIONES` | `20` (o `19,20`) |
| `PLACE_DESDE_MES` | `202401` |

El workflow `.github/workflows/ingesta.yml` se ejecuta **cada día a las 05:15 UTC** en modo `diario` (opd-179 completo, menores del año en curso, feed PLACE de los últimos 2 días y BDNS de los últimos 30 días) y se puede lanzar a mano con cualquier modo. En repositorios públicos los minutos de Actions son gratuitos; en privados, el plan gratuito incluye 2.000 min/mes (la ejecución diaria dura pocos minutos).

> GitHub desactiva los workflows programados tras 60 días sin actividad en el repositorio; si ocurre, basta con reactivarlo en la pestaña *Actions*.

## 5. Desplegar en Vercel (Hobby)

1. <https://vercel.com/new> → importa el repositorio de GitHub. Framework: Next.js (se detecta solo).
2. En **Environment Variables** añade `DATABASE_URL` y `REVALIDATE_SECRET` (y, si quieres, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. *Deploy*. Las páginas con datos se renderizan bajo demanda; los KPIs y estadísticas se cachean 15 min y se refrescan tras cada ingesta.
4. Copia la URL del despliegue en la variable `SITE_URL` de GitHub Actions.

No hace falta Vercel Cron: la ingesta va en GitHub Actions porque las funciones de Vercel Hobby tienen duración limitada.

## Decisiones y limitaciones

- **Filtro de PLACE**: se incluye una licitación si el CP del órgano empieza por 26, el lugar de ejecución es NUTS ES23x o el órgano (o su jerarquía) menciona «Rioja» (se excluye «Rioja Alavesa»).
- **Estados normalizados**: Anuncio previo, En plazo, Pendiente de adjudicación, Adjudicada, Resuelta y Anulada (se guarda siempre el valor original).
- **Empresas** agrupadas por NIF; sin NIF, por nombre exacto. Las personas físicas de la BDNS llegan seudonimizadas y no se enlazan a perfiles.
- **Duplicados opd-179 ↔ PLACE**: mismo número de expediente → la ficha enlaza ambas fuentes.
- **Feed de PLACE**: la primera página pesa ~1 MB, pero las siguientes (`rel="next"`) pesan 14-17 MB y tardan ~40 s cada una. Úsalo solo para el incremental (últimos días); para el histórico usa los ZIP mensuales (`place-zip`). El ETL guarda cada 20 páginas y reintenta descargas completas con timeout de 10 min.

## Pendiente

- Histórico de PLACE: en la base local de pruebas solo se cargaron los ZIP de julio, agosto y octubre de 2026 y el feed del 9 al 18 de noviembre de 2026; septiembre de 2026 y el feed del 1 al 8 de noviembre fallaron por cortes de red (`ETIMEDOUT`) y no se reintentaron. En Supabase, lanza `place-zip --desde-mes 202401 --hasta-mes 202610 --borrar` desde Actions.
- Panel `/admin` con Supabase Auth para relanzar cargas (hoy se hace desde GitHub Actions y el estado se ve en `/actualizaciones`).
- Conectores de altos cargos y cargos municipales/ayuntamientos (las tablas existen; las fuentes no publican un fichero estable).
- Las rutas inexistentes muestran la página «No encontrado», pero con código HTTP 200 en vez de 404 (efecto del streaming de Next.js).
- Las cargas de menores y BDNS comparten tablas: no lances varias cargas a la vez contra la misma base (el workflow ya usa `concurrency`).

## Licencia de los datos

Datos de La Rioja bajo CC BY 4.0; PLACE y BDNS reutilizables conforme a la Ley 37/2007 y sus avisos legales. Cita siempre la fuente original.

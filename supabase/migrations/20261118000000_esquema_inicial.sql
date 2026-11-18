-- Rioja Abierta · esquema inicial
-- Compatible con Supabase (extensiones en el esquema "extensions") y con Postgres local.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Normalización inmutable (minúsculas y sin tildes) para búsquedas e índices.
create or replace function public.f_norm(t text) returns text
language sql immutable parallel safe as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, '')))
$$;

-- ---------- Catálogos ----------
create table if not exists public.organismos (
  id           uuid primary key default extensions.gen_random_uuid(),
  clave        text not null unique,          -- dir3:XXXX | nom:<nombre normalizado>
  nombre       text not null,
  nif          text,
  dir3         text,
  postal       text,
  ciudad       text,
  nuts         text,
  jerarquia    text,                          -- padres PLACE concatenados con " > "
  ambito       text,                          -- autonomico | local | estatal | otros
  fuente_alta  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists organismos_nombre_trgm on public.organismos using gin (public.f_norm(nombre) extensions.gin_trgm_ops);

create table if not exists public.empresas (
  id           uuid primary key default extensions.gen_random_uuid(),
  clave        text not null unique,          -- NIF normalizado o nom:<nombre normalizado>
  nombre       text not null,
  nif          text unique,
  tipo_id      text,                          -- NIF | UTE | OTROS | NOMBRE
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists empresas_nombre_trgm on public.empresas using gin (public.f_norm(nombre) extensions.gin_trgm_ops);

-- ---------- Licitaciones (opd-179 Gobierno de La Rioja + PLACE) ----------
create table if not exists public.licitaciones (
  id                   uuid primary key default extensions.gen_random_uuid(),
  fuente               text not null check (fuente in ('larioja.org','place')),
  id_fuente            text not null,
  codigo_expediente    text,
  anio_expediente      int,
  objeto               text not null,
  organismo_id         uuid references public.organismos(id),
  unidad_competente    text,
  unidad_proponente    text,
  tipo                 text,
  tipo_origen          text,
  procedimiento        text,
  estado               text,
  estado_origen        text,
  presupuesto_base     numeric(16,2),
  presupuesto_con_iva  numeric(16,2),
  valor_estimado       numeric(16,2),
  importe_adjudicado   numeric(16,2),          -- suma de adjudicaciones (desnormalizado)
  fecha_publicacion    date,
  fecha_fin_ofertas    timestamptz,
  fecha_adjudicacion   date,
  fecha_formalizacion  date,
  fecha_actualizacion  timestamptz,
  lugar_ejecucion      text,
  nuts                 text,
  duracion_dias        int,
  duracion_meses       int,
  criterios_valoracion text,
  num_licitadores      int,
  resultado_adjudica   text,
  url_origen           text,
  url_perfil           text,
  url_place            text,                   -- si el mismo expediente aparece también en PLACE
  busqueda             text,                   -- texto normalizado para el buscador
  raw                  jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (fuente, id_fuente)
);
create index if not exists licitaciones_fecha_idx on public.licitaciones (fecha_publicacion desc nulls last);
create index if not exists licitaciones_estado_idx on public.licitaciones (estado);
create index if not exists licitaciones_tipo_idx on public.licitaciones (tipo);
create index if not exists licitaciones_organismo_idx on public.licitaciones (organismo_id);
create index if not exists licitaciones_importe_idx on public.licitaciones (presupuesto_base);
create index if not exists licitaciones_expediente_idx on public.licitaciones (codigo_expediente);
create index if not exists licitaciones_busqueda_trgm on public.licitaciones using gin (busqueda extensions.gin_trgm_ops);

create table if not exists public.licitacion_cpvs (
  licitacion_id uuid not null references public.licitaciones(id) on delete cascade,
  codigo        text not null,
  descripcion   text,
  primary key (licitacion_id, codigo)
);
create index if not exists licitacion_cpvs_codigo_idx on public.licitacion_cpvs (codigo);

create table if not exists public.adjudicaciones (
  id               uuid primary key default extensions.gen_random_uuid(),
  licitacion_id    uuid not null references public.licitaciones(id) on delete cascade,
  empresa_id       uuid references public.empresas(id),
  nombre_origen    text not null,
  nif_origen       text,
  importe          numeric(16,2),
  importe_con_iva  numeric(16,2),
  fecha            date,
  lote_numero      text not null default '',
  lote_descripcion text,
  unique (licitacion_id, nombre_origen, lote_numero)
);
create index if not exists adjudicaciones_empresa_idx on public.adjudicaciones (empresa_id);
create index if not exists adjudicaciones_fecha_idx on public.adjudicaciones (fecha desc nulls last);
create index if not exists adjudicaciones_nombre_idx on public.adjudicaciones (nombre_origen);

-- ---------- Contratos menores (ejecución presupuestaria, Intervención General) ----------
create table if not exists public.contratos_menores (
  cod_contrato   text primary key,
  anio_dataset   int not null,
  concepto       text not null,
  importe        numeric(16,2),
  fecha          date,
  departamento   text,
  organismo_id   uuid references public.organismos(id),
  tipo           text,
  tipo_origen    text,
  empresa_id     uuid references public.empresas(id),
  nombre_origen  text,
  nif_origen     text,
  persona_fisica boolean not null default false,
  busqueda       text,
  updated_at     timestamptz not null default now()
);
create index if not exists menores_fecha_idx on public.contratos_menores (fecha desc nulls last);
create index if not exists menores_empresa_idx on public.contratos_menores (empresa_id);
create index if not exists menores_depto_idx on public.contratos_menores (departamento);
create index if not exists menores_busqueda_trgm on public.contratos_menores using gin (busqueda extensions.gin_trgm_ops);

-- ---------- Subvenciones (BDNS / SNPSAP) ----------
create table if not exists public.subvenciones (
  id                   bigint primary key,
  cod_concesion        text,
  id_convocatoria      bigint,
  numero_convocatoria  text,
  convocatoria         text,
  instrumento          text,
  importe              numeric(16,2),
  ayuda_equivalente    numeric(16,2),
  fecha_concesion      date,
  fecha_alta           date,
  beneficiario_nombre  text,
  beneficiario_nif     text,
  id_persona_bdns      bigint,
  es_persona_fisica    boolean not null default false,
  empresa_id           uuid references public.empresas(id),
  nivel1               text,
  nivel2               text,
  nivel3               text,
  codigo_invente       text,
  url_bases            text,
  region_id            int,
  busqueda             text,
  updated_at           timestamptz not null default now()
);
create index if not exists subvenciones_fecha_idx on public.subvenciones (fecha_concesion desc nulls last);
create index if not exists subvenciones_nif_idx on public.subvenciones (beneficiario_nif);
create index if not exists subvenciones_empresa_idx on public.subvenciones (empresa_id);
create index if not exists subvenciones_busqueda_trgm on public.subvenciones using gin (busqueda extensions.gin_trgm_ops);

-- ---------- Cargos públicos (extras) ----------
create table if not exists public.altos_cargos (
  id           uuid primary key default extensions.gen_random_uuid(),
  ejercicio    int not null,
  area         text not null,
  cargo        text not null,
  nombre       text not null,
  retribucion  numeric(12,2),
  fuente_url   text,
  updated_at   timestamptz not null default now(),
  unique (ejercicio, area, cargo, nombre)
);

create table if not exists public.cargos_municipales (
  id           uuid primary key default extensions.gen_random_uuid(),
  municipio    text not null,
  nombre       text not null,
  cargo        text,
  dedicacion   text,
  retribucion  numeric(12,2),
  partido      text,
  fuente       text default 'SIL',
  updated_at   timestamptz not null default now()
);
create index if not exists cargos_municipales_municipio_idx on public.cargos_municipales (municipio);

-- ---------- Operación ----------
create table if not exists public.ingest_runs (
  id            uuid primary key default extensions.gen_random_uuid(),
  fuente        text not null,
  modo          text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  ok            boolean,
  leidos        int default 0,
  insertados    int default 0,
  actualizados  int default 0,
  omitidos      int default 0,
  error         text,
  detalle       jsonb
);
create index if not exists ingest_runs_started_idx on public.ingest_runs (started_at desc);

-- ---------- Seguridad (RLS): lectura pública, escritura solo service_role ----------
do $$
declare t text;
begin
  foreach t in array array['organismos','empresas','licitaciones','licitacion_cpvs','adjudicaciones',
                           'contratos_menores','subvenciones','altos_cargos','cargos_municipales','ingest_runs']
  loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='lectura_publica') then
      execute format('create policy lectura_publica on public.%I for select using (true)', t);
    end if;
  end loop;
end $$;

-- =====================================================================================
-- Usuarios registrados (Supabase Auth): perfil de empresa, sectores CPV, seguimiento de
-- licitaciones (pipeline personal), checklist, historial de estados, cola de alertas
-- y función de idoneidad. RLS estricta: cada usuario solo ve y modifica lo suyo.
-- Idempotente: se puede aplicar con apply_migration (Supabase) y con `npm run etl -- migrar`.
-- =====================================================================================

-- ---------- Perfil de empresa ----------
create table if not exists public.perfiles (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  empresa                text check (char_length(empresa) <= 200),
  cif                    text check (char_length(cif) <= 20),
  palabras_clave         text[] not null default '{}',
  palabras_negativas     text[] not null default '{}',
  zonas                  text[] not null default '{}',
  organismos_preferidos  uuid[] not null default '{}',
  organismos_excluidos   uuid[] not null default '{}',
  tipos                  text[] not null default '{}',
  procedimientos         text[] not null default '{}',
  importe_min            numeric(16,2) check (importe_min >= 0),
  importe_max            numeric(16,2) check (importe_max >= 0),
  facturacion_anual      numeric(16,2) check (facturacion_anual >= 0),
  plantilla              int check (plantilla >= 0),
  clasificacion          text check (char_length(clasificacion) <= 300),
  plazo_preparacion_dias int not null default 10 check (plazo_preparacion_dias between 0 and 180),
  alertas_email          boolean not null default false,
  alertas_frecuencia     text not null default 'semanal' check (alertas_frecuencia in ('diaria','semanal')),
  alertas_umbral         int not null default 60 check (alertas_umbral between 0 and 100),
  onboarding_completo    boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Sectores: prefijo significativo de CPV (2 a 8 dígitos: 45 = división, 4523314 = muy concreto)
create table if not exists public.perfil_cpv (
  user_id     uuid not null references auth.users(id) on delete cascade,
  codigo      text not null check (codigo ~ '^[0-9]{2,8}$'),
  descripcion text,
  origen      text not null default 'manual' check (origen in ('manual','sugerido')),
  created_at  timestamptz not null default now(),
  primary key (user_id, codigo)
);

-- ---------- Seguimiento (pipeline) ----------
-- Estados: interesa → preparando → presentada → ganada | perdida ; descartada (con motivo) ;
-- desierta (automático si la licitación oficial queda anulada/desierta). «Sugerida» no se guarda:
-- es cualquier licitación en plazo sin seguimiento, calculada al vuelo con public.idoneidad().
create table if not exists public.seguimientos (
  id                   uuid primary key default extensions.gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  licitacion_id        uuid not null references public.licitaciones(id) on delete cascade,
  estado               text not null default 'interesa'
                       check (estado in ('interesa','preparando','presentada','ganada','perdida','descartada','desierta')),
  motivo_descarte      text check (char_length(motivo_descarte) <= 300),
  notas                text check (char_length(notas) <= 10000),
  fecha_limite_interna date,
  importe_ofertado     numeric(16,2) check (importe_ofertado >= 0),
  puntuacion_inicial   int,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (user_id, licitacion_id)
);
create index if not exists seguimientos_user_estado_idx on public.seguimientos (user_id, estado);
create index if not exists seguimientos_licitacion_idx on public.seguimientos (licitacion_id);

create table if not exists public.seguimiento_eventos (
  id              bigint generated always as identity primary key,
  seguimiento_id  uuid not null references public.seguimientos(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  estado_anterior text,
  estado_nuevo    text not null,
  nota            text,
  automatico      boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists seguimiento_eventos_seg_idx on public.seguimiento_eventos (seguimiento_id, created_at desc);
create index if not exists seguimiento_eventos_user_idx on public.seguimiento_eventos (user_id, created_at desc);

create table if not exists public.seguimiento_checklist (
  id             uuid primary key default extensions.gen_random_uuid(),
  seguimiento_id uuid not null references public.seguimientos(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  texto          text not null check (char_length(texto) between 1 and 200),
  hecho          boolean not null default false,
  orden          int not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists seguimiento_checklist_seg_idx on public.seguimiento_checklist (seguimiento_id, orden);
create index if not exists seguimiento_checklist_user_idx on public.seguimiento_checklist (user_id);

-- ---------- Alertas por email (preparado; el envío aún no está activo) ----------
create table if not exists public.alertas_email (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  creada_at     timestamptz not null default now(),
  enviada_at    timestamptz,
  estado        text not null default 'pendiente' check (estado in ('pendiente','enviada','error','omitida')),
  licitaciones  uuid[] not null default '{}',
  detalle       jsonb
);
create index if not exists alertas_email_user_idx on public.alertas_email (user_id, creada_at desc);

-- ---------- Triggers ----------
create or replace function public.tg_set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists perfiles_updated_at on public.perfiles;
create trigger perfiles_updated_at before update on public.perfiles for each row execute function public.tg_set_updated_at();
drop trigger if exists seguimientos_updated_at on public.seguimientos;
create trigger seguimientos_updated_at before update on public.seguimientos for each row execute function public.tg_set_updated_at();

-- Historial de estados y checklist por defecto
create or replace function public.tg_seguimiento_historial() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  auto boolean := coalesce(current_setting('rioja.automatico', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    insert into public.seguimiento_eventos (seguimiento_id, user_id, estado_anterior, estado_nuevo, nota, automatico)
    values (new.id, new.user_id, null, new.estado, case when new.estado = 'descartada' then new.motivo_descarte end, auto);
    insert into public.seguimiento_checklist (seguimiento_id, user_id, texto, orden)
    select new.id, new.user_id, t.texto, t.orden
    from (values ('DEUC firmado', 1), ('Solvencia económica', 2), ('Solvencia técnica', 3),
                 ('Garantía provisional (si se exige)', 4), ('Oferta técnica (sobre B)', 5), ('Oferta económica (sobre C)', 6)) t(texto, orden);
  elsif new.estado is distinct from old.estado then
    insert into public.seguimiento_eventos (seguimiento_id, user_id, estado_anterior, estado_nuevo, nota, automatico)
    values (new.id, new.user_id, old.estado, new.estado, case when new.estado = 'descartada' then new.motivo_descarte end, auto);
  end if;
  return null;
end $$;

drop trigger if exists seguimientos_historial on public.seguimientos;
create trigger seguimientos_historial after insert or update of estado on public.seguimientos
  for each row execute function public.tg_seguimiento_historial();

-- Si la licitación oficial queda anulada o desierta, los seguimientos activos pasan a «desierta»
create or replace function public.tg_licitacion_estado_seguimientos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'Anulada'
     or public.f_norm(new.resultado_adjudica) similar to '(desiert|desistim|renuncia)%' then
    perform set_config('rioja.automatico', 'on', true);
    update public.seguimientos s set estado = 'desierta'
     where s.licitacion_id = new.id and s.estado in ('interesa','preparando','presentada');
    perform set_config('rioja.automatico', '', true);
  end if;
  return null;
end $$;

drop trigger if exists licitaciones_estado_seguimientos on public.licitaciones;
create trigger licitaciones_estado_seguimientos after update of estado, resultado_adjudica on public.licitaciones
  for each row when (old.estado is distinct from new.estado or old.resultado_adjudica is distinct from new.resultado_adjudica)
  execute function public.tg_licitacion_estado_seguimientos();

-- Si aparece una adjudicación al CIF del usuario, su seguimiento pasa a «ganada»
create or replace function public.f_nif_norm(t text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select nullif(upper(regexp_replace(coalesce(t, ''), '[^A-Za-z0-9]', '', 'g')), '')
$$;

create or replace function public.tg_adjudicacion_ganada() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.f_nif_norm(new.nif_origen) is null then return null; end if;
  perform set_config('rioja.automatico', 'on', true);
  update public.seguimientos s set estado = 'ganada'
    from public.perfiles p
   where s.licitacion_id = new.licitacion_id and p.user_id = s.user_id
     and public.f_nif_norm(p.cif) = public.f_nif_norm(new.nif_origen)
     and s.estado in ('interesa','preparando','presentada');
  perform set_config('rioja.automatico', '', true);
  return null;
end $$;

drop trigger if exists adjudicaciones_ganada on public.adjudicaciones;
create trigger adjudicaciones_ganada after insert or update of nif_origen on public.adjudicaciones
  for each row execute function public.tg_adjudicacion_ganada();

create index if not exists adjudicaciones_nif_norm_idx on public.adjudicaciones (public.f_nif_norm(nif_origen));

-- ---------- RLS ----------
alter table public.perfiles enable row level security;
alter table public.perfil_cpv enable row level security;
alter table public.seguimientos enable row level security;
alter table public.seguimiento_eventos enable row level security;
alter table public.seguimiento_checklist enable row level security;
alter table public.alertas_email enable row level security;

do $$
declare t text;
begin
  -- propias: lectura y escritura completas
  foreach t in array array['perfiles','perfil_cpv','seguimientos'] loop
    execute format('drop policy if exists propio_select on public.%I', t);
    execute format('drop policy if exists propio_insert on public.%I', t);
    execute format('drop policy if exists propio_update on public.%I', t);
    execute format('drop policy if exists propio_delete on public.%I', t);
    execute format('create policy propio_select on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy propio_insert on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy propio_update on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy propio_delete on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
  -- historial y alertas: solo lectura (los escriben triggers / procesos de servidor)
  foreach t in array array['seguimiento_eventos','alertas_email'] loop
    execute format('drop policy if exists propio_select on public.%I', t);
    execute format('create policy propio_select on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- checklist: además, el seguimiento debe ser del usuario
drop policy if exists propio_select on public.seguimiento_checklist;
drop policy if exists propio_insert on public.seguimiento_checklist;
drop policy if exists propio_update on public.seguimiento_checklist;
drop policy if exists propio_delete on public.seguimiento_checklist;
create policy propio_select on public.seguimiento_checklist for select to authenticated using (user_id = (select auth.uid()));
create policy propio_insert on public.seguimiento_checklist for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.seguimientos s where s.id = seguimiento_id and s.user_id = (select auth.uid())));
create policy propio_update on public.seguimiento_checklist for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.seguimientos s where s.id = seguimiento_id and s.user_id = (select auth.uid())));
create policy propio_delete on public.seguimiento_checklist for delete to authenticated using (user_id = (select auth.uid()));

-- Permisos: nada para anon; authenticated, solo a través de RLS
revoke all on public.perfiles, public.perfil_cpv, public.seguimientos, public.seguimiento_eventos,
              public.seguimiento_checklist, public.alertas_email from anon;
grant select, insert, update, delete on public.perfiles, public.perfil_cpv, public.seguimientos, public.seguimiento_checklist to authenticated;
grant select on public.seguimiento_eventos, public.alertas_email to authenticated;

-- Las funciones de trigger no deben poder invocarse vía API
revoke execute on function public.tg_seguimiento_historial(), public.tg_licitacion_estado_seguimientos(),
  public.tg_adjudicacion_ganada(), public.tg_set_updated_at() from public, anon, authenticated;

-- ---------- Idoneidad ----------
-- Puntuación 0-100 por licitación para el usuario autenticado (auth.uid()), con desglose explicable.
-- Pesos: CPV 30 · palabras clave 20 · importe 15 · tipo 10 · organismo 10 · plazo 10 · zona 5 = 100.
-- Sin preferencia en un criterio = mitad de sus puntos. Penalizaciones: palabra negativa −25,
-- organismo excluido −40, importe por encima de la facturación anual −15 (ajustado a la solvencia −5),
-- procedimiento no deseado −5. Bonus: ya ganó con ese organismo (mismo CIF) +10. Se recorta a 0-100.
create or replace function public.idoneidad(p_ids uuid[] default null, p_limite int default 300)
returns table (licitacion_id uuid, puntuacion int, positivos jsonb, negativos jsonb)
language plpgsql stable security invoker set search_path = public, extensions as $$
#variable_conflict use_column
declare
  p public.perfiles%rowtype;
  v_cpvs text[];
begin
  select * into p from public.perfiles where user_id = auth.uid();
  if not found then return; end if;
  select coalesce(array_agg(codigo), '{}') into v_cpvs from public.perfil_cpv where user_id = auth.uid();

  return query
  with cand as (
    select l.*, o.nombre org_nombre, o.ciudad org_ciudad, o.ambito org_ambito
    from public.licitaciones l left join public.organismos o on o.id = l.organismo_id
    where case when p_ids is not null then l.id = any(p_ids)
               else l.estado in ('En plazo','Anuncio previo') and (l.fecha_fin_ofertas is null or l.fecha_fin_ofertas >= now()) end
    order by l.fecha_publicacion desc nulls last
    limit greatest(1, least(coalesce(p_limite, 300), 1000))
  ),
  ganadas as (
    select l2.organismo_id, count(*)::int n
    from public.adjudicaciones a join public.licitaciones l2 on l2.id = a.licitacion_id
    where public.f_nif_norm(p.cif) is not null and public.f_nif_norm(a.nif_origen) = public.f_nif_norm(p.cif)
    group by 1
  ),
  calc as (
    select
      -- CPV: nivel de coincidencia del prefijo del perfil con los CPV de la licitación
      (select max(case when lc.codigo like pc || '%' then case when length(pc) >= 8 then 30 when length(pc) >= 5 then 27 when length(pc) = 4 then 24 when length(pc) = 3 then 21 else 18 end
                       when pc like rtrim(lc.codigo, '0') || '%' then 15 end)
         from public.licitacion_cpvs lc, unnest(v_cpvs) pc where lc.licitacion_id = c.id) cpv_pts,
      (select string_agg(distinct coalesce(lc.descripcion, lc.codigo), ', ') from public.licitacion_cpvs lc, unnest(v_cpvs) pc
         where lc.licitacion_id = c.id and (lc.codigo like pc || '%' or pc like rtrim(lc.codigo, '0') || '%')) cpv_txt,
      (select array_agg(k) from unnest(p.palabras_clave) k where length(trim(k)) > 1 and public.f_norm(c.objeto) like '%' || public.f_norm(trim(k)) || '%') kw_si,
      (select array_agg(k) from unnest(p.palabras_negativas) k where length(trim(k)) > 1 and public.f_norm(c.objeto) like '%' || public.f_norm(trim(k)) || '%') kw_no,
      (select bool_or(public.f_norm(z) in ('la rioja', 'toda la rioja') or c.org_ambito = 'autonomico'
                      or public.f_norm(coalesce(c.org_nombre, '') || ' ' || coalesce(c.org_ciudad, '') || ' ' || coalesce(c.lugar_ejecucion, '') || ' ' || c.objeto) like '%' || public.f_norm(z) || '%')
         from unnest(p.zonas) z) zona_ok,
      case when c.fecha_fin_ofertas is null then null else floor(extract(epoch from (c.fecha_fin_ofertas - now())) / 86400)::int end dias,
      c.presupuesto_base / greatest(1, coalesce(c.duracion_meses, 12)::numeric / 12) valor_anual,
      c.*
    from cand c
  ),
  puntos as (
    select k.id,
      array_remove(array[
        case when cardinality(v_cpvs) > 0 and k.cpv_pts is not null then jsonb_build_object('criterio','CPV','puntos',k.cpv_pts,'texto','Sector: ' || left(k.cpv_txt, 120)) end,
        case when k.kw_si is not null then jsonb_build_object('criterio','Palabras','puntos',least(20, 12 + 4 * (cardinality(k.kw_si) - 1)),'texto','Contiene «' || array_to_string(k.kw_si, '», «') || '»') end,
        case when cardinality(p.tipos) > 0 and k.tipo = any(p.tipos) then jsonb_build_object('criterio','Tipo','puntos',10,'texto',k.tipo) end,
        case when k.presupuesto_base is not null and (p.importe_min is not null or p.importe_max is not null)
                  and k.presupuesto_base >= coalesce(p.importe_min, 0) and k.presupuesto_base <= coalesce(p.importe_max, 1e15)
             then jsonb_build_object('criterio','Importe','puntos',15,'texto','Importe dentro de tu rango') end,
        case when k.organismo_id = any(p.organismos_preferidos) then jsonb_build_object('criterio','Organismo','puntos',10,'texto','Organismo preferido') end,
        case when cardinality(p.zonas) > 0 and k.zona_ok then jsonb_build_object('criterio','Zona','puntos',5,'texto','En tu zona') end,
        case when k.dias is not null and k.dias >= p.plazo_preparacion_dias then jsonb_build_object('criterio','Plazo','puntos',10,'texto','Quedan ' || k.dias || ' días') end,
        case when g.n is not null then jsonb_build_object('criterio','Historial','puntos',10,'texto','Ya has ganado ' || g.n || ' contrato(s) con este organismo') end
      ], null) pos,
      array_remove(array[
        case when cardinality(v_cpvs) > 0 and k.cpv_pts is null then jsonb_build_object('criterio','CPV','puntos',0,'texto','Ningún CPV coincide con tus sectores') end,
        case when cardinality(p.palabras_clave) > 0 and k.kw_si is null then jsonb_build_object('criterio','Palabras','puntos',0,'texto','No aparece ninguna de tus palabras clave') end,
        case when k.kw_no is not null then jsonb_build_object('criterio','Palabras','puntos',-25,'texto','Contiene palabra excluida «' || array_to_string(k.kw_no, '», «') || '»') end,
        case when cardinality(p.tipos) > 0 and (k.tipo is null or not k.tipo = any(p.tipos)) then jsonb_build_object('criterio','Tipo','puntos',0,'texto','Tipo «' || coalesce(k.tipo, 'sin tipo') || '» fuera de tus preferencias') end,
        case when k.presupuesto_base is not null and p.importe_min is not null and k.presupuesto_base < p.importe_min then jsonb_build_object('criterio','Importe','puntos',0,'texto','Por debajo de tu importe mínimo') end,
        case when k.presupuesto_base is not null and p.importe_max is not null and k.presupuesto_base > p.importe_max then jsonb_build_object('criterio','Importe','puntos',0,'texto','Por encima de tu importe máximo') end,
        case when p.facturacion_anual > 0 and k.presupuesto_base > p.facturacion_anual then jsonb_build_object('criterio','Solvencia','puntos',-15,'texto','El importe supera tu facturación anual')
             when p.facturacion_anual > 0 and k.valor_anual * 1.5 > p.facturacion_anual then jsonb_build_object('criterio','Solvencia','puntos',-5,'texto','Solvencia justa: se suele pedir 1,5× el valor anual') end,
        case when k.organismo_id = any(p.organismos_excluidos) then jsonb_build_object('criterio','Organismo','puntos',-40,'texto','Organismo excluido') end,
        case when cardinality(p.zonas) > 0 and not coalesce(k.zona_ok, false) then jsonb_build_object('criterio','Zona','puntos',0,'texto','Fuera de tus zonas') end,
        case when k.dias is not null and k.dias < 0 then jsonb_build_object('criterio','Plazo','puntos',0,'texto','Plazo cerrado')
             when k.dias is not null and k.dias < p.plazo_preparacion_dias then jsonb_build_object('criterio','Plazo','puntos',round(10.0 * k.dias / greatest(1, p.plazo_preparacion_dias))::int,'texto','Solo quedan ' || k.dias || ' días (necesitas ' || p.plazo_preparacion_dias || ')') end,
        case when cardinality(p.procedimientos) > 0 and (k.procedimiento is null or not k.procedimiento = any(p.procedimientos)) then jsonb_build_object('criterio','Procedimiento','puntos',-5,'texto','Procedimiento no preferido') end
      ], null) neg,
      -- puntos neutros (criterio sin configurar = mitad)
      (case when cardinality(v_cpvs) = 0 then 15 else 0 end)
      + (case when cardinality(p.palabras_clave) = 0 then 10 else 0 end)
      + (case when cardinality(p.tipos) = 0 then 5 else 0 end)
      + (case when k.presupuesto_base is null or (p.importe_min is null and p.importe_max is null) then 7 else 0 end)
      + (case when not (k.organismo_id = any(p.organismos_preferidos)) or k.organismo_id is null then 5 else 0 end)
      + (case when cardinality(p.zonas) = 0 then 2 else 0 end)
      + (case when k.dias is null then 5 else 0 end) neutros
    from calc k left join ganadas g on g.organismo_id = k.organismo_id
  )
  select x.id,
    greatest(0, least(100, x.neutros
      + coalesce((select sum((e->>'puntos')::int) from unnest(x.pos) e), 0)
      + coalesce((select sum((e->>'puntos')::int) from unnest(x.neg) e), 0)))::int,
    to_jsonb(x.pos), to_jsonb(x.neg)
  from puntos x;
end $$;

revoke execute on function public.idoneidad(uuid[], int) from public, anon;
grant execute on function public.idoneidad(uuid[], int) to authenticated;

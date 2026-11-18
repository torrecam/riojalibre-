-- Alertas diarias por email (Brevo) — Edge Function «alertas-diarias» + pg_cron + pg_net.
-- Idempotente. Las partes que dependen de Supabase (vault, pg_cron, pg_net, auth.users completos) se saltan en un Postgres local.

-- ---------- Preferencias y token de baja ----------
alter table public.perfiles add column if not exists token_baja uuid not null default gen_random_uuid();
alter table public.perfiles add column if not exists ultima_alerta_at timestamptz;
create unique index if not exists perfiles_token_baja_idx on public.perfiles (token_baja);
alter table public.perfiles alter column alertas_email set default true;
alter table public.perfiles alter column alertas_frecuencia set default 'diaria';
alter table public.perfiles alter column alertas_umbral set default 60;

-- (el token solo lo ve su dueño por RLS; idoneidad() lee perfiles con select *, así que se mantiene el SELECT de tabla)
grant select on public.perfiles to authenticated;

create index if not exists licitaciones_created_at_idx on public.licitaciones (created_at desc);

-- ---------- Destinatarios y contenido (lo usa la Edge Function con service_role) ----------
create or replace function public.alertas_preparar(p_solo_email text default null, p_desde_horas int default null, p_max int default 15, p_forzar boolean default false)
returns table (user_id uuid, email text, empresa text, umbral int, token_baja uuid, ultima_alerta_at timestamptz, total int, items jsonb)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare
  r record;
  v_desde timestamptz;
  v_ids uuid[];
  v_total int;
  v_items jsonb;
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
begin
  for r in
    select p.user_id, u.email::text email, p.empresa, p.alertas_umbral, p.alertas_frecuencia, p.token_baja, p.ultima_alerta_at
    from public.perfiles p join auth.users u on u.id = p.user_id
    where p.alertas_email and p.onboarding_completo
      and u.email is not null and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until < now())
      and (p_solo_email is null or lower(u.email) = lower(p_solo_email))
    order by p.created_at
  loop
    -- una vez al día como mucho (y los semanales, solo los lunes), salvo prueba forzada
    if not p_forzar then
      if r.ultima_alerta_at is not null and (r.ultima_alerta_at at time zone 'Europe/Madrid')::date = v_hoy then continue; end if;
      if r.alertas_frecuencia = 'semanal' and extract(isodow from v_hoy) <> 1 then continue; end if;
    end if;
    v_desde := case when p_desde_horas is not null then now() - make_interval(hours => p_desde_horas)
                    else coalesce(r.ultima_alerta_at, now() - interval '1 day') end;
    -- licitaciones en plazo NUEVAS (cargadas desde el último envío), no enviadas antes y que el usuario no sigue ya
    select array_agg(l.id) into v_ids
    from public.licitaciones l
    where l.estado in ('En plazo', 'Anuncio previo')
      and (l.fecha_fin_ofertas is null or l.fecha_fin_ofertas >= now())
      and l.created_at > v_desde
      and not exists (select 1 from public.seguimientos s where s.user_id = r.user_id and s.licitacion_id = l.id)
      and (p_forzar or not exists (select 1 from public.alertas_email a where a.user_id = r.user_id and a.estado = 'enviada' and l.id = any(a.licitaciones)));
    if v_ids is null then continue; end if;

    -- idoneidad() usa auth.uid(): se calcula «como» ese usuario
    perform set_config('request.jwt.claim.sub', r.user_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', r.user_id, 'role', 'authenticated')::text, true);

    select count(*)::int,
           coalesce(jsonb_agg(x order by x.puntuacion desc, x.fecha_fin_ofertas asc nulls last) filter (where x.rn <= p_max), '[]')
      into v_total, v_items
    from (
      select i.licitacion_id id, i.puntuacion, l.objeto, o.nombre organismo, l.presupuesto_base, l.fecha_fin_ofertas, l.tipo,
             (select jsonb_agg(case when e->>'criterio' = 'Tipo' then 'Tipo: ' || (e->>'texto') else e->>'texto' end order by (e->>'puntos')::int desc)
               from jsonb_array_elements(i.positivos) e where e->>'criterio' in ('CPV', 'Palabras', 'Organismo', 'Historial', 'Tipo')) motivos,
             row_number() over (order by i.puntuacion desc, l.fecha_fin_ofertas asc nulls last) rn
      from public.idoneidad(v_ids, 1000) i
      join public.licitaciones l on l.id = i.licitacion_id
      left join public.organismos o on o.id = l.organismo_id
      where i.puntuacion >= r.alertas_umbral
    ) x;

    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);
    if v_total = 0 then continue; end if;

    user_id := r.user_id; email := r.email; empresa := r.empresa; umbral := r.alertas_umbral; token_baja := r.token_baja;
    ultima_alerta_at := r.ultima_alerta_at; total := v_total; items := v_items;
    return next;
  end loop;
end $$;

-- Registro del envío (cola/histórico) y marca de último envío
create or replace function public.alertas_registrar(p_user uuid, p_ids uuid[], p_estado text, p_detalle jsonb default null, p_marcar boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.alertas_email (user_id, enviada_at, estado, licitaciones, detalle)
  values (p_user, case when p_estado = 'enviada' then now() end, p_estado, coalesce(p_ids, '{}'), p_detalle);
  if p_estado = 'enviada' and p_marcar then
    update public.perfiles set ultima_alerta_at = now() where user_id = p_user;
  end if;
end $$;

-- Baja y reactivación con un clic (las llama la web con el rol del servidor)
create or replace function public.alertas_baja(t uuid, activar boolean default false)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if t is null then return false; end if;
  update public.perfiles set alertas_email = activar where token_baja = t;
  get diagnostics n = row_count;
  return n > 0;
end $$;

revoke all on function public.alertas_preparar(text, int, int, boolean) from public, anon, authenticated;
revoke all on function public.alertas_registrar(uuid, uuid[], text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.alertas_baja(uuid, boolean) from public, anon, authenticated;

-- ---------- Solo en Supabase: secreto del cron, lanzador y programación ----------
do $do$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') or not exists (select 1 from pg_namespace where nspname = 'vault') then
    raise notice 'Sin Supabase (vault/service_role): se omite cron y secreto';
    return;
  end if;

  grant execute on function public.alertas_preparar(text, int, int, boolean) to service_role;
  grant execute on function public.alertas_registrar(uuid, uuid[], text, jsonb, boolean) to service_role;

  -- secreto aleatorio generado dentro de la BD: nunca sale en el repo ni en el chat
  if not exists (select 1 from vault.secrets where name = 'alertas_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'alertas_cron_secret', 'Cabecera x-cron-secret de la Edge Function alertas-diarias');
  end if;

  execute $f$
    create or replace function public.alertas_secreto_valido(s text) returns boolean
    language sql stable security definer set search_path = '' as $b$
      select coalesce(length(s) >= 32 and exists (select 1 from vault.decrypted_secrets where name = 'alertas_cron_secret' and decrypted_secret = s), false)
    $b$;
    revoke all on function public.alertas_secreto_valido(text) from public, anon, authenticated;
    grant execute on function public.alertas_secreto_valido(text) to service_role;
  $f$;

  create extension if not exists pg_net with schema extensions;
  create extension if not exists pg_cron;

  execute $f$
    create or replace function public.alertas_lanzar(cuerpo jsonb default '{"dry_run": true}') returns bigint
    language sql security definer set search_path = '' as $b$
      select net.http_post(
        url := 'https://rpcgapijblfiwnrnsevf.supabase.co/functions/v1/alertas-diarias',
        headers := jsonb_build_object('Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'alertas_cron_secret')),
        body := cuerpo,
        timeout_milliseconds := 120000)
    $b$;
    revoke all on function public.alertas_lanzar(jsonb) from public, anon, authenticated;
  $f$;

  -- 9:00 en Madrid = 08:00 UTC en invierno (CET) y 07:00 UTC en verano (CEST).
  -- Se lanza a ambas horas y la función solo actúa cuando en Madrid son las 9.
  if exists (select 1 from cron.job where jobname = 'alertas-diarias') then
    perform cron.unschedule('alertas-diarias');
  end if;
  perform cron.schedule('alertas-diarias', '0 7,8 * * *',
    $c$select public.alertas_lanzar('{"dry_run": false, "solo_hora_madrid": 9}'::jsonb)$c$);
end $do$;

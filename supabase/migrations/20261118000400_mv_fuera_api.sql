-- Aviso de seguridad 0016: las vistas materializadas no deben quedar expuestas en la Data API.
-- La web las lee con el rol del servidor (no vía PostgREST), así que se retiran a anon/authenticated.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke select on public.mv_empresas_totales, public.mv_organismos_totales from anon, authenticated;
    -- registro interno de migraciones: sin acceso desde la API (RLS sin políticas, intencionado)
    revoke all on public._migraciones from anon, authenticated;
  end if;
end $$;

-- Endurecimiento según los avisos de seguridad de Supabase.
-- La vista de aristas respeta los permisos de quien consulta (las tablas ya son de lectura pública).
alter view public.v_red_aristas set (security_invoker = true);

-- search_path fijo en las funciones.
alter function public.f_norm(text) set search_path = public, extensions;
alter function public.refrescar_derivados() set search_path = public, extensions;

-- Solo el ETL (rol postgres) puede recalcular derivados; evita que se invoque vía API pública.
revoke execute on function public.refrescar_derivados() from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke execute on function public.refrescar_derivados() from anon, authenticated;
  end if;
end $$;

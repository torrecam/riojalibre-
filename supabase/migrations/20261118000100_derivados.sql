-- Rioja Abierta · campos derivados y vistas agregadas

-- Recalcula texto de búsqueda e importe adjudicado. Lo invoca el ETL al terminar cada carga.
create or replace function public.refrescar_derivados() returns void
language plpgsql as $$
begin
  update public.licitaciones l set
    importe_adjudicado = a.total
  from (select licitacion_id, sum(importe) total from public.adjudicaciones group by licitacion_id) a
  where a.licitacion_id = l.id and l.importe_adjudicado is distinct from a.total;

  update public.licitaciones l set busqueda = x.b
  from (
    select l2.id, public.f_norm(concat_ws(' ', l2.objeto, l2.codigo_expediente, o.nombre,
             (select string_agg(a.nombre_origen || ' ' || coalesce(a.nif_origen,''), ' ') from public.adjudicaciones a where a.licitacion_id = l2.id))) b
    from public.licitaciones l2 left join public.organismos o on o.id = l2.organismo_id
  ) x
  where x.id = l.id and l.busqueda is distinct from x.b;

  update public.contratos_menores set busqueda = public.f_norm(concat_ws(' ', concepto, nombre_origen, nif_origen, departamento, cod_contrato))
  where busqueda is null or busqueda <> public.f_norm(concat_ws(' ', concepto, nombre_origen, nif_origen, departamento, cod_contrato));

  update public.subvenciones set busqueda = public.f_norm(concat_ws(' ', beneficiario_nombre, beneficiario_nif, convocatoria, nivel2, nivel3))
  where busqueda is null or busqueda <> public.f_norm(concat_ws(' ', beneficiario_nombre, beneficiario_nif, convocatoria, nivel2, nivel3));

  refresh materialized view public.mv_empresas_totales;
  refresh materialized view public.mv_organismos_totales;
end $$;

-- Totales por empresa (contratos + menores + subvenciones)
drop materialized view if exists public.mv_empresas_totales;
create materialized view public.mv_empresas_totales as
select e.id, e.clave, e.nombre, e.nif, e.tipo_id,
       coalesce(c.n, 0)::int  as contratos,
       coalesce(c.total, 0)   as importe_contratos,
       coalesce(m.n, 0)::int  as menores,
       coalesce(m.total, 0)   as importe_menores,
       coalesce(s.n, 0)::int  as subvenciones,
       coalesce(s.total, 0)   as importe_subvenciones
from public.empresas e
left join (select empresa_id, count(*) n, sum(importe) total from public.adjudicaciones where empresa_id is not null group by 1) c on c.empresa_id = e.id
left join (select empresa_id, count(*) n, sum(importe) total from public.contratos_menores where empresa_id is not null group by 1) m on m.empresa_id = e.id
left join (select empresa_id, count(*) n, sum(importe) total from public.subvenciones where empresa_id is not null group by 1) s on s.empresa_id = e.id;
create unique index on public.mv_empresas_totales (id);
create index on public.mv_empresas_totales (importe_contratos desc);

-- Totales por organismo
drop materialized view if exists public.mv_organismos_totales;
create materialized view public.mv_organismos_totales as
select o.id, o.nombre, o.ambito, o.ciudad,
       coalesce(l.n, 0)::int as licitaciones,
       coalesce(l.presupuesto, 0) as presupuesto,
       coalesce(a.n, 0)::int as adjudicaciones,
       coalesce(a.total, 0) as importe_adjudicado,
       coalesce(m.n, 0)::int as menores,
       coalesce(m.total, 0) as importe_menores
from public.organismos o
left join (select organismo_id, count(*) n, sum(presupuesto_base) presupuesto from public.licitaciones group by 1) l on l.organismo_id = o.id
left join (select l.organismo_id, count(*) n, sum(a.importe) total from public.adjudicaciones a join public.licitaciones l on l.id = a.licitacion_id group by 1) a on a.organismo_id = o.id
left join (select organismo_id, count(*) n, sum(importe) total from public.contratos_menores group by 1) m on m.organismo_id = o.id;
create unique index on public.mv_organismos_totales (id);

-- Aristas organismo–empresa para el grafo de red
create or replace view public.v_red_aristas as
select l.organismo_id, a.empresa_id, count(*)::int as contratos, sum(a.importe) as importe
from public.adjudicaciones a
join public.licitaciones l on l.id = a.licitacion_id
where a.empresa_id is not null and l.organismo_id is not null
group by 1, 2;

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on public.mv_empresas_totales, public.mv_organismos_totales, public.v_red_aristas to anon, authenticated;
  end if;
end $$;

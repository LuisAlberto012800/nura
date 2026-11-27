-- =====================================================================
-- Nura · 0004 · fotos de perfil, portada y Nura Insights
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pega TODO este archivo
-- > Run. Se corre una sola vez, después de 0003.
--
-- Qué agrega:
--   1. Foto de perfil de cada barbero (la sube él desde su cuenta).
--   2. Foto de portada de la barbería (la sube el encargado).
--   3. Hasta cuándo tiene pagado Nura Insights. Solo lo cambia el equipo
--      de Nura desde el Table Editor; la barbería no puede.
-- =====================================================================

alter table public.estilistas add column if not exists foto_url text;
alter table public.salones
  add column if not exists portada_url text,
  add column if not exists insights_hasta date;

-- El encargado puede cambiar la portada; insights_hasta queda fuera a propósito.
grant update (portada_url) on public.salones to authenticated;

-- El barbero cambia su propia foto. Solo se aceptan fotos subidas a la
-- carpeta de su barbería en Nura.
create or replace function public.actualizar_mi_foto(p_salon uuid, p_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_url is not null and position(('/storage/v1/object/public/trabajos/' || p_salon::text || '/') in p_url) = 0 then
    raise exception 'foto_invalida';
  end if;
  update public.estilistas set foto_url = p_url where salon_id = p_salon and usuario_id = auth.uid();
  if not found then raise exception 'sin_perfil'; end if;
end;
$$;

revoke execute on function public.actualizar_mi_foto(uuid, text) from public;
grant execute on function public.actualizar_mi_foto(uuid, text) to authenticated;

-- =====================================================================
-- Nura · 0003 · barberos con cuenta propia
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pega TODO este archivo
-- > Run. Se corre una sola vez, después de 0002.
--
-- Qué agrega:
--   1. El barbero manda una solicitud a su barbería y el encargado la acepta.
--      Así queda comprobado que trabaja ahí.
--   2. Permisos: el encargado (dueño) cambia precios, horarios y datos del
--      equipo. El barbero solo cambia su propio perfil.
-- =====================================================================

-- ---------- 1. Solicitudes para unirse a una barbería -----------------
create table if not exists public.solicitudes (
  id            uuid primary key default gen_random_uuid(),
  salon_id      uuid not null references public.salones (id) on delete cascade,
  usuario_id    uuid not null references auth.users (id) on delete cascade,
  nombre        text not null check (char_length(nombre) between 2 and 80),
  estado        text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada')),
  creado_en     timestamptz not null default now(),
  respondida_en timestamptz,
  unique (salon_id, usuario_id)
);
alter table public.solicitudes enable row level security;
revoke all on public.solicitudes from anon, authenticated;
grant select on public.solicitudes to authenticated;
create policy "solicitudes: la ve quien la mandó y el encargado" on public.solicitudes
  for select to authenticated using (usuario_id = auth.uid() or public.es_dueno(salon_id));

-- El barbero manda la solicitud con el código de la barbería (su enlace).
create or replace function public.solicitar_union(p_codigo text, p_nombre text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_salon public.salones%rowtype;
  v_nombre text := btrim(coalesce(p_nombre, ''));
begin
  if v_uid is null then raise exception 'sin_sesion'; end if;
  if char_length(v_nombre) < 2 or char_length(v_nombre) > 80 then raise exception 'nombre_invalido'; end if;
  select * into v_salon from public.salones where slug = lower(btrim(coalesce(p_codigo, '')));
  if not found then raise exception 'barberia_no_encontrada'; end if;
  if exists (select 1 from public.miembros where salon_id = v_salon.id and usuario_id = v_uid) then
    raise exception 'ya_eres_parte';
  end if;
  if (select count(*) from public.solicitudes where usuario_id = v_uid and estado = 'pendiente' and salon_id <> v_salon.id) >= 3 then
    raise exception 'demasiadas_solicitudes';
  end if;
  insert into public.solicitudes (salon_id, usuario_id, nombre)
  values (v_salon.id, v_uid, v_nombre)
  on conflict (salon_id, usuario_id) do update
    set estado = 'pendiente', nombre = excluded.nombre, creado_en = now(), respondida_en = null;
  return v_salon.nombre;
end;
$$;

-- Nombre de una barbería por su código, para la pantalla de invitación.
create or replace function public.barberia_por_codigo(p_codigo text)
returns text language sql stable security definer set search_path = public as $$
  select nombre from public.salones where slug = lower(btrim(coalesce(p_codigo, '')));
$$;

-- El encargado acepta (ligándolo a un perfil existente o creando uno) o rechaza.
create or replace function public.responder_solicitud(p_solicitud uuid, p_aceptar boolean, p_estilista uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v public.solicitudes%rowtype;
  v_estilista uuid;
begin
  select * into v from public.solicitudes where id = p_solicitud and estado = 'pendiente' for update;
  if not found then raise exception 'solicitud_no_encontrada'; end if;
  if not public.es_dueno(v.salon_id) then raise exception 'sin_permiso'; end if;

  if not p_aceptar then
    update public.solicitudes set estado = 'rechazada', respondida_en = now() where id = v.id;
    return null;
  end if;

  if p_estilista is not null then
    update public.estilistas set usuario_id = v.usuario_id, activo = true
    where id = p_estilista and salon_id = v.salon_id and usuario_id is null
    returning id into v_estilista;
    if v_estilista is null then raise exception 'perfil_ocupado'; end if;
  else
    insert into public.estilistas (salon_id, usuario_id, nombre)
    values (v.salon_id, v.usuario_id, v.nombre) returning id into v_estilista;
  end if;

  insert into public.miembros (salon_id, usuario_id, rol) values (v.salon_id, v.usuario_id, 'estilista')
  on conflict (salon_id, usuario_id) do nothing;
  update public.solicitudes set estado = 'aceptada', respondida_en = now() where id = v.id;
  return v_estilista;
end;
$$;

-- El encargado le quita el acceso a alguien que ya no trabaja ahí.
create or replace function public.quitar_acceso(p_estilista uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v public.estilistas%rowtype;
begin
  select * into v from public.estilistas where id = p_estilista;
  if not found or not public.es_dueno(v.salon_id) then raise exception 'sin_permiso'; end if;
  if v.usuario_id is null or v.usuario_id = auth.uid() then return; end if;
  delete from public.miembros where salon_id = v.salon_id and usuario_id = v.usuario_id and rol = 'estilista';
  update public.estilistas set usuario_id = null where id = v.id;
end;
$$;

-- El barbero se sale de la barbería. Su perfil queda inactivo, con su historial.
create or replace function public.salir_de_barberia(p_salon uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.miembros where salon_id = p_salon and usuario_id = auth.uid() and rol = 'estilista') then
    raise exception 'sin_permiso';
  end if;
  delete from public.miembros where salon_id = p_salon and usuario_id = auth.uid();
  update public.estilistas set usuario_id = null, activo = false where salon_id = p_salon and usuario_id = auth.uid();
end;
$$;

-- El barbero cambia su propio perfil: nombre, especialidades y años.
-- Su horario, su estado y los precios los cambia el encargado.
create or replace function public.actualizar_mi_perfil(p_salon uuid, p_nombre text, p_especialidades text[], p_anios int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_nombre text := btrim(coalesce(p_nombre, ''));
begin
  if char_length(v_nombre) < 2 or char_length(v_nombre) > 80 then raise exception 'nombre_invalido'; end if;
  if p_anios is not null and (p_anios < 0 or p_anios > 70) then raise exception 'anios_invalidos'; end if;
  update public.estilistas
    set nombre = v_nombre,
        especialidades = coalesce(p_especialidades[1:6], '{}'),
        anios_oficio = p_anios
  where salon_id = p_salon and usuario_id = auth.uid();
  if not found then raise exception 'sin_perfil'; end if;
end;
$$;

revoke execute on function public.solicitar_union(text, text) from public;
revoke execute on function public.barberia_por_codigo(text) from public;
revoke execute on function public.responder_solicitud(uuid, boolean, uuid) from public;
revoke execute on function public.quitar_acceso(uuid) from public;
revoke execute on function public.salir_de_barberia(uuid) from public;
revoke execute on function public.actualizar_mi_perfil(uuid, text, text[], int) from public;
grant execute on function public.solicitar_union(text, text) to authenticated;
grant execute on function public.barberia_por_codigo(text) to anon, authenticated;
grant execute on function public.responder_solicitud(uuid, boolean, uuid) to authenticated;
grant execute on function public.quitar_acceso(uuid) to authenticated;
grant execute on function public.salir_de_barberia(uuid) to authenticated;
grant execute on function public.actualizar_mi_perfil(uuid, text, text[], int) to authenticated;

-- ---------- 2. Permisos: qué cambia el encargado y qué el barbero ------
-- Servicios (precios), horarios y equipo: todos los ven, solo el encargado los cambia.
drop policy if exists "servicios: miembros" on public.servicios;
create policy "servicios: el equipo los ve" on public.servicios
  for select to authenticated using (public.es_miembro(salon_id));
create policy "servicios: el encargado los cambia" on public.servicios
  for all to authenticated using (public.es_dueno(salon_id)) with check (public.es_dueno(salon_id));

drop policy if exists "horarios: miembros" on public.horarios;
create policy "horarios: el equipo los ve" on public.horarios
  for select to authenticated using (public.es_miembro(salon_id));
create policy "horarios: el encargado los cambia" on public.horarios
  for all to authenticated using (public.es_dueno(salon_id)) with check (public.es_dueno(salon_id));

drop policy if exists "estilistas: miembros" on public.estilistas;
create policy "estilistas: el equipo los ve" on public.estilistas
  for select to authenticated using (public.es_miembro(salon_id));
create policy "estilistas: el encargado los cambia" on public.estilistas
  for all to authenticated using (public.es_dueno(salon_id)) with check (public.es_dueno(salon_id));

-- Bloqueos: el encargado bloquea a cualquiera; el barbero solo su propio tiempo.
drop policy if exists "bloqueos: miembros" on public.bloqueos;
create policy "bloqueos: el equipo los ve" on public.bloqueos
  for select to authenticated using (public.es_miembro(salon_id));
create policy "bloqueos: encargado o el propio barbero" on public.bloqueos
  for all to authenticated
  using (public.es_dueno(salon_id) or exists (
    select 1 from public.estilistas e where e.id = estilista_id and e.salon_id = bloqueos.salon_id and e.usuario_id = auth.uid()))
  with check (public.es_dueno(salon_id) or exists (
    select 1 from public.estilistas e where e.id = estilista_id and e.salon_id = bloqueos.salon_id and e.usuario_id = auth.uid()));

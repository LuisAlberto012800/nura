-- =====================================================================
-- Nura · 0002 · clientes, trabajos con confirmación, reservas públicas
--
-- Cómo usarlo: Supabase > tu proyecto > SQL Editor > New query > pega TODO
-- este archivo > Run. Se corre una sola vez, después de 0001.
--
-- Qué agrega:
--   1. Tipo de cabello en la ficha de cada cliente.
--   2. Trabajos ligados a su servicio y a su clienta, con enlace para que
--      ella lo confirme (eso le da su medalla al trabajo).
--   3. Reservas desde la página pública, sin cuenta, respetando horarios.
--   4. Verificación de la barbería que solo puede marcar el equipo de Nura.
-- =====================================================================

-- ---------- 1. Clientes ----------------------------------------------
alter table public.clientes add column if not exists tipo_cabello public.tipo_cabello;

-- ---------- 4. Verificación de la barbería ---------------------------
-- La marca el equipo de Nura desde el Table Editor; la barbería no puede.
alter table public.salones
  add column if not exists local_verificado_en timestamptz,
  add column if not exists identidad_verificada_en timestamptz;

revoke insert, update on public.salones from anon, authenticated;
grant insert (nombre, slug, colonia, direccion, whatsapp, descripcion) on public.salones to authenticated;
grant update (nombre, slug, colonia, direccion, whatsapp, descripcion, abierto_hoy, publicado) on public.salones to authenticated;

-- ---------- 2. Trabajos ----------------------------------------------
alter table public.trabajos
  add column if not exists servicio_id     uuid,
  add column if not exists cliente_id      uuid,
  add column if not exists muestra_cara    boolean not null default false,
  add column if not exists confirmacion    text not null default 'pendiente'
    check (confirmacion in ('pendiente', 'con_nombre', 'sin_nombre', 'rechazado')),
  add column if not exists nombre_publico  text,
  add column if not exists medalla_cliente smallint check (medalla_cliente between 1 and 4),
  add column if not exists confirmado_en   timestamptz;

alter table public.trabajos
  add constraint trabajos_salon_id_unico unique (salon_id, id),
  add constraint trabajos_servicio_fk foreign key (salon_id, servicio_id)
    references public.servicios (salon_id, id) on delete set null (servicio_id),
  add constraint trabajos_cliente_fk foreign key (salon_id, cliente_id)
    references public.clientes (salon_id, id) on delete set null (cliente_id),
  -- Si se ve la cara, no se publica sin el sí de la clienta.
  add constraint trabajo_cara_confirmada check (
    not publicado or not muestra_cara or confirmacion in ('con_nombre', 'sin_nombre')
  ),
  -- Si la clienta dijo que no, nunca se publica.
  add constraint trabajo_rechazado_no_se_publica check (not (publicado and confirmacion = 'rechazado'));

-- La confirmación y la medalla solo las escribe la clienta, desde su enlace.
revoke insert, update on public.trabajos from anon, authenticated;
grant insert (salon_id, estilista_id, cita_id, servicio_id, cliente_id, titulo, foto_despues, foto_antes,
              tipo_cabello, categoria, duracion_min, colonia, publicado, muestra_cara)
  on public.trabajos to authenticated;
grant update (estilista_id, cita_id, servicio_id, cliente_id, titulo, foto_despues, foto_antes,
              tipo_cabello, categoria, duracion_min, colonia, publicado, muestra_cara)
  on public.trabajos to authenticated;

-- Enlace secreto de confirmación. Tabla aparte para que nunca sea público.
create table if not exists public.confirmaciones (
  trabajo_id uuid primary key,
  salon_id   uuid not null references public.salones (id) on delete cascade,
  token      uuid not null unique default gen_random_uuid(),
  creado_en  timestamptz not null default now(),
  foreign key (salon_id, trabajo_id) references public.trabajos (salon_id, id) on delete cascade
);
alter table public.confirmaciones enable row level security;
revoke all on public.confirmaciones from anon, authenticated;
grant select on public.confirmaciones to authenticated;
create policy "confirmaciones: miembros" on public.confirmaciones
  for select to authenticated using (public.es_miembro(salon_id));

create or replace function public.crear_confirmacion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.confirmaciones (trabajo_id, salon_id) values (new.id, new.salon_id)
  on conflict (trabajo_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trabajos_crear_confirmacion on public.trabajos;
create trigger trabajos_crear_confirmacion
  after insert on public.trabajos
  for each row execute function public.crear_confirmacion();

-- Lo que ve la clienta al abrir su enlace (sin datos de nadie más).
create or replace function public.trabajo_por_token(p_token uuid)
returns table (
  foto_despues text, foto_antes text, categoria public.categoria_servicio, servicio text,
  salon text, slug text, estilista text, cliente text, confirmacion text
)
language sql stable security definer set search_path = public as $$
  select t.foto_despues, t.foto_antes, t.categoria, sv.nombre, s.nombre, s.slug, e.nombre,
         split_part(cl.nombre, ' ', 1), t.confirmacion
  from public.confirmaciones c
  join public.trabajos t on t.id = c.trabajo_id
  join public.salones s on s.id = t.salon_id
  left join public.servicios sv on sv.id = t.servicio_id
  left join public.estilistas e on e.id = t.estilista_id
  left join public.clientes cl on cl.id = t.cliente_id
  where c.token = p_token;
$$;

-- La clienta responde una sola vez: con su nombre, sin su nombre o "no soy yo".
create or replace function public.responder_trabajo(p_token uuid, p_respuesta text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v public.trabajos%rowtype;
  v_completadas int := 0;
  v_meses int := 0;
  v_primera timestamptz;
  v_medalla smallint := 1;
begin
  if p_respuesta not in ('con_nombre', 'sin_nombre', 'rechazado') then
    raise exception 'respuesta_invalida';
  end if;

  select t.* into v from public.trabajos t
  join public.confirmaciones c on c.trabajo_id = t.id
  where c.token = p_token
  for update of t;
  if not found then raise exception 'enlace_invalido'; end if;
  if v.confirmacion <> 'pendiente' then return v.confirmacion; end if;

  if p_respuesta = 'rechazado' then
    update public.trabajos set confirmacion = 'rechazado', publicado = false, confirmado_en = now() where id = v.id;
    return 'rechazado';
  end if;

  -- Medalla de la clienta: bronce por responder desde su enlace; sube con
  -- citas completadas en Nura. Sin cita en Nura se queda en bronce.
  if v.cliente_id is not null and v.cita_id is not null then
    select count(*), count(distinct date_trunc('month', inicio at time zone 'America/Mexico_City')), min(inicio)
      into v_completadas, v_meses, v_primera
    from public.citas
    where salon_id = v.salon_id and cliente_id = v.cliente_id and estado = 'completada';
    if v_completadas >= 1 then v_medalla := 2; end if;
    if v_completadas >= 3 and v_meses >= 2 then v_medalla := 3; end if;
    if v_completadas >= 10 and v_primera <= now() - interval '6 months' then v_medalla := 4; end if;
  end if;

  update public.trabajos set
    confirmacion    = p_respuesta,
    medalla_cliente = v_medalla,
    confirmado_en   = now(),
    nombre_publico  = case when p_respuesta = 'con_nombre'
                        then (select split_part(nombre, ' ', 1) from public.clientes where id = v.cliente_id) end,
    -- Si se veía la cara, ya con el sí se publica (si tiene sus datos completos).
    publicado = case
      when v.muestra_cara and v.foto_despues is not null and v.tipo_cabello is not null
           and v.categoria is not null and v.duracion_min is not null and v.colonia is not null then true
      else v.publicado end
  where id = v.id;
  return p_respuesta;
end;
$$;

-- ---------- 3. Reservas desde la página pública ----------------------
-- Horas ocupadas de un salón publicado: solo cuándo, nunca de quién.
create or replace function public.ocupado_publico(p_salon uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (estilista_id uuid, inicio timestamptz, fin timestamptz)
language sql stable security definer set search_path = public as $$
  select c.estilista_id, c.inicio, c.fin
  from public.citas c join public.salones s on s.id = c.salon_id
  where s.id = p_salon and s.publicado and p_hasta - p_desde <= interval '62 days'
    and c.estado in ('por_confirmar', 'confirmada') and c.inicio < p_hasta and c.fin > p_desde
  union all
  select b.estilista_id, b.inicio, b.fin
  from public.bloqueos b join public.salones s on s.id = b.salon_id
  where s.id = p_salon and s.publicado and p_hasta - p_desde <= interval '62 days'
    and b.inicio < p_hasta and b.fin > p_desde;
$$;

-- Reserva sin cuenta. Valida todo aquí: la página pública no es de fiar.
create or replace function public.reservar(
  p_salon uuid, p_estilista uuid, p_servicio uuid, p_inicio timestamptz, p_nombre text, p_telefono text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_duracion int;
  v_precio int;
  v_fin timestamptz;
  v_local timestamp;
  v_cliente uuid;
  v_pendientes int;
  v_cita uuid;
  v_nombre text := btrim(coalesce(p_nombre, ''));
begin
  if not exists (select 1 from public.salones where id = p_salon and publicado) then
    raise exception 'salon_no_disponible';
  end if;
  if not exists (select 1 from public.estilistas where id = p_estilista and salon_id = p_salon and activo) then
    raise exception 'estilista_no_disponible';
  end if;
  select duracion_min, precio into v_duracion, v_precio
  from public.servicios where id = p_servicio and salon_id = p_salon and activo;
  if v_duracion is null then raise exception 'servicio_no_disponible'; end if;
  if char_length(v_nombre) < 2 or char_length(v_nombre) > 80 then raise exception 'nombre_invalido'; end if;
  if coalesce(p_telefono, '') !~ '^[0-9]{10}$' then raise exception 'telefono_invalido'; end if;
  if p_inicio < now() + interval '30 minutes' or p_inicio > now() + interval '60 days' then
    raise exception 'fecha_invalida';
  end if;

  v_fin := p_inicio + make_interval(mins => v_duracion);
  v_local := p_inicio at time zone 'America/Mexico_City';
  if not exists (
    select 1 from public.horarios h
    where h.salon_id = p_salon and h.estilista_id = p_estilista
      and h.dia = extract(dow from v_local)::int
      and v_local::time >= h.inicio
      and (v_local + make_interval(mins => v_duracion))::time <= h.fin
      and (v_local + make_interval(mins => v_duracion))::date = v_local::date
  ) then
    raise exception 'fuera_de_horario';
  end if;
  if exists (
    select 1 from public.bloqueos
    where salon_id = p_salon and estilista_id = p_estilista and inicio < v_fin and fin > p_inicio
  ) then
    raise exception 'horario_ocupado';
  end if;

  select id into v_cliente from public.clientes where salon_id = p_salon and telefono = p_telefono;
  if v_cliente is null then
    insert into public.clientes (salon_id, nombre, telefono, origen)
    values (p_salon, v_nombre, p_telefono, 'reserva') returning id into v_cliente;
  end if;

  -- Freno a reservas falsas: máximo 2 reservas por confirmar por teléfono.
  select count(*) into v_pendientes from public.citas
  where salon_id = p_salon and cliente_id = v_cliente and estado = 'por_confirmar' and inicio > now();
  if v_pendientes >= 2 then raise exception 'demasiadas_reservas'; end if;

  begin
    insert into public.citas (salon_id, estilista_id, cliente_id, servicio_id, inicio, fin, estado, precio)
    values (p_salon, p_estilista, v_cliente, p_servicio, p_inicio, v_fin, 'por_confirmar', v_precio)
    returning id into v_cita;
  exception when exclusion_violation then
    raise exception 'horario_ocupado';
  end;
  return v_cita;
end;
$$;

revoke execute on function public.reservar(uuid, uuid, uuid, timestamptz, text, text) from public;
revoke execute on function public.ocupado_publico(uuid, timestamptz, timestamptz) from public;
revoke execute on function public.trabajo_por_token(uuid) from public;
revoke execute on function public.responder_trabajo(uuid, text) from public;
grant execute on function public.reservar(uuid, uuid, uuid, timestamptz, text, text) to anon, authenticated;
grant execute on function public.ocupado_publico(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.trabajo_por_token(uuid) to anon, authenticated;
grant execute on function public.responder_trabajo(uuid, text) to anon, authenticated;

-- Para los trabajos que ya existían antes de esta versión.
insert into public.confirmaciones (trabajo_id, salon_id)
select id, salon_id from public.trabajos
on conflict (trabajo_id) do nothing;

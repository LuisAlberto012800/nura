-- =====================================================================
-- Nura · 0007 · cuponera
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pega TODO este archivo
-- > Run. Se corre una sola vez, después de 0006.
--
-- El encargado crea cupones para un servicio o para todos: descuento en
-- porcentaje o en pesos, con fecha de vencimiento y número de usos opcionales.
-- La clienta lo escribe al reservar y la cita guarda el precio con descuento.
-- =====================================================================

create table if not exists public.cupones (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salones (id) on delete cascade,
  codigo      text not null check (codigo ~ '^[A-Z0-9]{3,20}$'),
  servicio_id uuid,
  tipo        text not null check (tipo in ('porcentaje', 'monto')),
  valor       int not null check (valor > 0),
  vence       date,
  usos_max    int check (usos_max > 0),
  usos        int not null default 0,
  publico     boolean not null default true,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now(),
  unique (salon_id, codigo),
  unique (salon_id, id),
  check (tipo <> 'porcentaje' or valor <= 100),
  foreign key (salon_id, servicio_id) references public.servicios (salon_id, id) on delete cascade
);
alter table public.cupones enable row level security;
revoke all on public.cupones from anon, authenticated;
grant select on public.cupones to anon, authenticated;
grant insert, update, delete on public.cupones to authenticated;

create policy "cupones: el equipo los ve" on public.cupones
  for select to authenticated using (public.es_miembro(salon_id));
create policy "cupones: el encargado los maneja" on public.cupones
  for all to authenticated using (public.es_dueno(salon_id)) with check (public.es_dueno(salon_id));
-- Los cupones marcados como públicos se ven en la página de la barbería.
create policy "cupones: públicos y vigentes" on public.cupones
  for select to anon, authenticated using (
    publico and activo
    and (vence is null or vence >= (now() at time zone 'America/Mexico_City')::date)
    and (usos_max is null or usos < usos_max)
    and exists (select 1 from public.salones s where s.id = salon_id and s.publicado)
  );

alter table public.citas
  add column if not exists cupon_id  uuid references public.cupones (id) on delete set null,
  add column if not exists descuento int not null default 0 check (descuento >= 0);

-- ¿Sirve este cupón para este servicio? Devuelve el descuento exacto en pesos.
create or replace function public.calcular_cupon(p_salon uuid, p_servicio uuid, p_codigo text)
returns table (id uuid, codigo text, descuento int, precio int, precio_final int)
language sql stable security definer set search_path = public as $$
  select c.id, c.codigo,
         least(sv.precio, case when c.tipo = 'porcentaje' then round(sv.precio * c.valor / 100.0)::int else c.valor end),
         sv.precio,
         sv.precio - least(sv.precio, case when c.tipo = 'porcentaje' then round(sv.precio * c.valor / 100.0)::int else c.valor end)
  from public.cupones c
  join public.servicios sv on sv.id = p_servicio and sv.salon_id = p_salon and sv.activo
  where c.salon_id = p_salon
    and c.codigo = upper(btrim(coalesce(p_codigo, '')))
    and c.activo
    and (c.servicio_id is null or c.servicio_id = p_servicio)
    and (c.vence is null or c.vence >= (now() at time zone 'America/Mexico_City')::date)
    and (c.usos_max is null or c.usos < c.usos_max);
$$;

-- La reserva ahora acepta un cupón (opcional). Se reemplaza la versión de 0002.
drop function if exists public.reservar(uuid, uuid, uuid, timestamptz, text, text);
create or replace function public.reservar(
  p_salon uuid, p_estilista uuid, p_servicio uuid, p_inicio timestamptz, p_nombre text, p_telefono text,
  p_cupon text default null
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
  v_cupon uuid;
  v_descuento int := 0;
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

  -- Cupón: se revisa aquí y se descuenta del precio exacto.
  if nullif(btrim(coalesce(p_cupon, '')), '') is not null then
    select c.id, c.descuento into v_cupon, v_descuento from public.calcular_cupon(p_salon, p_servicio, p_cupon) c;
    if v_cupon is null then raise exception 'cupon_invalido'; end if;
    update public.cupones set usos = usos + 1 where id = v_cupon;
  end if;

  begin
    insert into public.citas (salon_id, estilista_id, cliente_id, servicio_id, inicio, fin, estado, precio, cupon_id, descuento)
    values (p_salon, p_estilista, v_cliente, p_servicio, p_inicio, v_fin, 'por_confirmar', v_precio - v_descuento, v_cupon, v_descuento)
    returning id into v_cita;
  exception when exclusion_violation then
    raise exception 'horario_ocupado';
  end;
  return v_cita;
end;
$$;


revoke execute on function public.calcular_cupon(uuid, uuid, text) from public;
revoke execute on function public.reservar(uuid, uuid, uuid, timestamptz, text, text, text) from public;
grant execute on function public.calcular_cupon(uuid, uuid, text) to anon, authenticated;
grant execute on function public.reservar(uuid, uuid, uuid, timestamptz, text, text, text) to anon, authenticated;

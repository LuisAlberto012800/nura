-- =====================================================================
-- Nura · base de datos inicial
--
-- Cómo usarlo (paso 4 del deploy):
--   Supabase > tu proyecto > SQL Editor > New query > pega TODO este
--   archivo > Run. Solo se corre una vez, en un proyecto nuevo.
--
-- Reglas que este archivo garantiza:
--   1. Cada barbería ve y cambia únicamente sus propios datos.
--   2. Un estilista no puede tener dos citas empalmadas.
--   3. Un trabajo no se publica sin sus cuatro datos obligatorios.
--   4. Precios exactos en pesos enteros, nunca "desde".
-- =====================================================================

create extension if not exists btree_gist;

-- ---------- Catálogos ------------------------------------------------
create type public.rol_miembro       as enum ('dueno', 'estilista');
create type public.categoria_servicio as enum ('corte', 'barba', 'color', 'tratamiento');
create type public.tipo_cabello      as enum ('lacio', 'ondulado', 'rizado', 'afro');
create type public.estado_cita       as enum ('por_confirmar', 'confirmada', 'completada', 'cancelada', 'no_asistio');
create type public.origen_cliente    as enum ('manual', 'archivo', 'contactos', 'reserva');

-- ---------- Salones (barberías y estéticas) --------------------------
create table public.salones (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (char_length(nombre) between 2 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  colonia     text not null check (char_length(colonia) between 2 and 80),
  direccion   text,
  whatsapp    text check (whatsapp ~ '^[0-9]{10}$'),
  descripcion text,
  abierto_hoy boolean not null default true,
  publicado   boolean not null default false,
  creado_por  uuid not null default auth.uid() references auth.users (id),
  creado_en   timestamptz not null default now()
);

-- Quién pertenece a cada salón y con qué rol
create table public.miembros (
  salon_id   uuid not null references public.salones (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  rol        public.rol_miembro not null default 'estilista',
  creado_en  timestamptz not null default now(),
  primary key (salon_id, usuario_id)
);
create index miembros_usuario_idx on public.miembros (usuario_id);

-- ---------- Equipo, servicios y horarios -----------------------------
create table public.estilistas (
  id             uuid primary key default gen_random_uuid(),
  salon_id       uuid not null references public.salones (id) on delete cascade,
  usuario_id     uuid references auth.users (id) on delete set null,
  nombre         text not null check (char_length(nombre) between 2 and 80),
  especialidades text[] not null default '{}',
  anios_oficio   int check (anios_oficio between 0 and 70),
  foto           text,
  activo         boolean not null default true,
  creado_en      timestamptz not null default now(),
  unique (salon_id, id)
);

create table public.servicios (
  id           uuid primary key default gen_random_uuid(),
  salon_id     uuid not null references public.salones (id) on delete cascade,
  nombre       text not null check (char_length(nombre) between 2 and 80),
  categoria    public.categoria_servicio not null,
  duracion_min int not null check (duracion_min between 10 and 600),
  precio       int not null check (precio > 0),  -- pesos enteros, precio exacto
  activo       boolean not null default true,
  orden        int not null default 0,
  creado_en    timestamptz not null default now(),
  unique (salon_id, id)
);

create table public.horarios (
  id           uuid primary key default gen_random_uuid(),
  salon_id     uuid not null references public.salones (id) on delete cascade,
  estilista_id uuid not null,
  dia          smallint not null check (dia between 0 and 6),  -- 0 = domingo
  inicio       time not null,
  fin          time not null,
  check (fin > inicio),
  foreign key (salon_id, estilista_id) references public.estilistas (salon_id, id) on delete cascade
);

create table public.bloqueos (
  id           uuid primary key default gen_random_uuid(),
  salon_id     uuid not null references public.salones (id) on delete cascade,
  estilista_id uuid not null,
  inicio       timestamptz not null,
  fin          timestamptz not null,
  motivo       text,
  check (fin > inicio),
  foreign key (salon_id, estilista_id) references public.estilistas (salon_id, id) on delete cascade
);

-- ---------- Clientes y citas -----------------------------------------
create table public.clientes (
  id            uuid primary key default gen_random_uuid(),
  salon_id      uuid not null references public.salones (id) on delete cascade,
  nombre        text not null check (char_length(nombre) between 1 and 120),
  telefono      text check (telefono ~ '^[0-9]{10}$'),
  correo        text,
  notas         text,
  ultima_visita date,
  origen        public.origen_cliente not null default 'manual',
  creado_en     timestamptz not null default now(),
  unique (salon_id, telefono),
  unique (salon_id, id)
);

create table public.citas (
  id           uuid primary key default gen_random_uuid(),
  salon_id     uuid not null references public.salones (id) on delete cascade,
  estilista_id uuid not null,
  cliente_id   uuid,
  servicio_id  uuid,
  inicio       timestamptz not null,
  fin          timestamptz not null,
  estado       public.estado_cita not null default 'confirmada',
  precio       int check (precio >= 0),
  notas        text,
  creado_en    timestamptz not null default now(),
  check (fin > inicio),
  unique (salon_id, id),
  foreign key (salon_id, estilista_id) references public.estilistas (salon_id, id) on delete cascade,
  foreign key (salon_id, cliente_id)   references public.clientes (salon_id, id) on delete set null (cliente_id),
  foreign key (salon_id, servicio_id)  references public.servicios (salon_id, id) on delete set null (servicio_id),
  -- Regla 2: sin empalmes para el mismo estilista (solo cuentan las citas vivas)
  constraint citas_sin_empalmes exclude using gist (
    estilista_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado in ('por_confirmar', 'confirmada'))
);
create index citas_salon_inicio_idx on public.citas (salon_id, inicio);

-- ---------- Trabajos (portafolio) ------------------------------------
create table public.trabajos (
  id           uuid primary key default gen_random_uuid(),
  salon_id     uuid not null references public.salones (id) on delete cascade,
  estilista_id uuid,
  cita_id      uuid,
  titulo       text,
  foto_despues text,
  foto_antes   text,
  tipo_cabello public.tipo_cabello,
  categoria    public.categoria_servicio,
  duracion_min int check (duracion_min between 10 and 600),
  colonia      text,
  publicado    boolean not null default false,
  creado_en    timestamptz not null default now(),
  foreign key (salon_id, estilista_id) references public.estilistas (salon_id, id) on delete set null (estilista_id),
  foreign key (salon_id, cita_id)      references public.citas (salon_id, id) on delete set null (cita_id),
  -- Regla 3: no se publica sin los cuatro datos y la foto de después
  constraint trabajo_completo_para_publicar check (
    not publicado or (
      foto_despues is not null and tipo_cabello is not null and categoria is not null
      and duracion_min is not null and colonia is not null
    )
  )
);
create index trabajos_salon_idx on public.trabajos (salon_id);

-- ---------- Funciones de apoyo ---------------------------------------
create or replace function public.es_miembro(p_salon uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.miembros where salon_id = p_salon and usuario_id = auth.uid()
  );
$$;

create or replace function public.es_dueno(p_salon uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.miembros
    where salon_id = p_salon and usuario_id = auth.uid() and rol = 'dueno'
  );
$$;

-- Quien crea un salón queda como su dueño
create or replace function public.agregar_dueno()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.miembros (salon_id, usuario_id, rol) values (new.id, new.creado_por, 'dueno');
  return new;
end;
$$;

create trigger salones_agregar_dueno
  after insert on public.salones
  for each row execute function public.agregar_dueno();

-- ---------- Regla 1: seguridad por salón -----------------------------
alter table public.salones    enable row level security;
alter table public.miembros   enable row level security;
alter table public.estilistas enable row level security;
alter table public.servicios  enable row level security;
alter table public.horarios   enable row level security;
alter table public.bloqueos   enable row level security;
alter table public.clientes   enable row level security;
alter table public.citas      enable row level security;
alter table public.trabajos   enable row level security;

-- Salones
create policy "salón: lo ven sus miembros" on public.salones
  for select to authenticated using (public.es_miembro(id) or creado_por = auth.uid());
create policy "salón: el público ve los publicados" on public.salones
  for select to anon, authenticated using (publicado);
create policy "salón: cualquiera con cuenta crea el suyo" on public.salones
  for insert to authenticated with check (creado_por = auth.uid());
create policy "salón: el dueño lo edita" on public.salones
  for update to authenticated using (public.es_dueno(id)) with check (public.es_dueno(id));
create policy "salón: el dueño lo borra" on public.salones
  for delete to authenticated using (public.es_dueno(id));

-- Miembros
create policy "miembros: se ven dentro del salón" on public.miembros
  for select to authenticated using (usuario_id = auth.uid() or public.es_miembro(salon_id));
create policy "miembros: el dueño agrega" on public.miembros
  for insert to authenticated with check (public.es_dueno(salon_id));
create policy "miembros: el dueño quita" on public.miembros
  for delete to authenticated using (public.es_dueno(salon_id));

-- Datos del salón: solo sus miembros los leen y los cambian
create policy "estilistas: miembros" on public.estilistas
  for all to authenticated using (public.es_miembro(salon_id)) with check (public.es_miembro(salon_id));
create policy "servicios: miembros" on public.servicios
  for all to authenticated using (public.es_miembro(salon_id)) with check (public.es_miembro(salon_id));
create policy "horarios: miembros" on public.horarios
  for all to authenticated using (public.es_miembro(salon_id)) with check (public.es_miembro(salon_id));
create policy "bloqueos: miembros" on public.bloqueos
  for all to authenticated using (public.es_miembro(salon_id)) with check (public.es_miembro(salon_id));
create policy "clientes: miembros" on public.clientes
  for all to authenticated using (public.es_miembro(salon_id)) with check (public.es_miembro(salon_id));
create policy "citas: miembros" on public.citas
  for all to authenticated using (public.es_miembro(salon_id)) with check (public.es_miembro(salon_id));
create policy "trabajos: miembros" on public.trabajos
  for all to authenticated using (public.es_miembro(salon_id)) with check (public.es_miembro(salon_id));

-- Lo que ve el público en la página de un salón publicado.
-- Clientes, citas y bloqueos nunca son públicos.
create policy "estilistas: público" on public.estilistas
  for select to anon, authenticated
  using (activo and exists (select 1 from public.salones s where s.id = salon_id and s.publicado));
create policy "servicios: público" on public.servicios
  for select to anon, authenticated
  using (activo and exists (select 1 from public.salones s where s.id = salon_id and s.publicado));
create policy "horarios: público" on public.horarios
  for select to anon, authenticated
  using (exists (select 1 from public.salones s where s.id = salon_id and s.publicado));
create policy "trabajos: público" on public.trabajos
  for select to anon, authenticated
  using (publicado and exists (select 1 from public.salones s where s.id = salon_id and s.publicado));

-- ---------- Fotos ----------------------------------------------------
-- Carpeta por salón: trabajos/<id del salón>/<archivo>. Lectura pública,
-- escritura solo de los miembros de ese salón.
insert into storage.buckets (id, name, public)
values ('trabajos', 'trabajos', true)
on conflict (id) do nothing;

create policy "fotos: los miembros suben a su salón" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trabajos'
    and (storage.foldername(name))[1] in (
      select salon_id::text from public.miembros where usuario_id = auth.uid()
    )
  );
create policy "fotos: los miembros cambian las de su salón" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'trabajos'
    and (storage.foldername(name))[1] in (
      select salon_id::text from public.miembros where usuario_id = auth.uid()
    )
  );
create policy "fotos: los miembros borran las de su salón" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'trabajos'
    and (storage.foldername(name))[1] in (
      select salon_id::text from public.miembros where usuario_id = auth.uid()
    )
  );

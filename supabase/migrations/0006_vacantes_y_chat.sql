-- =====================================================================
-- Nura · 0006 · vacantes de trabajo y chat en vivo (complementos pagados)
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pega TODO este archivo
-- > Run. Se corre una sola vez, después de 0005.
--
-- Qué agrega:
--   1. Vacantes: la barbería con el complemento publica vacantes; solo los
--      barberos las ven y se postulan. La barbería ve a quién le interesa.
--   2. Chat en vivo entre clienta y barbería, abierto solo en el horario de
--      chat que la barbería elige y solo con el complemento pagado.
--   Las fechas vacantes_hasta y chat_hasta solo las cambia el equipo de Nura.
-- =====================================================================

alter table public.salones
  add column if not exists vacantes_hasta date,
  add column if not exists chat_hasta     date,
  add column if not exists chat_inicio    time not null default '10:00',
  add column if not exists chat_fin       time not null default '19:00',
  add column if not exists chat_dias      smallint[] not null default '{1,2,3,4,5,6}';

-- El encargado elige el horario del chat; las fechas de pago quedan fuera.
grant update (chat_inicio, chat_fin, chat_dias) on public.salones to authenticated;

-- ¿Quien pregunta es barbero? (cuenta de profesional o ya es parte de un equipo)
create or replace function public.es_profesional()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'rol', '') = 'profesional'
      or exists (select 1 from public.miembros where usuario_id = auth.uid());
$$;

create or replace function public.vacantes_activas(p_salon uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.salones where id = p_salon
                 and vacantes_hasta >= (now() at time zone 'America/Mexico_City')::date);
$$;

-- ¿El chat de esa barbería está abierto ahora mismo?
create or replace function public.chat_abierto(p_salon uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.salones s
    where s.id = p_salon and s.publicado
      and s.chat_hasta >= (now() at time zone 'America/Mexico_City')::date
      and extract(dow from now() at time zone 'America/Mexico_City')::smallint = any (s.chat_dias)
      and (now() at time zone 'America/Mexico_City')::time between s.chat_inicio and s.chat_fin
  );
$$;

-- ---------- 1. Vacantes ----------------------------------------------
create table if not exists public.vacantes (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salones (id) on delete cascade,
  titulo      text not null check (char_length(titulo) between 3 and 80),
  tipo        text not null default 'tiempo_completo'
              check (tipo in ('tiempo_completo', 'medio_tiempo', 'renta_silla', 'comision')),
  pago        text check (char_length(pago) <= 80),
  descripcion text check (char_length(descripcion) <= 1000),
  abierta     boolean not null default true,
  creado_en   timestamptz not null default now(),
  unique (salon_id, id)
);
alter table public.vacantes enable row level security;
revoke all on public.vacantes from anon, authenticated;
grant select, insert, update, delete on public.vacantes to authenticated;

create policy "vacantes: el equipo ve las suyas" on public.vacantes
  for select to authenticated using (public.es_miembro(salon_id));
create policy "vacantes: los barberos ven las abiertas" on public.vacantes
  for select to authenticated using (abierta and public.es_profesional() and public.vacantes_activas(salon_id));
create policy "vacantes: el encargado publica con el complemento" on public.vacantes
  for insert to authenticated with check (public.es_dueno(salon_id) and public.vacantes_activas(salon_id));
create policy "vacantes: el encargado las cambia" on public.vacantes
  for update to authenticated using (public.es_dueno(salon_id)) with check (public.es_dueno(salon_id));
create policy "vacantes: el encargado las borra" on public.vacantes
  for delete to authenticated using (public.es_dueno(salon_id));

create table if not exists public.postulaciones (
  id             uuid primary key default gen_random_uuid(),
  salon_id       uuid not null references public.salones (id) on delete cascade,
  vacante_id     uuid not null,
  usuario_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre         text not null check (char_length(nombre) between 2 and 80),
  telefono       text not null check (telefono ~ '^[0-9]{10}$'),
  anios_oficio   int check (anios_oficio between 0 and 70),
  especialidades text check (char_length(especialidades) <= 200),
  mensaje        text check (char_length(mensaje) <= 600),
  estado         text not null default 'nueva' check (estado in ('nueva', 'vista', 'contactada', 'descartada')),
  creado_en      timestamptz not null default now(),
  unique (vacante_id, usuario_id),
  foreign key (salon_id, vacante_id) references public.vacantes (salon_id, id) on delete cascade
);
alter table public.postulaciones enable row level security;
revoke all on public.postulaciones from anon, authenticated;
grant select, insert on public.postulaciones to authenticated;
grant update (estado) on public.postulaciones to authenticated;

create policy "postulaciones: la ve quien se postuló y el encargado" on public.postulaciones
  for select to authenticated using (usuario_id = auth.uid() or public.es_dueno(salon_id));
create policy "postulaciones: solo barberos, a vacantes abiertas" on public.postulaciones
  for insert to authenticated with check (
    usuario_id = auth.uid() and public.es_profesional() and public.vacantes_activas(salon_id)
    and not public.es_miembro(salon_id)
    and exists (select 1 from public.vacantes v where v.id = vacante_id and v.salon_id = postulaciones.salon_id and v.abierta)
  );
create policy "postulaciones: el encargado cambia el estado" on public.postulaciones
  for update to authenticated using (public.es_dueno(salon_id)) with check (public.es_dueno(salon_id));

-- ---------- 2. Chat en vivo ------------------------------------------
create table if not exists public.conversaciones (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid not null references public.salones (id) on delete cascade,
  usuario_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre            text not null check (char_length(nombre) between 1 and 80),
  creado_en         timestamptz not null default now(),
  ultimo_mensaje_en timestamptz,
  ultimo_autor      text,
  ultimo_texto      text,
  leido_salon_en    timestamptz,
  leido_cliente_en  timestamptz,
  unique (salon_id, usuario_id),
  unique (salon_id, id)
);
alter table public.conversaciones enable row level security;
revoke all on public.conversaciones from anon, authenticated;
grant select, insert on public.conversaciones to authenticated;

create policy "conversaciones: la clienta y el equipo" on public.conversaciones
  for select to authenticated using (usuario_id = auth.uid() or public.es_miembro(salon_id));
create policy "conversaciones: se abren con el chat abierto" on public.conversaciones
  for insert to authenticated with check (usuario_id = auth.uid() and public.chat_abierto(salon_id) and not public.es_miembro(salon_id));

create table if not exists public.mensajes (
  id              uuid primary key default gen_random_uuid(),
  salon_id        uuid not null references public.salones (id) on delete cascade,
  conversacion_id uuid not null,
  autor           text not null check (autor in ('cliente', 'salon')),
  autor_id        uuid not null default auth.uid(),
  texto           text not null check (char_length(btrim(texto)) between 1 and 1000),
  creado_en       timestamptz not null default now(),
  foreign key (salon_id, conversacion_id) references public.conversaciones (salon_id, id) on delete cascade
);
create index if not exists mensajes_por_conversacion on public.mensajes (conversacion_id, creado_en);
alter table public.mensajes enable row level security;
revoke all on public.mensajes from anon, authenticated;
grant select, insert on public.mensajes to authenticated;

create policy "mensajes: la clienta y el equipo los ven" on public.mensajes
  for select to authenticated using (
    public.es_miembro(salon_id)
    or exists (select 1 from public.conversaciones c where c.id = conversacion_id and c.usuario_id = auth.uid())
  );
-- La clienta escribe solo en horario de chat; el equipo contesta cuando quiera.
create policy "mensajes: escribir" on public.mensajes
  for insert to authenticated with check (
    autor_id = auth.uid() and (
      (autor = 'cliente' and public.chat_abierto(salon_id)
        and exists (select 1 from public.conversaciones c where c.id = conversacion_id and c.salon_id = mensajes.salon_id and c.usuario_id = auth.uid()))
      or (autor = 'salon' and public.es_miembro(salon_id))
    )
  );

-- Cada mensaje actualiza la conversación (para la lista y los no leídos).
create or replace function public.al_llegar_mensaje()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversaciones
     set ultimo_mensaje_en = new.creado_en, ultimo_autor = new.autor, ultimo_texto = left(new.texto, 120),
         leido_salon_en   = case when new.autor = 'salon' then new.creado_en else leido_salon_en end,
         leido_cliente_en = case when new.autor = 'cliente' then new.creado_en else leido_cliente_en end
   where id = new.conversacion_id;
  return new;
end;
$$;
drop trigger if exists mensajes_actualizan_conversacion on public.mensajes;
create trigger mensajes_actualizan_conversacion after insert on public.mensajes
  for each row execute function public.al_llegar_mensaje();

-- Marcar como leída (la clienta o el equipo, cada quien su lado).
create or replace function public.marcar_leido(p_conversacion uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v public.conversaciones%rowtype;
begin
  select * into v from public.conversaciones where id = p_conversacion;
  if not found then return; end if;
  if v.usuario_id = auth.uid() then
    update public.conversaciones set leido_cliente_en = now() where id = v.id;
  elsif public.es_miembro(v.salon_id) then
    update public.conversaciones set leido_salon_en = now() where id = v.id;
  end if;
end;
$$;

revoke execute on function public.es_profesional() from public;
revoke execute on function public.vacantes_activas(uuid) from public;
revoke execute on function public.chat_abierto(uuid) from public;
revoke execute on function public.marcar_leido(uuid) from public;
grant execute on function public.es_profesional() to authenticated;
grant execute on function public.vacantes_activas(uuid) to authenticated;
grant execute on function public.chat_abierto(uuid) to anon, authenticated;
grant execute on function public.marcar_leido(uuid) to authenticated;

-- Mensajes en tiempo real (Supabase Realtime respeta las políticas de arriba).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'mensajes') then
    alter publication supabase_realtime add table public.mensajes;
  end if;
end $$;

-- =====================================================================
-- Nura · 0005 · bot de WhatsApp con membresía
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pega TODO este archivo
-- > Run. Se corre una sola vez, después de 0004.
--
-- Agrega hasta cuándo tiene pagado el bot de WhatsApp cada barbería.
-- Solo lo cambia el equipo de Nura desde el Table Editor; la barbería no.
-- El bot reserva con las mismas reglas de la página pública (función
-- reservar de 0002): horarios, descansos, empalmes y freno a reservas falsas.
-- =====================================================================

alter table public.salones add column if not exists bot_hasta date;

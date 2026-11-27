import type { SupabaseClient } from "@supabase/supabase-js";
import { hoyLocal } from "./tiempo";

export const PRECIO_INSIGHTS = 149;

// ¿La barbería tiene pagado Nura Insights hoy? Lo activa el equipo de Nura.
export async function insightsActivo(supabase: SupabaseClient, salonId: string): Promise<boolean> {
  const { data, error } = await supabase.from("salones").select("insights_hasta").eq("id", salonId).maybeSingle();
  if (error || !data?.insights_hasta) return false;
  return String(data.insights_hasta) >= hoyLocal();
}

export const PRECIO_BOT = 199;

// ¿La barbería tiene pagado el bot de WhatsApp hoy? Lo activa el equipo de Nura.
export async function botActivo(supabase: SupabaseClient, salonId: string): Promise<boolean> {
  const { data, error } = await supabase.from("salones").select("bot_hasta").eq("id", salonId).maybeSingle();
  if (error || !data?.bot_hasta) return false;
  return String(data.bot_hasta) >= hoyLocal();
}

// Enlace de WhatsApp que abre el bot ya con el código de la barbería.
export function enlaceBot(slug: string): string | null {
  const numero = process.env.NEXT_PUBLIC_NURA_BOT_NUMERO;
  if (!numero) return null;
  return `https://wa.me/${numero.replace(/\D/g, "").length === 10 ? `52${numero.replace(/\D/g, "")}` : numero.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, quiero reservar en ${slug}`)}`;
}

// Complementos nuevos. Precios propuestos: ajústalos aquí si cambian.
export const PRECIO_VACANTES = 99;
export const PRECIO_CHAT = 149;

async function fechaActiva(supabase: SupabaseClient, salonId: string, columna: "vacantes_hasta" | "chat_hasta") {
  const { data, error } = await supabase.from("salones").select(columna).eq("id", salonId).maybeSingle();
  const valor = (data as Record<string, string | null> | null)?.[columna];
  return !error && !!valor && String(valor) >= hoyLocal();
}
export const vacantesActivas = (s: SupabaseClient, id: string) => fechaActiva(s, id, "vacantes_hasta");
export const chatActivo = (s: SupabaseClient, id: string) => fechaActiva(s, id, "chat_hasta");

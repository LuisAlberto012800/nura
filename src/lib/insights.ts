import type { SupabaseClient } from "@supabase/supabase-js";
import { hoyLocal } from "./tiempo";

export const PRECIO_INSIGHTS = 149;

// ¿La barbería tiene pagado Nura Insights hoy? Lo activa el equipo de Nura.
export async function insightsActivo(supabase: SupabaseClient, salonId: string): Promise<boolean> {
  const { data, error } = await supabase.from("salones").select("insights_hasta").eq("id", salonId).maybeSingle();
  if (error || !data?.insights_hasta) return false;
  return String(data.insights_hasta) >= hoyLocal();
}

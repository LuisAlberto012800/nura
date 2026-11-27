"use server";

import { revalidatePath } from "next/cache";
import { contextoEncargado, sesionActual } from "@/lib/sesion";
import { HORAS } from "@/lib/horarios";

export type EstadoChat = { error?: string; ok?: boolean };

export async function guardarHorarioChat(_: EstadoChat, form: FormData): Promise<EstadoChat> {
  const dias = form.getAll("dias").map(Number).filter((d) => d >= 0 && d <= 6);
  const inicio = String(form.get("inicio") ?? "");
  const fin = String(form.get("fin") ?? "");
  if (!HORAS.includes(inicio) || !HORAS.includes(fin) || fin <= inicio) return { error: "La hora de cierre debe ser después de la de apertura." };
  const { supabase, salon } = await contextoEncargado();
  const { error } = await supabase.from("salones").update({ chat_dias: dias, chat_inicio: inicio, chat_fin: fin }).eq("id", salon.id);
  if (error) return { error: "No pudimos guardar el horario. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Primer mensaje de la clienta: abre la conversación y lo manda.
export async function iniciarChat(salonId: string, texto: string): Promise<{ id?: string; error?: string }> {
  const limpio = texto.trim().slice(0, 1000);
  if (!limpio) return { error: "Escribe tu mensaje." };
  const { supabase, user } = await sesionActual();
  if (!user) return { error: "Inicia sesión para escribir." };
  const nombre = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Cliente").slice(0, 80);
  let { data: conv } = await supabase.from("conversaciones").select("id").eq("salon_id", salonId).eq("usuario_id", user.id).maybeSingle();
  if (!conv) {
    const r = await supabase.from("conversaciones").insert({ salon_id: salonId, nombre }).select("id").single();
    if (r.error || !r.data) return { error: "El chat de esta barbería está cerrado en este momento." };
    conv = r.data;
  }
  const { error } = await supabase.from("mensajes").insert({ salon_id: salonId, conversacion_id: conv.id, autor: "cliente", texto: limpio });
  if (error) return { error: "El chat de esta barbería está cerrado en este momento." };
  return { id: conv.id };
}

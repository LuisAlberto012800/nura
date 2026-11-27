"use server";

import { revalidatePath } from "next/cache";
import { contextoBarberia, contextoEncargado } from "@/lib/sesion";
import { borrarFoto, fotoDelSalon } from "@/lib/fotos";
import { limpiarTelefono } from "@/lib/salon";

export type EstadoDatos = { error?: string; ok?: boolean };

// Publicar u ocultar la página. Para publicar se necesita algo que reservar.
export async function cambiarPublicacion(form: FormData) {
  const publicar = form.get("publicar") === "si";
  const { supabase, salon } = await contextoBarberia();
  if (publicar) {
    const [{ count: servicios }, { count: horarios }] = await Promise.all([
      supabase.from("servicios").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).eq("activo", true),
      supabase.from("horarios").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
    ]);
    if (!servicios || !horarios) return;
  }
  await supabase.from("salones").update({ publicado: publicar }).eq("id", salon.id);
  revalidatePath("/", "layout");
}

export async function guardarDatos(_: EstadoDatos, form: FormData): Promise<EstadoDatos> {
  const nombre = String(form.get("nombre") ?? "").trim();
  const colonia = String(form.get("colonia") ?? "").trim();
  const direccion = String(form.get("direccion") ?? "").trim().slice(0, 120) || null;
  const descripcion = String(form.get("descripcion") ?? "").trim().slice(0, 280) || null;
  const whatsappTexto = String(form.get("whatsapp") ?? "").trim();
  const whatsapp = whatsappTexto ? limpiarTelefono(whatsappTexto) : null;

  if (nombre.length < 2 || nombre.length > 80) return { error: "Escribe el nombre de tu barbería." };
  if (colonia.length < 2 || colonia.length > 80) return { error: "Escribe la colonia." };
  if (whatsappTexto && !whatsapp) return { error: "El WhatsApp debe tener 10 dígitos, por ejemplo 33 1234 5678." };

  const { supabase, salon } = await contextoBarberia();
  const { error } = await supabase.from("salones").update({ nombre, colonia, direccion, descripcion, whatsapp }).eq("id", salon.id);
  if (error) return { error: "No pudimos guardar. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Foto de portada de la barbería, como en Facebook o LinkedIn.
export async function guardarPortada(url: string | null): Promise<{ error?: string }> {
  const { supabase, salon } = await contextoEncargado();
  if (url && !fotoDelSalon(url, salon.id)) return { error: "La foto no se subió bien. Vuelve a elegirla." };
  const { data: antes } = await supabase.from("salones").select("portada_url").eq("id", salon.id).single();
  const { error } = await supabase.from("salones").update({ portada_url: url }).eq("id", salon.id);
  if (error) return { error: "No pudimos guardar la portada. Intenta de nuevo." };
  if (antes?.portada_url && antes.portada_url !== url) await borrarFoto(supabase, salon.id, antes.portada_url);
  revalidatePath("/", "layout");
  return {};
}

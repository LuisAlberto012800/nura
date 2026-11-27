"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contextoBarberia } from "@/lib/sesion";
import { borrarFoto } from "@/lib/fotos";

export type EstadoPerfil = { error?: string; ok?: boolean };

// El barbero cambia su nombre, especialidades y años. Su horario no.
export async function guardarMiPerfil(_: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const nombre = String(form.get("nombre") ?? "").trim();
  const especialidades = String(form.get("especialidades") ?? "").split(",").map((e) => e.trim()).filter(Boolean).slice(0, 6);
  const aniosTexto = String(form.get("anios_oficio") ?? "").trim();
  const anios = aniosTexto === "" ? null : Number(aniosTexto);
  if (nombre.length < 2) return { error: "Escribe tu nombre." };
  if (anios !== null && (!Number.isInteger(anios) || anios < 0 || anios > 70)) return { error: "Los años de oficio van en número entero." };
  const { supabase, salon } = await contextoBarberia();
  const { error } = await supabase.rpc("actualizar_mi_perfil", { p_salon: salon.id, p_nombre: nombre, p_especialidades: especialidades, p_anios: anios });
  if (error) return { error: "No pudimos guardar. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function salirDeBarberia() {
  const { supabase, salon } = await contextoBarberia();
  await supabase.rpc("salir_de_barberia", { p_salon: salon.id });
  revalidatePath("/", "layout");
  redirect("/unirme");
}

// Foto de perfil del barbero. La anterior se borra para cuidar el espacio.
export async function guardarMiFoto(url: string | null): Promise<{ error?: string }> {
  const { supabase, user, salon } = await contextoBarberia();
  const { data: yo } = await supabase.from("estilistas").select("foto_url").eq("salon_id", salon.id).eq("usuario_id", user.id).maybeSingle();
  const { error } = await supabase.rpc("actualizar_mi_foto", { p_salon: salon.id, p_url: url });
  if (error) return { error: "No pudimos guardar tu foto. Intenta de nuevo." };
  if (yo?.foto_url && yo.foto_url !== url) await borrarFoto(supabase, salon.id, yo.foto_url);
  revalidatePath("/", "layout");
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contextoBarberia } from "@/lib/sesion";

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

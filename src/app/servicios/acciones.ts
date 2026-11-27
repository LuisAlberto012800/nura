"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { CATEGORIAS } from "@/lib/formato";

export type EstadoServicio = { error?: string; ok?: boolean };

async function contexto() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) redirect("/alta");
  return { supabase, salon };
}

// Crea un servicio nuevo o, si trae id, actualiza el existente.
export async function guardarServicio(_: EstadoServicio, form: FormData): Promise<EstadoServicio> {
  const id = String(form.get("id") ?? "");
  const nombre = String(form.get("nombre") ?? "").trim();
  const categoria = String(form.get("categoria") ?? "");
  const duracion = Number(form.get("duracion_min"));
  const precioTexto = String(form.get("precio") ?? "").replace(/[$,\s]/g, "");
  const precio = Number(precioTexto);

  if (nombre.length < 2) return { error: "Escribe el nombre del servicio." };
  if (!CATEGORIAS.some((c) => c.valor === categoria)) return { error: "Elige el tipo de servicio." };
  if (!Number.isInteger(duracion) || duracion < 10 || duracion > 600) return { error: "Elige cuánto dura." };
  if (!/^\d+$/.test(precioTexto) || !Number.isInteger(precio) || precio <= 0)
    return { error: "El precio va en pesos enteros y mayor a cero, por ejemplo 450." };
  if (precio > 100000) return { error: "Revisa el precio: parece demasiado alto." };

  const { supabase, salon } = await contexto();
  const datos = { nombre, categoria, duracion_min: duracion, precio };

  const { error } = id
    ? await supabase.from("servicios").update(datos).eq("id", id).eq("salon_id", salon.id)
    : await supabase.from("servicios").insert({ ...datos, salon_id: salon.id });
  if (error) return { error: "No pudimos guardar el servicio. Intenta de nuevo." };

  revalidatePath("/servicios");
  revalidatePath("/hoy");
  if (id) redirect("/servicios");
  return { ok: true };
}

export async function cambiarVisible(form: FormData) {
  const id = String(form.get("id") ?? "");
  const activo = form.get("activo") === "true";
  const { supabase, salon } = await contexto();
  await supabase.from("servicios").update({ activo: !activo }).eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/servicios");
}

export async function borrarServicio(form: FormData) {
  const id = String(form.get("id") ?? "");
  const { supabase, salon } = await contexto();
  await supabase.from("servicios").delete().eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/servicios");
  revalidatePath("/hoy");
  redirect("/servicios");
}

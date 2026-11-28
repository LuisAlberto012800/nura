"use server";

import { revalidatePath } from "next/cache";
import { contextoEncargado } from "@/lib/sesion";
import { esDiaValido } from "@/lib/tiempo";

export type EstadoCupon = { error?: string; ok?: boolean };

export async function crearCupon(_: EstadoCupon, form: FormData): Promise<EstadoCupon> {
  const codigo = String(form.get("codigo") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const servicio = String(form.get("servicio_id") ?? "") || null;
  const tipo = form.get("tipo") === "monto" ? "monto" : "porcentaje";
  const valor = Number(String(form.get("valor") ?? "").replace(/[^0-9]/g, ""));
  const vence = String(form.get("vence") ?? "");
  const usosTexto = String(form.get("usos_max") ?? "").trim();
  const usos = usosTexto === "" ? null : Number(usosTexto);
  if (codigo.length < 3 || codigo.length > 20) return { error: "El código lleva de 3 a 20 letras o números, por ejemplo CORTE20." };
  if (!Number.isInteger(valor) || valor <= 0) return { error: tipo === "porcentaje" ? "Escribe el porcentaje, por ejemplo 20." : "Escribe cuántos pesos descuenta, por ejemplo 50." };
  if (tipo === "porcentaje" && valor > 100) return { error: "El porcentaje no puede pasar de 100." };
  if (vence && !esDiaValido(vence)) return { error: "Revisa la fecha de vencimiento." };
  if (usos !== null && (!Number.isInteger(usos) || usos < 1)) return { error: "El número de usos va en número entero." };

  const { supabase, salon } = await contextoEncargado();
  if (servicio && tipo === "monto") {
    const { data: s } = await supabase.from("servicios").select("precio").eq("id", servicio).eq("salon_id", salon.id).maybeSingle();
    if (s && valor >= s.precio) return { error: `El descuento debe ser menor al precio del servicio (${s.precio} pesos).` };
  }
  const { error } = await supabase.from("cupones").insert({
    salon_id: salon.id,
    codigo,
    servicio_id: servicio,
    tipo,
    valor,
    vence: vence || null,
    usos_max: usos,
    publico: form.get("publico") === "si",
  });
  if (error?.code === "23505") return { error: `Ya tienes un cupón con el código ${codigo}.` };
  if (error) return { error: "No pudimos guardar el cupón. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cambiarCupon(form: FormData) {
  const id = String(form.get("id") ?? "");
  const activo = form.get("activo") === "true";
  const { supabase, salon } = await contextoEncargado();
  await supabase.from("cupones").update({ activo: !activo }).eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/", "layout");
}

export async function borrarCupon(form: FormData) {
  const id = String(form.get("id") ?? "");
  const { supabase, salon } = await contextoEncargado();
  await supabase.from("cupones").delete().eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/", "layout");
}

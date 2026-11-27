"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contextoBarberia } from "@/lib/sesion";
import { limpiarTelefono } from "@/lib/salon";
import { CABELLOS } from "@/lib/formato";

export type EstadoCliente = { error?: string; ok?: boolean };

function leer(form: FormData) {
  const nombre = String(form.get("nombre") ?? "").trim();
  const telefonoTexto = String(form.get("telefono") ?? "").trim();
  const telefono = telefonoTexto ? limpiarTelefono(telefonoTexto) : null;
  const cabello = String(form.get("tipo_cabello") ?? "");
  const tipo_cabello = CABELLOS.some((c) => c.valor === cabello) ? cabello : null;
  const notas = String(form.get("notas") ?? "").trim().slice(0, 500) || null;
  if (nombre.length < 1) return { error: "Escribe el nombre del cliente." } as const;
  if (nombre.length > 120) return { error: "El nombre es muy largo." } as const;
  if (telefonoTexto && !telefono) return { error: "El teléfono debe tener 10 dígitos, por ejemplo 33 1234 5678." } as const;
  return { datos: { nombre, telefono, tipo_cabello, notas } } as const;
}

const DUPLICADO = "Ya tienes un cliente con ese teléfono. Búscalo en tu lista.";

export async function crearCliente(_: EstadoCliente, form: FormData): Promise<EstadoCliente> {
  const r = leer(form);
  if ("error" in r) return { error: r.error };
  const { supabase, salon } = await contextoBarberia();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...r.datos, salon_id: salon.id, origen: "manual" })
    .select("id")
    .single();
  if (error?.code === "23505") return { error: DUPLICADO };
  if (error || !data) return { error: "No pudimos guardar al cliente. Intenta de nuevo." };
  revalidatePath("/", "layout");
  redirect(`/clientes/${data.id}`);
}

export async function guardarCliente(_: EstadoCliente, form: FormData): Promise<EstadoCliente> {
  const id = String(form.get("id") ?? "");
  const r = leer(form);
  if ("error" in r) return { error: r.error };
  const { supabase, salon } = await contextoBarberia();
  const { error } = await supabase.from("clientes").update(r.datos).eq("id", id).eq("salon_id", salon.id);
  if (error?.code === "23505") return { error: DUPLICADO };
  if (error) return { error: "No pudimos guardar los cambios. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Borra al cliente y sus datos personales. Sus citas pasadas se quedan sin nombre.
export async function borrarCliente(form: FormData) {
  const id = String(form.get("id") ?? "");
  const { supabase, salon } = await contextoBarberia();
  await supabase.from("clientes").delete().eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/", "layout");
  redirect("/clientes");
}

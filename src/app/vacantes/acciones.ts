"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contextoEncargado, sesionActual } from "@/lib/sesion";
import { limpiarTelefono } from "@/lib/salon";

export type EstadoVacante = { error?: string; ok?: boolean };
const TIPOS = ["tiempo_completo", "medio_tiempo", "renta_silla", "comision"];

export async function crearVacante(_: EstadoVacante, form: FormData): Promise<EstadoVacante> {
  const titulo = String(form.get("titulo") ?? "").trim();
  const tipo = String(form.get("tipo") ?? "");
  const pago = String(form.get("pago") ?? "").trim().slice(0, 80) || null;
  const descripcion = String(form.get("descripcion") ?? "").trim().slice(0, 1000) || null;
  if (titulo.length < 3) return { error: "Escribe qué puesto buscas, por ejemplo: Barbero con experiencia en fades." };
  if (!TIPOS.includes(tipo)) return { error: "Elige el tipo de trabajo." };
  const { supabase, salon } = await contextoEncargado();
  const { error } = await supabase.from("vacantes").insert({ salon_id: salon.id, titulo, tipo, pago, descripcion });
  if (error) return { error: "No pudimos publicarla. Revisa que tengas activo el complemento de vacantes." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cambiarVacante(form: FormData) {
  const id = String(form.get("id") ?? "");
  const abierta = form.get("abierta") === "true";
  const { supabase, salon } = await contextoEncargado();
  await supabase.from("vacantes").update({ abierta: !abierta }).eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/", "layout");
}

export async function cambiarPostulacion(form: FormData) {
  const id = String(form.get("id") ?? "");
  const estado = String(form.get("estado") ?? "");
  if (!["vista", "contactada", "descartada", "nueva"].includes(estado)) return;
  const { supabase, salon } = await contextoEncargado();
  await supabase.from("postulaciones").update({ estado }).eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/", "layout");
}

// El barbero se postula. Las reglas (solo barberos, vacante abierta) las cuida la base de datos.
export async function postularme(_: EstadoVacante, form: FormData): Promise<EstadoVacante> {
  const vacante = String(form.get("vacante") ?? "");
  const salonId = String(form.get("salon") ?? "");
  const nombre = String(form.get("nombre") ?? "").trim();
  const telefono = limpiarTelefono(String(form.get("telefono") ?? ""));
  const aniosTexto = String(form.get("anios") ?? "").trim();
  const anios = aniosTexto === "" ? null : Number(aniosTexto);
  if (nombre.length < 2) return { error: "Escribe tu nombre." };
  if (!telefono) return { error: "Tu celular debe tener 10 dígitos, para que te contacten." };
  if (anios !== null && (!Number.isInteger(anios) || anios < 0 || anios > 70)) return { error: "Los años de oficio van en número." };
  const { supabase, user } = await sesionActual();
  if (!user) redirect("/");
  const { error } = await supabase.from("postulaciones").insert({
    salon_id: salonId,
    vacante_id: vacante,
    nombre,
    telefono,
    anios_oficio: anios,
    especialidades: String(form.get("especialidades") ?? "").trim().slice(0, 200) || null,
    mensaje: String(form.get("mensaje") ?? "").trim().slice(0, 600) || null,
  });
  if (error?.code === "23505") return { error: "Ya te postulaste a esta vacante." };
  if (error) return { error: "No pudimos mandar tu postulación. Puede que la vacante ya se haya cerrado." };
  revalidatePath("/empleos");
  return { ok: true };
}

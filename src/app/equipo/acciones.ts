"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { DIAS, HORAS } from "@/lib/horarios";

export type EstadoEquipo = { error?: string; ok?: boolean };

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

function leerDatos(form: FormData) {
  const nombre = String(form.get("nombre") ?? "").trim();
  const especialidades = String(form.get("especialidades") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .slice(0, 6);
  const aniosTexto = String(form.get("anios_oficio") ?? "").trim();
  const anios = aniosTexto === "" ? null : Number(aniosTexto);
  return { nombre, especialidades, anios };
}

function validar({ nombre, anios }: ReturnType<typeof leerDatos>): string | null {
  if (nombre.length < 2) return "Escribe el nombre del estilista.";
  if (anios !== null && (!Number.isInteger(anios) || anios < 0 || anios > 70)) return "Los años de oficio van en número entero.";
  return null;
}

export async function crearEstilista(_: EstadoEquipo, form: FormData): Promise<EstadoEquipo> {
  const datos = leerDatos(form);
  const error = validar(datos);
  if (error) return { error };

  const { supabase, salon } = await contexto();
  const { data, error: errorDb } = await supabase
    .from("estilistas")
    .insert({ salon_id: salon.id, nombre: datos.nombre, especialidades: datos.especialidades, anios_oficio: datos.anios })
    .select("id")
    .single();
  if (errorDb || !data) return { error: "No pudimos agregar al estilista. Intenta de nuevo." };

  revalidatePath("/equipo");
  redirect(`/equipo/${data.id}`);
}

// Guarda los datos del estilista y su horario de la semana.
export async function guardarEstilista(_: EstadoEquipo, form: FormData): Promise<EstadoEquipo> {
  const id = String(form.get("id") ?? "");
  const datos = leerDatos(form);
  const error = validar(datos);
  if (error) return { error };

  const filas: { dia: number; inicio: string; fin: string }[] = [];
  for (const d of DIAS) {
    if (form.get(`atiende_${d.valor}`) !== "on") continue;
    const inicio = String(form.get(`inicio_${d.valor}`) ?? "");
    const fin = String(form.get(`fin_${d.valor}`) ?? "");
    if (!HORAS.includes(inicio) || !HORAS.includes(fin)) return { error: `Revisa las horas del ${d.texto.toLowerCase()}.` };
    if (fin <= inicio) return { error: `El ${d.texto.toLowerCase()} la hora de salida debe ser después de la de entrada.` };
    filas.push({ dia: d.valor, inicio, fin });
  }

  const { supabase, salon } = await contexto();
  const { error: errorDatos } = await supabase
    .from("estilistas")
    .update({ nombre: datos.nombre, especialidades: datos.especialidades, anios_oficio: datos.anios })
    .eq("id", id)
    .eq("salon_id", salon.id);
  if (errorDatos) return { error: "No pudimos guardar los datos. Intenta de nuevo." };

  // El horario se reemplaza completo: se borra el anterior y se escribe el nuevo.
  const { error: errorBorrar } = await supabase.from("horarios").delete().eq("estilista_id", id).eq("salon_id", salon.id);
  if (errorBorrar) return { error: "No pudimos actualizar el horario. Intenta de nuevo." };
  if (filas.length > 0) {
    const { error: errorHorario } = await supabase
      .from("horarios")
      .insert(filas.map((f) => ({ ...f, salon_id: salon.id, estilista_id: id })));
    if (errorHorario) return { error: "El horario no se guardó completo. Vuelve a tocar Guardar." };
  }

  revalidatePath("/equipo");
  revalidatePath("/hoy");
  return { ok: true };
}

// No se borra a nadie: dejar de mostrarlo conserva su historial de citas y trabajos.
export async function cambiarActivo(form: FormData) {
  const id = String(form.get("id") ?? "");
  const activo = form.get("activo") === "true";
  const { supabase, salon } = await contexto();
  await supabase.from("estilistas").update({ activo: !activo }).eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/equipo");
  revalidatePath(`/equipo/${id}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contextoBarberia } from "@/lib/sesion";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { CABELLOS } from "@/lib/formato";

export type EstadoTrabajo = { error?: string };

const carpeta = (salonId: string) => `${SUPABASE_URL}/storage/v1/object/public/trabajos/${salonId}/`;

export async function crearTrabajo(_: EstadoTrabajo, form: FormData): Promise<EstadoTrabajo> {
  const { supabase, salon } = await contextoBarberia();
  const fotoDespues = String(form.get("foto_despues") ?? "");
  const fotoAntes = String(form.get("foto_antes") ?? "") || null;
  const servicioId = String(form.get("servicio_id") ?? "");
  const cabello = String(form.get("tipo_cabello") ?? "");
  const colonia = String(form.get("colonia") ?? "").trim();
  const estilistaId = String(form.get("estilista_id") ?? "") || null;
  const citaId = String(form.get("cita_id") ?? "") || null;
  const muestraCara = form.get("muestra_cara") === "si";
  const titulo = String(form.get("titulo") ?? "").trim().slice(0, 60) || null;

  // Las fotos solo pueden venir de la carpeta de este salón.
  if (!fotoDespues.startsWith(carpeta(salon.id))) return { error: "Sube la foto de después." };
  if (fotoAntes && !fotoAntes.startsWith(carpeta(salon.id))) return { error: "La foto de antes no se subió bien. Vuelve a elegirla." };
  if (!CABELLOS.some((c) => c.valor === cabello)) return { error: "Elige el tipo de cabello." };
  if (colonia.length < 2) return { error: "Escribe la colonia." };

  const { data: servicio } = await supabase
    .from("servicios")
    .select("categoria, duracion_min")
    .eq("id", servicioId)
    .eq("salon_id", salon.id)
    .maybeSingle();
  if (!servicio) return { error: "Elige el servicio." };

  // Si viene de una cita, el cliente es el de esa cita (no se puede elegir a cualquiera).
  let clienteId: string | null = null;
  if (citaId) {
    const { data: cita } = await supabase.from("citas").select("cliente_id, estilista_id").eq("id", citaId).eq("salon_id", salon.id).maybeSingle();
    if (!cita) return { error: "Esa cita ya no existe. Elige otra o súbelo sin cita." };
    clienteId = cita.cliente_id;
  }

  const { data, error } = await supabase
    .from("trabajos")
    .insert({
      salon_id: salon.id,
      estilista_id: estilistaId,
      cita_id: citaId,
      cliente_id: clienteId,
      servicio_id: servicioId,
      titulo,
      foto_despues: fotoDespues,
      foto_antes: fotoAntes,
      tipo_cabello: cabello,
      categoria: servicio.categoria,
      duracion_min: servicio.duracion_min,
      colonia,
      muestra_cara: muestraCara,
      publicado: !muestraCara,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No pudimos guardar el trabajo. Intenta de nuevo." };

  if (clienteId) {
    await supabase.from("clientes").update({ tipo_cabello: cabello }).eq("id", clienteId).eq("salon_id", salon.id).is("tipo_cabello", null);
  }
  revalidatePath("/", "layout");
  redirect(`/trabajos/${data.id}?nuevo=1`);
}

export async function cambiarPublicado(form: FormData) {
  const id = String(form.get("id") ?? "");
  const publicado = form.get("publicado") === "true";
  const { supabase, salon } = await contextoBarberia();
  await supabase.from("trabajos").update({ publicado: !publicado }).eq("id", id).eq("salon_id", salon.id);
  revalidatePath("/", "layout");
}

export async function borrarTrabajo(form: FormData) {
  const id = String(form.get("id") ?? "");
  const { supabase, salon } = await contextoBarberia();
  const { data } = await supabase.from("trabajos").select("foto_despues, foto_antes").eq("id", id).eq("salon_id", salon.id).maybeSingle();
  if (data) {
    const rutas = [data.foto_despues, data.foto_antes]
      .filter((u): u is string => !!u && u.startsWith(carpeta(salon.id)))
      .map((u) => u.slice(`${SUPABASE_URL}/storage/v1/object/public/trabajos/`.length));
    await supabase.from("trabajos").delete().eq("id", id).eq("salon_id", salon.id);
    if (rutas.length) await supabase.storage.from("trabajos").remove(rutas);
  }
  revalidatePath("/", "layout");
  redirect("/trabajos");
}

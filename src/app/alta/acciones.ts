"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearSlug, limpiarTelefono, salonDelUsuario } from "@/lib/salon";

export type EstadoAlta = { error?: string };

export async function darDeAlta(_: EstadoAlta, form: FormData): Promise<EstadoAlta> {
  const nombre = String(form.get("nombre") ?? "").trim();
  const colonia = String(form.get("colonia") ?? "").trim();
  const whatsappTexto = String(form.get("whatsapp") ?? "").trim();
  const tuNombre = String(form.get("tu_nombre") ?? "").trim();

  if (nombre.length < 2) return { error: "Escribe el nombre de tu barbería o estética." };
  if (colonia.length < 2) return { error: "Escribe la colonia donde está tu local." };
  if (tuNombre.length < 2) return { error: "Escribe tu nombre como aparecerá en tu perfil." };
  const whatsapp = whatsappTexto ? limpiarTelefono(whatsappTexto) : null;
  if (whatsappTexto && !whatsapp) return { error: "El WhatsApp debe tener 10 dígitos, por ejemplo 33 1234 5678." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  if (await salonDelUsuario(supabase, user.id)) redirect("/hoy");

  // Si el enlace ya está ocupado, se le agregan unos caracteres al final.
  const base = crearSlug(nombre);
  let salonId: string | null = null;
  for (let intento = 0; intento < 4 && !salonId; intento++) {
    const slug = intento === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("salones")
      .insert({ nombre, colonia, whatsapp, slug })
      .select("id")
      .single();
    if (data) salonId = data.id;
    else if (error && error.code !== "23505") return { error: "No pudimos guardar tu barbería. Intenta de nuevo." };
  }
  if (!salonId) return { error: "No pudimos crear el enlace de tu página. Prueba con otro nombre." };

  const { error: errorEstilista } = await supabase
    .from("estilistas")
    .insert({ salon_id: salonId, usuario_id: user.id, nombre: tuNombre });
  if (errorEstilista) return { error: "Tu barbería quedó guardada, pero no tu perfil. Entra de nuevo para terminar." };

  redirect("/hoy");
}

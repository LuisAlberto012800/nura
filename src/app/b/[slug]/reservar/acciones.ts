"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { limpiarTelefono } from "@/lib/salon";
import { aInstante, esDiaValido } from "@/lib/tiempo";

export type EstadoReserva = { error?: string };

const ERRORES: Record<string, string> = {
  salon_no_disponible: "Esta barbería todavía no recibe reservas en línea. Escríbele por WhatsApp.",
  estilista_no_disponible: "Esa persona ya no está disponible. Elige a otra.",
  servicio_no_disponible: "Ese servicio ya no está disponible. Elige otro.",
  nombre_invalido: "Escribe tu nombre.",
  telefono_invalido: "Tu celular debe tener 10 dígitos, por ejemplo 33 1234 5678.",
  fecha_invalida: "Elige una hora con al menos 30 minutos de anticipación.",
  fuera_de_horario: "Esa hora ya no está en su horario. Elige otra.",
  horario_ocupado: "Alguien acaba de apartar esa hora. Elige otra.",
  demasiadas_reservas: "Ya tienes 2 reservas por confirmar aquí. Espera a que te confirmen o escríbeles por WhatsApp.",
};

export async function reservarCita(_: EstadoReserva, form: FormData): Promise<EstadoReserva> {
  const slug = String(form.get("slug") ?? "");
  const salonId = String(form.get("salon_id") ?? "");
  const estilistaId = String(form.get("estilista_id") ?? "");
  const servicioId = String(form.get("servicio_id") ?? "");
  const dia = String(form.get("dia") ?? "");
  const hora = String(form.get("hora") ?? "");
  const nombre = String(form.get("nombre") ?? "").trim();
  const telefono = limpiarTelefono(String(form.get("telefono") ?? ""));

  if (!esDiaValido(dia) || !/^\d{2}:\d{2}$/.test(hora)) return { error: "Elige el día y la hora." };
  if (nombre.length < 2) return { error: ERRORES.nombre_invalido };
  if (!telefono) return { error: ERRORES.telefono_invalido };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("reservar", {
    p_salon: salonId,
    p_estilista: estilistaId,
    p_servicio: servicioId,
    p_inicio: aInstante(dia, hora),
    p_nombre: nombre,
    p_telefono: telefono,
  });
  if (error) {
    const clave = Object.keys(ERRORES).find((k) => error.message.includes(k));
    return { error: clave ? ERRORES[clave] : "No pudimos apartar tu cita. Intenta de nuevo." };
  }
  const q = new URLSearchParams({ s: servicioId, e: estilistaId, d: dia, h: hora, n: nombre.split(" ")[0] });
  redirect(`/b/${slug}/listo?${q}`);
}

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
  cupon_invalido: "Ese cupón ya no aplica a este servicio. Quítalo o usa otro.",
};

export type CuponRevisado = { codigo: string; descuento: number; final: number } | { error: string };

// La clienta escribe un código: devuelve el descuento exacto para ese servicio.
export async function revisarCupon(salonId: string, servicioId: string, codigo: string): Promise<CuponRevisado> {
  const limpio = codigo.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (limpio.length < 3) return { error: "Escribe el código completo." };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("calcular_cupon", { p_salon: salonId, p_servicio: servicioId, p_codigo: limpio });
  const c = (data as { codigo: string; descuento: number; precio_final: number }[] | null)?.[0];
  if (error || !c) return { error: "Ese cupón no existe, ya venció o no aplica a este servicio." };
  return { codigo: c.codigo, descuento: c.descuento, final: c.precio_final };
}

export async function reservarCita(_: EstadoReserva, form: FormData): Promise<EstadoReserva> {
  const slug = String(form.get("slug") ?? "");
  const salonId = String(form.get("salon_id") ?? "");
  const estilistaId = String(form.get("estilista_id") ?? "");
  const servicioId = String(form.get("servicio_id") ?? "");
  const dia = String(form.get("dia") ?? "");
  const hora = String(form.get("hora") ?? "");
  const nombre = String(form.get("nombre") ?? "").trim();
  const telefono = limpiarTelefono(String(form.get("telefono") ?? ""));
  const cupon = String(form.get("cupon") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!esDiaValido(dia) || !/^\d{2}:\d{2}$/.test(hora)) return { error: "Elige el día y la hora." };
  if (nombre.length < 2) return { error: ERRORES.nombre_invalido };
  if (!telefono) return { error: ERRORES.telefono_invalido };

  const supabase = await crearClienteServidor();
  // Precio con cupón para mostrarlo en la confirmación (la reserva lo vuelve a revisar).
  const conCupon = cupon ? await revisarCupon(salonId, servicioId, cupon) : null;
  if (conCupon && "error" in conCupon) return { error: ERRORES.cupon_invalido };
  const { error } = await supabase.rpc("reservar", {
    p_salon: salonId,
    p_estilista: estilistaId,
    p_servicio: servicioId,
    p_inicio: aInstante(dia, hora),
    p_nombre: nombre,
    p_telefono: telefono,
    // Solo se manda con cupón, así la reserva sigue funcionando sin la migración 0007.
    ...(cupon ? { p_cupon: cupon } : {}),
  });
  if (error) {
    const clave = Object.keys(ERRORES).find((k) => error.message.includes(k));
    return { error: clave ? ERRORES[clave] : "No pudimos apartar tu cita. Intenta de nuevo." };
  }
  const q = new URLSearchParams({ s: servicioId, e: estilistaId, d: dia, h: hora, n: nombre.split(" ")[0] });
  if (conCupon) {
    q.set("c", conCupon.codigo);
    q.set("t", String(conCupon.final));
  }
  redirect(`/b/${slug}/listo?${q}`);
}

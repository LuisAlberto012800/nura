import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ocupado, Turno } from "@/lib/disponibilidad";
import { aInstante, hoyLocal, sumarDias } from "@/lib/tiempo";

export const DIAS_VISIBLES = 60;

// Todo lo que el formulario de cita necesita: equipo con horarios, servicios,
// clientes y horas ocupadas de hoy a 60 días. Al modificar, la cita misma no
// cuenta como ocupada.
export async function datosParaCita(supabase: SupabaseClient, salonId: string, excluirCita?: string) {
  const hoy = hoyLocal();
  const dias = Array.from({ length: DIAS_VISIBLES }, (_, i) => sumarDias(hoy, i));
  const desde = aInstante(hoy, "00:00");
  const hasta = aInstante(sumarDias(hoy, DIAS_VISIBLES), "00:00");
  const [{ data: equipo }, { data: servicios }, { data: clientes }, { data: citas }, { data: bloqueos }] = await Promise.all([
    supabase.from("estilistas").select("id, nombre, horarios(dia, inicio, fin)").eq("salon_id", salonId).eq("activo", true).order("creado_en"),
    supabase.from("servicios").select("id, nombre, duracion_min, precio").eq("salon_id", salonId).eq("activo", true).order("orden").order("creado_en"),
    supabase.from("clientes").select("id, nombre, telefono").eq("salon_id", salonId).order("nombre").limit(2000),
    supabase
      .from("citas")
      .select("id, estilista_id, inicio, fin")
      .eq("salon_id", salonId)
      .in("estado", ["por_confirmar", "confirmada"])
      .lt("inicio", hasta)
      .gt("fin", desde)
      .limit(3000),
    supabase.from("bloqueos").select("estilista_id, inicio, fin").eq("salon_id", salonId).lt("inicio", hasta).gt("fin", desde).limit(1000),
  ]);
  const ocupados: Ocupado[] = [
    ...((citas ?? []) as (Ocupado & { id: string })[]).filter((c) => c.id !== excluirCita).map(({ estilista_id, inicio, fin }) => ({ estilista_id, inicio, fin })),
    ...((bloqueos ?? []) as Ocupado[]),
  ];
  return {
    hoy,
    dias,
    equipo: (equipo ?? []) as { id: string; nombre: string; horarios: Turno[] }[],
    servicios: (servicios ?? []) as { id: string; nombre: string; duracion_min: number; precio: number }[],
    clientes: (clientes ?? []) as { id: string; nombre: string; telefono: string | null }[],
    ocupados,
  };
}

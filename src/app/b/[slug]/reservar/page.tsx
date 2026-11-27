import { notFound } from "next/navigation";
import { Encabezado } from "@/components/Encabezado";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { salonPorSlug } from "@/lib/publico";
import { aInstante, hoyLocal, minutosAhora, sumarDias } from "@/lib/tiempo";
import type { Ocupado, Turno } from "@/lib/disponibilidad";
import { FormularioReserva } from "./FormularioReserva";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reservar · Nura" };

const DIAS = 30;

export default async function Reservar({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, salon } = await salonPorSlug(slug);
  if (!salon) notFound();

  const hoy = hoyLocal();
  const dias = Array.from({ length: DIAS }, (_, i) => sumarDias(hoy, i));
  const [{ data: servicios }, { data: equipo }, { data: ocupados }, { data: dFotos }] = await Promise.all([
    supabase.from("servicios").select("id, nombre, duracion_min, precio").eq("salon_id", salon.id).eq("activo", true).order("orden").order("creado_en"),
    supabase.from("estilistas").select("id, nombre, horarios(dia, inicio, fin)").eq("salon_id", salon.id).eq("activo", true).order("creado_en"),
    supabase.rpc("ocupado_publico", { p_salon: salon.id, p_desde: aInstante(hoy, "00:00"), p_hasta: aInstante(sumarDias(hoy, DIAS), "00:00") }),
    supabase.from("trabajos").select("servicio_id, foto_despues").eq("salon_id", salon.id).eq("publicado", true).order("creado_en", { ascending: false }).limit(60),
  ]);
  // Una foto real por servicio para el resumen de la reserva.
  const fotos: Record<string, string> = {};
  for (const f of (dFotos ?? []) as { servicio_id: string | null; foto_despues: string }[]) if (f.servicio_id && !fotos[f.servicio_id]) fotos[f.servicio_id] = f.foto_despues;
  const conHorario = ((equipo ?? []) as { id: string; nombre: string; horarios: Turno[] }[]).filter((e) => e.horarios.length > 0);

  return (
    <main className="pantalla">
      <div className="contenido">
        <Encabezado titulo="Reservar" volver={`/b/${slug}`} />
        {!salon.publicado ? (
          <p className="aviso aviso-azul">Tu página está oculta, así que nadie puede reservar todavía. Publícala en Cuenta.</p>
        ) : !servicios?.length || !conHorario.length ? (
          <p className="aviso aviso-neutro">Esta barbería todavía no tiene horarios en línea. Escríbele por WhatsApp.</p>
        ) : (
          <FormularioReserva
            slug={slug}
            salonId={salon.id}
            servicios={servicios}
            equipo={conHorario}
            ocupados={(ocupados ?? []) as Ocupado[]}
            dias={dias}
            hoy={hoy}
            ahora={minutosAhora()}
            servicioInicial={sp.servicio}
            estilistaInicial={sp.e}
            fotos={fotos}
            colonia={salon.colonia}
          />
        )}
      </div>
    </main>
  );
}

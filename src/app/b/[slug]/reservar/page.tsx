import Link from "next/link";
import { notFound } from "next/navigation";
import { Icono } from "@/components/Iconos";
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
  const [{ data: servicios }, { data: equipo }, { data: ocupados }] = await Promise.all([
    supabase.from("servicios").select("id, nombre, duracion_min, precio").eq("salon_id", salon.id).eq("activo", true).order("orden").order("creado_en"),
    supabase.from("estilistas").select("id, nombre, horarios(dia, inicio, fin)").eq("salon_id", salon.id).eq("activo", true).order("creado_en"),
    supabase.rpc("ocupado_publico", { p_salon: salon.id, p_desde: aInstante(hoy, "00:00"), p_hasta: aInstante(sumarDias(hoy, DIAS), "00:00") }),
  ]);
  const conHorario = ((equipo ?? []) as { id: string; nombre: string; horarios: Turno[] }[]).filter((e) => e.horarios.length > 0);

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href={`/b/${slug}`} className="volver">
          <Icono nombre="atras" tamano={18} />
          {salon.nombre}
        </Link>
        <h1 className="titulo">Reservar</h1>
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
          />
        )}
      </div>
    </main>
  );
}

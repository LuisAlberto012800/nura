import Link from "next/link";
import { redirect } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { HORAS } from "@/lib/horarios";
import { aInstante, esDiaValido, hoyLocal, minutosAhora, sumarDias } from "@/lib/tiempo";
import type { Ocupado } from "@/lib/disponibilidad";
import { FormularioCita } from "./FormularioCita";

export const metadata = { title: "Nueva cita · Nura" };
export const dynamic = "force-dynamic";

const DIAS_VISIBLES = 60;

export default async function NuevaCita({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) redirect("/alta");

  // Se puede agendar de hoy a 60 días; nunca en días pasados.
  const hoy = hoyLocal();
  const dias = Array.from({ length: DIAS_VISIBLES }, (_, i) => sumarDias(hoy, i));
  const dia = esDiaValido(sp.dia) && dias.includes(sp.dia) ? sp.dia : hoy;
  const hora = sp.hora && HORAS.includes(sp.hora) ? sp.hora : undefined;
  const desde = aInstante(hoy, "00:00");
  const hasta = aInstante(sumarDias(hoy, DIAS_VISIBLES), "00:00");

  const [{ data: equipo }, { data: servicios }, { data: clientes }, { data: citas }, { data: bloqueos }] = await Promise.all([
    supabase
      .from("estilistas")
      .select("id, nombre, horarios(dia, inicio, fin)")
      .eq("salon_id", salon.id)
      .eq("activo", true)
      .order("creado_en"),
    supabase
      .from("servicios")
      .select("id, nombre, duracion_min, precio")
      .eq("salon_id", salon.id)
      .eq("activo", true)
      .order("orden")
      .order("creado_en"),
    supabase.from("clientes").select("id, nombre, telefono").eq("salon_id", salon.id).order("nombre").limit(500),
    supabase
      .from("citas")
      .select("estilista_id, inicio, fin")
      .eq("salon_id", salon.id)
      .in("estado", ["por_confirmar", "confirmada"])
      .lt("inicio", hasta)
      .gt("fin", desde)
      .limit(3000),
    supabase.from("bloqueos").select("estilista_id, inicio, fin").eq("salon_id", salon.id).lt("inicio", hasta).gt("fin", desde).limit(1000),
  ]);
  const ocupados = [...(citas ?? []), ...(bloqueos ?? [])] as Ocupado[];

  const estilistaId = (equipo ?? []).find((e) => e.id === sp.e)?.id ?? equipo?.[0]?.id ?? "";
  const volver = `/agenda?dia=${dia}${estilistaId ? `&e=${estilistaId}` : ""}`;

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href={volver} className="volver">
          <Icono nombre="atras" tamano={18} />
          Agenda
        </Link>
        <div>
          <h1 className="titulo">Nueva cita</h1>
        </div>

        {!servicios || servicios.length === 0 ? (
          <>
            <p className="aviso aviso-neutro">Para agendar necesitas al menos un servicio con su precio.</p>
            <Link className="btn" href="/servicios">
              Agregar servicios
            </Link>
          </>
        ) : !estilistaId ? (
          <>
            <p className="aviso aviso-neutro">Para agendar necesitas a alguien en tu equipo.</p>
            <Link className="btn" href="/equipo">
              Ir a Equipo y horarios
            </Link>
          </>
        ) : (
          <FormularioCita
            dias={dias}
            hoy={hoy}
            ahora={minutosAhora()}
            diaInicial={dia}
            horaInicial={hora}
            estilistaInicial={estilistaId}
            equipo={equipo ?? []}
            servicios={servicios}
            clientes={clientes ?? []}
            ocupados={ocupados}
          />
        )}
      </div>
    </main>
  );
}

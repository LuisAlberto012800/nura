import Link from "next/link";
import { redirect } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { HORAS } from "@/lib/horarios";
import { esDiaValido, fechaLarga, hoyLocal } from "@/lib/tiempo";
import { FormularioCita } from "./FormularioCita";

export const metadata = { title: "Nueva cita · Nura" };
export const dynamic = "force-dynamic";

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

  const dia = esDiaValido(sp.dia) ? sp.dia : hoyLocal();
  const hora = sp.hora && HORAS.includes(sp.hora) ? sp.hora : "10:00";

  const [{ data: equipo }, { data: servicios }, { data: clientes }] = await Promise.all([
    supabase.from("estilistas").select("id, nombre").eq("salon_id", salon.id).eq("activo", true).order("creado_en"),
    supabase
      .from("servicios")
      .select("id, nombre, duracion_min, precio")
      .eq("salon_id", salon.id)
      .eq("activo", true)
      .order("orden")
      .order("creado_en"),
    supabase.from("clientes").select("id, nombre, telefono").eq("salon_id", salon.id).order("nombre").limit(500),
  ]);

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
          <p className="subtitulo">{fechaLarga(dia)}</p>
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
            dia={dia}
            hora={hora}
            horas={HORAS}
            estilistaId={estilistaId}
            equipo={equipo ?? []}
            servicios={servicios}
            clientes={clientes ?? []}
          />
        )}
      </div>
    </main>
  );
}

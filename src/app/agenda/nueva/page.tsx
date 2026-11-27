import Link from "next/link";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { HORAS } from "@/lib/horarios";
import { esDiaValido, minutosAhora } from "@/lib/tiempo";
import { FormularioCita } from "./FormularioCita";
import { datosParaCita } from "./datos";
import { SinDatos } from "@/components/SinDatos";

export const metadata = { title: "Nueva cita · Nura" };
export const dynamic = "force-dynamic";

export default async function NuevaCita({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const { supabase, salon } = await contextoBarberia();
  const { hoy, dias, equipo, servicios, clientes, ocupados } = await datosParaCita(supabase, salon.id);

  const dia = esDiaValido(sp.dia) && dias.includes(sp.dia) ? sp.dia : hoy;
  const hora = sp.hora && HORAS.includes(sp.hora) ? sp.hora : undefined;
  const estilistaId = equipo.find((e) => e.id === sp.e)?.id ?? equipo[0]?.id ?? "";
  const volver = `/agenda?dia=${dia}${estilistaId ? `&e=${estilistaId}` : ""}`;

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href={volver} className="volver">
          <Icono nombre="atras" tamano={18} />
          Agenda
        </Link>
        <h1 className="titulo">Nueva cita</h1>
          {servicios.length === 0 ? (
            <SinDatos texto="Para agendar necesitas al menos un servicio con su precio." href="/servicios" boton="Agregar servicios" />
          ) : !estilistaId ? (
            <SinDatos texto="Para agendar necesitas a alguien en tu equipo." href="/equipo" boton="Ir a Equipo y horarios" />
          ) : (
            <FormularioCita
              dias={dias}
              hoy={hoy}
              ahora={minutosAhora()}
              diaInicial={dia}
              horaInicial={hora}
              estilistaInicial={estilistaId}
              equipo={equipo}
              servicios={servicios}
              clientes={clientes}
              ocupados={ocupados}
              clienteInicial={clientes.find((c) => c.id === sp.cliente)?.id}
            />
          )}
      </div>
    </main>
  );
}

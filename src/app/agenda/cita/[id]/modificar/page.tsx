import Link from "next/link";
import { notFound } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { diaLocal, horaLocal, minutosAhora } from "@/lib/tiempo";
import { FormularioCita } from "../../../nueva/FormularioCita";
import { datosParaCita } from "../../../nueva/datos";

export const metadata = { title: "Modificar cita · Nura" };
export const dynamic = "force-dynamic";

export default async function ModificarCita({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const { supabase, salon } = await contextoBarberia();
  const { data: cita } = await supabase
    .from("citas")
    .select("id, inicio, estado, estilista_id, servicio_id, cliente_id, notas")
    .eq("id", id)
    .eq("salon_id", salon.id)
    .maybeSingle();
  if (!cita) notFound();

  const viva = cita.estado === "por_confirmar" || cita.estado === "confirmada";
  const { hoy, dias, equipo, servicios, clientes, ocupados } = await datosParaCita(supabase, salon.id, cita.id);
  const dia = diaLocal(cita.inicio);

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href={`/agenda/cita/${cita.id}`} className="volver">
          <Icono nombre="atras" tamano={18} />
          Cita
        </Link>
        <h1 className="titulo">Modificar cita</h1>
        {!viva ? (
          <p className="aviso aviso-neutro">Esta cita ya se completó o se canceló, así que no se puede modificar.</p>
        ) : (
          <FormularioCita
            dias={dias}
            hoy={hoy}
            ahora={minutosAhora()}
            diaInicial={dias.includes(dia) ? dia : hoy}
            horaInicial={horaLocal(cita.inicio)}
            estilistaInicial={equipo.find((e) => e.id === cita.estilista_id)?.id ?? equipo[0]?.id ?? ""}
            equipo={equipo}
            servicios={servicios}
            clientes={clientes}
            ocupados={ocupados}
            clienteInicial={cita.cliente_id ?? undefined}
            cita={{ id: cita.id, servicio_id: cita.servicio_id, notas: cita.notas }}
          />
        )}
      </div>
    </main>
  );
}

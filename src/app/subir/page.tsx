import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { aInstante, diaLocal, etiquetaDia, horaLocal, hoyLocal, sumarDias } from "@/lib/tiempo";
import { FormularioTrabajo, type CitaReciente } from "./FormularioTrabajo";

export const metadata = { title: "Subir trabajo · Nura" };
export const dynamic = "force-dynamic";

type Cita = {
  id: string;
  inicio: string;
  servicio_id: string | null;
  estilista_id: string;
  servicio: { nombre: string } | null;
  cliente: { nombre: string; tipo_cabello: string | null } | null;
};

export default async function Subir({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const { supabase, user, salon } = await contextoBarberia();
  const hoy = hoyLocal();

  const [{ data: servicios }, { data: equipo }, { data: datosCitas }] = await Promise.all([
    supabase.from("servicios").select("id, nombre, duracion_min, precio").eq("salon_id", salon.id).eq("activo", true).order("orden").order("creado_en"),
    supabase.from("estilistas").select("id, nombre, usuario_id").eq("salon_id", salon.id).eq("activo", true).order("creado_en"),
    supabase
      .from("citas")
      .select("id, inicio, servicio_id, estilista_id, servicio:servicios(nombre), cliente:clientes(nombre, tipo_cabello)")
      .eq("salon_id", salon.id)
      .in("estado", ["completada", "confirmada"])
      .gte("inicio", aInstante(sumarDias(hoy, -7), "00:00"))
      .lte("inicio", new Date().toISOString())
      .order("inicio", { ascending: false })
      .limit(8),
  ]);

  const citas: CitaReciente[] = ((datosCitas ?? []) as unknown as Cita[]).map((c) => {
    const dia = diaLocal(c.inicio);
    const cuando = dia === hoy ? "Hoy" : dia === sumarDias(hoy, -1) ? "Ayer" : `${etiquetaDia(dia).corto} ${etiquetaDia(dia).numero}`;
    return {
      id: c.id,
      etiqueta: [`${cuando} ${horaLocal(c.inicio)}`, c.servicio?.nombre, c.cliente?.nombre.split(" ")[0]].filter(Boolean).join(" · "),
      servicio_id: c.servicio_id,
      estilista_id: c.estilista_id,
      cliente_nombre: c.cliente?.nombre ?? null,
      cliente_cabello: c.cliente?.tipo_cabello ?? null,
    };
  });

  return (
    <main className="pantalla">
      <div className="contenido">
        <div className="fila-separada">
          <h1 className="titulo">Subir trabajo</h1>
          <Link href="/trabajos" className="meta" style={{ color: "var(--accion-500)", fontWeight: 700, textDecoration: "none" }}>
            Ver mis trabajos
          </Link>
        </div>
        {!servicios || servicios.length === 0 ? (
          <>
            <p className="aviso aviso-neutro">Para subir un trabajo primero agrega tus servicios con su precio.</p>
            <Link className="btn" href="/servicios">
              Agregar servicios
            </Link>
          </>
        ) : (
          <FormularioTrabajo
            salonId={salon.id}
            colonia={salon.colonia}
            servicios={servicios}
            equipo={equipo ?? []}
            estilistaPropio={(equipo ?? []).find((e) => e.usuario_id === user.id)?.id}
            citas={citas}
            citaInicial={sp.cita}
          />
        )}
      </div>
      <BarraBarberia activa="subir" />
    </main>
  );
}

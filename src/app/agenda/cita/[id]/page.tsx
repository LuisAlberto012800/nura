import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { duracionTexto, pesos } from "@/lib/formato";
import { aMinutos, diaLocal, fechaLarga, horaLocal } from "@/lib/tiempo";
import { cambiarEstado } from "../../acciones";

export const metadata = { title: "Cita · Nura" };
export const dynamic = "force-dynamic";

type Cita = {
  id: string;
  inicio: string;
  fin: string;
  estado: "por_confirmar" | "confirmada" | "completada" | "no_asistio" | "cancelada";
  precio: number | null;
  notas: string | null;
  estilista_id: string;
  cliente: { nombre: string; telefono: string | null } | null;
  servicio: { nombre: string } | null;
  estilista: { nombre: string } | null;
};

const ESTADOS: Record<Cita["estado"], { texto: string; clase: string }> = {
  por_confirmar: { texto: "Por confirmar", clase: "aviso-azul" },
  confirmada: { texto: "Confirmada", clase: "aviso-neutro" },
  completada: { texto: "Completada", clase: "aviso-exito" },
  no_asistio: { texto: "No asistió", clase: "aviso-neutro" },
  cancelada: { texto: "Cancelada", clase: "aviso-error" },
};

function Boton({ id, estado, texto, clase }: { id: string; estado: string; texto: string; clase: string }) {
  return (
    <form action={cambiarEstado}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button type="submit" className={clase}>
        {texto}
      </button>
    </form>
  );
}

export default async function DetalleCita({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // Las reglas de la base de datos solo devuelven citas del salón propio.
  const { data } = await supabase
    .from("citas")
    .select(
      "id, inicio, fin, estado, precio, notas, estilista_id, cliente:clientes(nombre, telefono), servicio:servicios(nombre), estilista:estilistas(nombre)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const cita = data as unknown as Cita;

  const dia = diaLocal(cita.inicio);
  const minutos = aMinutos(horaLocal(cita.fin)) - aMinutos(horaLocal(cita.inicio));
  const estado = ESTADOS[cita.estado];
  const viva = cita.estado === "confirmada" || cita.estado === "por_confirmar";
  const telefono = cita.cliente?.telefono;

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href={`/agenda?dia=${dia}&e=${cita.estilista_id}`} className="volver">
          <Icono nombre="atras" tamano={18} />
          Agenda
        </Link>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className={`aviso ${estado.clase}`} style={{ alignSelf: "flex-start", padding: "5px 10px", fontSize: 13, fontWeight: 700 }}>
            {estado.texto}
          </span>
          <h1 className="titulo">
            {horaLocal(cita.inicio)} · {cita.servicio?.nombre ?? "Cita"}
          </h1>
          <p className="subtitulo">
            {fechaLarga(dia)} · {horaLocal(cita.inicio)} a {horaLocal(cita.fin)}
            {minutos > 0 ? ` (${duracionTexto(minutos)})` : ""}
          </p>
        </div>

        <div className="tarjeta" style={{ gap: 4 }}>
          <span className="etiqueta">Cliente</span>
          <strong style={{ fontSize: 18 }}>{cita.cliente?.nombre ?? "Sin cliente"}</strong>
          {telefono && <span className="meta" style={{ userSelect: "all" }}>{telefono}</span>}
          {telefono && (
            <a className="btn btn-sec" style={{ marginTop: 8 }} href={`https://wa.me/52${telefono}`} target="_blank" rel="noopener noreferrer">
              Escribir por WhatsApp
            </a>
          )}
        </div>

        <div className="tarjeta" style={{ gap: 6 }}>
          <div className="fila-separada">
            <span className="meta">Atiende</span>
            <strong>{cita.estilista?.nombre}</strong>
          </div>
          <div className="fila-separada">
            <span className="meta">Precio</span>
            <strong className="precio">{cita.precio != null ? pesos(cita.precio) : "Sin precio"}</strong>
          </div>
          {cita.notas && (
            <div className="fila-separada">
              <span className="meta">Nota</span>
              <span>{cita.notas}</span>
            </div>
          )}
        </div>

        {viva && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cita.estado === "por_confirmar" && <Boton id={cita.id} estado="confirmada" texto="Confirmar la cita" clase="btn" />}
            <Boton id={cita.id} estado="completada" texto="Marcar como completada" clase={cita.estado === "por_confirmar" ? "btn btn-sec" : "btn"} />
            <Boton id={cita.id} estado="no_asistio" texto="No asistió" clase="btn btn-sec" />
            <Boton id={cita.id} estado="cancelada" texto="Cancelar la cita" clase="btn btn-peligro" />
          </div>
        )}
        {cita.estado === "cancelada" && <Boton id={cita.id} estado="confirmada" texto="Volver a agendarla en el mismo horario" clase="btn btn-sec" />}
        {cita.estado === "no_asistio" && <Boton id={cita.id} estado="completada" texto="Sí vino: marcar como completada" clase="btn btn-sec" />}
      </div>
    </main>
  );
}

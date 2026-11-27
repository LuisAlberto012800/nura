import Link from "next/link";
import { notFound } from "next/navigation";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { enlaceWhatsApp, haceCuanto, pesos, telefonoTexto, textoCabello } from "@/lib/formato";
import { diaLocal, etiquetaDia, horaLocal, hoyLocal } from "@/lib/tiempo";
import { FormularioCliente } from "../FormularioCliente";
import { BorrarCliente } from "../BorrarCliente";

export const metadata = { title: "Cliente · Nura" };
export const dynamic = "force-dynamic";

type Cita = {
  id: string;
  inicio: string;
  estado: "por_confirmar" | "confirmada" | "completada" | "no_asistio" | "cancelada";
  precio: number | null;
  servicio: { nombre: string } | null;
  estilista: { nombre: string } | null;
};

const ESTADO: Record<Cita["estado"], string> = {
  por_confirmar: "Por confirmar",
  confirmada: "Confirmada",
  completada: "",
  no_asistio: "No asistió",
  cancelada: "Cancelada",
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fechaCorta = (dia: string) => `${Number(dia.slice(8))} ${MESES[Number(dia.slice(5, 7)) - 1]}${dia.slice(0, 4) !== hoyLocal().slice(0, 4) ? ` ${dia.slice(0, 4)}` : ""}`;

export default async function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const { supabase, salon } = await contextoBarberia();

  const [{ data: cliente }, { data: datosCitas }, { data: trabajos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, telefono, tipo_cabello, notas, ultima_visita, origen")
      .eq("id", id)
      .eq("salon_id", salon.id)
      .maybeSingle(),
    supabase
      .from("citas")
      .select("id, inicio, estado, precio, servicio:servicios(nombre), estilista:estilistas(nombre)")
      .eq("salon_id", salon.id)
      .eq("cliente_id", id)
      .order("inicio", { ascending: false })
      .limit(100),
    supabase.from("trabajos").select("id, foto_despues").eq("salon_id", salon.id).eq("cliente_id", id).order("creado_en", { ascending: false }).limit(12),
  ]);
  if (!cliente) notFound();
  const citas = (datosCitas ?? []) as unknown as Cita[];
  const ahora = Date.now();
  const proxima = [...citas].reverse().find((c) => (c.estado === "confirmada" || c.estado === "por_confirmar") && Date.parse(c.inicio) > ahora);
  const historial = citas.filter((c) => c !== proxima);
  const completadas = citas.filter((c) => c.estado === "completada");
  const gastado = completadas.reduce((s, c) => s + (c.precio ?? 0), 0);
  const faltas = citas.filter((c) => c.estado === "no_asistio").length;
  const hoy = hoyLocal();
  const primerNombre = cliente.nombre.split(" ")[0];

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/clientes" className="volver">
          <Icono nombre="atras" tamano={18} />
          Clientes
        </Link>

        <div className="fila" style={{ gap: 14 }}>
          <span className="avatar">{cliente.nombre.charAt(0).toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <h1 className="titulo" style={{ fontSize: 24 }}>{cliente.nombre}</h1>
            <p className="meta" style={{ margin: 0 }}>
              {[cliente.telefono ? telefonoTexto(cliente.telefono) : "Sin celular", textoCabello(cliente.tipo_cabello)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="fila" style={{ gap: 10 }}>
          <Link className="btn" href={`/agenda/nueva?cliente=${cliente.id}`}>
            Agendar
          </Link>
          {cliente.telefono && (
            <a className="btn btn-sec" href={enlaceWhatsApp(cliente.telefono, `Hola ${primerNombre}, te escribo de ${salon.nombre}.`)} target="_blank" rel="noreferrer">
              <Icono nombre="mensaje" tamano={18} />
              WhatsApp
            </a>
          )}
        </div>

        {cliente.notas && <p className="aviso aviso-neutro" style={{ margin: 0, whiteSpace: "pre-line" }}>{cliente.notas}</p>}

        <div className="cifras">
          <div>
            <strong>{completadas.length}</strong>
            <span>visitas</span>
          </div>
          <div>
            <strong>{pesos(gastado)}</strong>
            <span>en total</span>
          </div>
          <div>
            <strong>{cliente.ultima_visita ? haceCuanto(cliente.ultima_visita, hoy).replace("hace ", "") : "—"}</strong>
            <span>{cliente.ultima_visita ? "desde que vino" : "sin visitas"}</span>
          </div>
          {faltas > 0 && (
            <div>
              <strong>{faltas}</strong>
              <span>{faltas === 1 ? "falta" : "faltas"}</span>
            </div>
          )}
        </div>

        {proxima && (
          <Link href={`/agenda/cita/${proxima.id}`} className="tarjeta proxima">
            <span className="etiqueta">Próxima cita</span>
            <strong>
              {etiquetaDia(diaLocal(proxima.inicio)).corto} {fechaCorta(diaLocal(proxima.inicio))} · {horaLocal(proxima.inicio)}
            </strong>
            <span className="meta">
              {proxima.servicio?.nombre ?? "Cita"}
              {proxima.estilista ? ` con ${proxima.estilista.nombre.split(" ")[0]}` : ""}
              {proxima.estado === "por_confirmar" ? " · por confirmar" : ""}
            </span>
          </Link>
        )}

        {(trabajos ?? []).length > 0 && (
          <section aria-labelledby="sus-trabajos" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 id="sus-trabajos" className="etiqueta">Sus trabajos</h2>
            <div className="galeria">
              {(trabajos ?? []).map((t) => (
                <Link key={t.id} href={`/trabajos/${t.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.foto_despues ?? ""} alt="" loading="lazy" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="historial" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 id="historial" className="etiqueta">Historial</h2>
          {historial.length > 0 ? (
            <ul className="lista-servicios">
              {historial.map((c) => (
                <li key={c.id}>
                  <Link href={`/agenda/cita/${c.id}`} className="fila-cliente">
                    <span className="fecha-historial">{fechaCorta(diaLocal(c.inicio))}</span>
                    <span className="servicio-info">
                      <strong style={{ color: c.estado === "cancelada" || c.estado === "no_asistio" ? "var(--tinta-400)" : undefined }}>
                        {c.servicio?.nombre ?? "Cita"}
                      </strong>
                      <span className="meta">
                        {[c.estilista?.nombre.split(" ")[0], ESTADO[c.estado]].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {c.precio != null && c.estado === "completada" && <span className="precio" style={{ fontSize: 15 }}>{pesos(c.precio)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="meta" style={{ margin: 0 }}>Todavía no tiene citas.</p>
          )}
        </section>

        <details className="tarjeta desplegable">
          <summary>Editar datos</summary>
          <FormularioCliente cliente={cliente} />
        </details>

        <BorrarCliente id={cliente.id} nombre={cliente.nombre} />
      </div>
      <BarraBarberia activa="clientes" />
    </main>
  );
}

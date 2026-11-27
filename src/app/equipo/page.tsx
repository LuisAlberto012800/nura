import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { urlBase } from "@/lib/url";
import { BotonCopiar } from "@/components/BotonCopiar";
import { responderSolicitud } from "./acciones";
import { DIAS, horaCorta } from "@/lib/horarios";
import { FormularioNuevo } from "./FormularioNuevo";

export const metadata = { title: "Equipo y horarios · Nura" };
export const dynamic = "force-dynamic";

type Estilista = {
  id: string;
  nombre: string;
  especialidades: string[];
  activo: boolean;
  usuario_id: string | null;
  horarios: { dia: number; inicio: string; fin: string }[];
};

// "Lun a sáb · 10:00 a 20:00" cuando todos los días tienen la misma hora; si no, los días.
function resumenHorario(h: Estilista["horarios"]): string {
  if (h.length === 0) return "Sin horario todavía";
  const orden = DIAS.map((d) => d.valor);
  const dias = [...h].sort((a, b) => orden.indexOf(a.dia) - orden.indexOf(b.dia));
  const nombres = dias.map((d) => DIAS.find((x) => x.valor === d.dia)!.texto.slice(0, 3).toLowerCase());
  const mismaHora = dias.every((d) => d.inicio === dias[0].inicio && d.fin === dias[0].fin);
  const lista = nombres.length > 2 && dias.every((d, i) => i === 0 || orden.indexOf(d.dia) === orden.indexOf(dias[i - 1].dia) + 1)
    ? `${nombres[0]} a ${nombres[nombres.length - 1]}`
    : nombres.join(", ");
  const texto = lista.charAt(0).toUpperCase() + lista.slice(1);
  return mismaHora ? `${texto} · ${horaCorta(dias[0].inicio)} a ${horaCorta(dias[0].fin)}` : `${texto} · horario por día`;
}

export default async function Equipo() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoEncargado();
  const [{ data }, { data: dSolicitudes }] = await Promise.all([
    supabase
      .from("estilistas")
      .select("id, nombre, especialidades, activo, usuario_id, horarios(dia, inicio, fin)")
      .eq("salon_id", salon.id)
      .order("creado_en"),
    supabase.from("solicitudes").select("id, nombre, creado_en").eq("salon_id", salon.id).eq("estado", "pendiente").order("creado_en"),
  ]);
  const equipo = (data ?? []) as Estilista[];
  const solicitudes = (dSolicitudes ?? []) as { id: string; nombre: string }[];
  const sinCuenta = equipo.filter((e) => e.activo && !e.usuario_id);
  const invitacion = `${await urlBase()}/unirme/${salon.slug}`;

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/cuenta" className="volver">
          <Icono nombre="atras" tamano={18} />
          Cuenta
        </Link>
        <div>
          <h1 className="titulo">Equipo y horarios</h1>
          <p className="subtitulo">Quién atiende y cuándo. La agenda solo ofrece horarios dentro de estas horas.</p>
        </div>

        {solicitudes.map((sol) => (
          <section key={sol.id} className="tarjeta tarjeta-azul" aria-label={`Solicitud de ${sol.nombre}`}>
            <strong style={{ fontSize: 16 }}>{sol.nombre} quiere unirse a tu equipo</strong>
            <span className="meta">Acepta solo si trabaja contigo. Podrá ver la agenda y los clientes, y subir sus trabajos. No podrá cambiar precios ni horarios.</span>
            <form action={responderSolicitud} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="hidden" name="solicitud" value={sol.id} />
              <input type="hidden" name="respuesta" value="aceptar" />
              {sinCuenta.length > 0 && (
                <label className="campo">
                  <span>Es su perfil</span>
                  <select name="estilista" defaultValue={sinCuenta.find((e) => e.nombre.split(" ")[0].toLowerCase() === sol.nombre.split(" ")[0].toLowerCase())?.id ?? ""}>
                    <option value="">Perfil nuevo</option>
                    {sinCuenta.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                  <small>Si ya lo tenías en tu equipo, elígelo para conservar su horario y sus citas.</small>
                </label>
              )}
              <button type="submit" className="btn">
                Aceptar
              </button>
            </form>
            <form action={responderSolicitud}>
              <input type="hidden" name="solicitud" value={sol.id} />
              <input type="hidden" name="respuesta" value="rechazar" />
              <button type="submit" className="btn btn-texto ancho" style={{ color: "var(--tinta-600)" }}>
                No trabaja aquí
              </button>
            </form>
          </section>
        ))}

        <ul className="lista-servicios">
          {equipo.map((e) => (
            <li key={e.id} className={e.activo ? undefined : "oculto"}>
              <Link href={`/equipo/${e.id}`} className="servicio-info">
                <strong>
                  {e.nombre}
                  {e.usuario_id && <span className="etiqueta-azul" style={{ marginLeft: 8, verticalAlign: "middle" }}>Con cuenta</span>}
                </strong>
                <span className="meta">
                  {e.activo ? resumenHorario(e.horarios) : "No aparece en la agenda ni en tu página"}
                </span>
                {e.especialidades.length > 0 && <span className="meta">{e.especialidades.join(" · ")}</span>}
              </Link>
              <span style={{ color: "var(--tinta-400)", display: "inline-flex" }}>
                <Icono nombre="siguiente" tamano={18} />
              </span>
            </li>
          ))}
        </ul>

        <section className="tarjeta" aria-labelledby="invitar">
          <h2 id="invitar" className="etiqueta">Invitar a tu equipo</h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--tinta-600)" }}>
            Mándales este enlace. Cada quien crea su cuenta y te llega su solicitud aquí para que la aceptes.
          </p>
          <p className="enlace-pagina">{invitacion.replace(/^https?:\/\//, "")}</p>
          <div className="fila" style={{ gap: 8 }}>
            <BotonCopiar texto={invitacion} etiqueta="Copiar" />
            <a className="btn btn-sec" href={`https://wa.me/?text=${encodeURIComponent(`Únete al equipo de ${salon.nombre} en Nura para ver tu agenda: ${invitacion}`)}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </section>

        <section className="tarjeta" aria-labelledby="nuevo">
          <h2 id="nuevo" className="etiqueta">Agregar sin cuenta</h2>
          <FormularioNuevo />
        </section>
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

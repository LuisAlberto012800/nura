import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { urlBase } from "@/lib/url";
import { cambiarActivo, responderSolicitud } from "./acciones";
import { DIAS, horaCorta } from "@/lib/horarios";
import { textoTurnos, turnosDelDia } from "@/lib/disponibilidad";
import { aInstante, hoyLocal, sumarDias } from "@/lib/tiempo";
import { AgregarBarbero } from "./AgregarBarbero";
import { MasBarbero } from "./MasBarbero";

export const metadata = { title: "Equipo y horarios · Nura" };
export const dynamic = "force-dynamic";

type Estilista = {
  id: string;
  nombre: string;
  especialidades: string[];
  activo: boolean;
  usuario_id: string | null;
  foto_url: string | null;
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
  const { supabase, salon, user } = await contextoEncargado();
  const hoy = hoyLocal();
  const [{ data }, { data: dSolicitudes }, { data: dCitas }] = await Promise.all([
    supabase
      .from("estilistas")
      .select("id, nombre, especialidades, activo, usuario_id, foto_url, horarios(dia, inicio, fin)")
      .eq("salon_id", salon.id)
      .order("creado_en"),
    supabase.from("solicitudes").select("id, nombre, creado_en").eq("salon_id", salon.id).eq("estado", "pendiente").order("creado_en"),
    // Citas pendientes de cada quien (para la tarjeta y para avisar antes de dar de baja).
    supabase
      .from("citas")
      .select("estilista_id, inicio")
      .eq("salon_id", salon.id)
      .in("estado", ["por_confirmar", "confirmada"])
      .gte("inicio", new Date().toISOString())
      .limit(2000),
  ]);
  const finSemana = aInstante(sumarDias(hoy, 7), "00:00");
  const pendientes = new Map<string, { total: number; semana: number }>();
  for (const c of (dCitas ?? []) as { estilista_id: string; inicio: string }[]) {
    const p = pendientes.get(c.estilista_id) ?? { total: 0, semana: 0 };
    p.total += 1;
    if (Date.parse(c.inicio) < Date.parse(finSemana)) p.semana += 1;
    pendientes.set(c.estilista_id, p);
  }
  const equipo = (data ?? []) as Estilista[];
  const solicitudes = (dSolicitudes ?? []) as { id: string; nombre: string }[];
  const sinCuenta = equipo.filter((e) => e.activo && !e.usuario_id);
  const activos = equipo.filter((e) => e.activo);
  const inactivos = equipo.filter((e) => !e.activo);
  const invitacion = `${await urlBase()}/unirme/${salon.slug}`;

  return (
    <main className="pantalla">
      <div className="contenido">
        <div>
          <h1 className="titulo">Equipo y horarios</h1>
          <p className="subtitulo">
            {activos.length} {activos.length === 1 ? "barbero activo" : "barberos activos"}. La agenda solo ofrece horas dentro de su horario.
          </p>
        </div>
        <AgregarBarbero invitacion={invitacion} salon={salon.nombre} />

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

        <section aria-labelledby="activos" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 id="activos" className="etiqueta">Activos</h2>
          {activos.length === 0 && <p className="meta" style={{ margin: 0 }}>Todavía no hay nadie. Toca Agregar barbero.</p>}
          <ul className="lista-equipo">
            {activos.map((e) => {
              const hoyTurnos = turnosDelDia(e.horarios, hoy);
              const citas = pendientes.get(e.id) ?? { total: 0, semana: 0 };
              const esYo = e.usuario_id === user.id;
              return (
                <li key={e.id} className="barbero">
                  <div className="barbero-cabeza">
                    {e.foto_url ? (
                      <span className="avatar-foto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.foto_url} alt="" />
                      </span>
                    ) : (
                      <span className="avatar avatar-sm">{e.nombre.charAt(0).toUpperCase()}</span>
                    )}
                    <div className="barbero-datos">
                      <strong>
                        {e.nombre}
                        {esYo ? <span className="meta"> · tú</span> : e.usuario_id ? <span className="etiqueta-azul">Con cuenta</span> : null}
                      </strong>
                      <span className={hoyTurnos.length ? "barbero-hoy" : "meta"}>
                        {e.horarios.length === 0 ? "Falta su horario" : hoyTurnos.length ? `Hoy ${textoTurnos(hoyTurnos)}` : "Hoy descansa"}
                        {citas.semana > 0 && ` · ${citas.semana} ${citas.semana === 1 ? "cita" : "citas"} esta semana`}
                      </span>
                      {e.horarios.length > 0 && <span className="meta">{resumenHorario(e.horarios)}</span>}
                      {e.especialidades.length > 0 && <span className="meta">{e.especialidades.join(" · ")}</span>}
                    </div>
                  </div>
                  <div className="barbero-acciones">
                    <Link href={`/equipo/${e.id}`} className={`btn ${e.horarios.length === 0 ? "" : "btn-sec"}`}>
                      {e.horarios.length === 0 ? "Poner horario" : "Horario y datos"}
                    </Link>
                    <Link href={`/agenda?e=${e.id}`} className="btn btn-sec">
                      Agenda
                    </Link>
                    <MasBarbero id={e.id} nombre={e.nombre} conCuenta={!!e.usuario_id} esYo={esYo} citas={citas.total} invitacion={invitacion} salon={salon.nombre} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {inactivos.length > 0 && (
          <details className="tarjeta inactivos">
            <summary>
              Ya no trabajan aquí ({inactivos.length})
              <Icono nombre="siguiente" tamano={16} />
            </summary>
            <ul className="lista-servicios">
              {inactivos.map((e) => (
                <li key={e.id} className="oculto">
                  <span className="avatar avatar-sm">{e.nombre.charAt(0).toUpperCase()}</span>
                  <span className="servicio-info">
                    <strong>{e.nombre}</strong>
                    <span className="meta">No aparece en la agenda ni en tu página</span>
                  </span>
                  <form action={cambiarActivo}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="activo" value="false" />
                    <button type="submit" className="btn btn-sec" style={{ width: "auto", padding: "0 14px" }}>
                      Reactivar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

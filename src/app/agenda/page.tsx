import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import {
  aInstante,
  aMinutos,
  deMinutos,
  diaSemana,
  esDiaValido,
  etiquetaDia,
  fechaLarga,
  horaLocal,
  hoyLocal,
  sumarDias,
} from "@/lib/tiempo";
import { cambiarEstado, quitarBloqueo } from "./acciones";

export const metadata = { title: "Agenda · Nura" };
export const dynamic = "force-dynamic";

const ALTO_MEDIA_HORA = 48; // px por cada 30 minutos

type Estilista = { id: string; nombre: string; horarios: { dia: number; inicio: string; fin: string }[] };
type Cita = {
  id: string;
  inicio: string;
  fin: string;
  estado: "por_confirmar" | "confirmada" | "completada" | "no_asistio";
  cliente: { nombre: string } | null;
  servicio: { nombre: string } | null;
};
type Bloqueo = { id: string; inicio: string; fin: string; motivo: string | null };

const ESTADO_TEXTO: Record<Cita["estado"], string> = {
  por_confirmar: "por confirmar",
  confirmada: "",
  completada: "completada",
  no_asistio: "no asistió",
};

export default async function Agenda({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) redirect("/alta");

  const hoy = hoyLocal();
  const dia = esDiaValido(sp.dia) ? sp.dia : hoy;

  const { data: datosEquipo } = await supabase
    .from("estilistas")
    .select("id, nombre, horarios(dia, inicio, fin)")
    .eq("salon_id", salon.id)
    .eq("activo", true)
    .order("creado_en");
  const equipo = (datosEquipo ?? []) as Estilista[];

  if (equipo.length === 0) {
    return (
      <main className="pantalla">
        <div className="contenido">
          <h1 className="titulo">Agenda</h1>
          <p className="aviso aviso-neutro">Primero agrega a alguien del equipo con su horario.</p>
          <Link className="btn" href="/equipo">
            Ir a Equipo y horarios
          </Link>
        </div>
        <BarraBarberia activa="agenda" />
      </main>
    );
  }

  const estilista = equipo.find((e) => e.id === sp.e) ?? equipo[0];
  const desde = aInstante(dia, "00:00");
  const hasta = aInstante(sumarDias(dia, 1), "00:00");

  const [{ data: datosCitas }, { data: datosBloqueos }] = await Promise.all([
    supabase
      .from("citas")
      .select("id, inicio, fin, estado, cliente:clientes(nombre), servicio:servicios(nombre)")
      .eq("salon_id", salon.id)
      .eq("estilista_id", estilista.id)
      .neq("estado", "cancelada")
      .gte("inicio", desde)
      .lt("inicio", hasta)
      .order("inicio"),
    supabase
      .from("bloqueos")
      .select("id, inicio, fin, motivo")
      .eq("salon_id", salon.id)
      .eq("estilista_id", estilista.id)
      .lt("inicio", hasta)
      .gt("fin", desde)
      .order("inicio"),
  ]);
  const citas = (datosCitas ?? []) as unknown as Cita[];
  const bloqueos = (datosBloqueos ?? []) as Bloqueo[];

  // Rango visible: el horario del día, ampliado si hay citas fuera de él.
  const horario = estilista.horarios.find((h) => h.dia === diaSemana(dia));
  const minutosDe = (instante: string) => aMinutos(horaLocal(instante));
  let inicioVista = horario ? aMinutos(horario.inicio) : 9 * 60;
  let finVista = horario ? aMinutos(horario.fin) : 20 * 60;
  for (const c of [...citas, ...bloqueos]) {
    inicioVista = Math.min(inicioVista, minutosDe(c.inicio));
    finVista = Math.max(finVista, Math.min(24 * 60, minutosDe(c.fin) || 24 * 60));
  }
  inicioVista = Math.floor(inicioVista / 60) * 60;
  finVista = Math.ceil(finVista / 30) * 30;
  const franjas: number[] = [];
  for (let m = inicioVista; m < finVista; m += 30) franjas.push(m);
  const dentroDeHorario = (m: number) => !!horario && m >= aMinutos(horario.inicio) && m < aMinutos(horario.fin);
  const y = (m: number) => ((m - inicioVista) / 30) * ALTO_MEDIA_HORA;

  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));
  // Los días pasados se pueden consultar, pero no agendar.
  const pasado = dia < hoy;
  const diaParaAgendar = pasado ? hoy : dia;
  const consulta = (d: string) => `/agenda?dia=${d}&e=${estilista.id}`;
  const citaCancelada = sp.cancelada;

  return (
    <main className="pantalla">
      <div className="contenido">
        <div className="fila-separada">
          <div>
            <h1 className="titulo">Agenda</h1>
            <p className="subtitulo">{fechaLarga(dia)}</p>
          </div>
          <div className="fila" style={{ gap: 6 }}>
            <Link className="boton-icono" href={consulta(sumarDias(dia, -1))} aria-label="Día anterior">
              <Icono nombre="atras" tamano={18} />
            </Link>
            <Link className="boton-icono" href={consulta(sumarDias(dia, 1))} aria-label="Día siguiente">
              <Icono nombre="siguiente" tamano={18} />
            </Link>
          </div>
        </div>

        <nav className="tira-dias" aria-label="Elegir día">
          {dias.map((d) => {
            const { corto, numero } = etiquetaDia(d);
            return (
              <Link
                key={d}
                href={consulta(d)}
                className={`dia-chip${d === dia ? " activo" : ""}${estilista.horarios.some((h) => h.dia === diaSemana(d)) ? "" : " descansa"}`}
                aria-current={d === dia ? "date" : undefined}
              >
                <span>{d === hoy ? "Hoy" : corto}</span>
                <strong>{numero}</strong>
              </Link>
            );
          })}
        </nav>

        {equipo.length > 1 && (
          <nav className="chips-equipo" aria-label="Elegir estilista">
            {equipo.map((e) => (
              <Link key={e.id} href={`/agenda?dia=${dia}&e=${e.id}`} className={`chip${e.id === estilista.id ? " activo" : ""}`}>
                {e.nombre.split(" ")[0]}
              </Link>
            ))}
          </nav>
        )}

        <div className="fila acciones-agenda" style={{ gap: 10 }}>
          <Link className="btn" href={`/agenda/nueva?dia=${diaParaAgendar}&e=${estilista.id}`}>
            Nueva cita
          </Link>
          <Link className="btn btn-sec" href={`/agenda/bloquear?dia=${dia}&e=${estilista.id}`}>
            Bloquear horario
          </Link>
        </div>

        {citaCancelada && (
          <form action={cambiarEstado} className="aviso-deshacer" role="status">
            <span>Cita cancelada.</span>
            <input type="hidden" name="id" value={citaCancelada} />
            <input type="hidden" name="estado" value="confirmada" />
            <button type="submit">Deshacer</button>
          </form>
        )}
        {sp.aviso === "ocupado" && (
          <p className="aviso aviso-error" role="alert">No se pudo deshacer: ese horario ya lo ocupa otra cita.</p>
        )}

        <p className="meta" style={{ margin: 0 }}>
          {pasado
            ? "Este día ya pasó. Puedes consultarlo, pero las citas nuevas son de hoy en adelante."
            : horario
            ? `${estilista.nombre.split(" ")[0]} atiende de ${horario.inicio.slice(0, 5)} a ${horario.fin.slice(0, 5)}. Toca una hora libre para agendar.`
            : `${estilista.nombre.split(" ")[0]} descansa este día. No se pueden agendar citas.`}
        </p>

        <div className="linea-tiempo" style={{ height: franjas.length * ALTO_MEDIA_HORA }}>
          {franjas.map((m) =>
            dentroDeHorario(m) && !pasado ? (
              <Link
                key={m}
                href={`/agenda/nueva?dia=${dia}&e=${estilista.id}&hora=${deMinutos(m)}`}
                className={`franja${m % 60 === 0 ? " en-punto" : ""}`}
                style={{ top: y(m), height: ALTO_MEDIA_HORA }}
                aria-label={`Agendar a las ${deMinutos(m)}`}
              >
                <span>{m % 60 === 0 ? deMinutos(m) : ""}</span>
              </Link>
            ) : (
              <div
                key={m}
                className={`franja${m % 60 === 0 ? " en-punto" : ""}${dentroDeHorario(m) ? "" : " fuera"}`}
                style={{ top: y(m), height: ALTO_MEDIA_HORA }}
                aria-hidden="true"
              >
                <span>{m % 60 === 0 ? deMinutos(m) : ""}</span>
              </div>
            ),
          )}

          {bloqueos.map((b) => {
            const a = Math.max(inicioVista, minutosDe(b.inicio));
            const z = Math.min(finVista, minutosDe(b.fin) || 24 * 60);
            return (
              <div key={b.id} className="bloque bloqueo" style={{ top: y(a) + 2, height: Math.max(y(z) - y(a) - 4, 28) }}>
                <div>
                  <strong>{b.motivo || "Bloqueado"}</strong>
                  <span>
                    {horaLocal(b.inicio)} a {horaLocal(b.fin)}
                  </span>
                </div>
                <form action={quitarBloqueo}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="dia" value={dia} />
                  <input type="hidden" name="estilista_id" value={estilista.id} />
                  <button type="submit" aria-label="Quitar bloqueo">Quitar</button>
                </form>
              </div>
            );
          })}

          {citas.map((c) => {
            const a = minutosDe(c.inicio);
            const z = minutosDe(c.fin) || 24 * 60;
            return (
              <Link
                key={c.id}
                href={`/agenda/cita/${c.id}`}
                className={`bloque cita ${c.estado}`}
                style={{ top: y(a) + 2, height: Math.max(y(z) - y(a) - 4, 28) }}
              >
                <strong>
                  {horaLocal(c.inicio)} · {c.servicio?.nombre ?? "Cita"}
                </strong>
                <span>
                  {c.cliente?.nombre ?? "Sin cliente"}
                  {ESTADO_TEXTO[c.estado] ? ` · ${ESTADO_TEXTO[c.estado]}` : ""}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
      <BarraBarberia activa="agenda" />
    </main>
  );
}

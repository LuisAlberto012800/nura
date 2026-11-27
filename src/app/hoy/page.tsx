import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { pesos } from "@/lib/formato";
import { insightsActivo } from "@/lib/insights";
import { aInstante, diaLocal, diaSemana, etiquetaDia, fechaLarga, horaLocal, hoyLocal, sumarDias } from "@/lib/tiempo";
import { cambiarEstado } from "../agenda/acciones";

type Cita = {
  id: string;
  inicio: string;
  estado: "por_confirmar" | "confirmada" | "completada";
  precio: number | null;
  cliente: { nombre: string } | null;
  servicio: { nombre: string } | null;
  estilista: { nombre: string } | null;
};

export const metadata = { title: "Hoy · Nura" };
export const dynamic = "force-dynamic";

const CITA = "id, inicio, estado, precio, cliente:clientes(nombre), servicio:servicios(nombre), estilista:estilistas(nombre)";

export default async function Hoy() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, user, salon } = await contextoBarberia();
  const hoy = hoyLocal();

  const { data: yo } = await supabase.from("estilistas").select("id, nombre").eq("salon_id", salon.id).eq("usuario_id", user.id).maybeSingle();
  // El barbero ve sus propias citas; el encargado ve las de todo el equipo.
  const soloMias = salon.rol === "estilista" && yo ? yo.id : null;
  const mias: Record<string, string> = soloMias ? { estilista_id: soloMias } : {};

  const [{ data: datosHoy }, { data: datosPorConfirmar }, conteos, { data: dSolicitudes }] = await Promise.all([
    supabase
      .from("citas")
      .select(CITA)
      .eq("salon_id", salon.id)
      .match(mias)
      .in("estado", ["confirmada", "por_confirmar", "completada"])
      .gte("inicio", aInstante(hoy, "00:00"))
      .lt("inicio", aInstante(sumarDias(hoy, 1), "00:00"))
      .order("inicio"),
    supabase
      .from("citas")
      .select(CITA)
      .eq("salon_id", salon.id)
      .match(mias)
      .eq("estado", "por_confirmar")
      .gte("inicio", new Date().toISOString())
      .order("inicio")
      .limit(10),
    Promise.all(
      [
        supabase.from("servicios").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
        supabase.from("horarios").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
        supabase.from("trabajos").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
      ].map(async (q) => (await q).count ?? 0),
    ),
    salon.rol === "dueno"
      ? supabase.from("solicitudes").select("id, nombre").eq("salon_id", salon.id).eq("estado", "pendiente")
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
  ]);
  const solicitudes = (dSolicitudes ?? []) as { id: string; nombre: string }[];
  // Mensajes de clientes sin leer (si tiene chat en vivo).
  const { data: dChats } = await supabase.from("conversaciones").select("id, ultimo_mensaje_en, leido_salon_en").eq("salon_id", salon.id).eq("ultimo_autor", "cliente").limit(50);
  const sinLeer = ((dChats ?? []) as { ultimo_mensaje_en: string | null; leido_salon_en: string | null }[]).filter((c) => !c.leido_salon_en || (c.ultimo_mensaje_en ?? "") > c.leido_salon_en).length;

  // Esta semana (de lunes a hoy): citas completadas, lo cobrado y clientes nuevos.
  const lunes = sumarDias(hoy, -((diaSemana(hoy) + 6) % 7));
  const [{ data: dSemana }, { count: nuevos }] = await Promise.all([
    supabase
      .from("citas")
      .select("precio")
      .eq("salon_id", salon.id)
      .match(mias)
      .eq("estado", "completada")
      .gte("inicio", aInstante(lunes, "00:00"))
      .lt("inicio", aInstante(sumarDias(hoy, 1), "00:00")),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).gte("creado_en", aInstante(lunes, "00:00")),
  ]);
  const semana = (dSemana ?? []) as { precio: number | null }[];
  // Dinero y clientes nuevos: solo el encargado y solo con Nura Insights.
  const conInsights = salon.rol === "dueno" && (await insightsActivo(supabase, salon.id));
  const cobradoSemana = semana.reduce((t, c) => t + (c.precio ?? 0), 0);
  const [servicios, horarios, trabajos] = conteos;
  const citasHoy = (datosHoy ?? []) as unknown as Cita[];
  const porConfirmar = (datosPorConfirmar ?? []) as unknown as Cita[];
  const varios = new Set(citasHoy.map((c) => c.estilista?.nombre)).size > 1;
  const ahora = Date.now();
  const siguiente = citasHoy.find((c) => c.estado !== "completada" && Date.parse(c.inicio) >= ahora - 15 * 60_000);
  const esperado = citasHoy.reduce((s, c) => s + (c.precio ?? 0), 0);
  const cobrado = citasHoy.filter((c) => c.estado === "completada").reduce((s, c) => s + (c.precio ?? 0), 0);
  const primerNombre = (yo?.nombre ?? "").split(" ")[0];

  const pendientes = [
    { hecho: servicios > 0, texto: "Servicios y precios", href: "/servicios" },
    { hecho: horarios > 0, texto: "Equipo y horarios", href: "/equipo" },
    { hecho: trabajos >= 3, texto: `Sube 3 trabajos${trabajos > 0 && trabajos < 3 ? ` (llevas ${trabajos})` : ""}`, href: "/subir" },
    { hecho: salon.publicado, texto: "Publica tu página", href: "/cuenta" },
  ];
  const listos = pendientes.filter((p) => p.hecho).length;

  const filaCita = (c: Cita, conDia = false) => {
    const hecha = c.estado === "completada";
    const dia = diaLocal(c.inicio);
    return (
      <li key={c.id}>
        <Link href={`/agenda/cita/${c.id}`}>
          <span className="hora" style={{ color: hecha ? "var(--tinta-400)" : undefined }}>
            {conDia && dia !== hoy ? `${etiquetaDia(dia).corto} ${etiquetaDia(dia).numero}` : horaLocal(c.inicio)}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: 14, color: hecha ? "var(--tinta-400)" : undefined }}>
              {c.servicio?.nombre ?? "Cita"} · {c.cliente?.nombre?.split(" ")[0] ?? "Sin cliente"}
            </strong>
            <span className="meta">
              {conDia ? `${dia === hoy ? "Hoy" : ""} ${horaLocal(c.inicio)}`.trim() : hecha ? "Completada" : c.estado === "por_confirmar" ? "Por confirmar" : "Confirmada"}
              {(varios || conDia) && c.estilista ? ` · con ${c.estilista.nombre.split(" ")[0]}` : ""}
            </span>
          </span>
          {!conDia && <Icono nombre="siguiente" tamano={16} />}
        </Link>
        {conDia && (
          <form action={cambiarEstado}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="estado" value="confirmada" />
            <input type="hidden" name="volver" value="/hoy" />
            <button type="submit" className="btn-mini">
              Confirmar
            </button>
          </form>
        )}
      </li>
    );
  };

  return (
    <main className="pantalla">
      <div className="contenido">
        <div className="fila-separada">
          <div>
            <h1 className="titulo">{primerNombre ? `Hola, ${primerNombre}` : "Hola"}</h1>
            <p className="subtitulo">{fechaLarga(hoy)}</p>
          </div>
          <Logo alto={22} />
        </div>

        {solicitudes.length > 0 && (
          <Link href="/equipo" className="tarjeta tarjeta-azul enlace-unirme">
            <span>
              <strong>
                {solicitudes.length === 1 ? `${solicitudes[0].nombre} quiere unirse a tu equipo` : `${solicitudes.length} barberos quieren unirse a tu equipo`}
              </strong>
              <span className="meta">Confirma que trabajan contigo.</span>
            </span>
            <Icono nombre="siguiente" tamano={18} />
          </Link>
        )}

        {sinLeer > 0 && (
          <Link href="/mensajes" className="tarjeta tarjeta-azul enlace-unirme">
            <span>
              <strong>{sinLeer === 1 ? "1 mensaje sin leer" : `${sinLeer} mensajes sin leer`}</strong>
              <span className="meta">Clientes que te escribieron por el chat.</span>
            </span>
            <Icono nombre="siguiente" tamano={18} />
          </Link>
        )}

        {porConfirmar.length > 0 && (
          <section className="tarjeta tarjeta-azul" aria-labelledby="reservas">
            <h2 id="reservas" className="etiqueta" style={{ color: "var(--azul-700)" }}>
              {porConfirmar.length === 1 ? "1 reserva por confirmar" : `${porConfirmar.length} reservas por confirmar`}
            </h2>
            <ul className="lista-citas">{porConfirmar.map((c) => filaCita(c, true))}</ul>
          </section>
        )}

        {citasHoy.length > 0 && (
          <div className="cifras">
            <div>
              <strong>{citasHoy.length}</strong>
              <span>{citasHoy.length === 1 ? "cita hoy" : "citas hoy"}</span>
            </div>
            {conInsights && (
              <div>
                <strong>{pesos(cobrado)}</strong>
                <span>de {pesos(esperado)}</span>
              </div>
            )}
            <div>
              <strong>{siguiente ? horaLocal(siguiente.inicio) : "—"}</strong>
              <span>{siguiente ? "la siguiente" : "sin más citas"}</span>
            </div>
          </div>
        )}

        <section className="tarjeta" aria-labelledby="citas-hoy">
          <div className="fila-separada">
            <h2 id="citas-hoy" className="etiqueta">Citas de hoy</h2>
            <Link href="/agenda/nueva" className="meta" style={{ color: "var(--accion-500)", fontWeight: 700, textDecoration: "none" }}>
              Nueva cita
            </Link>
          </div>
          {citasHoy.length > 0 ? (
            <ul className="lista-citas">{citasHoy.map((c) => filaCita(c))}</ul>
          ) : (
            <p className="meta" style={{ margin: 0 }}>No tienes citas hoy.</p>
          )}
        </section>

        {conInsights ? (
          <Link href="/negocio" className="tarjeta-enlace" aria-label="Ver los números de tu negocio">
            <div className="fila-separada">
              <h2 className="etiqueta">Esta semana</h2>
              <span className="meta" style={{ color: "var(--accion-500)", fontWeight: 700 }}>Ver Negocio</span>
            </div>
            <div className="estadisticas">
              <div>
                <strong>{semana.length}</strong>
                <span>{semana.length === 1 ? "cita completada" : "citas completadas"}</span>
              </div>
              <div>
                <strong>{pesos(cobradoSemana)}</strong>
                <span>cobrado</span>
              </div>
              <div>
                <strong>{nuevos ?? 0}</strong>
                <span>{nuevos === 1 ? "cliente nuevo" : "clientes nuevos"}</span>
              </div>
            </div>
          </Link>
        ) : salon.rol === "dueno" && listos === pendientes.length ? (
          <Link href="/negocio" className="tarjeta enlace-unirme">
            <span>
              <strong>¿Cuánto cobraste esta semana?</strong>
              <span className="meta">Con Nura Insights ves tu dinero y qué clientes regresan.</span>
            </span>
            <Icono nombre="siguiente" tamano={18} />
          </Link>
        ) : null}

        {salon.rol === "dueno" && listos < pendientes.length && (
          <section className="tarjeta" aria-labelledby="pendientes">
            <div className="fila-separada">
              <h2 id="pendientes" className="etiqueta">Para recibir reservas</h2>
              <span className="meta">
                {listos} de {pendientes.length}
              </span>
            </div>
            <div className="progreso" aria-hidden="true">
              {pendientes.map((p) => (
                <span key={p.href} className={p.hecho ? "lleno" : undefined} />
              ))}
            </div>
            <ul className="lista-pendientes">
              {pendientes.map((p) => (
                <li key={p.href}>
                  <span className={`paso${p.hecho ? " hecho" : ""}`}>
                    <Icono nombre={p.hecho ? "check" : "reloj"} tamano={15} grosor={2.2} />
                  </span>
                  <Link href={p.href} className="pendiente-enlace">
                    <span style={{ color: p.hecho ? "var(--tinta-400)" : "var(--tinta-900)" }}>{p.texto}</span>
                    {!p.hecho && <Icono nombre="siguiente" tamano={18} />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <BarraBarberia activa="hoy" />
    </main>
  );
}

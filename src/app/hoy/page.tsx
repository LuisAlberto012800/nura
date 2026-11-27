import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { pesos } from "@/lib/formato";
import { aInstante, diaLocal, etiquetaDia, fechaLarga, horaLocal, hoyLocal, sumarDias } from "@/lib/tiempo";
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

  const [{ data: yo }, { data: datosHoy }, { data: datosPorConfirmar }, conteos] = await Promise.all([
    supabase.from("estilistas").select("nombre").eq("salon_id", salon.id).eq("usuario_id", user.id).maybeSingle(),
    supabase
      .from("citas")
      .select(CITA)
      .eq("salon_id", salon.id)
      .in("estado", ["confirmada", "por_confirmar", "completada"])
      .gte("inicio", aInstante(hoy, "00:00"))
      .lt("inicio", aInstante(sumarDias(hoy, 1), "00:00"))
      .order("inicio"),
    supabase
      .from("citas")
      .select(CITA)
      .eq("salon_id", salon.id)
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
  ]);
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
            <div>
              <strong>{pesos(cobrado)}</strong>
              <span>de {pesos(esperado)}</span>
            </div>
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

        {listos < pendientes.length && (
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

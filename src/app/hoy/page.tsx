import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { aInstante, horaLocal, hoyLocal, sumarDias } from "@/lib/tiempo";
import { salir } from "./acciones";

type CitaHoy = {
  id: string;
  inicio: string;
  estado: string;
  cliente: { nombre: string } | null;
  servicio: { nombre: string } | null;
  estilista: { nombre: string } | null;
};

export const metadata = { title: "Hoy · Nura" };
export const dynamic = "force-dynamic";

const ZONA = "America/Mexico_City";

function fechaDeHoy() {
  const texto = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA }).format(new Date());
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

async function contar(supabase: Awaited<ReturnType<typeof crearClienteServidor>>, tabla: string, salonId: string) {
  const { count } = await supabase.from(tabla).select("id", { count: "exact", head: true }).eq("salon_id", salonId);
  return count ?? 0;
}

export default async function Hoy() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) redirect("/alta");

  const { data: yo } = await supabase
    .from("estilistas")
    .select("nombre")
    .eq("salon_id", salon.id)
    .eq("usuario_id", user.id)
    .maybeSingle();
  const [servicios, trabajos, clientes, horarios] = await Promise.all([
    contar(supabase, "servicios", salon.id),
    contar(supabase, "trabajos", salon.id),
    contar(supabase, "clientes", salon.id),
    contar(supabase, "horarios", salon.id),
  ]);
  const primerNombre = (yo?.nombre ?? "").split(" ")[0];

  const hoy = hoyLocal();
  const { data: datosCitas } = await supabase
    .from("citas")
    .select("id, inicio, estado, cliente:clientes(nombre), servicio:servicios(nombre), estilista:estilistas(nombre)")
    .eq("salon_id", salon.id)
    .in("estado", ["confirmada", "por_confirmar", "completada"])
    .gte("inicio", aInstante(hoy, "00:00"))
    .lt("inicio", aInstante(sumarDias(hoy, 1), "00:00"))
    .order("inicio");
  const citasHoy = (datosCitas ?? []) as unknown as CitaHoy[];
  const variosEstilistas = new Set(citasHoy.map((c) => c.estilista?.nombre)).size > 1;

  const pendientes: { hecho: boolean; texto: string; href?: string }[] = [
    { hecho: true, texto: "Datos de tu barbería" },
    { hecho: servicios > 0, texto: "Servicios y precios", href: "/servicios" },
    { hecho: trabajos >= 3, texto: "Tus primeros 3 trabajos" },
    { hecho: horarios > 0, texto: "Equipo y horarios", href: "/equipo" },
  ];
  const listos = pendientes.filter((p) => p.hecho).length;

  return (
    <main className="pantalla">
      <div className="contenido">
        <div className="fila-separada">
          <div>
            <h1 className="titulo">{primerNombre ? `Hola, ${primerNombre}` : "Hola"}</h1>
            <p className="subtitulo">{fechaDeHoy()}</p>
          </div>
          <Logo alto={22} />
        </div>

        <div className="tarjeta" style={{ gap: 6 }}>
          <span className="etiqueta">Tu barbería</span>
          <strong style={{ fontSize: 18 }}>{salon.nombre}</strong>
          <span className="meta">
            {salon.colonia} · enlace de tu página: /{salon.slug}
          </span>
        </div>

        <section className="tarjeta" aria-labelledby="citas-hoy">
          <div className="fila-separada">
            <h2 id="citas-hoy" className="etiqueta">Citas de hoy · {citasHoy.length}</h2>
            <Link href="/agenda" className="meta" style={{ color: "var(--accion-500)", fontWeight: 700, textDecoration: "none" }}>
              Ver agenda
            </Link>
          </div>
          {citasHoy.length > 0 ? (
            <ul className="lista-citas">
              {citasHoy.map((c) => (
                <li key={c.id}>
                  <Link href={`/agenda/cita/${c.id}`}>
                    <span className="hora" style={{ color: c.estado === "completada" ? "var(--tinta-400)" : undefined }}>
                      {horaLocal(c.inicio)}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 14, color: c.estado === "completada" ? "var(--tinta-400)" : undefined }}>
                        {c.servicio?.nombre ?? "Cita"} · {c.cliente?.nombre?.split(" ")[0] ?? "Sin cliente"}
                      </strong>
                      <span className="meta">
                        {c.estado === "completada" ? "Completada" : c.estado === "por_confirmar" ? "Por confirmar" : "Confirmada"}
                        {variosEstilistas && c.estilista ? ` · con ${c.estilista.nombre.split(" ")[0]}` : ""}
                      </span>
                    </span>
                    <Icono nombre="siguiente" tamano={16} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="meta" style={{ margin: 0 }}>
              No tienes citas hoy. <Link href="/agenda/nueva">Agenda una</Link>.
            </p>
          )}
        </section>

        <section className="tarjeta" aria-labelledby="pendientes">
          <div className="fila-separada">
            <h2 id="pendientes" className="etiqueta">Para terminar tu alta</h2>
            <span className="meta">
              {listos} de {pendientes.length}
            </span>
          </div>
          <div className="progreso" aria-hidden="true">
            {pendientes.map((p) => (
              <span key={p.texto} className={p.hecho ? "lleno" : undefined} />
            ))}
          </div>
          <ul className="lista-pendientes">
            {pendientes.map((p) => (
              <li key={p.texto}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: p.hecho ? "var(--exito-500)" : "var(--superficie-200)",
                    color: p.hecho ? "#fff" : "var(--tinta-400)",
                  }}
                >
                  <Icono nombre={p.hecho ? "check" : "reloj"} tamano={15} grosor={2.2} />
                </span>
                {p.href ? (
                  <Link href={p.href} className="pendiente-enlace">
                    <span style={{ color: p.hecho ? "var(--tinta-400)" : "var(--tinta-900)" }}>{p.texto}</span>
                    <span style={{ color: "var(--accion-500)", display: "inline-flex" }}>
                      {!p.hecho && <span style={{ fontSize: 13, fontWeight: 700, marginRight: 2 }}>Agregar</span>}
                      <Icono nombre="siguiente" tamano={18} />
                    </span>
                  </Link>
                ) : (
                  <>
                    <span style={{ flex: 1, color: p.hecho ? "var(--tinta-400)" : "var(--tinta-900)" }}>{p.texto}</span>
                    {!p.hecho && <span className="meta">Próximamente</span>}
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="tarjeta" aria-labelledby="respaldo">
          <h2 id="respaldo" className="etiqueta">Respaldo</h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--tinta-600)" }}>
            Descarga en un archivo todo lo de tu barbería: equipo, servicios, clientes, citas y trabajos. Hazlo cada lunes.
          </p>
          <span className="meta">
            {clientes} clientes · {servicios} servicios · {trabajos} trabajos
          </span>
          <a className="btn btn-sec" href="/api/respaldo" download>
            <Icono nombre="descargar" tamano={18} />
            Descargar respaldo
          </a>
        </section>

        <form action={salir}>
          <button type="submit" className="btn btn-texto" style={{ color: "var(--tinta-600)" }}>
            Cerrar sesión
          </button>
        </form>
      </div>
      <BarraBarberia activa="hoy" />
    </main>
  );
}

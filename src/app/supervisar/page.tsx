import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Encabezado } from "@/components/Encabezado";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { sesionActual } from "@/lib/sesion";
import { salonDelUsuario } from "@/lib/salon";
import { esSupervisor, vistaElegida, type Vista } from "@/lib/supervisor";
import { cambiarVista } from "./acciones";

export const metadata = { title: "Supervisor · Nura" };
export const dynamic = "force-dynamic";

const VISTAS: { clave: Vista; titulo: string; detalle: string }[] = [
  { clave: "encargado", titulo: "Encargado", detalle: "Lo que ve el dueño: menú, cupones, complementos, precios y horarios." },
  { clave: "barbero", titulo: "Barbero del equipo", detalle: "Lo que ve un barbero: su agenda y su perfil, sin precios ni horarios." },
  { clave: "usuario", titulo: "Usuario", detalle: "Lo que ve quien busca dónde cortarse: inicio, citas y reservar." },
];

export default async function Supervisar() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, user } = await sesionActual();
  if (!user) redirect("/");
  if (!esSupervisor(user.email)) notFound();

  const [salon, vista] = await Promise.all([salonDelUsuario(supabase, user.id), vistaElegida()]);

  // ¿Qué migraciones ya corrieron? Si falta una tabla o columna, Supabase responde con error.
  const sinError = async (consulta: PromiseLike<{ error: unknown }>) => !(await consulta).error;
  const migraciones = await Promise.all([
    ["0002 · clientes, trabajos y reservas", sinError(supabase.from("confirmaciones").select("trabajo_id", { head: true, count: "exact" }))],
    ["0003 · equipo con cuentas", sinError(supabase.from("solicitudes").select("id", { head: true, count: "exact" }))],
    ["0004 · fotos e Insights", sinError(supabase.from("salones").select("portada_url").limit(1))],
    ["0005 · bot de WhatsApp", sinError(supabase.from("salones").select("bot_hasta").limit(1))],
    ["0006 · vacantes y chat", sinError(supabase.from("vacantes").select("id", { head: true, count: "exact" }))],
    ["0007 · cupones", sinError(supabase.from("cupones").select("id", { head: true, count: "exact" }))],
  ].map(async ([nombre, ok]) => [nombre as string, await ok] as const));

  // Solo se revisa si cada dato existe; nunca se muestra su valor.
  const hay = (...nombres: string[]) => nombres.every((n) => !!process.env[n]);
  const ajustes: [string, boolean][] = [
    ["Dirección del sitio (NEXT_PUBLIC_SITE_URL)", hay("NEXT_PUBLIC_SITE_URL")],
    ["Entrar con Google o Facebook", hay("NEXT_PUBLIC_LOGIN_PROVIDERS")],
    ["Bot de WhatsApp conectado a Meta", hay("WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN", "NEXT_PUBLIC_NURA_BOT_NUMERO")],
    ["Tu WhatsApp para \"Quiero activarlo\"", hay("NEXT_PUBLIC_NURA_WHATSAPP")],
  ];

  return (
    <main className="pantalla">
      <div className="contenido">
        <Encabezado titulo="Modo supervisor" volver={vista === "usuario" ? "/inicio" : "/hoy"} />
        <p className="subtitulo" style={{ margin: 0 }}>Solo tu cuenta ve esta pantalla. Cambia de vista para revisar la app como la ve cada quien.</p>

        <ul className="vistas">
          {VISTAS.map((v) => (
            <li key={v.clave}>
              <form action={cambiarVista}>
                <input type="hidden" name="vista" value={v.clave} />
                <button type="submit" className="vista" aria-current={vista === v.clave}>
                  <span>
                    <strong>{v.titulo}</strong>
                    <small>{v.detalle}</small>
                  </span>
                  <Icono nombre="siguiente" tamano={16} />
                </button>
              </form>
            </li>
          ))}
        </ul>

        {salon && (
          <section className="tarjeta" aria-labelledby="publica">
            <h2 id="publica" className="etiqueta">Sin cuenta</h2>
            <p className="meta" style={{ margin: 0 }}>
              Así ve {salon.nombre} cualquier persona que abre tu enlace. {salon.publicado ? "" : "Tu página está oculta: publícala en Menú, Tu página."}
            </p>
            <div className="fila" style={{ gap: 8 }}>
              <Link className="btn btn-sec" href={`/b/${salon.slug}`}>
                Página pública
              </Link>
              <Link className="btn btn-sec" href={`/b/${salon.slug}/reservar`}>
                Reservar
              </Link>
            </div>
          </section>
        )}

        <section className="tarjeta" aria-labelledby="base">
          <h2 id="base" className="etiqueta">Base de datos</h2>
          <ul className="revision">
            {migraciones.map(([nombre, ok]) => (
              <li key={nombre}>
                <span>{nombre}</span>
                <b className={ok ? "ok" : "falta"}>{ok ? "Lista" : "Falta correrla"}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="tarjeta" aria-labelledby="vercel">
          <h2 id="vercel" className="etiqueta">Ajustes en Vercel</h2>
          <ul className="revision">
            {ajustes.map(([nombre, ok]) => (
              <li key={nombre}>
                <span>{nombre}</span>
                <b className={ok ? "ok" : "falta"}>{ok ? "Listo" : "Falta"}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

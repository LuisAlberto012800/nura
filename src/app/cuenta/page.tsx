import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { BotonCopiar } from "@/components/BotonCopiar";
import { Icono } from "@/components/Iconos";
import { Medalla } from "@/components/Medalla";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { medallaSalon, NOMBRE_MEDALLA, SIGUIENTE_PASO } from "@/lib/medallas";
import { urlBase } from "@/lib/url";
import { salir } from "../hoy/acciones";
import { cambiarPublicacion } from "./acciones";

export const metadata = { title: "Cuenta · Nura" };
export const dynamic = "force-dynamic";

export default async function Cuenta() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoBarberia();
  const [{ data: verif }, { count: servicios }, { count: horarios }, { count: trabajos }, { count: confirmados }, { count: equipo }] = await Promise.all([
    supabase.from("salones").select("whatsapp, local_verificado_en, identidad_verificada_en, creado_en").eq("id", salon.id).single(),
    supabase.from("servicios").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).eq("activo", true),
    supabase.from("horarios").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
    supabase.from("trabajos").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
    supabase.from("trabajos").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).in("confirmacion", ["con_nombre", "sin_nombre"]),
    supabase.from("estilistas").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).eq("activo", true),
  ]);
  const nivel = verif ? medallaSalon(verif, confirmados ?? 0) : 0;
  const enlace = `${await urlBase()}/b/${salon.slug}`;
  const puedePublicar = (servicios ?? 0) > 0 && (horarios ?? 0) > 0;
  const falta = !servicios ? "Agrega al menos un servicio para publicar." : !horarios ? "Pon el horario de tu equipo para publicar." : null;

  const fila = (href: string, texto: string, detalle?: string) => (
    <li>
      <Link href={href} className="fila-cliente">
        <span className="servicio-info">
          <strong style={{ color: "var(--tinta-900)" }}>{texto}</strong>
          {detalle && <span className="meta">{detalle}</span>}
        </span>
        <Icono nombre="siguiente" tamano={16} />
      </Link>
    </li>
  );

  return (
    <main className="pantalla">
      <div className="contenido">
        <div>
          <h1 className="titulo">{salon.nombre}</h1>
          <p className="subtitulo">{salon.colonia}</p>
        </div>

        <section className="tarjeta" aria-labelledby="tu-pagina">
          <form action={cambiarPublicacion} className="fila-separada">
            <input type="hidden" name="publicar" value={salon.publicado ? "no" : "si"} />
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <strong id="tu-pagina">{salon.publicado ? "Tu página está publicada" : "Tu página está oculta"}</strong>
              <span className="meta">{salon.publicado ? "Te encuentran en Descubrir y reservan sin cuenta." : falta ?? "Publícala para recibir reservas."}</span>
            </span>
            <button
              type="submit"
              className={`interruptor${salon.publicado ? " encendido" : ""}`}
              role="switch"
              aria-checked={salon.publicado}
              aria-label={salon.publicado ? "Ocultar mi página" : "Publicar mi página"}
              disabled={!salon.publicado && !puedePublicar}
            />
          </form>
          <p className="enlace-pagina">{enlace.replace(/^https?:\/\//, "")}</p>
          <div className="fila" style={{ gap: 8 }}>
            <Link className="btn btn-sec" href={`/b/${salon.slug}`}>
              Ver
            </Link>
            <BotonCopiar texto={enlace} etiqueta="Copiar" />
            <a className="btn btn-sec" href={`https://wa.me/?text=${encodeURIComponent(`Reserva conmigo en ${salon.nombre}: ${enlace}`)}`} target="_blank" rel="noreferrer">
              Compartir
            </a>
          </div>
        </section>

        <section className="tarjeta" style={{ gap: 6 }} aria-label="Medalla">
          <div className="fila-separada">
            <span className="etiqueta">Medalla</span>
            <Medalla nivel={nivel} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "var(--tinta-600)" }}>
            {nivel < 4 ? `Para ${NOMBRE_MEDALLA[nivel + 1].toLowerCase()}: ${SIGUIENTE_PASO[nivel].charAt(0).toLowerCase()}${SIGUIENTE_PASO[nivel].slice(1)}` : SIGUIENTE_PASO[4]}
          </p>
          <span className="meta">Cada trabajo lleva la medalla más baja entre la tuya y la de tu cliente.</span>
        </section>

        <ul className="lista-servicios">
          {fila("/trabajos", "Mis trabajos", `${trabajos ?? 0} subidos · ${confirmados ?? 0} confirmados`)}
          {fila("/servicios", "Servicios y precios", `${servicios ?? 0} activos`)}
          {fila("/equipo", "Equipo y horarios", `${equipo ?? 0} ${equipo === 1 ? "persona" : "personas"}`)}
          {fila("/cuenta/datos", "Datos de tu barbería", "Nombre, dirección, WhatsApp")}
        </ul>

        <a className="btn btn-sec" href="/api/respaldo" download>
          <Icono nombre="descargar" tamano={18} />
          Descargar respaldo
        </a>
        <p className="meta" style={{ margin: "-6px 0 0", textAlign: "center" }}>Hazlo cada lunes. El plan gratis no guarda copias.</p>

        <form action={salir} style={{ alignSelf: "center" }}>
          <button type="submit" className="btn btn-texto" style={{ color: "var(--tinta-600)" }}>
            Cerrar sesión
          </button>
        </form>
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

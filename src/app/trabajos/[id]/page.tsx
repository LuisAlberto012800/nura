import Link from "next/link";
import { notFound } from "next/navigation";
import { BarraBarberia } from "@/components/BarraBarberia";
import { BotonCopiar } from "@/components/BotonCopiar";
import { Icono } from "@/components/Iconos";
import { Medalla } from "@/components/Medalla";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { duracionTexto, enlaceWhatsApp, pesos, textoCabello } from "@/lib/formato";
import { medallaSalon, medallaTrabajo } from "@/lib/medallas";
import { urlBase } from "@/lib/url";
import { borrarTrabajo, cambiarPublicado } from "../../subir/acciones";
import { BorrarTrabajo } from "./BorrarTrabajo";

export const metadata = { title: "Trabajo · Nura" };
export const dynamic = "force-dynamic";

type Trabajo = {
  id: string;
  titulo: string | null;
  foto_despues: string | null;
  foto_antes: string | null;
  tipo_cabello: string | null;
  duracion_min: number | null;
  colonia: string | null;
  publicado: boolean;
  muestra_cara: boolean;
  confirmacion: "pendiente" | "con_nombre" | "sin_nombre" | "rechazado";
  nombre_publico: string | null;
  medalla_cliente: number | null;
  servicio: { nombre: string; precio: number } | null;
  estilista: { nombre: string } | null;
  cliente: { id: string; nombre: string; telefono: string | null } | null;
};

export default async function DetalleTrabajo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, salon } = await contextoBarberia();

  const [{ data }, { data: conf }, { data: verif }, { count: confirmados }] = await Promise.all([
    supabase
      .from("trabajos")
      .select(
        "id, titulo, foto_despues, foto_antes, tipo_cabello, duracion_min, colonia, publicado, muestra_cara, confirmacion, nombre_publico, medalla_cliente, servicio:servicios(nombre, precio), estilista:estilistas(nombre), cliente:clientes(id, nombre, telefono)",
      )
      .eq("id", id)
      .eq("salon_id", salon.id)
      .maybeSingle(),
    supabase.from("confirmaciones").select("token").eq("trabajo_id", id).maybeSingle(),
    supabase.from("salones").select("whatsapp, local_verificado_en, identidad_verificada_en, creado_en").eq("id", salon.id).single(),
    supabase.from("trabajos").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).in("confirmacion", ["con_nombre", "sin_nombre"]),
  ]);
  if (!data) notFound();
  const t = data as unknown as Trabajo;
  const enlace = conf ? `${await urlBase()}/confirmar/${conf.token}` : null;
  const primerNombre = t.cliente?.nombre.split(" ")[0];
  const mensaje = `Hola${primerNombre ? ` ${primerNombre}` : ""}, subí tu ${t.servicio?.nombre.toLowerCase() ?? "trabajo"} a Nura. ¿Lo confirmas? Es un toque: ${enlace}`;
  const confirmado = t.confirmacion === "con_nombre" || t.confirmacion === "sin_nombre";
  const nivel = verif ? medallaTrabajo(medallaSalon(verif, confirmados ?? 0), t.medalla_cliente, t.confirmacion) : 0;
  const esperandoCara = t.muestra_cara && t.confirmacion === "pendiente";

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/trabajos" className="volver">
          <Icono nombre="atras" tamano={18} />
          Mis trabajos
        </Link>

        {sp.nuevo && (
          <p className="aviso aviso-exito" role="status" style={{ margin: 0 }}>
            {t.publicado ? "Publicado. Ya aparece en tu página y en Descubrir." : "Guardado. Se publica cuando tu cliente lo confirme."}
          </p>
        )}

        <div className={`foto-trabajo${t.foto_antes ? " doble" : ""}`}>
          {t.foto_antes && (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.foto_antes} alt="Antes" />
              <figcaption>Antes</figcaption>
            </figure>
          )}
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.foto_despues ?? ""} alt="Después" />
            {t.foto_antes && <figcaption>Después</figcaption>}
          </figure>
        </div>

        <div className="fila-separada" style={{ alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <h1 className="titulo" style={{ fontSize: 22 }}>{t.titulo ?? t.servicio?.nombre ?? "Trabajo"}</h1>
            <p className="meta" style={{ margin: "4px 0 0" }}>
              {[textoCabello(t.tipo_cabello), t.duracion_min ? duracionTexto(t.duracion_min) : null, t.colonia, t.estilista?.nombre.split(" ")[0]].filter(Boolean).join(" · ")}
            </p>
          </div>
          {t.servicio && <span className="precio">{pesos(t.servicio.precio)}</span>}
        </div>

        {confirmado ? (
          <div className="tarjeta" style={{ gap: 6 }}>
            <Medalla nivel={nivel} />
            <span style={{ fontSize: 14 }}>
              Confirmado por {t.nombre_publico ?? "tu cliente"}
              {t.confirmacion === "sin_nombre" ? " (sin mostrar su nombre)" : ""}.
            </span>
          </div>
        ) : t.confirmacion === "rechazado" ? (
          <p className="aviso aviso-neutro" style={{ margin: 0 }}>Tu cliente pidió que no se publique. Se queda solo en tu historial.</p>
        ) : enlace ? (
          <section className="tarjeta" aria-labelledby="pedir">
            <h2 id="pedir" className="etiqueta">Pide la confirmación</h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--tinta-600)" }}>
              {esperandoCara
                ? `Como se ve la cara, se publica cuando ${primerNombre ?? "tu cliente"} lo confirme.`
                : `Si ${primerNombre ?? "tu cliente"} lo confirma, el trabajo gana su medalla.`}
            </p>
            {t.cliente?.telefono ? (
              <a className="btn" href={enlaceWhatsApp(t.cliente.telefono, mensaje)} target="_blank" rel="noreferrer">
                <Icono nombre="mensaje" tamano={18} />
                Mandar a {primerNombre} por WhatsApp
              </a>
            ) : (
              <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer">
                <Icono nombre="mensaje" tamano={18} />
                Mandar por WhatsApp
              </a>
            )}
            <BotonCopiar texto={enlace} />
          </section>
        ) : null}

        {t.confirmacion !== "rechazado" && !esperandoCara && (
          <form action={cambiarPublicado} className="tarjeta fila-separada" style={{ flexDirection: "row" }}>
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="publicado" value={String(t.publicado)} />
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <strong>{t.publicado ? "Publicado" : "Oculto"}</strong>
              <span className="meta">{t.publicado ? "Se ve en tu página y en Descubrir." : "Solo lo ves tú."}</span>
            </span>
            <button type="submit" className={`interruptor${t.publicado ? " encendido" : ""}`} role="switch" aria-checked={t.publicado} aria-label={t.publicado ? "Ocultar" : "Publicar"} />
          </form>
        )}

        {t.cliente && (
          <Link href={`/clientes/${t.cliente.id}`} className="meta" style={{ textDecoration: "none", color: "var(--tinta-600)" }}>
            Cliente: <strong>{t.cliente.nombre}</strong>
          </Link>
        )}

        <BorrarTrabajo id={t.id} accion={borrarTrabajo} />
      </div>
      <BarraBarberia activa="subir" />
    </main>
  );
}

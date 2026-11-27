import Link from "next/link";
import { notFound } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { salonPorSlug } from "@/lib/publico";
import { duracionTexto, enlaceWhatsApp, pesos } from "@/lib/formato";
import { esDiaValido, fechaLarga } from "@/lib/tiempo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cita apartada · Nura" };

export default async function Listo({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, salon } = await salonPorSlug(slug);
  if (!salon || !esDiaValido(sp.d) || !/^\d{2}:\d{2}$/.test(sp.h ?? "")) notFound();

  const [{ data: servicio }, { data: estilista }, { data: foto }] = await Promise.all([
    supabase.from("servicios").select("nombre, precio, duracion_min").eq("id", sp.s ?? "").eq("salon_id", salon.id).maybeSingle(),
    supabase.from("estilistas").select("nombre").eq("id", sp.e ?? "").eq("salon_id", salon.id).maybeSingle(),
    supabase.from("trabajos").select("foto_despues").eq("salon_id", salon.id).eq("servicio_id", sp.s ?? "").eq("publicado", true).limit(1).maybeSingle(),
  ]);
  const dia = fechaLarga(sp.d).split(",")[0];
  const cuando = `${fechaLarga(sp.d).toLowerCase()} a las ${sp.h}`;
  const nombre = (sp.n ?? "").slice(0, 40);
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salon.direccion ? `${salon.direccion}, ` : ""}${salon.colonia}, Guadalajara`)}`;

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 18 }}>
        <div className="confirmada">
          <span className="circulo-listo" aria-hidden="true">
            <Icono nombre="check" tamano={40} grosor={2.4} />
          </span>
          <h1 className="titulo">
            Listo. {dia} {Number(sp.d.slice(8))}, {sp.h}
            {estilista ? `, con ${estilista.nombre.split(" ")[0]}` : ""}.
          </h1>
          <p className="subtitulo" style={{ margin: 0 }}>{salon.nombre} te confirma por WhatsApp.</p>
        </div>

        <div className="tarjeta" style={{ gap: 12 }}>
          <div className="resumen-miniatura">
            <span className="mini" style={{ width: 52, height: 64 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {foto?.foto_despues && <img src={foto.foto_despues} alt="" />}
            </span>
            <span>
              <p style={{ fontSize: 15, fontWeight: 800 }}>
                {servicio?.nombre ?? "Cita"}
                {servicio ? ` · ${duracionTexto(servicio.duracion_min)}` : ""}
              </p>
              <p style={{ fontSize: 13, color: "var(--tinta-600)", marginTop: 3 }}>
                {estilista ? `${estilista.nombre} · ` : ""}
                {salon.nombre}
              </p>
            </span>
          </div>
          <span className="meta" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {salon.direccion ? `${salon.direccion} · ` : ""}
            {salon.colonia}
          </span>
          {servicio && (
            <div className="fila-separada" style={{ borderTop: "1px solid var(--borde-100)", paddingTop: 12 }}>
              <span style={{ fontSize: 14, color: "var(--tinta-600)" }}>Pagas en la barbería</span>
              <span className="precio" style={{ fontSize: 18 }}>{pesos(servicio.precio)}</span>
            </div>
          )}
        </div>

        <div className="fila" style={{ gap: 10 }}>
          <a className="btn btn-sec" href={mapa} target="_blank" rel="noreferrer">
            Cómo llegar
          </a>
          {salon.whatsapp && (
            <a
              className="btn btn-sec"
              href={enlaceWhatsApp(salon.whatsapp, `Hola, soy ${nombre}. Acabo de reservar ${servicio?.nombre.toLowerCase() ?? "una cita"} el ${cuando} en Nura.`)}
              target="_blank"
              rel="noreferrer"
            >
              Avisar
            </a>
          )}
        </div>

        <div className="accion-fija">
          <Link className="btn" href={`/b/${slug}`}>
            Volver a {salon.nombre}
          </Link>
        </div>
      </div>
    </main>
  );
}

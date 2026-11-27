import Link from "next/link";
import { notFound } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { salonPorSlug } from "@/lib/publico";
import { enlaceWhatsApp, pesos } from "@/lib/formato";
import { esDiaValido, fechaLarga } from "@/lib/tiempo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cita apartada · Nura" };

export default async function Listo({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, salon } = await salonPorSlug(slug);
  if (!salon || !esDiaValido(sp.d) || !/^\d{2}:\d{2}$/.test(sp.h ?? "")) notFound();

  const [{ data: servicio }, { data: estilista }] = await Promise.all([
    supabase.from("servicios").select("nombre, precio").eq("id", sp.s ?? "").eq("salon_id", salon.id).maybeSingle(),
    supabase.from("estilistas").select("nombre").eq("id", sp.e ?? "").eq("salon_id", salon.id).maybeSingle(),
  ]);
  const cuando = `${fechaLarga(sp.d).toLowerCase()} a las ${sp.h}`;
  const nombre = (sp.n ?? "").slice(0, 40);

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 18 }}>
        <Logo alto={22} />
        <span className="listo-check" aria-hidden="true">
          <Icono nombre="check" tamano={30} grosor={2.6} />
        </span>
        <div>
          <h1 className="titulo">Tu cita quedó apartada</h1>
          <p className="subtitulo">{salon.nombre} te confirma por WhatsApp.</p>
        </div>
        <div className="tarjeta" style={{ gap: 6 }}>
          <strong style={{ fontSize: 17 }}>{servicio?.nombre ?? "Cita"}</strong>
          <span>{cuando.charAt(0).toUpperCase() + cuando.slice(1)}</span>
          <span className="meta">
            {estilista ? `Con ${estilista.nombre.split(" ")[0]} · ` : ""}
            {salon.direccion ? `${salon.direccion}, ` : ""}
            {salon.colonia}
          </span>
          {servicio && <span className="precio">{pesos(servicio.precio)}</span>}
        </div>
        {salon.whatsapp && (
          <a
            className="btn"
            href={enlaceWhatsApp(salon.whatsapp, `Hola, soy ${nombre}. Acabo de reservar ${servicio?.nombre.toLowerCase() ?? "una cita"} el ${cuando} en Nura.`)}
            target="_blank"
            rel="noreferrer"
          >
            <Icono nombre="mensaje" tamano={18} />
            Avisar por WhatsApp
          </a>
        )}
        <Link className="btn btn-sec" href={`/b/${slug}`}>
          Volver a {salon.nombre}
        </Link>
      </div>
    </main>
  );
}

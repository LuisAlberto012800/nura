import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";

export const metadata = { title: "Mis trabajos · Nura" };
export const dynamic = "force-dynamic";

type Trabajo = { id: string; foto_despues: string | null; publicado: boolean; confirmacion: string; muestra_cara: boolean };

export default async function Trabajos() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoBarberia();
  const { data } = await supabase
    .from("trabajos")
    .select("id, foto_despues, publicado, confirmacion, muestra_cara")
    .eq("salon_id", salon.id)
    .order("creado_en", { ascending: false })
    .limit(200);
  const trabajos = (data ?? []) as Trabajo[];
  const publicados = trabajos.filter((t) => t.publicado).length;
  const confirmados = trabajos.filter((t) => t.confirmacion === "con_nombre" || t.confirmacion === "sin_nombre").length;

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/cuenta" className="volver">
          <Icono nombre="atras" tamano={18} />
          Cuenta
        </Link>
        <div className="fila-separada">
          <div>
            <h1 className="titulo">Mis trabajos</h1>
            {trabajos.length > 0 && (
              <p className="subtitulo">
                {publicados} publicados · {confirmados} confirmados
              </p>
            )}
          </div>
          <Link href="/subir" className="boton-icono boton-accion" aria-label="Subir trabajo">
            <Icono nombre="mas" tamano={20} />
          </Link>
        </div>

        {trabajos.length > 0 ? (
          <div className="galeria">
            {trabajos.map((t) => (
              <Link key={t.id} href={`/trabajos/${t.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.foto_despues ?? ""} alt="" loading="lazy" style={{ opacity: t.publicado ? 1 : 0.55 }} />
                {!t.publicado && <span className="sello-galeria">{t.confirmacion === "rechazado" ? "No publicar" : t.muestra_cara && t.confirmacion === "pendiente" ? "Esperando" : "Oculto"}</span>}
                {(t.confirmacion === "con_nombre" || t.confirmacion === "sin_nombre") && (
                  <span className="check-galeria" aria-label="Confirmado">
                    <Icono nombre="check" tamano={12} grosor={3} />
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="tarjeta vacio">
            <Icono nombre="camara" tamano={36} />
            <strong>Sube tu primer trabajo.</strong>
            <p>Una foto de después, el servicio y el tipo de cabello. Así te encuentran clientas con cabello como el que tú trabajas.</p>
            <Link href="/subir" className="btn">
              Subir trabajo
            </Link>
          </div>
        )}
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

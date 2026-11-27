import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Espejo } from "@/components/Logo";
import { Medalla } from "@/components/Medalla";
import { Regresar } from "@/components/Regresar";
import { SinConfigurar } from "@/components/SinConfigurar";
import { Verificado } from "@/components/Encabezado";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { duracionTexto, pesos, textoCabello, textoCategoria } from "@/lib/formato";
import { medallaSalon, medallaTrabajo } from "@/lib/medallas";

export const dynamic = "force-dynamic";

type Trabajo = {
  id: string;
  titulo: string | null;
  foto_despues: string;
  foto_antes: string | null;
  tipo_cabello: string;
  categoria: string;
  duracion_min: number;
  colonia: string;
  confirmacion: string;
  medalla_cliente: number | null;
  nombre_publico: string | null;
  servicio: { id: string; nombre: string; precio: number } | null;
  estilista: { id: string; nombre: string; anios_oficio: number | null; foto_url: string | null } | null;
  salon: { nombre: string; slug: string; colonia: string; whatsapp: string | null; local_verificado_en: string | null; identidad_verificada_en: string | null } | null;
};

async function cargar(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("trabajos")
    .select(
      "id, titulo, foto_despues, foto_antes, tipo_cabello, categoria, duracion_min, colonia, confirmacion, medalla_cliente, nombre_publico, servicio:servicios(id, nombre, precio), estilista:estilistas(id, nombre, anios_oficio, foto_url), salon:salones(nombre, slug, colonia, whatsapp, local_verificado_en, identidad_verificada_en)",
    )
    .eq("id", id)
    .eq("publicado", true)
    .maybeSingle();
  return data as unknown as Trabajo | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  if (!supabaseConfigurado) return { title: "Nura" };
  const t = await cargar((await params).id);
  if (!t) return { title: "Nura" };
  const que = t.titulo ?? t.servicio?.nombre ?? textoCategoria(t.categoria);
  return { title: `${que} · ${t.salon?.nombre} · Nura`, description: `${que} en cabello ${textoCabello(t.tipo_cabello)?.toLowerCase()}${t.servicio ? `, ${pesos(t.servicio.precio)} precio exacto` : ""}.` };
}

// Detalle de un trabajo publicado: lo que ve la clienta antes de reservar.
export default async function DetalleTrabajo({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const t = await cargar((await params).id);
  if (!t || !t.salon) notFound();
  const nivel = medallaTrabajo(medallaSalon(t.salon), t.medalla_cliente, t.confirmacion);
  const que = t.titulo ?? t.servicio?.nombre ?? textoCategoria(t.categoria) ?? "Trabajo";
  const reservar = `/b/${t.salon.slug}/reservar?${new URLSearchParams({ ...(t.servicio ? { servicio: t.servicio.id } : {}), ...(t.estilista ? { e: t.estilista.id } : {}) })}`;

  return (
    <main className="pantalla detalle-trabajo">
      <div className={`fotos-detalle${t.foto_antes ? " doble" : ""}`}>
        {t.foto_antes && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.foto_antes} alt="Antes" />
            <figcaption>Antes</figcaption>
          </figure>
        )}
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.foto_despues} alt={`${que}, después`} />
          {t.foto_antes && <figcaption className="despues">Después</figcaption>}
        </figure>
        <div className="sobre-fotos">
          <Regresar respaldo={`/b/${t.salon.slug}`} clase="boton-redondo sobre-foto" />
        </div>
      </div>

      <div className="hoja">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {nivel > 0 && (
            <span className="pastilla azul" style={{ alignSelf: "flex-start" }}>
              Trabajo verificado · <Medalla nivel={nivel} compacta />
            </span>
          )}
          <h1 className="titulo" style={{ fontSize: 26 }}>{que}</h1>
          {t.nombre_publico && <span className="meta">Confirmado por {t.nombre_publico}</span>}
        </div>

        <div className="datos-dos">
          <div>
            <span>Tipo de cabello</span>
            <strong>{textoCabello(t.tipo_cabello)}</strong>
          </div>
          <div>
            <span>Servicio</span>
            <strong>{textoCategoria(t.categoria)}</strong>
          </div>
          <div>
            <span>Duración</span>
            <strong>{duracionTexto(t.duracion_min)}</strong>
          </div>
          <div>
            <span>Colonia</span>
            <strong>{t.colonia}</strong>
          </div>
        </div>

        <Link href={`/b/${t.salon.slug}`} className="fila-autor">
          {t.estilista?.foto_url ? (
            <span className="avatar-foto" style={{ width: 42, height: 42 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.estilista.foto_url} alt="" />
            </span>
          ) : (
            <span className="avatar-espejo">
              <Espejo tamano={22} />
            </span>
          )}
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong>
              {t.estilista?.nombre ?? t.salon.nombre}
              {medallaSalon(t.salon) >= 2 && <Verificado />}
            </strong>
            <span className="meta">
              {t.estilista ? `${t.salon.nombre} · ` : ""}
              {t.salon.colonia}
              {t.estilista?.anios_oficio ? ` · ${t.estilista.anios_oficio} años de oficio` : ""}
            </span>
          </span>
          <span className="ver-perfil">Ver perfil</span>
        </Link>
      </div>

      <div className="accion-fija">
        {t.servicio && (
          <span className="precio-barra">
            <span>Precio exacto</span>
            <strong>{pesos(t.servicio.precio)}</strong>
          </span>
        )}
        <Link className="btn" href={reservar}>
          Reservar este trabajo
        </Link>
      </div>
    </main>
  );
}

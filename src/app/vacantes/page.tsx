import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Complemento } from "@/components/Complemento";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { PRECIO_VACANTES, vacantesActivas } from "@/lib/insights";
import { textoTipo } from "@/lib/vacantes";
import { cambiarVacante } from "./acciones";
import { FormularioVacante } from "./Formularios";

export const metadata = { title: "Vacantes · Nura" };
export const dynamic = "force-dynamic";

type Vacante = { id: string; titulo: string; tipo: string; pago: string | null; abierta: boolean; postulaciones: { estado: string }[] };

export default async function Vacantes() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoEncargado();
  const activo = await vacantesActivas(supabase, salon.id);
  const { data } = activo
    ? await supabase.from("vacantes").select("id, titulo, tipo, pago, abierta, postulaciones(estado)").eq("salon_id", salon.id).order("creado_en", { ascending: false })
    : { data: [] };
  const vacantes = (data ?? []) as Vacante[];

  return (
    <main className="pantalla">
      <div className="contenido">
        <div>
          <h1 className="titulo">Vacantes</h1>
          <p className="subtitulo">{activo ? "Solo los barberos con cuenta en Nura las ven y se postulan." : "Encuentra barberos para tu equipo."}</p>
        </div>
        {!activo ? (
          <Complemento
            nombre="Vacantes"
            precio={PRECIO_VACANTES}
            incluye={[
              "Publica las vacantes que quieras",
              "Solo las ven barberos con cuenta en Nura, no clientes",
              "Ves su experiencia, especialidades y su celular",
              "Los barberos ven tu página con trabajos reales antes de postularse",
            ]}
          />
        ) : (
          <>
            {vacantes.length > 0 && (
              <ul className="lista-servicios">
                {vacantes.map((v) => {
                  const nuevas = v.postulaciones.filter((p) => p.estado === "nueva").length;
                  return (
                    <li key={v.id} className={v.abierta ? undefined : "oculto"}>
                      <Link href={`/vacantes/${v.id}`} className="servicio-info">
                        <strong>{v.titulo}</strong>
                        <span className="meta">
                          {textoTipo(v.tipo)}
                          {v.pago ? ` · ${v.pago}` : ""}
                        </span>
                        <span className="meta">
                          {v.postulaciones.length} {v.postulaciones.length === 1 ? "postulación" : "postulaciones"}
                          {nuevas > 0 ? ` · ${nuevas} sin ver` : ""}
                        </span>
                      </Link>
                      <form action={cambiarVacante}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="abierta" value={String(v.abierta)} />
                        <button type="submit" className={`interruptor${v.abierta ? " encendido" : ""}`} role="switch" aria-checked={v.abierta} aria-label={v.abierta ? "Cerrar vacante" : "Abrir vacante"} />
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
            <section className="tarjeta" aria-labelledby="nueva">
              <h2 id="nueva" className="etiqueta">Nueva vacante</h2>
              <FormularioVacante />
            </section>
          </>
        )}
        <Link href="/cuenta" className="volver" style={{ alignSelf: "center" }}>
          <Icono nombre="atras" tamano={16} />
          Cuenta
        </Link>
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

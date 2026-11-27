import Link from "next/link";
import { notFound } from "next/navigation";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { enlaceWhatsApp, haceCuanto, telefonoTexto } from "@/lib/formato";
import { diaLocal, hoyLocal } from "@/lib/tiempo";
import { textoTipo } from "@/lib/vacantes";
import { cambiarPostulacion } from "../acciones";

export const metadata = { title: "Postulaciones · Nura" };
export const dynamic = "force-dynamic";

type Postulacion = { id: string; nombre: string; telefono: string; anios_oficio: number | null; especialidades: string | null; mensaje: string | null; estado: string; creado_en: string };

const ESTADOS: Record<string, string> = { nueva: "Nueva", vista: "Vista", contactada: "Contactada", descartada: "Descartada" };

export default async function Postulaciones({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const { supabase, salon } = await contextoEncargado();
  const [{ data: vacante }, { data }] = await Promise.all([
    supabase.from("vacantes").select("id, titulo, tipo, pago, abierta").eq("id", id).eq("salon_id", salon.id).maybeSingle(),
    supabase.from("postulaciones").select("id, nombre, telefono, anios_oficio, especialidades, mensaje, estado, creado_en").eq("vacante_id", id).eq("salon_id", salon.id).order("creado_en", { ascending: false }),
  ]);
  if (!vacante) notFound();
  const lista = (data ?? []) as Postulacion[];
  const hoy = hoyLocal();

  const Estado = ({ p, a, texto }: { p: Postulacion; a: string; texto: string }) => (
    <form action={cambiarPostulacion}>
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="estado" value={a} />
      <button type="submit" className={`chip${p.estado === a ? " activo" : ""}`}>
        {texto}
      </button>
    </form>
  );

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/vacantes" className="volver">
          <Icono nombre="atras" tamano={18} />
          Vacantes
        </Link>
        <div>
          <h1 className="titulo" style={{ fontSize: 24 }}>{vacante.titulo}</h1>
          <p className="subtitulo">
            {textoTipo(vacante.tipo)}
            {vacante.pago ? ` · ${vacante.pago}` : ""}
            {vacante.abierta ? "" : " · cerrada"}
          </p>
        </div>
        {lista.length === 0 ? (
          <p className="aviso aviso-neutro">Todavía nadie se postula. Las vacantes con pago claro y fotos de tus trabajos en tu página reciben más interés.</p>
        ) : (
          lista.map((p) => (
            <section key={p.id} className="tarjeta" style={{ gap: 8, opacity: p.estado === "descartada" ? 0.6 : 1 }}>
              <div className="fila-separada">
                <strong style={{ fontSize: 16 }}>{p.nombre}</strong>
                <span className={`etiqueta-azul`}>{ESTADOS[p.estado]}</span>
              </div>
              <span className="meta">
                {[p.anios_oficio != null ? `${p.anios_oficio} años de oficio` : null, p.especialidades, `se postuló ${haceCuanto(diaLocal(p.creado_en), hoy)}`].filter(Boolean).join(" · ")}
              </span>
              {p.mensaje && <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-line" }}>{p.mensaje}</p>}
              <a
                className="btn btn-sec"
                href={enlaceWhatsApp(p.telefono, `Hola ${p.nombre.split(" ")[0]}, te escribo de ${salon.nombre} por tu postulación a "${vacante.titulo}" en Nura.`)}
                target="_blank"
                rel="noreferrer"
              >
                <Icono nombre="mensaje" tamano={18} />
                Escribir · {telefonoTexto(p.telefono)}
              </a>
              <div className="chips-equipo" style={{ flexWrap: "wrap" }}>
                <Estado p={p} a="vista" texto="Vista" />
                <Estado p={p} a="contactada" texto="Contactada" />
                <Estado p={p} a="descartada" texto="Descartar" />
              </div>
            </section>
          ))
        )}
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

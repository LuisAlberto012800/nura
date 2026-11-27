import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Encabezado } from "@/components/Encabezado";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { sesionActual } from "@/lib/sesion";
import { textoTipo } from "@/lib/vacantes";
import { FormularioPostulacion } from "../../vacantes/Formularios";

export const metadata = { title: "Vacante · Nura" };
export const dynamic = "force-dynamic";

export default async function Vacante({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const { supabase, user } = await sesionActual();
  if (!user) redirect("/");
  const { data: v } = await supabase
    .from("vacantes")
    .select("id, salon_id, titulo, tipo, pago, descripcion, abierta, salon:salones(nombre, slug, colonia), postulaciones(id)")
    .eq("id", id)
    .maybeSingle();
  if (!v) notFound();
  const vacante = v as unknown as { id: string; salon_id: string; titulo: string; tipo: string; pago: string | null; descripcion: string | null; abierta: boolean; salon: { nombre: string; slug: string; colonia: string } | null; postulaciones: { id: string }[] };
  const { data: yo } = await supabase.from("estilistas").select("nombre, anios_oficio, especialidades").eq("usuario_id", user.id).limit(1).maybeSingle();
  const nombre = yo?.nombre ?? ((user.user_metadata?.full_name as string | undefined) ?? "");

  return (
    <main className="pantalla">
      <div className="contenido">
        <Encabezado titulo="Vacante" volver="/empleos" />
        <div>
          <h1 className="titulo" style={{ fontSize: 24 }}>{vacante.titulo}</h1>
          <p className="subtitulo">
            {vacante.salon?.nombre} · {vacante.salon?.colonia}
          </p>
        </div>
        <div className="datos-dos">
          <div>
            <span>Tipo</span>
            <strong>{textoTipo(vacante.tipo)}</strong>
          </div>
          <div>
            <span>Pago</span>
            <strong>{vacante.pago ?? "Por platicar"}</strong>
          </div>
        </div>
        {vacante.descripcion && <p style={{ margin: 0, fontSize: 15, whiteSpace: "pre-line" }}>{vacante.descripcion}</p>}
        {vacante.salon && (
          <Link href={`/b/${vacante.salon.slug}`} className="tarjeta enlace-unirme">
            <span>
              <strong>Mira su trabajo antes de postularte</strong>
              <span className="meta">Página de {vacante.salon.nombre} en Nura</span>
            </span>
          </Link>
        )}
        {vacante.postulaciones.length > 0 ? (
          <p className="aviso aviso-exito">Ya te postulaste. Si les interesa, te escriben a tu celular.</p>
        ) : !vacante.abierta ? (
          <p className="aviso aviso-neutro">Esta vacante ya se cerró.</p>
        ) : (
          <section className="tarjeta" aria-labelledby="postular">
            <h2 id="postular" className="etiqueta">Postúlate</h2>
            <FormularioPostulacion vacante={vacante.id} salon={vacante.salon_id} nombre={nombre} anios={yo?.anios_oficio ?? null} especialidades={(yo?.especialidades ?? []).join(", ")} />
          </section>
        )}
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Encabezado } from "@/components/Encabezado";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { sesionActual } from "@/lib/sesion";
import { textoTipo } from "@/lib/vacantes";

export const metadata = { title: "Vacantes para barberos · Nura" };
export const dynamic = "force-dynamic";

type Vacante = { id: string; titulo: string; tipo: string; pago: string | null; salon: { nombre: string; colonia: string; portada_url: string | null } | null; postulaciones: { id: string }[] };

// Solo para barberos: las vacantes abiertas de barberías en Nura.
export default async function Empleos() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, user } = await sesionActual();
  if (!user) redirect("/");
  const { data } = await supabase
    .from("vacantes")
    .select("id, titulo, tipo, pago, salon:salones(nombre, colonia, portada_url), postulaciones(id)")
    .eq("abierta", true)
    .order("creado_en", { ascending: false })
    .limit(60);
  const vacantes = ((data ?? []) as unknown as Vacante[]).filter((v) => v.salon);
  const profesional = user.user_metadata?.rol === "profesional";

  return (
    <main className="pantalla">
      <div className="contenido">
        <Encabezado titulo="Vacantes" volver="/cuenta" />
        {!profesional && vacantes.length === 0 ? (
          <p className="aviso aviso-neutro">Las vacantes son solo para barberos y estilistas con cuenta profesional en Nura.</p>
        ) : vacantes.length === 0 ? (
          <div className="tarjeta vacio">
            <Icono nombre="clientes" tamano={36} />
            <strong>Por ahora no hay vacantes abiertas.</strong>
            <p>Cuando una barbería de Nura busque a alguien, aparece aquí.</p>
          </div>
        ) : (
          <ul className="lista-servicios">
            {vacantes.map((v) => (
              <li key={v.id}>
                <Link href={`/empleos/${v.id}`} className="fila-cliente">
                  <span className="avatar-foto" style={{ width: 52, height: 52, borderRadius: 14 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {v.salon?.portada_url && <img src={v.salon.portada_url} alt="" />}
                  </span>
                  <span className="servicio-info">
                    <strong>{v.titulo}</strong>
                    <span className="meta">
                      {v.salon?.nombre} · {v.salon?.colonia}
                    </span>
                    <span className="meta">
                      {textoTipo(v.tipo)}
                      {v.pago ? ` · ${v.pago}` : ""}
                    </span>
                  </span>
                  {v.postulaciones.length > 0 ? <span className="etiqueta-azul">Te postulaste</span> : <Icono nombre="siguiente" tamano={16} />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

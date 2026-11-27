import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { borrarServicio } from "../acciones";
import { FormularioServicio } from "../FormularioServicio";

export const metadata = { title: "Editar servicio · Nura" };
export const dynamic = "force-dynamic";

export default async function EditarServicio({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // Las reglas de la base de datos solo devuelven servicios del salón propio.
  const { data: servicio } = await supabase
    .from("servicios")
    .select("id, nombre, categoria, duracion_min, precio")
    .eq("id", id)
    .maybeSingle();
  if (!servicio) notFound();

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/servicios" className="volver">
          <Icono nombre="atras" tamano={18} />
          Servicios
        </Link>
        <h1 className="titulo">Editar servicio</h1>
        <FormularioServicio inicial={servicio} />
        <form action={borrarServicio}>
          <input type="hidden" name="id" value={servicio.id} />
          <button type="submit" className="btn btn-peligro">
            Borrar servicio
          </button>
        </form>
        <p className="meta">Si solo quieres que no aparezca un tiempo, mejor ocúltalo con el interruptor en la lista.</p>
      </div>
    </main>
  );
}

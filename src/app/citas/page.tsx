import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraClienta } from "@/components/BarraClienta";
import { Espejo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Citas · Nura" };
export const dynamic = "force-dynamic";

export default async function Citas() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="pantalla">
      <div className="contenido">
        <h1 className="titulo">Citas</h1>
        <div className="tarjeta vacio">
          <Espejo tamano={44} />
          <strong>Aún no tienes citas.</strong>
          <p>Cuando reserves un trabajo, aquí verás la fecha, la dirección y podrás volver a reservar en un toque.</p>
          <Link href="/inicio" className="btn">
            Ver trabajos cerca
          </Link>
        </div>
      </div>
      <BarraClienta activa="citas" />
    </main>
  );
}

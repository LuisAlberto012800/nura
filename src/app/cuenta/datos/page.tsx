import Link from "next/link";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { FormularioDatos } from "./FormularioDatos";
import { FotoSubible } from "@/components/FotoSubible";
import { guardarPortada } from "../acciones";

export const metadata = { title: "Datos de tu barbería · Nura" };
export const dynamic = "force-dynamic";

export default async function Datos() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoEncargado();
  const { data } = await supabase.from("salones").select("nombre, colonia, direccion, whatsapp, descripcion, portada_url").eq("id", salon.id).single();
  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/cuenta" className="volver">
          <Icono nombre="atras" tamano={18} />
          Cuenta
        </Link>
        <h1 className="titulo">Datos de tu barbería</h1>
        <section style={{ display: "flex", flexDirection: "column", gap: 6 }} aria-label="Portada">
          <span className="etiqueta">Portada</span>
          <FotoSubible salonId={salon.id} carpeta="portada" forma="portada" actual={data?.portada_url ?? null} guardar={guardarPortada} />
          <span className="meta">La primera imagen de tu página. Una foto de tu local o de tu equipo trabajando.</span>
        </section>
        {data && <FormularioDatos datos={data} />}
      </div>
    </main>
  );
}

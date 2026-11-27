import Link from "next/link";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { Importador } from "./Importador";

export const metadata = { title: "Importar clientes · Nura" };
export const dynamic = "force-dynamic";

export default async function Importar() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  await contextoEncargado();
  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/clientes" className="volver">
          <Icono nombre="atras" tamano={18} />
          Clientes
        </Link>
        <div>
          <h1 className="titulo">Trae a tus clientes</h1>
          <p className="subtitulo">Sube el archivo de tu agenda anterior y quedan en tu lista como clientes previos.</p>
        </div>
        <Importador />
      </div>
    </main>
  );
}

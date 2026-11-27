import Link from "next/link";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { FormularioCliente } from "../FormularioCliente";

export const metadata = { title: "Nuevo cliente · Nura" };
export const dynamic = "force-dynamic";

export default async function NuevoCliente() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  await contextoBarberia();
  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/clientes" className="volver">
          <Icono nombre="atras" tamano={18} />
          Clientes
        </Link>
        <h1 className="titulo">Nuevo cliente</h1>
        <div className="tarjeta">
          <FormularioCliente />
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { FormularioRecuperar } from "./Formularios";

export const metadata = { title: "Recuperar contraseña · Nura" };
export const dynamic = "force-dynamic";

export default function Recuperar() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 22 }}>
        <Link href="/entrar" className="volver">
          <Icono nombre="atras" tamano={18} />
          Iniciar sesión
        </Link>
        <div>
          <h1 className="titulo">Recupera tu contraseña</h1>
          <p className="subtitulo">Te mandamos un enlace a tu correo para que pongas una nueva.</p>
        </div>
        <FormularioRecuperar />
        <p className="meta" style={{ margin: 0 }}>Si entraste con Google o Facebook, no tienes contraseña: entra con el mismo botón.</p>
      </div>
    </main>
  );
}

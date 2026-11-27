import Link from "next/link";
import { EleccionRol } from "@/components/EleccionRol";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata = { title: "Crear cuenta · Nura" };
export const dynamic = "force-dynamic";

export default function Registro() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 22 }}>
        <Link href="/" className="volver">
          <Icono nombre="atras" tamano={18} />
          Inicio
        </Link>
        <div>
          <h1 className="titulo">¿Cómo vas a usar Nura?</h1>
          <p className="subtitulo">Así te mostramos lo que te sirve desde el primer momento.</p>
        </div>
        <EleccionRol destino={(rol) => `/registro/cuenta?rol=${rol}`} />
        <p className="meta" style={{ textAlign: "center" }}>
          ¿Ya tienes cuenta? <Link href="/entrar">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}

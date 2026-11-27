import { redirect } from "next/navigation";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { FormularioAlta } from "./FormularioAlta";
import Link from "next/link";
import { Icono } from "@/components/Iconos";

export const metadata = { title: "Alta de tu barbería · Nura" };
export const dynamic = "force-dynamic";

export default async function Alta() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  if (await salonDelUsuario(supabase, user.id)) redirect("/hoy");

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="progreso" aria-hidden="true">
            <span className="lleno" />
            <span />
            <span />
            <span />
          </div>
          <span className="meta">Paso 1 de 4</span>
        </div>
        <div>
          <h1 className="titulo">Tu barbería en Nura</h1>
          <p className="subtitulo">Lo básico para empezar. Lo demás lo agregas cuando quieras.</p>
        </div>
        <FormularioAlta />
        <Link href="/unirme" className="tarjeta enlace-unirme">
          <span>
            <strong>¿Trabajas en una barbería que ya está en Nura?</strong>
            <span className="meta">Únete a su equipo en lugar de crear otra.</span>
          </span>
          <Icono nombre="siguiente" tamano={18} />
        </Link>
      </div>
    </main>
  );
}

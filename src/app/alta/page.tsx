import { redirect } from "next/navigation";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { FormularioAlta } from "./FormularioAlta";

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
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioNuevaContrasena } from "../recuperar/Formularios";

export const metadata = { title: "Contraseña nueva · Nura" };
export const dynamic = "force-dynamic";

export default async function NuevaContrasena() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/recuperar");
  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 22 }}>
        <Logo alto={30} />
        <div>
          <h1 className="titulo">Pon tu contraseña nueva</h1>
          <p className="subtitulo">{user.email}</p>
        </div>
        <FormularioNuevaContrasena />
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { FormularioUnirme } from "../FormularioUnirme";
import { recordarInvitacion } from "../acciones";

export const metadata = { title: "Invitación · Nura" };
export const dynamic = "force-dynamic";

// El enlace que el encargado manda por WhatsApp a su equipo.
export default async function Invitacion({ params }: { params: Promise<{ codigo: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { codigo } = await params;
  const supabase = await crearClienteServidor();
  const { data: nombreSalon } = await supabase.rpc("barberia_por_codigo", { p_codigo: codigo });
  if (!nombreSalon) notFound();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && (await salonDelUsuario(supabase, user.id))) redirect("/hoy");
  const nombre = (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "") as string;

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 20 }}>
        <Logo alto={28} />
        <div>
          <h1 className="titulo">Te invitan a {String(nombreSalon)}</h1>
          <p className="subtitulo">Únete a su equipo en Nura para ver tu agenda y subir tus trabajos. Tu encargado confirma que trabajas ahí.</p>
        </div>
        {user ? (
          <FormularioUnirme codigo={codigo} nombre={nombre} />
        ) : (
          <>
            <form action={recordarInvitacion}>
              <input type="hidden" name="codigo" value={codigo} />
              <button type="submit" className="btn">
                Crear mi cuenta de barbero
              </button>
            </form>
            <p className="meta" style={{ margin: 0, textAlign: "center" }}>
              ¿Ya tienes cuenta? <Link href="/entrar">Inicia sesión</Link> y vuelve a abrir este enlace.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { EleccionRol } from "@/components/EleccionRol";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { destinoDe, esRol } from "@/lib/rol";

export const metadata = { title: "Bienvenida · Nura" };
export const dynamic = "force-dynamic";

// Para quien entró con Google o Facebook sin haber elegido antes su lado de la app.
export default async function Elegir({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { rol } = await searchParams;
  if (esRol(rol)) {
    const { data } = await supabase.auth.updateUser({ data: { rol } });
    redirect(await destinoDe(supabase, data.user ?? user));
  }

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 22, paddingTop: 40 }}>
        <Logo alto={34} />
        <div>
          <h1 className="titulo">¿Cómo vas a usar Nura?</h1>
          <p className="subtitulo">Solo te lo preguntamos esta vez.</p>
        </div>
        <EleccionRol destino={(r) => `/elegir?rol=${r}`} />
      </div>
    </main>
  );
}

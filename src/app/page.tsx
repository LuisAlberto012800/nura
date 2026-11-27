import { redirect } from "next/navigation";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";

export const dynamic = "force-dynamic";

// Puerta de entrada: manda a cada quien a donde le toca.
export default async function Inicio() {
  if (!supabaseConfigurado) return <SinConfigurar />;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const salon = await salonDelUsuario(supabase, user.id);
  redirect(salon ? "/hoy" : "/alta");
}

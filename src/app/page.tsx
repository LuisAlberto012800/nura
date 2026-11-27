import { redirect } from "next/navigation";
import { Bienvenida, type FotoMosaico } from "@/components/Bienvenida";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { destinoDe } from "@/lib/rol";

export const dynamic = "force-dynamic";

// Puerta de entrada: sin sesión, la bienvenida; con sesión, a donde le toca.
export default async function Inicio() {
  if (!supabaseConfigurado) return <SinConfigurar />;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(await destinoDe(supabase, user));

  // El mosaico usa fotos reales de trabajos publicados cuando ya las hay.
  const { data } = await supabase
    .from("trabajos")
    .select("foto_despues, titulo")
    .eq("publicado", true)
    .not("foto_despues", "is", null)
    .order("creado_en", { ascending: false })
    .limit(9);
  const fotos: FotoMosaico[] = (data ?? []).map((t) => ({ url: t.foto_despues as string, alt: t.titulo ?? "" }));

  return <Bienvenida fotos={fotos} />;
}

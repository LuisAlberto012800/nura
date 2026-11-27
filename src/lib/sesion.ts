import { redirect } from "next/navigation";
import { crearClienteServidor } from "./supabase/server";
import { salonDelUsuario } from "./salon";

// Para las pantallas y acciones de la barbería: sesión y salón, o fuera.
export async function contextoBarberia() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) redirect("/alta");
  return { supabase, user, salon };
}

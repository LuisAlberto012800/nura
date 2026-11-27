import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "./supabase/server";
import { salonDelUsuario } from "./salon";

export type Usuario = { id: string; email: string | null; user_metadata: Record<string, unknown> };

// Quién está usando la app. Se calcula una sola vez por pantalla aunque varias
// partes lo pidan, y revisa la sesión sin ir a Supabase cuando se puede.
export const sesionActual = cache(async () => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const c = data?.claims;
  const user: Usuario | null = c?.sub
    ? { id: c.sub, email: (c.email as string | undefined) ?? null, user_metadata: (c.user_metadata as Record<string, unknown> | undefined) ?? {} }
    : null;
  return { supabase, user };
});

const salonDe = cache(async (userId: string) => {
  const { supabase } = await sesionActual();
  return salonDelUsuario(supabase, userId);
});

// Para las pantallas y acciones de la barbería: sesión y salón, o fuera.
export async function contextoBarberia() {
  const { supabase, user } = await sesionActual();
  if (!user) redirect("/");
  const salon = await salonDe(user.id);
  if (!salon) redirect("/alta");
  return { supabase, user, salon };
}

// Para lo que solo cambia el encargado: precios, horarios, equipo, datos.
export async function contextoEncargado() {
  const ctx = await contextoBarberia();
  if (ctx.salon.rol !== "dueno") redirect("/cuenta");
  return ctx;
}

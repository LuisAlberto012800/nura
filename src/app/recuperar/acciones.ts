"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COOKIE_RECUPERAR, destinoDe } from "@/lib/rol";

export type EstadoRecuperar = { error?: string; aviso?: string };

// Manda el correo con el enlace. La respuesta es la misma exista o no la
// cuenta, para no revelar qué correos están registrados.
export async function pedirRecuperacion(_: EstadoRecuperar, form: FormData): Promise<EstadoRecuperar> {
  const correo = String(form.get("correo") ?? "").trim().toLowerCase();
  if (!correo.includes("@")) return { error: "Escribe un correo válido." };
  const h = await headers();
  const origen = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(correo, { redirectTo: `${origen}/auth/confirmar` });
  if (error && /rate|seconds/i.test(error.message)) return { error: "Ya te mandamos un correo hace poco. Espera un minuto e intenta de nuevo." };
  (await cookies()).set(COOKIE_RECUPERAR, "1", { maxAge: 60 * 60, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  return { aviso: `Si ${correo} tiene cuenta en Nura, ya te llegó un correo con un enlace. Ábrelo desde este mismo celular.` };
}

export async function guardarContrasena(_: EstadoRecuperar, form: FormData): Promise<EstadoRecuperar> {
  const nueva = String(form.get("contrasena") ?? "");
  const otra = String(form.get("repetir") ?? "");
  if (nueva.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };
  if (nueva !== otra) return { error: "Las dos contraseñas no coinciden." };
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "El enlace ya venció. Pide otro desde Iniciar sesión." };
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) {
    if (/different|same/i.test(error.message)) return { error: "Usa una contraseña distinta a la anterior." };
    return { error: "No pudimos guardarla. Intenta de nuevo." };
  }
  redirect(await destinoDe(supabase, user));
}

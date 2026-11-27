"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoEntrar = { error?: string; aviso?: string };

function datos(form: FormData) {
  return {
    correo: String(form.get("correo") ?? "").trim().toLowerCase(),
    contrasena: String(form.get("contrasena") ?? ""),
    modo: String(form.get("modo") ?? "entrar"),
  };
}

export async function entrarOCrear(_: EstadoEntrar, form: FormData): Promise<EstadoEntrar> {
  const { correo, contrasena, modo } = datos(form);
  if (!correo.includes("@")) return { error: "Escribe un correo válido." };
  if (contrasena.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };

  const supabase = await crearClienteServidor();

  if (modo === "crear") {
    const h = await headers();
    const origen = h.get("origin") ?? `https://${h.get("host")}`;
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: { emailRedirectTo: `${origen}/auth/confirmar` },
    });
    if (error) {
      if (/registered|already/i.test(error.message)) return { error: "Ese correo ya tiene cuenta. Entra con tu contraseña." };
      return { error: "No pudimos crear la cuenta. Revisa el correo e intenta de nuevo." };
    }
    if (!data.session) {
      return { aviso: `Te mandamos un correo a ${correo}. Ábrelo y toca el enlace para confirmar tu cuenta.` };
    }
    redirect("/alta");
  }

  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
  if (error) {
    if (/confirm/i.test(error.message)) return { error: "Primero confirma tu correo con el enlace que te mandamos." };
    return { error: "El correo o la contraseña no coinciden." };
  }
  redirect("/");
}

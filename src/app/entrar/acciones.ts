"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COOKIE_ROL, PROVEEDORES, destinoDe, esRol, type Proveedor } from "@/lib/rol";

export type EstadoEntrar = { error?: string; aviso?: string };

async function origen() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

// Correo y contraseña: crear cuenta (con su rol) o entrar.
export async function entrarOCrear(_: EstadoEntrar, form: FormData): Promise<EstadoEntrar> {
  const correo = String(form.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(form.get("contrasena") ?? "");
  const modo = String(form.get("modo") ?? "entrar");
  const rol = String(form.get("rol") ?? "");

  if (!correo.includes("@")) return { error: "Escribe un correo válido." };
  if (contrasena.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };

  const supabase = await crearClienteServidor();

  if (modo === "crear") {
    if (!esRol(rol)) return { error: "Elige si buscas quién te atienda o si eres estilista." };
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: { emailRedirectTo: `${await origen()}/auth/confirmar`, data: { rol } },
    });
    if (error) {
      if (/registered|already/i.test(error.message)) return { error: "Ese correo ya tiene cuenta. Inicia sesión con tu contraseña." };
      return { error: "No pudimos crear la cuenta. Revisa el correo e intenta de nuevo." };
    }
    if (!data.session || !data.user) {
      return { aviso: `Te mandamos un correo a ${correo}. Ábrelo y toca el enlace para confirmar tu cuenta.` };
    }
    redirect(await destinoDe(supabase, data.user));
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
  if (error || !data.user) {
    if (error && /confirm/i.test(error.message)) return { error: "Primero confirma tu correo con el enlace que te mandamos." };
    return { error: "El correo o la contraseña no coinciden." };
  }
  redirect(await destinoDe(supabase, data.user));
}

// Google o Facebook. El rol elegido se recuerda en una cookie mientras la
// persona va y regresa del proveedor.
export async function entrarConProveedor(form: FormData) {
  const proveedor = String(form.get("proveedor") ?? "") as Proveedor;
  const rol = String(form.get("rol") ?? "");
  if (!PROVEEDORES.includes(proveedor)) redirect("/entrar");

  if (esRol(rol)) {
    (await cookies()).set(COOKIE_ROL, rol, { maxAge: 60 * 30, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  }
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: proveedor,
    options: { redirectTo: `${await origen()}/auth/confirmar` },
  });
  if (error || !data.url) redirect("/entrar?aviso=proveedor");
  redirect(data.url);
}

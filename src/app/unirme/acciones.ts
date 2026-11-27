"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COOKIE_UNIRME } from "@/lib/rol";

export type EstadoUnirme = { error?: string };

const ERRORES: Record<string, string> = {
  barberia_no_encontrada: "No encontramos una barbería con ese código. Pídele el enlace a tu encargado.",
  ya_eres_parte: "Ya eres parte de esa barbería.",
  demasiadas_solicitudes: "Ya tienes 3 solicitudes esperando respuesta. Espera a que te contesten.",
  nombre_invalido: "Escribe tu nombre como te conocen tus clientes.",
};

// Acepta el código solo, o el enlace completo que mandó el encargado.
function leerCodigo(texto: string): string {
  const limpio = texto.trim().toLowerCase();
  const enlace = limpio.match(/\/(?:unirme|b)\/([a-z0-9-]+)/);
  return (enlace ? enlace[1] : limpio).replace(/[^a-z0-9-]/g, "");
}

export async function enviarSolicitud(_: EstadoUnirme, form: FormData): Promise<EstadoUnirme> {
  const codigo = leerCodigo(String(form.get("codigo") ?? ""));
  const nombre = String(form.get("nombre") ?? "").trim();
  if (!codigo) return { error: "Escribe el código o pega el enlace de tu barbería." };
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/registro/cuenta?rol=profesional");
  if (user.user_metadata?.rol !== "profesional") await supabase.auth.updateUser({ data: { rol: "profesional" } });
  const { error } = await supabase.rpc("solicitar_union", { p_codigo: codigo, p_nombre: nombre });
  if (error) {
    const clave = Object.keys(ERRORES).find((k) => error.message.includes(k));
    return { error: clave ? ERRORES[clave] : "No pudimos mandar la solicitud. Intenta de nuevo." };
  }
  (await cookies()).delete(COOKIE_UNIRME);
  revalidatePath("/unirme");
  redirect("/unirme");
}

// La invitación se recuerda mientras la persona crea su cuenta.
export async function recordarInvitacion(form: FormData) {
  const codigo = leerCodigo(String(form.get("codigo") ?? ""));
  (await cookies()).set(COOKIE_UNIRME, codigo, { maxAge: 60 * 60 * 24, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  redirect("/registro/cuenta?rol=profesional");
}

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { salonDelUsuario } from "./salon";

// Cada cuenta es de una clienta o de un profesional (estilista o barbero).
// El rol se guarda en los datos de la cuenta; la seguridad no depende de él,
// porque los datos de cada barbería los protegen las reglas de la base de datos.
export type Rol = "cliente" | "profesional";
export const COOKIE_ROL = "nura_rol";

export function esRol(valor: unknown): valor is Rol {
  return valor === "cliente" || valor === "profesional";
}

// A dónde va cada quien al entrar.
export async function destinoDe(supabase: SupabaseClient, user: User): Promise<string> {
  if (await salonDelUsuario(supabase, user.id)) return "/hoy";
  const rol = user.user_metadata?.rol;
  if (rol === "profesional") return "/alta";
  if (rol === "cliente") return "/inicio";
  return "/elegir";
}

// Formas de entrar además del correo. Se encienden en Vercel con la variable
// NEXT_PUBLIC_LOGIN_PROVIDERS, por ejemplo "google,facebook", una vez que cada
// proveedor está configurado en Supabase.
export type Proveedor = "google" | "facebook";
export const PROVEEDORES: Proveedor[] = (process.env.NEXT_PUBLIC_LOGIN_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter((p): p is Proveedor => p === "google" || p === "facebook");

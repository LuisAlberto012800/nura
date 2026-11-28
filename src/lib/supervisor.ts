import { cookies } from "next/headers";

// Modo supervisor: solo para los correos escritos en la variable de Vercel
// NURA_SUPERVISORES (separados por coma). No da permisos extra sobre los datos:
// solo deja cambiar de vista para revisar la app como la ve cada quien.
export const COOKIE_VISTA = "nura_vista";
export type Vista = "encargado" | "barbero" | "usuario";

export function esSupervisor(correo: string | null | undefined): boolean {
  if (!correo) return false;
  const lista = (process.env.NURA_SUPERVISORES ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(correo.trim().toLowerCase());
}

// La vista que eligió el supervisor (por defecto, la de encargado).
export async function vistaElegida(): Promise<Vista> {
  const v = (await cookies()).get(COOKIE_VISTA)?.value;
  return v === "barbero" || v === "usuario" ? v : "encargado";
}

"use server";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { sesionActual } from "@/lib/sesion";
import { COOKIE_VISTA, esSupervisor } from "@/lib/supervisor";

export async function cambiarVista(form: FormData) {
  const { user } = await sesionActual();
  if (!user || !esSupervisor(user.email)) notFound();
  const vista = String(form.get("vista") ?? "");
  const almacen = await cookies();
  if (vista === "barbero" || vista === "usuario") {
    almacen.set(COOKIE_VISTA, vista, { maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  } else {
    almacen.delete(COOKIE_VISTA);
  }
  redirect(vista === "usuario" ? "/inicio" : "/hoy");
}

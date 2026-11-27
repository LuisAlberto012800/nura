"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function responder(form: FormData) {
  const token = String(form.get("token") ?? "");
  const respuesta = String(form.get("respuesta") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(token)) redirect("/");
  const supabase = await crearClienteServidor();
  await supabase.rpc("responder_trabajo", { p_token: token, p_respuesta: respuesta });
  redirect(`/confirmar/${token}`);
}

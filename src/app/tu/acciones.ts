"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

const CABELLOS = ["lacio", "ondulado", "rizado", "afro"];

// Guarda el tipo de cabello de la clienta: su inicio muestra eso primero.
export async function guardarCabello(form: FormData) {
  const cabello = String(form.get("cabello") ?? "");
  if (!CABELLOS.includes(cabello)) return;
  const supabase = await crearClienteServidor();
  await supabase.auth.updateUser({ data: { cabello } });
  revalidatePath("/tu");
  revalidatePath("/inicio");
}

export async function salir() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// Cliente para el teléfono: solo se usa para subir fotos directo a Supabase,
// así no pasan por el servidor (que en el plan gratis limita el tamaño).
export function crearClienteNavegador() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase/config";

const RAIZ = `${SUPABASE_URL}/storage/v1/object/public/trabajos/`;

// ¿La foto es de la carpeta de este salón en Nura?
export const fotoDelSalon = (url: string | null | undefined, salonId: string) => !!url && url.startsWith(`${RAIZ}${salonId}/`);

// Borra del almacenamiento una foto reemplazada, para cuidar el espacio gratis.
export async function borrarFoto(supabase: SupabaseClient, salonId: string, url: string | null | undefined) {
  if (url && fotoDelSalon(url, salonId)) await supabase.storage.from("trabajos").remove([url.slice(RAIZ.length)]);
}

import { crearClienteServidor } from "./supabase/server";

export type SalonPublico = {
  id: string;
  nombre: string;
  slug: string;
  colonia: string;
  direccion: string | null;
  whatsapp: string | null;
  descripcion: string | null;
  publicado: boolean;
  local_verificado_en: string | null;
  identidad_verificada_en: string | null;
  creado_en: string;
};

// Salón por su enlace. Lo ve cualquiera si está publicado; su equipo siempre.
export async function salonPorSlug(slug: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("salones")
    .select("id, nombre, slug, colonia, direccion, whatsapp, descripcion, publicado, local_verificado_en, identidad_verificada_en, creado_en")
    .eq("slug", slug)
    .maybeSingle();
  return { supabase, salon: data as SalonPublico | null };
}

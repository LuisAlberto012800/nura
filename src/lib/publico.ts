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
  portada_url: string | null;
};

// Salón por su enlace. Lo ve cualquiera si está publicado; su equipo siempre.
export async function salonPorSlug(slug: string) {
  const supabase = await crearClienteServidor();
  const columnas = "id, nombre, slug, colonia, direccion, whatsapp, descripcion, publicado, local_verificado_en, identidad_verificada_en, creado_en";
  let { data, error } = await supabase.from("salones").select(`${columnas}, portada_url`).eq("slug", slug).maybeSingle();
  // Si todavía no se corre la actualización 0004, la página sigue funcionando sin portada.
  if (error) ({ data, error } = await supabase.from("salones").select(columnas).eq("slug", slug).maybeSingle());
  const salon = data ? ({ ...(data as object) } as SalonPublico) : null;
  if (salon && salon.portada_url === undefined) salon.portada_url = null;
  return { supabase, salon };
}

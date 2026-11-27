import type { SupabaseClient } from "@supabase/supabase-js";

export type Salon = {
  id: string;
  nombre: string;
  slug: string;
  colonia: string;
  whatsapp: string | null;
  abierto_hoy: boolean;
  publicado: boolean;
};

// El salón al que pertenece quien tiene la sesión abierta (por ahora, uno por persona).
export async function salonDelUsuario(supabase: SupabaseClient, usuarioId: string): Promise<Salon | null> {
  const { data } = await supabase
    .from("miembros")
    .select("salon:salones(id, nombre, slug, colonia, whatsapp, abierto_hoy, publicado)")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: true })
    .limit(1)
    .maybeSingle();
  const salon = (data as { salon: Salon | Salon[] | null } | null)?.salon ?? null;
  return Array.isArray(salon) ? (salon[0] ?? null) : salon;
}

// "Salón Alba" -> "salon-alba"
export function crearSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "salon";
}

// Deja solo los 10 dígitos de un celular mexicano: quita +52, espacios y guiones.
export function limpiarTelefono(texto: string): string | null {
  let digitos = texto.replace(/\D/g, "");
  if (digitos.length === 12 && digitos.startsWith("52")) digitos = digitos.slice(2);
  if (digitos.length === 13 && digitos.startsWith("521")) digitos = digitos.slice(3);
  return digitos.length === 10 ? digitos : null;
}

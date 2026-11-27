// Medallas de verificación. Cada trabajo lleva la más baja entre la de la
// barbería y la de la clienta que lo confirmó (el eslabón más débil).
export const NOMBRE_MEDALLA = ["Sin verificar", "Bronce", "Plata", "Oro", "Platino"] as const;

export type DatosVerificacion = {
  whatsapp: string | null;
  local_verificado_en: string | null;
  identidad_verificada_en: string | null;
  creado_en?: string | null;
};

// Bronce: WhatsApp registrado. Plata: local visitado por el equipo de Nura.
// Oro: identidad validada. Platino: oro, 25 trabajos confirmados y 3 meses.
export function medallaSalon(s: DatosVerificacion, trabajosConfirmados = 0): number {
  if (!s.whatsapp) return 0;
  if (!s.local_verificado_en) return 1;
  if (!s.identidad_verificada_en) return 2;
  const meses = s.creado_en ? (Date.now() - Date.parse(s.creado_en)) / (30 * 24 * 3600 * 1000) : 0;
  return trabajosConfirmados >= 25 && meses >= 3 ? 4 : 3;
}

export function medallaTrabajo(salon: number, cliente: number | null, confirmacion: string): number {
  if (confirmacion !== "con_nombre" && confirmacion !== "sin_nombre") return 0;
  return Math.min(salon, cliente ?? 1);
}

export const SIGUIENTE_PASO = [
  "Agrega el WhatsApp de tu barbería en Cuenta.",
  "El equipo de Nura visita tu local para darte plata.",
  "Valida tu identidad con INE para llegar a oro. Pronto en la app.",
  "Llega a 25 trabajos confirmados por clientas y 3 meses en Nura.",
  "Tienes la medalla más alta.",
] as const;

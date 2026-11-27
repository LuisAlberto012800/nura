export const TIPOS_VACANTE = [
  { valor: "tiempo_completo", texto: "Tiempo completo" },
  { valor: "medio_tiempo", texto: "Medio tiempo" },
  { valor: "renta_silla", texto: "Renta de silla" },
  { valor: "comision", texto: "Por comisión" },
] as const;
export const textoTipo = (v: string) => TIPOS_VACANTE.find((t) => t.valor === v)?.texto ?? v;

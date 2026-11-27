// Formatos que se repiten en toda la app.

// 90 -> "1 h 30 min"
export function duracionTexto(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// 1450 -> "$1,450"
export function pesos(cantidad: number): string {
  return `$${cantidad.toLocaleString("es-MX")}`;
}

export const DURACIONES = [15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 210, 240, 300];

export const CATEGORIAS = [
  { valor: "corte", texto: "Corte" },
  { valor: "barba", texto: "Barba" },
  { valor: "color", texto: "Color" },
  { valor: "tratamiento", texto: "Tratamiento" },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]["valor"];

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

export const CABELLOS = [
  { valor: "lacio", texto: "Lacio" },
  { valor: "ondulado", texto: "Ondulado" },
  { valor: "rizado", texto: "Rizado" },
  { valor: "afro", texto: "Afro" },
] as const;

export type Cabello = (typeof CABELLOS)[number]["valor"];

export const textoCabello = (v: string | null | undefined) => CABELLOS.find((c) => c.valor === v)?.texto ?? null;
export const textoCategoria = (v: string | null | undefined) => CATEGORIAS.find((c) => c.valor === v)?.texto ?? null;

// "2026-11-02" -> "hace 3 semanas", contra hoy en Guadalajara
export function haceCuanto(dia: string, hoy: string): string {
  const dias = Math.round((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${dia}T12:00:00Z`)) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 14) return `hace ${dias} días`;
  if (dias < 60) return `hace ${Math.round(dias / 7)} semanas`;
  if (dias < 365) return `hace ${Math.round(dias / 30)} meses`;
  const anios = Math.round(dias / 365);
  return anios === 1 ? "hace un año" : `hace ${anios} años`;
}

export function diasDesde(dia: string, hoy: string): number {
  return Math.round((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${dia}T12:00:00Z`)) / 86_400_000);
}

// Enlace de WhatsApp a un celular de México de 10 dígitos
export function enlaceWhatsApp(telefono: string, texto?: string): string {
  return `https://wa.me/52${telefono}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

// "3312345678" -> "33 1234 5678"
export function telefonoTexto(t: string): string {
  return t.length === 10 ? `${t.slice(0, 2)} ${t.slice(2, 6)} ${t.slice(6)}` : t;
}

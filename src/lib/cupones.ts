import { pesos } from "./formato";

export type Cupon = { id: string; codigo: string; servicio_id: string | null; tipo: "porcentaje" | "monto"; valor: number; vence: string | null; usos_max: number | null; usos: number; publico: boolean; activo: boolean };

// "20% de descuento" o "$50 de descuento"
export const textoDescuento = (c: Pick<Cupon, "tipo" | "valor">) => (c.tipo === "porcentaje" ? `${c.valor}% de descuento` : `${pesos(c.valor)} de descuento`);

// Precio exacto con el cupón aplicado (nunca menor a $0).
export function precioConCupon(precio: number, c: Pick<Cupon, "tipo" | "valor">): number {
  const descuento = c.tipo === "porcentaje" ? Math.round((precio * c.valor) / 100) : c.valor;
  return Math.max(0, precio - Math.min(precio, descuento));
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const venceTexto = (d: string) => `vence el ${Number(d.slice(8))} de ${MESES[Number(d.slice(5, 7)) - 1]}`;

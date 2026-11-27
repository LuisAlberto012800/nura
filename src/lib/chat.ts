import { DIAS } from "./horarios";
import { aMinutos, diaSemana, hoyLocal, minutosAhora } from "./tiempo";

export type AjustesChat = { chat_hasta: string | null; chat_inicio: string; chat_fin: string; chat_dias: number[] };

// "Lun a sáb · 10:00 a 19:00"
export function textoHorarioChat(a: AjustesChat): string {
  const orden = DIAS.map((d) => d.valor).filter((d) => a.chat_dias.includes(d));
  const corto = (d: number) => DIAS.find((x) => x.valor === d)!.texto.slice(0, 3).toLowerCase();
  const seguidos = orden.length > 2 && orden.every((d, i) => i === 0 || DIAS.findIndex((x) => x.valor === d) === DIAS.findIndex((x) => x.valor === orden[i - 1]) + 1);
  const dias = orden.length === 0 ? "ningún día" : seguidos ? `${corto(orden[0])} a ${corto(orden[orden.length - 1])}` : orden.map(corto).join(", ");
  return `${dias.charAt(0).toUpperCase()}${dias.slice(1)} · ${a.chat_inicio.slice(0, 5)} a ${a.chat_fin.slice(0, 5)}`;
}

// ¿Pagado y abierto ahora mismo? (la base de datos vuelve a revisarlo al escribir)
export function estadoChat(a: AjustesChat) {
  const activo = !!a.chat_hasta && a.chat_hasta >= hoyLocal();
  const ahora = minutosAhora();
  const abierto = activo && a.chat_dias.includes(diaSemana(hoyLocal())) && ahora >= aMinutos(a.chat_inicio) && ahora <= aMinutos(a.chat_fin);
  return { activo, abierto, horario: textoHorarioChat(a) };
}

// Días en el orden en que se muestran (lunes primero). En la base de datos
// el día va de 0 = domingo a 6 = sábado.
export const DIAS = [
  { valor: 1, texto: "Lunes" },
  { valor: 2, texto: "Martes" },
  { valor: 3, texto: "Miércoles" },
  { valor: 4, texto: "Jueves" },
  { valor: 5, texto: "Viernes" },
  { valor: 6, texto: "Sábado" },
  { valor: 0, texto: "Domingo" },
];

// Horas cada media hora, de 6:00 a 23:30, como "10:00".
export const HORAS: string[] = Array.from({ length: 36 }, (_, i) => {
  const minutos = 6 * 60 + i * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${minutos % 60 === 0 ? "00" : "30"}`;
});

export type DiaHorario = { dia: number; atiende: boolean; inicio: string; fin: string };

// Horario de ejemplo cuando todavía no hay uno guardado: lunes a sábado, 10 a 20.
export function horarioSugerido(): DiaHorario[] {
  return DIAS.map((d) => ({ dia: d.valor, atiende: d.valor !== 0, inicio: "10:00", fin: "20:00" }));
}

// "10:00:00" (como lo devuelve la base) -> "10:00"
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

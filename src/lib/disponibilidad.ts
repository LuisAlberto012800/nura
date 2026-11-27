// Cuándo se puede agendar: dentro del horario de quien atiende y sin chocar
// con otra cita o un bloqueo. Lo usan el formulario (para mostrar solo horas
// libres) y el servidor (para no confiar en lo que mande el teléfono).
import { aInstante, aMinutos, deMinutos, diaSemana } from "./tiempo";

export type Turno = { dia: number; inicio: string; fin: string };
export type Ocupado = { estilista_id: string; inicio: string; fin: string };

export const PASO_MIN = 30;

// Turnos del día de la semana de esa fecha (puede haber más de uno).
export function turnosDelDia(horarios: Turno[], dia: string): Turno[] {
  const d = diaSemana(dia);
  return horarios.filter((h) => h.dia === d).sort((a, b) => aMinutos(a.inicio) - aMinutos(b.inicio));
}

export function textoTurnos(turnos: Turno[]): string {
  return turnos.map((t) => `${t.inicio.slice(0, 5)} a ${t.fin.slice(0, 5)}`).join(" y ");
}

// ¿La cita completa (inicio + duración) cae dentro de algún turno?
export function dentroDeTurno(turnos: Turno[], hora: string, duracion: number): boolean {
  const a = aMinutos(hora);
  const z = a + duracion;
  return turnos.some((t) => a >= aMinutos(t.inicio) && z <= aMinutos(t.fin));
}

export function choca(ocupados: Ocupado[], estilistaId: string, dia: string, hora: string, duracion: number): boolean {
  const a = Date.parse(aInstante(dia, hora));
  const z = a + duracion * 60_000;
  return ocupados.some((o) => o.estilista_id === estilistaId && a < Date.parse(o.fin) && z > Date.parse(o.inicio));
}

// Horas de inicio libres para ese día, estilista y duración.
export function horasLibres(
  horarios: Turno[],
  ocupados: Ocupado[],
  estilistaId: string,
  dia: string,
  duracion: number,
): string[] {
  const libres: string[] = [];
  for (const t of turnosDelDia(horarios, dia)) {
    const fin = aMinutos(t.fin);
    for (let m = aMinutos(t.inicio); m + duracion <= fin; m += PASO_MIN) {
      const hora = deMinutos(m);
      if (!choca(ocupados, estilistaId, dia, hora, duracion)) libres.push(hora);
    }
  }
  return libres;
}

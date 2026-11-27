// Fechas y horas en la zona de Guadalajara. Desde 2022 México ya no cambia
// de horario en verano, así que la zona central es siempre UTC−6.
export const ZONA = "America/Mexico_City";
const DESFASE = "-06:00";

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// "2026-11-26" de hoy en Guadalajara
export function hoyLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

export function esDiaValido(dia: string | undefined | null): dia is string {
  return !!dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) && !Number.isNaN(Date.parse(`${dia}T00:00:00Z`));
}

export function sumarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// 0 = domingo … 6 = sábado, igual que en la tabla de horarios
export function diaSemana(dia: string): number {
  return new Date(`${dia}T12:00:00Z`).getUTCDay();
}

// Día y hora locales -> instante para guardar en la base de datos
export function aInstante(dia: string, hora: string): string {
  return `${dia}T${hora}:00${DESFASE}`;
}

// Instante de la base de datos -> "11:30" en Guadalajara
export function horaLocal(instante: string): string {
  return new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(instante),
  );
}

// Instante -> "2026-11-26" en Guadalajara
export function diaLocal(instante: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date(instante));
}

export function etiquetaDia(dia: string) {
  return { corto: DIAS_CORTOS[diaSemana(dia)], numero: String(Number(dia.slice(8, 10))) };
}

// "Jueves 26 de noviembre"
export function fechaLarga(dia: string): string {
  const texto = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${dia}T12:00:00Z`),
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "10:30" <-> 630
export function aMinutos(hora: string): number {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function deMinutos(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

// Minutos desde medianoche, ahora mismo en Guadalajara
export function minutosAhora(): number {
  return aMinutos(new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()));
}

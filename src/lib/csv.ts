// Lectura de archivos CSV de otras agendas o de Excel, sin librerías.

// Excel en español suele guardar en Windows-1252; las apps, en UTF-8.
export async function leerTexto(archivo: File): Promise<string> {
  const bytes = await archivo.arrayBuffer();
  let texto: string;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    texto = new TextDecoder("windows-1252").decode(bytes);
  }
  return texto.replace(/^﻿/, "");
}

// Separa en filas y columnas. Respeta comillas, comas dentro de comillas y
// saltos de línea dentro de una celda. Detecta si separa con coma, punto y coma o tabulador.
export function leerCSV(texto: string): string[][] {
  const primera = texto.slice(0, texto.indexOf("\n") === -1 ? undefined : texto.indexOf("\n"));
  const cuenta = (c: string) => primera.split(c).length;
  const sep = [",", ";", "\t"].reduce((a, b) => (cuenta(b) > cuenta(a) ? b : a));
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') enComillas = false;
      else celda += c;
    } else if (c === '"') enComillas = true;
    else if (c === sep) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(celda);
      if (fila.some((x) => x.trim() !== "")) filas.push(fila);
      fila = [];
      celda = "";
    } else celda += c;
  }
  fila.push(celda);
  if (fila.some((x) => x.trim() !== "")) filas.push(fila);
  return filas.map((f) => f.map((x) => x.trim()));
}

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export const CAMPOS = [
  { clave: "nombre", texto: "Nombre", pistas: ["nombre", "nombre completo", "name", "full name", "first name", "cliente", "nombre del cliente"] },
  { clave: "apellido", texto: "Apellido", pistas: ["apellido", "apellidos", "last name", "surname", "apellido paterno"] },
  { clave: "telefono", texto: "Celular", pistas: ["celular", "telefono", "tel", "movil", "phone", "mobile", "whatsapp", "numero", "telefono movil", "phone number"] },
  { clave: "correo", texto: "Correo", pistas: ["correo", "email", "e mail", "mail", "correo electronico"] },
  { clave: "notas", texto: "Notas", pistas: ["notas", "nota", "notes", "comentarios", "observaciones"] },
  { clave: "ultima", texto: "Última visita", pistas: ["ultima visita", "ultima cita", "last visit", "last appointment", "fecha ultima visita", "ultima reserva"] },
] as const;

export type Campo = (typeof CAMPOS)[number]["clave"];

// Adivina qué columna es cada dato por el nombre del encabezado.
export function adivinarColumnas(encabezados: string[]): Record<Campo, number> {
  const norm = encabezados.map(normal);
  const r = {} as Record<Campo, number>;
  for (const campo of CAMPOS) {
    let i = norm.findIndex((h) => (campo.pistas as readonly string[]).includes(h));
    if (i === -1) i = norm.findIndex((h) => campo.pistas.some((p) => h.startsWith(p) || h.includes(` ${p}`)));
    r[campo.clave] = i;
  }
  if (r.apellido === r.nombre) r.apellido = -1;
  return r;
}

// "15/03/2026", "15-03-26" o "2026-03-15" -> "2026-03-15". Si no se entiende, null.
export function leerFecha(texto: string): string | null {
  const t = texto.trim().split(/[ T]/)[0];
  let a: number, m: number, d: number;
  let x = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (x) [a, m, d] = [Number(x[1]), Number(x[2]), Number(x[3])];
  else if ((x = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) {
    [d, m, a] = [Number(x[1]), Number(x[2]), Number(x[3])];
    if (a < 100) a += 2000;
  } else return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || a < 2000) return null;
  const iso = `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return Number.isNaN(Date.parse(iso)) || iso > new Date().toISOString().slice(0, 10) ? null : iso;
}

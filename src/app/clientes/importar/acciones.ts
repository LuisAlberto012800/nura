"use server";

import { revalidatePath } from "next/cache";
import { contextoEncargado } from "@/lib/sesion";
import { limpiarTelefono } from "@/lib/salon";

export type FilaImportar = { nombre: string; telefono: string; correo: string; notas: string; ultima: string };
export type ResultadoLote = { nuevos: number; repetidos: number; omitidos: number; error?: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Guarda un lote de clientes del archivo. Los que ya existen (mismo celular) no se duplican.
export async function importarLote(filas: FilaImportar[]): Promise<ResultadoLote> {
  if (!Array.isArray(filas) || filas.length > 300) return { nuevos: 0, repetidos: 0, omitidos: 0, error: "Lote inválido." };
  const { supabase, salon } = await contextoEncargado();
  let omitidos = 0;
  const vistos = new Set<string>();
  const conCelular: Record<string, unknown>[] = [];
  const sinCelular: Record<string, unknown>[] = [];
  for (const f of filas) {
    const nombre = String(f.nombre ?? "").trim().slice(0, 120);
    if (!nombre) {
      omitidos++;
      continue;
    }
    const telefono = limpiarTelefono(String(f.telefono ?? ""));
    const correo = String(f.correo ?? "").trim().toLowerCase();
    const fila = {
      salon_id: salon.id,
      nombre,
      telefono,
      correo: correo.includes("@") ? correo.slice(0, 120) : null,
      notas: String(f.notas ?? "").trim().slice(0, 500) || null,
      ultima_visita: FECHA.test(String(f.ultima ?? "")) ? f.ultima : null,
      origen: "archivo",
    };
    if (telefono) {
      if (vistos.has(telefono)) {
        omitidos++;
        continue;
      }
      vistos.add(telefono);
      conCelular.push(fila);
    } else sinCelular.push(fila);
  }

  let nuevos = 0;
  if (conCelular.length) {
    const { data, error } = await supabase.from("clientes").upsert(conCelular, { onConflict: "salon_id,telefono", ignoreDuplicates: true }).select("id");
    if (error) return { nuevos, repetidos: 0, omitidos, error: "No pudimos guardar parte del archivo. Intenta de nuevo." };
    nuevos += data?.length ?? 0;
  }
  if (sinCelular.length) {
    const { data, error } = await supabase.from("clientes").insert(sinCelular).select("id");
    if (error) return { nuevos, repetidos: 0, omitidos, error: "No pudimos guardar parte del archivo. Intenta de nuevo." };
    nuevos += data?.length ?? 0;
  }
  revalidatePath("/", "layout");
  return { nuevos, repetidos: conCelular.length - (nuevos - sinCelular.length), omitidos };
}

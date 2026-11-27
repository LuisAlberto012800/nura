// Bot de reservas por WhatsApp. No guarda conversaciones: cada opción que
// toca la persona trae escrito lo que ya eligió (servicio, quién, día, hora).
// Reserva con la misma función de la página pública, con todas sus reglas.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../supabase/config";
import { horasLibres, turnosDelDia, type Ocupado, type Turno } from "../disponibilidad";
import { duracionTexto, pesos } from "../formato";
import { aInstante, aMinutos, etiquetaDia, fechaLarga, hoyLocal, minutosAhora, sumarDias } from "../tiempo";
import { enviarBotones, enviarLista, enviarTexto } from "./enviar";

export type Entrante = { de: string; nombre: string | null; texto?: string; opcion?: string };

type Salon = { id: string; nombre: string; slug: string; colonia: string; direccion: string | null; bot_hasta: string | null };
type Servicio = { id: string; nombre: string; duracion_min: number; precio: number; salon_id: string };
type Estilista = { id: string; nombre: string; horarios: Turno[] };

const DIAS = 21;
const POR_LISTA = 9; // la décima fila se usa para "Más horas"

const base = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://nura-nura-ebbe.vercel.app";
const db = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const conBot = (s: Salon) => !!s.bot_hasta && s.bot_hasta >= hoyLocal();

const ERRORES: Record<string, string> = {
  horario_ocupado: "Alguien acaba de apartar esa hora. Elige otra.",
  fuera_de_horario: "Esa hora ya no está en su horario. Elige otra.",
  fecha_invalida: "Esa hora ya está muy cerca. Elige otra con al menos 30 minutos de anticipación.",
  demasiadas_reservas: "Ya tienes 2 reservas esperando confirmación en esta barbería. Espera a que te confirmen.",
  salon_no_disponible: "Esta barbería no está recibiendo reservas en este momento.",
  servicio_no_disponible: "Ese servicio ya no está disponible.",
  estilista_no_disponible: "Esa persona ya no está disponible.",
};

export async function atender(m: Entrante) {
  const partes = (m.opcion ?? "").split("|");
  const paso = partes[0];
  try {
    if (paso === "s") return await elegirServicio(m, partes[1]);
    if (paso === "e") return await mostrarDias(m, partes[1], partes[2]);
    if (paso === "d") return await mostrarHoras(m, partes[1], partes[2], partes[3], Number(partes[4] ?? 0));
    if (paso === "h") return await pedirConfirmacion(m, partes[1], partes[2], partes[3], partes[4]);
    if (paso === "c") return await reservar(m, partes[1], partes[2], partes[3], partes[4]);
    return await saludar(m);
  } catch {
    await enviarTexto(m.de, "Algo falló de nuestro lado. Escribe de nuevo en un momento.");
  }
}

// Primer mensaje: el enlace de la barbería trae su código ("…reservar en salon-alba").
async function saludar(m: Entrante) {
  const palabras = (m.texto ?? "").toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
  const candidatos = [...new Set(palabras.filter((p) => p.length >= 3))].slice(0, 20);
  const { data } = candidatos.length
    ? await db().from("salones").select("id, nombre, slug, colonia, direccion, bot_hasta").in("slug", candidatos).eq("publicado", true).limit(1)
    : { data: [] };
  const salon = (data?.[0] ?? null) as Salon | null;
  if (!salon) {
    return enviarTexto(m.de, "Hola, soy el asistente de reservas de Nura. Para reservar, abre el botón de WhatsApp que está en la página de tu barbería.");
  }
  if (!conBot(salon)) {
    return enviarTexto(m.de, `${salon.nombre} todavía no reserva por WhatsApp. Puedes reservar aquí, sin cuenta: ${base()}/b/${salon.slug}`);
  }
  const { data: servicios } = await db().from("servicios").select("id, nombre, duracion_min, precio").eq("salon_id", salon.id).eq("activo", true).order("orden").order("creado_en").limit(10);
  if (!servicios?.length) return enviarTexto(m.de, `${salon.nombre} todavía no tiene servicios en línea. Escríbeles directo.`);
  return enviarLista(
    m.de,
    `Hola${m.nombre ? ` ${m.nombre.split(" ")[0]}` : ""}. Reserva en ${salon.nombre}, ${salon.colonia}. Precios exactos, pagas en la barbería. ¿Qué te quieres hacer?`,
    "Ver servicios",
    servicios.map((s) => ({ id: `s|${s.id}`, title: s.nombre, description: `${pesos(s.precio)} · ${duracionTexto(s.duracion_min)}` })),
  );
}

async function cargar(servicioId: string) {
  const { data: servicio } = await db().from("servicios").select("id, nombre, duracion_min, precio, salon_id").eq("id", servicioId).eq("activo", true).maybeSingle();
  if (!servicio) return null;
  const s = servicio as Servicio;
  const [{ data: salon }, { data: equipo }] = await Promise.all([
    db().from("salones").select("id, nombre, slug, colonia, direccion, bot_hasta").eq("id", s.salon_id).eq("publicado", true).maybeSingle(),
    db().from("estilistas").select("id, nombre, horarios(dia, inicio, fin)").eq("salon_id", s.salon_id).eq("activo", true).order("creado_en"),
  ]);
  if (!salon || !conBot(salon as Salon)) return null;
  return { servicio: s, salon: salon as Salon, equipo: ((equipo ?? []) as Estilista[]).filter((e) => e.horarios.length > 0) };
}

const noDisponible = (m: Entrante) => enviarTexto(m.de, "Esa opción ya no está disponible. Escribe de nuevo el nombre de tu barbería o abre su enlace.");

async function elegirServicio(m: Entrante, servicioId: string) {
  const d = await cargar(servicioId);
  if (!d) return noDisponible(m);
  if (d.equipo.length === 0) return enviarTexto(m.de, `${d.salon.nombre} todavía no tiene horarios en línea.`);
  if (d.equipo.length === 1) return mostrarDias(m, servicioId, d.equipo[0].id, d);
  return enviarLista(
    m.de,
    `${d.servicio.nombre}, ${pesos(d.servicio.precio)}. ¿Con quién?`,
    "Elegir",
    d.equipo.slice(0, 10).map((e) => ({ id: `e|${servicioId}|${e.id}`, title: e.nombre })),
  );
}

async function mostrarDias(m: Entrante, servicioId: string, estilistaId: string, previo?: Awaited<ReturnType<typeof cargar>>) {
  const d = previo ?? (await cargar(servicioId));
  const estilista = d?.equipo.find((e) => e.id === estilistaId);
  if (!d || !estilista) return noDisponible(m);
  const hoy = hoyLocal();
  const dias = Array.from({ length: DIAS }, (_, i) => sumarDias(hoy, i)).filter((x) => turnosDelDia(estilista.horarios, x).length > 0).slice(0, 10);
  if (!dias.length) return enviarTexto(m.de, `${estilista.nombre.split(" ")[0]} no tiene días disponibles pronto.`);
  return enviarLista(
    m.de,
    `${d.servicio.nombre} con ${estilista.nombre.split(" ")[0]}. ¿Qué día?`,
    "Elegir día",
    dias.map((x) => ({ id: `d|${servicioId}|${estilistaId}|${x}`, title: x === hoy ? "Hoy" : fechaLarga(x).split(",")[0], description: `${etiquetaDia(x).numero} de ${fechaLarga(x).split(" de ")[1] ?? ""}`.trim() })),
  );
}

async function libres(d: NonNullable<Awaited<ReturnType<typeof cargar>>>, estilista: Estilista, dia: string) {
  const { data } = await db().rpc("ocupado_publico", { p_salon: d.salon.id, p_desde: aInstante(dia, "00:00"), p_hasta: aInstante(sumarDias(dia, 1), "00:00") });
  const hoy = hoyLocal();
  const ahora = minutosAhora();
  return horasLibres(estilista.horarios, (data ?? []) as Ocupado[], estilista.id, dia, d.servicio.duracion_min).filter((h) => dia !== hoy || aMinutos(h) >= ahora + 30);
}

async function mostrarHoras(m: Entrante, servicioId: string, estilistaId: string, dia: string, desde: number) {
  const d = await cargar(servicioId);
  const estilista = d?.equipo.find((e) => e.id === estilistaId);
  if (!d || !estilista || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return noDisponible(m);
  const horas = await libres(d, estilista, dia);
  if (!horas.length) return enviarTexto(m.de, `Ya no quedan horas libres el ${fechaLarga(dia).toLowerCase()}. Escribe "hola" para elegir otro día.`);
  const pagina = horas.slice(desde, desde + POR_LISTA);
  const filas = pagina.map((h) => ({ id: `h|${servicioId}|${estilistaId}|${dia}|${h}`, title: h }));
  if (horas.length > desde + POR_LISTA) filas.push({ id: `d|${servicioId}|${estilistaId}|${dia}|${desde + POR_LISTA}`, title: "Más horas" });
  return enviarLista(m.de, `Horas libres el ${fechaLarga(dia).toLowerCase()}:`, "Elegir hora", filas);
}

async function pedirConfirmacion(m: Entrante, servicioId: string, estilistaId: string, dia: string, hora: string) {
  const d = await cargar(servicioId);
  const estilista = d?.equipo.find((e) => e.id === estilistaId);
  if (!d || !estilista) return noDisponible(m);
  return enviarBotones(
    m.de,
    `${d.servicio.nombre} con ${estilista.nombre.split(" ")[0]}\n${fechaLarga(dia)} a las ${hora}\n${d.salon.nombre}, ${d.salon.direccion ? `${d.salon.direccion}, ` : ""}${d.salon.colonia}\nPrecio exacto: ${pesos(d.servicio.precio)}, pagas en la barbería.`,
    [
      { id: `c|${servicioId}|${estilistaId}|${dia}|${hora}`, title: "Confirmar" },
      { id: `d|${servicioId}|${estilistaId}|${dia}`, title: "Otra hora" },
    ],
  );
}

async function reservar(m: Entrante, servicioId: string, estilistaId: string, dia: string, hora: string) {
  const d = await cargar(servicioId);
  const estilista = d?.equipo.find((e) => e.id === estilistaId);
  if (!d || !estilista) return noDisponible(m);
  const telefono = m.de.replace(/\D/g, "").slice(-10);
  const nombre = (m.nombre ?? "").trim().slice(0, 80) || "Cliente de WhatsApp";
  const { error } = await db().rpc("reservar", {
    p_salon: d.salon.id,
    p_estilista: estilistaId,
    p_servicio: servicioId,
    p_inicio: aInstante(dia, hora),
    p_nombre: nombre.length >= 2 ? nombre : "Cliente de WhatsApp",
    p_telefono: telefono,
  });
  if (error) {
    const clave = Object.keys(ERRORES).find((k) => error.message.includes(k));
    return enviarTexto(m.de, clave ? ERRORES[clave] : "No pudimos apartar tu cita. Intenta de nuevo.");
  }
  return enviarTexto(
    m.de,
    `Listo, tu cita quedó apartada: ${d.servicio.nombre} con ${estilista.nombre.split(" ")[0]}, ${fechaLarga(dia).toLowerCase()} a las ${hora}. ${d.salon.nombre} te confirma por WhatsApp. Página de la barbería: ${base()}/b/${d.salon.slug}`,
  );
}

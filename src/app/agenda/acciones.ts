"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { limpiarTelefono, salonDelUsuario } from "@/lib/salon";
import { aInstante, aMinutos, deMinutos, diaSemana, esDiaValido, hoyLocal, minutosAhora } from "@/lib/tiempo";
import { dentroDeTurno, textoTurnos, turnosDelDia, type Turno } from "@/lib/disponibilidad";

const EN_PLURAL = ["los domingos", "los lunes", "los martes", "los miércoles", "los jueves", "los viernes", "los sábados"];

export type EstadoAgenda = { error?: string };

async function contexto() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) redirect("/alta");
  return { supabase, salon };
}

const HORA = /^\d{2}:\d{2}$/;

function volver(dia: string, estilista: string, extra = "") {
  revalidatePath("/", "layout");
  redirect(`/agenda?dia=${dia}&e=${estilista}${extra}`);
}

// Nueva cita. El empalme lo impide la base de datos; aquí se traduce el error.
export async function crearCita(_: EstadoAgenda, form: FormData): Promise<EstadoAgenda> {
  const dia = String(form.get("dia") ?? "");
  const hora = String(form.get("hora") ?? "");
  const estilistaId = String(form.get("estilista_id") ?? "");
  const servicioId = String(form.get("servicio_id") ?? "");
  const modoCliente = String(form.get("modo_cliente") ?? "nuevo");
  const clienteId = String(form.get("cliente_id") ?? "");
  const nombre = String(form.get("cliente_nombre") ?? "").trim();
  const telefonoTexto = String(form.get("cliente_telefono") ?? "").trim();
  const notas = String(form.get("notas") ?? "").trim() || null;

  if (!esDiaValido(dia) || !HORA.test(hora)) return { error: "Elige el día y la hora." };
  if (!estilistaId) return { error: "Elige quién atiende." };
  if (!servicioId) return { error: "Elige el servicio." };
  if (dia < hoyLocal()) return { error: "Ese día ya pasó. Elige hoy o un día próximo." };
  if (dia === hoyLocal() && aMinutos(hora) < minutosAhora() - 30) return { error: "Esa hora ya pasó. Elige una hora más tarde." };

  const { supabase, salon } = await contexto();

  const { data: estilista } = await supabase
    .from("estilistas")
    .select("nombre, horarios(dia, inicio, fin)")
    .eq("id", estilistaId)
    .eq("salon_id", salon.id)
    .eq("activo", true)
    .maybeSingle();
  if (!estilista) return { error: "Esa persona ya no está en tu equipo. Elige a otra." };
  const nombreCorto = estilista.nombre.split(" ")[0];
  const turnos = turnosDelDia((estilista.horarios ?? []) as Turno[], dia);
  if (turnos.length === 0) return { error: `${nombreCorto} descansa ${EN_PLURAL[diaSemana(dia)]}. Elige otro día o cambia quién atiende.` };

  const { data: servicio } = await supabase
    .from("servicios")
    .select("duracion_min, precio")
    .eq("id", servicioId)
    .eq("salon_id", salon.id)
    .maybeSingle();
  if (!servicio) return { error: "Ese servicio ya no existe. Elige otro." };

  if (!dentroDeTurno(turnos, hora, servicio.duracion_min)) {
    return { error: `La cita quedaría fuera del horario de ${nombreCorto}, que ese día atiende de ${textoTurnos(turnos)}. Elige otra hora.` };
  }
  const inicio = aInstante(dia, hora);
  const fin = aInstante(dia, deMinutos(aMinutos(hora) + servicio.duracion_min));

  const { data: choque } = await supabase
    .from("bloqueos")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("estilista_id", estilistaId)
    .lt("inicio", fin)
    .gt("fin", inicio)
    .limit(1);
  if (choque && choque.length > 0) return { error: "Ese horario está bloqueado. Elige otra hora o quita el bloqueo." };

  // Cliente: uno de la lista, o uno nuevo (si su teléfono ya existe, se usa ese).
  let idCliente: string | null = null;
  if (modoCliente === "existente") {
    if (!clienteId) return { error: "Elige al cliente de la lista." };
    idCliente = clienteId;
  } else {
    if (nombre.length < 1) return { error: "Escribe el nombre del cliente." };
    const telefono = telefonoTexto ? limpiarTelefono(telefonoTexto) : null;
    if (telefonoTexto && !telefono) return { error: "El teléfono debe tener 10 dígitos, por ejemplo 33 1234 5678." };
    if (telefono) {
      const { data: existente } = await supabase
        .from("clientes")
        .select("id")
        .eq("salon_id", salon.id)
        .eq("telefono", telefono)
        .maybeSingle();
      if (existente) idCliente = existente.id;
    }
    if (!idCliente) {
      const { data: nuevo, error } = await supabase
        .from("clientes")
        .insert({ salon_id: salon.id, nombre, telefono, origen: "manual" })
        .select("id")
        .single();
      if (error || !nuevo) return { error: "No pudimos guardar al cliente. Intenta de nuevo." };
      idCliente = nuevo.id;
    }
  }

  const { error } = await supabase.from("citas").insert({
    salon_id: salon.id,
    estilista_id: estilistaId,
    cliente_id: idCliente,
    servicio_id: servicioId,
    inicio,
    fin,
    precio: servicio.precio,
    estado: "confirmada",
    notas,
  });
  if (error) {
    if (error.code === "23P01") return { error: "Ese horario se empalma con otra cita. Elige otra hora." };
    return { error: "No pudimos guardar la cita. Intenta de nuevo." };
  }

  volver(dia, estilistaId);
  return {};
}

export async function cambiarEstado(form: FormData) {
  const id = String(form.get("id") ?? "");
  const estado = String(form.get("estado") ?? "");
  if (!["completada", "no_asistio", "cancelada", "confirmada"].includes(estado)) return;
  const { supabase, salon } = await contexto();

  const { data: cita } = await supabase
    .from("citas")
    .select("id, inicio, estilista_id, cliente_id")
    .eq("id", id)
    .eq("salon_id", salon.id)
    .maybeSingle();
  if (!cita) redirect("/agenda");

  const { error } = await supabase.from("citas").update({ estado }).eq("id", id).eq("salon_id", salon.id);
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(cita.inicio));

  if (error) {
    // Al deshacer una cancelación, el horario pudo haberse ocupado mientras tanto.
    volver(dia, cita.estilista_id, error.code === "23P01" ? "&aviso=ocupado" : "&aviso=error");
  }
  if (estado === "completada" && cita.cliente_id) {
    await supabase.from("clientes").update({ ultima_visita: dia }).eq("id", cita.cliente_id).eq("salon_id", salon.id);
  }
  // Confirmar desde Hoy deja a la persona en Hoy.
  if (!error && form.get("volver") === "/hoy") {
    revalidatePath("/", "layout");
    redirect("/hoy");
  }
  volver(dia, cita.estilista_id, estado === "cancelada" ? `&cancelada=${id}` : "");
}

export async function crearBloqueo(_: EstadoAgenda, form: FormData): Promise<EstadoAgenda> {
  const dia = String(form.get("dia") ?? "");
  const estilistaId = String(form.get("estilista_id") ?? "");
  const desde = String(form.get("desde") ?? "");
  const hasta = String(form.get("hasta") ?? "");
  const motivo = String(form.get("motivo") ?? "").trim() || null;

  if (!esDiaValido(dia) || !estilistaId) return { error: "Elige el día y a quién bloquear." };
  if (!HORA.test(desde) || !HORA.test(hasta)) return { error: "Elige las horas." };
  if (aMinutos(hasta) <= aMinutos(desde)) return { error: "La hora final debe ser después de la inicial." };

  const { supabase, salon } = await contexto();
  const inicio = aInstante(dia, desde);
  const fin = aInstante(dia, hasta);

  const { data: citas } = await supabase
    .from("citas")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("estilista_id", estilistaId)
    .in("estado", ["confirmada", "por_confirmar"])
    .lt("inicio", fin)
    .gt("fin", inicio)
    .limit(1);
  if (citas && citas.length > 0) return { error: "Hay una cita en ese horario. Cámbiala o cancélala antes de bloquearlo." };

  const { error } = await supabase
    .from("bloqueos")
    .insert({ salon_id: salon.id, estilista_id: estilistaId, inicio, fin, motivo });
  if (error) return { error: "No pudimos bloquear el horario. Intenta de nuevo." };

  volver(dia, estilistaId);
  return {};
}

export async function quitarBloqueo(form: FormData) {
  const id = String(form.get("id") ?? "");
  const dia = String(form.get("dia") ?? "");
  const estilistaId = String(form.get("estilista_id") ?? "");
  const { supabase, salon } = await contexto();
  await supabase.from("bloqueos").delete().eq("id", id).eq("salon_id", salon.id);
  volver(dia, estilistaId);
}

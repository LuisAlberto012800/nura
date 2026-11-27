"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormulario } from "@/lib/useFormulario";
import { Ventana } from "@/components/Ventana";
import { duracionTexto, pesos } from "@/lib/formato";
import { aMinutos, etiquetaDia, fechaLarga, diaSemana } from "@/lib/tiempo";
import { horasLibres, textoTurnos, turnosDelDia, type Ocupado, type Turno } from "@/lib/disponibilidad";
import { crearCita, type EstadoAgenda } from "../acciones";

type Opcion = { id: string; nombre: string };
type Estilista = Opcion & { horarios: Turno[] };
type Servicio = Opcion & { duracion_min: number; precio: number };
type Cliente = Opcion & { telefono: string | null };

const EN_PLURAL = ["los domingos", "los lunes", "los martes", "los miércoles", "los jueves", "los viernes", "los sábados"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function FormularioCita({
  dias,
  hoy,
  ahora,
  diaInicial,
  horaInicial,
  estilistaInicial,
  equipo,
  servicios,
  clientes,
  ocupados,
}: {
  dias: string[];
  hoy: string;
  ahora: number;
  diaInicial: string;
  horaInicial?: string;
  estilistaInicial: string;
  equipo: Estilista[];
  servicios: Servicio[];
  clientes: Cliente[];
  ocupados: Ocupado[];
}) {
  const { estado, enviar, enviando } = useFormulario<EstadoAgenda>(crearCita, {});
  const [modo, setModo] = useState<"nuevo" | "existente">(clientes.length > 0 ? "existente" : "nuevo");
  const [estilistaId, setEstilistaId] = useState(estilistaInicial);
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const estilista = equipo.find((e) => e.id === estilistaId) ?? equipo[0];
  const servicio = servicios.find((s) => s.id === servicioId);
  const nombreCorto = estilista.nombre.split(" ")[0];

  const trabaja = (d: string) => turnosDelDia(estilista.horarios, d).length > 0;
  const primerDiaLibre = (lista: string[]) => lista.find(trabaja) ?? lista[0];
  const [dia, setDia] = useState(() => (trabaja(diaInicial) ? diaInicial : primerDiaLibre(dias)));
  const [hora, setHora] = useState(horaInicial ?? "");

  // Ventana emergente: errores del servidor o un aviso local (día de descanso).
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorVisto, setErrorVisto] = useState<EstadoAgenda | null>(null);
  const mensaje = aviso ?? (estado.error && errorVisto !== estado ? estado.error : null);
  const cerrar = () => {
    setAviso(null);
    setErrorVisto(estado);
  };

  const turnos = turnosDelDia(estilista.horarios, dia);
  const libres = useMemo(
    () =>
      servicio
        ? horasLibres(estilista.horarios, ocupados, estilista.id, dia, servicio.duracion_min).filter(
            // Hoy solo se ofrecen las horas que no han pasado.
            (h) => dia !== hoy || aMinutos(h) >= ahora - 15,
          )
        : [],
    [estilista, ocupados, dia, servicio, hoy, ahora],
  );

  // Si al cambiar día, servicio o estilista la hora elegida ya no cabe, se quita.
  useEffect(() => {
    if (hora && !libres.includes(hora)) setHora("");
  }, [libres, hora]);

  // Al cambiar de estilista, si descansa ese día, se mueve a su siguiente día de trabajo.
  const cambiarEstilista = (id: string) => {
    setEstilistaId(id);
    const otro = equipo.find((e) => e.id === id);
    if (otro && turnosDelDia(otro.horarios, dia).length === 0) {
      const siguiente = dias.find((d) => turnosDelDia(otro.horarios, d).length > 0);
      if (siguiente) setDia(siguiente);
    }
  };

  const elegirDia = (d: string) => {
    if (!trabaja(d)) {
      setAviso(`${nombreCorto} descansa ${EN_PLURAL[diaSemana(d)]}. Elige otro día o cambia quién atiende.`);
      return;
    }
    setDia(d);
  };

  const tira = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tira.current?.querySelector<HTMLElement>("[aria-pressed='true']")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [dia]);

  const ningunDia = !dias.some(trabaja);

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="hidden" name="dia" value={dia} />
      <input type="hidden" name="hora" value={hora} />
      <input type="hidden" name="modo_cliente" value={modo} />
      <input type="hidden" name="estilista_id" value={estilista.id} />

      <section className="tarjeta" aria-labelledby="cuando">
        <div className="fila-separada" style={{ alignItems: "baseline" }}>
          <h2 id="cuando" className="etiqueta">Día</h2>
          <span className="meta">{fechaLarga(dia)}</span>
        </div>
        <div className="tira-elegir" ref={tira} role="group" aria-label="Elegir día">
          {dias.map((d, i) => {
            const { corto, numero } = etiquetaDia(d);
            const libre = trabaja(d);
            const mesNuevo = i === 0 || d.slice(8) === "01";
            return (
              <button
                key={d}
                type="button"
                className={`dia-chip${d === dia ? " activo" : ""}${libre ? "" : " descansa"}`}
                aria-pressed={d === dia}
                aria-label={`${fechaLarga(d)}${libre ? "" : `, ${nombreCorto} descansa`}`}
                onClick={() => elegirDia(d)}
              >
                <span>{d === hoy ? "Hoy" : corto}</span>
                <strong>{numero}</strong>
                <small>{libre ? (mesNuevo ? MESES[Number(d.slice(5, 7)) - 1] : "") : "descansa"}</small>
              </button>
            );
          })}
        </div>

        {equipo.length > 1 && (
          <div className="chips-equipo" role="group" aria-label="Quién atiende">
            {equipo.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`chip${e.id === estilista.id ? " activo" : ""}`}
                aria-pressed={e.id === estilista.id}
                onClick={() => cambiarEstilista(e.id)}
              >
                {e.nombre.split(" ")[0]}
              </button>
            ))}
          </div>
        )}
        <p className="meta" style={{ margin: 0 }}>
          {ningunDia
            ? `${nombreCorto} no tiene horario de trabajo. Agrégalo en Equipo.`
            : `${nombreCorto} atiende de ${textoTurnos(turnos)}.`}
        </p>
      </section>

      <section className="tarjeta" aria-labelledby="que">
        <h2 id="que" className="etiqueta">Servicio y hora</h2>
        <label className="campo">
          <span>Servicio</span>
          <select id="servicio_id" name="servicio_id" value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} · {duracionTexto(s.duracion_min)} · {pesos(s.precio)}
              </option>
            ))}
          </select>
        </label>

        {libres.length > 0 ? (
          <div className="horas-libres" role="group" aria-label="Horas libres">
            {libres.map((h) => (
              <button key={h} type="button" className={`hora-chip${h === hora ? " activo" : ""}`} aria-pressed={h === hora} onClick={() => setHora(h)}>
                {h}
              </button>
            ))}
          </div>
        ) : (
          <p className="aviso aviso-neutro" style={{ margin: 0 }}>
            {ningunDia ? "Sin horario no hay horas para agendar." : "Ya no quedan horas libres este día para este servicio. Prueba otro día."}
          </p>
        )}
        {servicio && (
          <p className="meta" style={{ margin: 0 }}>
            {hora ? `${hora} · ` : ""}Dura {duracionTexto(servicio.duracion_min)} · {pesos(servicio.precio)}
          </p>
        )}
      </section>

      <section className="tarjeta" aria-labelledby="quien">
        <h2 id="quien" className="etiqueta">Cliente</h2>
        {clientes.length > 0 && (
          <div className="segmentado" role="group" aria-label="Tipo de cliente">
            <button type="button" aria-pressed={modo === "existente"} onClick={() => setModo("existente")}>
              De mi lista
            </button>
            <button type="button" aria-pressed={modo === "nuevo"} onClick={() => setModo("nuevo")}>
              Nuevo
            </button>
          </div>
        )}
        {modo === "existente" ? (
          <label className="campo">
            <span>Elige al cliente</span>
            <select id="cliente_id" name="cliente_id" defaultValue="">
              <option value="" disabled>
                Selecciona…
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.telefono ? ` · ${c.telefono}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="campo">
              <span>Nombre</span>
              <input id="cliente_nombre" name="cliente_nombre" autoComplete="off" placeholder="Ana Gutiérrez" />
            </label>
            <label className="campo">
              <span>Celular</span>
              <input id="cliente_telefono" name="cliente_telefono" type="tel" inputMode="tel" placeholder="33 1234 5678" />
              <small>Opcional. Sirve para escribirle por WhatsApp. Queda guardado en tus clientes.</small>
            </label>
          </>
        )}
        <label className="campo">
          <span>Nota</span>
          <input id="notas" name="notas" placeholder="Opcional" />
        </label>
      </section>

      <div className="accion-fija">
        <button className="btn" type="submit" disabled={enviando || !hora}>
          {enviando ? "Guardando…" : hora ? `Agendar a las ${hora}` : "Elige una hora"}
        </button>
      </div>

      {mensaje && (
        <Ventana titulo="No está disponible" onCerrar={cerrar}>
          <p>{mensaje}</p>
        </Ventana>
      )}
    </form>
  );
}

"use client";

import { useFormulario } from "@/lib/useFormulario";
import { useState } from "react";
import { duracionTexto, pesos } from "@/lib/formato";
import { crearCita, type EstadoAgenda } from "../acciones";

type Opcion = { id: string; nombre: string };
type Servicio = Opcion & { duracion_min: number; precio: number };
type Cliente = Opcion & { telefono: string | null };

export function FormularioCita({
  dia,
  hora,
  horas,
  estilistaId,
  equipo,
  servicios,
  clientes,
}: {
  dia: string;
  hora: string;
  horas: string[];
  estilistaId: string;
  equipo: Opcion[];
  servicios: Servicio[];
  clientes: Cliente[];
}) {
  const { estado, enviar, enviando } = useFormulario<EstadoAgenda>(crearCita, {});
  const [modo, setModo] = useState<"nuevo" | "existente">(clientes.length > 0 ? "existente" : "nuevo");
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const servicio = servicios.find((s) => s.id === servicioId);

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="hidden" name="dia" value={dia} />
      <input type="hidden" name="modo_cliente" value={modo} />

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
        <div style={{ display: "grid", gridTemplateColumns: equipo.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
          <label className="campo">
            <span>Hora</span>
            <select id="hora" name="hora" defaultValue={hora}>
              {horas.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          {equipo.length > 1 ? (
            <label className="campo">
              <span>Atiende</span>
              <select id="estilista_id" name="estilista_id" defaultValue={estilistaId}>
                {equipo.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="estilista_id" value={estilistaId} />
          )}
        </div>
        {servicio && (
          <p className="meta" style={{ margin: 0 }}>
            Dura {duracionTexto(servicio.duracion_min)} · precio {pesos(servicio.precio)}
          </p>
        )}
        <label className="campo">
          <span>Nota</span>
          <input id="notas" name="notas" placeholder="Opcional" />
        </label>
      </section>

      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}

      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Agendar"}
      </button>
    </form>
  );
}

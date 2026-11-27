"use client";

import { useFormulario } from "@/lib/useFormulario";
import { crearBloqueo, type EstadoAgenda } from "../acciones";

export function FormularioBloqueo({
  dia,
  estilistaId,
  equipo,
  horas,
}: {
  dia: string;
  estilistaId: string;
  equipo: { id: string; nombre: string }[];
  horas: string[];
}) {
  const { estado, enviar, enviando } = useFormulario<EstadoAgenda>(crearBloqueo, {});
  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="dia" value={dia} />
      {equipo.length > 1 ? (
        <label className="campo">
          <span>A quién</span>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label className="campo">
          <span>Desde</span>
          <select id="desde" name="desde" defaultValue="14:00">
            {horas.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Hasta</span>
          <select id="hasta" name="hasta" defaultValue="15:00">
            {horas.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="campo">
        <span>Motivo</span>
        <input id="motivo" name="motivo" placeholder="Comida" />
        <small>Opcional. Solo lo ves tú.</small>
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Bloquear"}
      </button>
    </form>
  );
}

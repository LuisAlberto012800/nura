"use client";

import { useFormulario } from "@/lib/useFormulario";
import { useEffect, useRef } from "react";
import { CATEGORIAS, DURACIONES, duracionTexto } from "@/lib/formato";
import { guardarServicio, type EstadoServicio } from "./acciones";

type Inicial = { id: string; nombre: string; categoria: string; duracion_min: number; precio: number };

export function FormularioServicio({ inicial }: { inicial?: Inicial }) {
  const { estado, enviar, enviando } = useFormulario<EstadoServicio>(guardarServicio, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Al agregar uno nuevo, limpia el formulario para el siguiente.
  useEffect(() => {
    if (estado.ok && !inicial) formRef.current?.reset();
  }, [estado, inicial]);

  return (
    <form ref={formRef} onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {inicial && <input type="hidden" name="id" value={inicial.id} />}
      <label className="campo">
        <span>Nombre del servicio</span>
        <input id="nombre" name="nombre" defaultValue={inicial?.nombre} placeholder="Corte en capas" required />
      </label>
      <label className="campo">
        <span>Tipo</span>
        <select id="categoria" name="categoria" defaultValue={inicial?.categoria ?? "corte"}>
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.texto}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label className="campo">
          <span>Duración</span>
          <select id="duracion_min" name="duracion_min" defaultValue={String(inicial?.duracion_min ?? 60)}>
            {DURACIONES.map((d) => (
              <option key={d} value={d}>
                {duracionTexto(d)}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Precio exacto</span>
          <input
            id="precio"
            name="precio"
            inputMode="numeric"
            pattern="[0-9$, ]*"
            defaultValue={inicial ? String(inicial.precio) : ""}
            placeholder="450"
            required
          />
        </label>
      </div>

      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.ok && !inicial && <p className="aviso aviso-azul" role="status">Servicio agregado.</p>}

      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : inicial ? "Guardar cambios" : "Agregar servicio"}
      </button>
    </form>
  );
}

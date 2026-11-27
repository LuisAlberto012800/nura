"use client";

import { useState } from "react";
import { useFormulario } from "@/lib/useFormulario";
import { CABELLOS } from "@/lib/formato";
import { crearCliente, guardarCliente, type EstadoCliente } from "./acciones";

type Cliente = { id: string; nombre: string; telefono: string | null; tipo_cabello: string | null; notas: string | null };

export function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  const { estado, enviar, enviando } = useFormulario<EstadoCliente>(cliente ? guardarCliente : crearCliente, {});
  const [cabello, setCabello] = useState(cliente?.tipo_cabello ?? "");

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <input type="hidden" name="tipo_cabello" value={cabello} />
      <label className="campo">
        <span>Nombre</span>
        <input name="nombre" defaultValue={cliente?.nombre} autoComplete="off" placeholder="Ana Gutiérrez" required />
      </label>
      <label className="campo">
        <span>Celular</span>
        <input name="telefono" type="tel" inputMode="tel" defaultValue={cliente?.telefono ?? ""} placeholder="33 1234 5678" />
      </label>
      <div className="campo">
        <span>Tipo de cabello</span>
        <div className="opciones-cabello">
          {CABELLOS.map((c) => (
            <button
              key={c.valor}
              type="button"
              className={`opcion-cabello${cabello === c.valor ? " activo" : ""}`}
              aria-pressed={cabello === c.valor}
              onClick={() => setCabello(cabello === c.valor ? "" : c.valor)}
            >
              <strong>{c.texto}</strong>
            </button>
          ))}
        </div>
      </div>
      <label className="campo">
        <span>Notas</span>
        <textarea name="notas" rows={3} defaultValue={cliente?.notas ?? ""} placeholder="Degradado bajo, no le gusta la navaja" />
        <small>Solo las ve tu equipo.</small>
      </label>

      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.ok && <p className="aviso aviso-azul" role="status">Guardado.</p>}

      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : cliente ? "Guardar" : "Agregar cliente"}
      </button>
    </form>
  );
}

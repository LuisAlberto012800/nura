"use client";

import { useFormulario } from "@/lib/useFormulario";

import { crearEstilista, type EstadoEquipo } from "./acciones";

export function FormularioNuevo() {
  const { estado, enviar, enviando } = useFormulario<EstadoEquipo>(crearEstilista, {});
  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label className="campo">
        <span>Nombre</span>
        <input id="nuevo_nombre" name="nombre" autoComplete="off" placeholder="Iván Mora" required />
        <small>Después podrás agregar sus especialidades y su horario.</small>
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Agregar y poner su horario"}
      </button>
    </form>
  );
}

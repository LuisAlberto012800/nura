"use client";

import { useActionState } from "react";
import { crearEstilista, type EstadoEquipo } from "./acciones";

export function FormularioNuevo() {
  const [estado, accion, enviando] = useActionState<EstadoEquipo, FormData>(crearEstilista, {});
  return (
    <form action={accion} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label className="campo">
        <span>Nombre</span>
        <input id="nuevo_nombre" name="nombre" autoComplete="off" placeholder="Iván Mora" required />
      </label>
      <label className="campo">
        <span>Especialidades</span>
        <input id="nuevo_especialidades" name="especialidades" placeholder="Fade, barba, corte en capas" />
        <small>Opcional. Sepáralas con comas.</small>
      </label>
      <label className="campo">
        <span>Años de oficio</span>
        <input id="nuevo_anios" name="anios_oficio" inputMode="numeric" pattern="[0-9]*" placeholder="5" />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Agregar y poner su horario"}
      </button>
    </form>
  );
}

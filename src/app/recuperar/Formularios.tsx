"use client";

import { useFormulario } from "@/lib/useFormulario";
import { guardarContrasena, pedirRecuperacion, type EstadoRecuperar } from "./acciones";

export function FormularioRecuperar() {
  const { estado, enviar, enviando } = useFormulario<EstadoRecuperar>(pedirRecuperacion, {});
  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label className="campo">
        <span>Correo</span>
        <input name="correo" type="email" autoComplete="email" inputMode="email" required />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.aviso && <p className="aviso aviso-azul" role="status">{estado.aviso}</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Un momento…" : "Mandar enlace"}
      </button>
    </form>
  );
}

export function FormularioNuevaContrasena() {
  const { estado, enviar, enviando } = useFormulario<EstadoRecuperar>(guardarContrasena, {});
  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label className="campo">
        <span>Contraseña nueva</span>
        <input name="contrasena" type="password" autoComplete="new-password" minLength={8} required />
        <small>Al menos 8 caracteres.</small>
      </label>
      <label className="campo">
        <span>Repítela</span>
        <input name="repetir" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}

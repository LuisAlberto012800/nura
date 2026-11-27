"use client";

import { useFormulario } from "@/lib/useFormulario";
import { useState } from "react";
import { entrarOCrear, type EstadoEntrar } from "./acciones";

export function FormularioEntrar() {
  const [modo, setModo] = useState<"entrar" | "crear">("crear");
  const { estado, enviar, enviando } = useFormulario<EstadoEntrar>(entrarOCrear, {});

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="modo" value={modo} />
      <label className="campo">
        <span>Correo</span>
        <input id="correo" name="correo" type="email" autoComplete="email" inputMode="email" required />
      </label>
      <label className="campo">
        <span>Contraseña</span>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete={modo === "crear" ? "new-password" : "current-password"}
          minLength={8}
          required
        />
        {modo === "crear" && <small>Al menos 8 caracteres.</small>}
      </label>

      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.aviso && <p className="aviso aviso-azul" role="status">{estado.aviso}</p>}

      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Un momento…" : modo === "crear" ? "Crear cuenta" : "Entrar"}
      </button>
      <button
        type="button"
        className="btn btn-texto"
        style={{ alignSelf: "center" }}
        onClick={() => setModo(modo === "crear" ? "entrar" : "crear")}
      >
        {modo === "crear" ? "Ya tengo cuenta: entrar" : "Soy nuevo: crear cuenta"}
      </button>
    </form>
  );
}

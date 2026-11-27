"use client";

import Link from "next/link";
import { useFormulario } from "@/lib/useFormulario";
import type { Rol } from "@/lib/rol";
import { entrarOCrear, type EstadoEntrar } from "./acciones";

// Correo y contraseña. modo "crear" registra con el rol elegido; "entrar" inicia sesión.
export function FormularioEntrar({ modo, rol }: { modo: "entrar" | "crear"; rol?: Rol }) {
  const { estado, enviar, enviando } = useFormulario<EstadoEntrar>(entrarOCrear, {});

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="modo" value={modo} />
      {rol && <input type="hidden" name="rol" value={rol} />}
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
      {modo === "entrar" && (
        <Link href="/recuperar" className="meta" style={{ alignSelf: "flex-end", marginTop: -6, color: "var(--accion-500)", fontWeight: 700, textDecoration: "none" }}>
          ¿Olvidaste tu contraseña?
        </Link>
      )}

      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.aviso && <p className="aviso aviso-azul" role="status">{estado.aviso}</p>}

      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Un momento…" : modo === "crear" ? "Crear cuenta" : "Iniciar sesión"}
      </button>
    </form>
  );
}

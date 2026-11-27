"use client";

import { useActionState } from "react";
import { darDeAlta, type EstadoAlta } from "./acciones";

export function FormularioAlta() {
  const [estado, accion, enviando] = useActionState<EstadoAlta, FormData>(darDeAlta, {});
  return (
    <form action={accion} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label className="campo">
        <span>Nombre de tu barbería o estética</span>
        <input id="nombre" name="nombre" autoComplete="organization" placeholder="Salón Alba" required />
      </label>
      <label className="campo">
        <span>Colonia</span>
        <input id="colonia" name="colonia" placeholder="Providencia" required />
      </label>
      <label className="campo">
        <span>WhatsApp del negocio</span>
        <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="33 1234 5678" />
        <small>Opcional. Es a donde te van a escribir para reservar.</small>
      </label>
      <label className="campo">
        <span>Tu nombre</span>
        <input id="tu_nombre" name="tu_nombre" autoComplete="name" placeholder="Daniela Robles" required />
        <small>Así aparecerás en tu perfil de estilista.</small>
      </label>

      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}

      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Siguiente"}
      </button>
    </form>
  );
}

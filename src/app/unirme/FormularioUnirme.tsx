"use client";

import { useFormulario } from "@/lib/useFormulario";
import { enviarSolicitud, type EstadoUnirme } from "./acciones";

export function FormularioUnirme({ codigo, nombre }: { codigo?: string; nombre?: string }) {
  const { estado, enviar, enviando } = useFormulario<EstadoUnirme>(enviarSolicitud, {});
  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {codigo ? (
        <input type="hidden" name="codigo" value={codigo} />
      ) : (
        <label className="campo">
          <span>Código o enlace de tu barbería</span>
          <input name="codigo" autoComplete="off" autoCapitalize="none" placeholder="salon-alba" required />
          <small>Pídeselo a tu encargado. Lo encuentra en Equipo, en Invitar a tu equipo.</small>
        </label>
      )}
      <label className="campo">
        <span>Tu nombre</span>
        <input name="nombre" defaultValue={nombre} autoComplete="name" placeholder="Como te conocen tus clientes" required />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Mandando…" : "Mandar solicitud"}
      </button>
    </form>
  );
}

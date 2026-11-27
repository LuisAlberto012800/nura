"use client";

import { useFormulario } from "@/lib/useFormulario";
import { guardarMiPerfil, type EstadoPerfil } from "./acciones";

export function FormularioPerfil({ nombre, especialidades, anios }: { nombre: string; especialidades: string[]; anios: number | null }) {
  const { estado, enviar, enviando } = useFormulario<EstadoPerfil>(guardarMiPerfil, {});
  return (
    <form onSubmit={enviar} className="tarjeta" style={{ gap: 14 }}>
      <label className="campo">
        <span>Nombre</span>
        <input name="nombre" defaultValue={nombre} required />
      </label>
      <label className="campo">
        <span>Especialidades</span>
        <input name="especialidades" defaultValue={especialidades.join(", ")} placeholder="Degradados, barba, rizos" />
        <small>Sepáralas con comas. Aparecen en la página de la barbería.</small>
      </label>
      <label className="campo">
        <span>Años de oficio</span>
        <input name="anios_oficio" inputMode="numeric" pattern="[0-9]*" defaultValue={anios ?? ""} />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.ok && <p className="aviso aviso-azul" role="status">Guardado.</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

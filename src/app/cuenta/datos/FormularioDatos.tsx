"use client";

import { useFormulario } from "@/lib/useFormulario";
import { guardarDatos, type EstadoDatos } from "../acciones";

type Datos = { nombre: string; colonia: string; direccion: string | null; whatsapp: string | null; descripcion: string | null };

export function FormularioDatos({ datos }: { datos: Datos }) {
  const { estado, enviar, enviando } = useFormulario<EstadoDatos>(guardarDatos, {});
  return (
    <form onSubmit={enviar} className="tarjeta" style={{ gap: 14 }}>
      <label className="campo">
        <span>Nombre</span>
        <input name="nombre" defaultValue={datos.nombre} required />
      </label>
      <label className="campo">
        <span>Colonia</span>
        <input name="colonia" defaultValue={datos.colonia} required />
      </label>
      <label className="campo">
        <span>Dirección</span>
        <input name="direccion" defaultValue={datos.direccion ?? ""} placeholder="Av. Chapultepec 123" />
        <small>Opcional. Aparece en tu página con un enlace al mapa.</small>
      </label>
      <label className="campo">
        <span>WhatsApp</span>
        <input name="whatsapp" type="tel" inputMode="tel" defaultValue={datos.whatsapp ?? ""} placeholder="33 1234 5678" />
      </label>
      <label className="campo">
        <span>Descripción</span>
        <textarea name="descripcion" rows={3} defaultValue={datos.descripcion ?? ""} placeholder="Especialistas en rizos y degradados" maxLength={280} />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.ok && <p className="aviso aviso-azul" role="status">Guardado.</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

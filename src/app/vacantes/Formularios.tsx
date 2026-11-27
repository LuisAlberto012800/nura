"use client";

import { useState } from "react";
import { useFormulario } from "@/lib/useFormulario";
import { TIPOS_VACANTE } from "@/lib/vacantes";
import { crearVacante, postularme, type EstadoVacante } from "./acciones";

export function FormularioVacante() {
  const { estado, enviar, enviando } = useFormulario<EstadoVacante>(crearVacante, {});
  const [tipo, setTipo] = useState("tiempo_completo");
  return (
    <form onSubmit={enviar} key={estado.ok ? "listo" : "nuevo"} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="tipo" value={tipo} />
      <label className="campo">
        <span>Puesto</span>
        <input name="titulo" placeholder="Barbero con experiencia en fades" required />
      </label>
      <div className="campo">
        <span>Tipo</span>
        <div className="chips-equipo" style={{ flexWrap: "wrap" }}>
          {TIPOS_VACANTE.map((t) => (
            <button key={t.valor} type="button" className={`chip${tipo === t.valor ? " activo" : ""}`} aria-pressed={tipo === t.valor} onClick={() => setTipo(t.valor)}>
              {t.texto}
            </button>
          ))}
        </div>
      </div>
      <label className="campo">
        <span>Pago</span>
        <input name="pago" placeholder="50% de comisión o $2,500 por semana" />
        <small>Opcional, pero las vacantes con pago claro reciben más postulaciones.</small>
      </label>
      <label className="campo">
        <span>Descripción</span>
        <textarea name="descripcion" rows={3} placeholder="Horario, qué buscas, qué ofreces" />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.ok && <p className="aviso aviso-exito" role="status">Publicada. Ya la ven los barberos en Nura.</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Publicando…" : "Publicar vacante"}
      </button>
    </form>
  );
}

export function FormularioPostulacion({ vacante, salon, nombre, anios, especialidades }: { vacante: string; salon: string; nombre: string; anios: number | null; especialidades: string }) {
  const { estado, enviar, enviando } = useFormulario<EstadoVacante>(postularme, {});
  if (estado.ok)
    return (
      <p className="aviso aviso-exito" role="status">
        Listo, mandamos tu postulación. Si les interesa, te escriben a tu celular.
      </p>
    );
  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="vacante" value={vacante} />
      <input type="hidden" name="salon" value={salon} />
      <label className="campo">
        <span>Tu nombre</span>
        <input name="nombre" defaultValue={nombre} required />
      </label>
      <label className="campo">
        <span>Celular</span>
        <input name="telefono" type="tel" inputMode="tel" placeholder="33 1234 5678" required />
        <small>Solo lo ve el encargado de esta barbería.</small>
      </label>
      <div className="datos-dos" style={{ gap: 10 }}>
        <label className="campo" style={{ background: "none", padding: 0 }}>
          <span>Años de oficio</span>
          <input name="anios" inputMode="numeric" defaultValue={anios ?? ""} />
        </label>
        <label className="campo" style={{ background: "none", padding: 0 }}>
          <span>Especialidades</span>
          <input name="especialidades" defaultValue={especialidades} placeholder="Fades, barba" />
        </label>
      </div>
      <label className="campo">
        <span>Mensaje</span>
        <textarea name="mensaje" rows={3} placeholder="Cuéntales por qué te interesa" />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      <div className="accion-fija">
        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? "Mandando…" : "Postularme"}
        </button>
      </div>
    </form>
  );
}

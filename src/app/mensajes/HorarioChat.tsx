"use client";

import { useState } from "react";
import { useFormulario } from "@/lib/useFormulario";
import { DIAS, HORAS } from "@/lib/horarios";
import { guardarHorarioChat, type EstadoChat } from "./acciones";

export function HorarioChat({ dias, inicio, fin }: { dias: number[]; inicio: string; fin: string }) {
  const { estado, enviar, enviando } = useFormulario<EstadoChat>(guardarHorarioChat, {});
  const [elegidos, setElegidos] = useState(dias);
  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {elegidos.map((d) => (
        <input key={d} type="hidden" name="dias" value={d} />
      ))}
      <div className="chips-equipo" style={{ flexWrap: "wrap" }} role="group" aria-label="Días con chat">
        {DIAS.map((d) => (
          <button
            key={d.valor}
            type="button"
            className={`chip${elegidos.includes(d.valor) ? " activo" : ""}`}
            aria-pressed={elegidos.includes(d.valor)}
            onClick={() => setElegidos(elegidos.includes(d.valor) ? elegidos.filter((x) => x !== d.valor) : [...elegidos, d.valor])}
          >
            {d.texto.slice(0, 3)}
          </button>
        ))}
      </div>
      <div className="datos-dos" style={{ gap: 10 }}>
        <label className="campo" style={{ background: "none", padding: 0 }}>
          <span>Abre</span>
          <select name="inicio" defaultValue={inicio.slice(0, 5)}>
            {HORAS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </label>
        <label className="campo" style={{ background: "none", padding: 0 }}>
          <span>Cierra</span>
          <select name="fin" defaultValue={fin.slice(0, 5)}>
            {HORAS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </label>
      </div>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.ok && <p className="aviso aviso-azul" role="status">Guardado.</p>}
      <button className="btn btn-sec" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar horario del chat"}
      </button>
    </form>
  );
}

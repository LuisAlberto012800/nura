"use client";

import { useActionState, useState } from "react";
import { DIAS, HORAS, type DiaHorario } from "@/lib/horarios";
import { guardarEstilista, type EstadoEquipo } from "./acciones";

type Estilista = { id: string; nombre: string; especialidades: string[]; anios_oficio: number | null };

export function FormularioEstilista({
  estilista,
  horario,
  esSugerido,
}: {
  estilista: Estilista;
  horario: DiaHorario[];
  esSugerido: boolean;
}) {
  const [estado, accion, enviando] = useActionState<EstadoEquipo, FormData>(guardarEstilista, {});
  const [dias, setDias] = useState(horario);

  const cambiar = (dia: number, cambio: Partial<DiaHorario>) =>
    setDias((actual) => actual.map((d) => (d.dia === dia ? { ...d, ...cambio } : d)));

  return (
    <form action={accion} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <input type="hidden" name="id" value={estilista.id} />

      <section className="tarjeta" aria-labelledby="datos">
        <h2 id="datos" className="etiqueta">Datos</h2>
        <label className="campo">
          <span>Nombre</span>
          <input id="nombre" name="nombre" defaultValue={estilista.nombre} required />
        </label>
        <label className="campo">
          <span>Especialidades</span>
          <input
            id="especialidades"
            name="especialidades"
            defaultValue={estilista.especialidades.join(", ")}
            placeholder="Color, balayage, rizos"
          />
          <small>Sepáralas con comas. Aparecen en su perfil.</small>
        </label>
        <label className="campo">
          <span>Años de oficio</span>
          <input
            id="anios_oficio"
            name="anios_oficio"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={estilista.anios_oficio ?? ""}
          />
        </label>
      </section>

      <section className="tarjeta" aria-labelledby="horario">
        <h2 id="horario" className="etiqueta">Horario de la semana</h2>
        {esSugerido && (
          <p className="aviso aviso-azul" style={{ margin: 0 }}>
            Te dejamos un horario de ejemplo. Ajústalo y toca Guardar.
          </p>
        )}
        <ul className="lista-horario">
          {dias.map((d) => {
            const nombreDia = DIAS.find((x) => x.valor === d.dia)?.texto ?? "";
            return (
              <li key={d.dia}>
                <label className="dia-atiende">
                  <input
                    type="checkbox"
                    className="interruptor-check"
                    name={`atiende_${d.dia}`}
                    checked={d.atiende}
                    onChange={(e) => cambiar(d.dia, { atiende: e.target.checked })}
                  />
                  <span>{nombreDia}</span>
                </label>
                {d.atiende ? (
                  <span className="horas">
                    <select
                      aria-label={`Entrada del ${nombreDia}`}
                      name={`inicio_${d.dia}`}
                      value={d.inicio}
                      onChange={(e) => cambiar(d.dia, { inicio: e.target.value })}
                    >
                      {HORAS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span className="meta">a</span>
                    <select
                      aria-label={`Salida del ${nombreDia}`}
                      name={`fin_${d.dia}`}
                      value={d.fin}
                      onChange={(e) => cambiar(d.dia, { fin: e.target.value })}
                    >
                      {HORAS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </span>
                ) : (
                  <span className="meta">Descansa</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.ok && <p className="aviso aviso-azul" role="status">Guardado.</p>}

      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

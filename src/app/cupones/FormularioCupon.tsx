"use client";

import { useState } from "react";
import { useFormulario } from "@/lib/useFormulario";
import { pesos } from "@/lib/formato";
import { precioConCupon } from "@/lib/cupones";
import { crearCupon, type EstadoCupon } from "./acciones";

type Servicio = { id: string; nombre: string; precio: number };

export function FormularioCupon({ servicios }: { servicios: Servicio[] }) {
  const { estado, enviar, enviando } = useFormulario<EstadoCupon>(crearCupon, {});
  const [servicioId, setServicioId] = useState("");
  const [tipo, setTipo] = useState<"porcentaje" | "monto">("porcentaje");
  const [valor, setValor] = useState("");
  const [codigo, setCodigo] = useState("");
  const [publico, setPublico] = useState(true);
  const n = Number(valor) || 0;
  const ejemplo = servicios.find((s) => s.id === servicioId) ?? servicios[0];
  const sugerido = `${(servicios.find((s) => s.id === servicioId)?.nombre.split(" ")[0] ?? "NURA").toUpperCase().normalize("NFD").replace(/[^A-Z]/g, "").slice(0, 10)}${n || ""}`;

  return (
    <form onSubmit={enviar} key={estado.ok ? `ok-${Date.now()}` : "nuevo"} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="publico" value={publico ? "si" : "no"} />
      <label className="campo">
        <span>Servicio</span>
        <select name="servicio_id" value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
          <option value="">Todos los servicios</option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} · {pesos(s.precio)}
            </option>
          ))}
        </select>
      </label>
      <div className="campo">
        <span>Descuento</span>
        <div className="segmentado" role="group" aria-label="Tipo de descuento">
          <button type="button" aria-pressed={tipo === "porcentaje"} onClick={() => setTipo("porcentaje")}>
            Porcentaje
          </button>
          <button type="button" aria-pressed={tipo === "monto"} onClick={() => setTipo("monto")}>
            Cantidad en pesos
          </button>
        </div>
      </div>
      <label className="campo">
        <span>{tipo === "porcentaje" ? "Porcentaje" : "Pesos de descuento"}</span>
        <div className="campo-con-unidad">
          {tipo === "monto" && <b>$</b>}
          <input name="valor" inputMode="numeric" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^0-9]/g, ""))} placeholder={tipo === "porcentaje" ? "20" : "50"} required />
          {tipo === "porcentaje" && <b>%</b>}
        </div>
        {ejemplo && n > 0 && (
          <small>
            {ejemplo.nombre}: {pesos(ejemplo.precio)} → <strong>{pesos(precioConCupon(ejemplo.precio, { tipo, valor: n }))}</strong>
          </small>
        )}
      </label>
      <label className="campo">
        <span>Código</span>
        <input name="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder={sugerido} maxLength={20} required autoCapitalize="characters" />
        <small>Lo escribe tu cliente al reservar. Solo letras y números.</small>
      </label>
      <div className="datos-dos" style={{ gap: 10 }}>
        <label className="campo" style={{ background: "none", padding: 0 }}>
          <span>Vence</span>
          <input name="vence" type="date" />
        </label>
        <label className="campo" style={{ background: "none", padding: 0 }}>
          <span>Máximo de usos</span>
          <input name="usos_max" inputMode="numeric" placeholder="Sin límite" />
        </label>
      </div>
      <label className="fila-separada interruptor-fila">
        <span>
          <strong>Mostrar en mi página</strong>
          <small>Si lo apagas, solo lo usa quien sepa el código.</small>
        </span>
        <input type="checkbox" className="interruptor-check" checked={publico} onChange={(e) => setPublico(e.target.checked)} />
      </label>
      {estado.error && <p className="aviso aviso-error" role="alert">{estado.error}</p>}
      {estado.ok && <p className="aviso aviso-exito" role="status">Cupón creado.</p>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Crear cupón"}
      </button>
    </form>
  );
}

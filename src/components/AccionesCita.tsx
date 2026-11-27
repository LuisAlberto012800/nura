"use client";

import Link from "next/link";
import { useState } from "react";
import { Ventana } from "./Ventana";
import { cambiarEstado } from "@/app/agenda/acciones";

// Los dos botones principales de una cita viva: Modificar y Cancelar.
// Cancelar pide confirmación antes de hacerlo.
export function AccionesCita({ id, resumen }: { id: string; resumen: string }) {
  const [confirmar, setConfirmar] = useState(false);
  return (
    <>
      <div className="fila" style={{ gap: 10 }}>
        <Link className="btn btn-sec" href={`/agenda/cita/${id}/modificar`}>
          Modificar
        </Link>
        <button type="button" className="btn btn-peligro" onClick={() => setConfirmar(true)}>
          Cancelar
        </button>
      </div>
      {confirmar && <ConfirmarCancelacion id={id} resumen={resumen} onCerrar={() => setConfirmar(false)} />}
    </>
  );
}

export function ConfirmarCancelacion({ id, resumen, onCerrar }: { id: string; resumen: string; onCerrar: () => void }) {
  return (
    <Ventana
      titulo="¿Seguro que quieres cancelar?"
      onCerrar={onCerrar}
      acciones={
        <>
          <button type="button" className="btn btn-sec" onClick={onCerrar} autoFocus>
            No, mantenerla
          </button>
          <form action={cambiarEstado}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="estado" value="cancelada" />
            <button type="submit" className="btn btn-peligro-lleno">
              Sí, cancelar la cita
            </button>
          </form>
        </>
      }
    >
      <p>{resumen}. El horario queda libre para otra cita.</p>
    </Ventana>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmarCancelacion } from "@/components/AccionesCita";
import { Ventana } from "@/components/Ventana";

// Cita en la línea de tiempo. Al tocarla salen Modificar y Cancelar.
export function BloqueCita({
  id,
  estado,
  titulo,
  detalle,
  resumen,
  style,
}: {
  id: string;
  estado: string;
  titulo: string;
  detalle: string;
  resumen: string;
  style: React.CSSProperties;
}) {
  const [paso, setPaso] = useState<"cerrado" | "opciones" | "cancelar">("cerrado");
  return (
    <>
      <button type="button" className={`bloque cita ${estado}`} style={style} onClick={() => setPaso("opciones")}>
        <strong>{titulo}</strong>
        <span>{detalle}</span>
      </button>
      {paso === "opciones" && (
        <Ventana
          titulo={titulo}
          onCerrar={() => setPaso("cerrado")}
          acciones={
            <>
              <Link className="btn" href={`/agenda/cita/${id}/modificar`}>
                Modificar
              </Link>
              <button type="button" className="btn btn-peligro" onClick={() => setPaso("cancelar")}>
                Cancelar
              </button>
              <Link className="btn btn-texto ancho" href={`/agenda/cita/${id}`}>
                Más opciones
              </Link>
            </>
          }
        >
          <p>{detalle}</p>
        </Ventana>
      )}
      {paso === "cancelar" && <ConfirmarCancelacion id={id} resumen={resumen} onCerrar={() => setPaso("cerrado")} />}
    </>
  );
}

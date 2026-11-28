"use client";

import { useState } from "react";
import { BotonCopiar } from "@/components/BotonCopiar";
import { Icono } from "@/components/Iconos";
import { Ventana } from "@/components/Ventana";
import { FormularioNuevo } from "./FormularioNuevo";

// Un solo botón para sumar gente: con su propia cuenta (enlace) o sin cuenta.
export function AgregarBarbero({ invitacion, salon }: { invitacion: string; salon: string }) {
  const [abierto, setAbierto] = useState(false);
  const mensaje = `Únete al equipo de ${salon} en Nura para ver tu agenda: ${invitacion}`;
  return (
    <>
      <button type="button" className="btn" onClick={() => setAbierto(true)}>
        <Icono nombre="mas" tamano={18} />
        Agregar barbero
      </button>
      {abierto && (
        <Ventana
          titulo="Agregar barbero"
          onCerrar={() => setAbierto(false)}
          acciones={
            <button type="button" className="btn btn-texto ancho" style={{ color: "var(--tinta-600)" }} onClick={() => setAbierto(false)}>
              Cerrar
            </button>
          }
        >
          <div className="agregar-opcion">
            <strong>Con su cuenta</strong>
            <span className="meta">Le mandas el enlace, crea su cuenta y te llega su solicitud. Ve su agenda y sube sus trabajos.</span>
            <div className="fila" style={{ gap: 8 }}>
              <BotonCopiar texto={invitacion} etiqueta="Copiar enlace" />
              <a className="btn btn-sec" href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="agregar-opcion">
            <strong>Sin cuenta</strong>
            <span className="meta">Tú manejas su agenda. Después puede ligar su cuenta.</span>
            <FormularioNuevo />
          </div>
        </Ventana>
      )}
    </>
  );
}

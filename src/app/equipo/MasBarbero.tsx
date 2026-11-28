"use client";

import Link from "next/link";
import { useState } from "react";
import { Ventana } from "@/components/Ventana";
import { cambiarActivo } from "./acciones";

type Props = { id: string; nombre: string; conCuenta: boolean; esYo: boolean; citas: number; invitacion: string; salon: string };

// Opciones de un barbero activo. Dar de baja siempre pide confirmación.
export function MasBarbero({ id, nombre, conCuenta, esYo, citas, invitacion, salon }: Props) {
  const [paso, setPaso] = useState<"cerrado" | "menu" | "baja">("cerrado");
  const primero = nombre.split(" ")[0];
  const cerrar = () => setPaso("cerrado");
  return (
    <>
      <button type="button" className="btn btn-sec boton-mas" aria-label={`Más opciones de ${nombre}`} onClick={() => setPaso("menu")}>
        Más
      </button>
      {paso === "menu" && (
        <Ventana
          titulo={nombre}
          onCerrar={cerrar}
          acciones={
            <button type="button" className="btn btn-texto ancho" style={{ color: "var(--tinta-600)" }} onClick={cerrar}>
              Cerrar
            </button>
          }
        >
          <ul className="opciones-ventana">
            <li>
              <Link href={`/equipo/${id}`}>Editar datos y horario</Link>
            </li>
            <li>
              <Link href={`/agenda?e=${id}`}>Ver su agenda</Link>
            </li>
            <li>
              <Link href={`/agenda/bloquear?e=${id}`}>Bloquear un horario (comida, permiso, vacaciones)</Link>
            </li>
            {!conCuenta && (
              <li>
                <a href={`https://wa.me/?text=${encodeURIComponent(`${primero}, crea tu cuenta en Nura para ver tu agenda de ${salon}: ${invitacion}`)}`} target="_blank" rel="noreferrer">
                  Invitar a que use su cuenta
                </a>
              </li>
            )}
            {!esYo && (
              <li>
                <button type="button" className="peligro" onClick={() => setPaso("baja")}>
                  Ya no trabaja aquí
                </button>
              </li>
            )}
          </ul>
        </Ventana>
      )}
      {paso === "baja" && (
        <Ventana
          titulo={`¿${primero} ya no trabaja aquí?`}
          onCerrar={cerrar}
          acciones={
            <form action={cambiarActivo} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="activo" value="true" />
              <button type="submit" className="btn btn-peligro">
                Sí, ya no trabaja aquí
              </button>
              <button type="button" className="btn btn-texto ancho" style={{ color: "var(--tinta-600)" }} onClick={cerrar} autoFocus>
                Cancelar
              </button>
            </form>
          }
        >
          <p style={{ margin: 0 }}>
            Deja de aparecer en la agenda y en tu página{conCuenta ? " y pierde el acceso a la app" : ""}. Sus trabajos y su historial se conservan.
          </p>
          {citas > 0 && (
            <p className="aviso aviso-error" style={{ margin: 0 }}>
              Tiene {citas} {citas === 1 ? "cita pendiente" : "citas pendientes"}. Muévelas a otro barbero o avísale a tus clientes.
            </p>
          )}
        </Ventana>
      )}
    </>
  );
}

// Botón "Ya no trabaja aquí" con su confirmación, para la pantalla de cada barbero.
export function BotonBaja({ id, nombre, conCuenta, citas }: { id: string; nombre: string; conCuenta: boolean; citas: number }) {
  const [abierto, setAbierto] = useState(false);
  const primero = nombre.split(" ")[0];
  return (
    <>
      <button type="button" className="btn btn-peligro" onClick={() => setAbierto(true)}>
        Ya no trabaja aquí
      </button>
      {abierto && (
        <Ventana
          titulo={`¿${primero} ya no trabaja aquí?`}
          onCerrar={() => setAbierto(false)}
          acciones={
            <form action={cambiarActivo} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="activo" value="true" />
              <button type="submit" className="btn btn-peligro">
                Sí, ya no trabaja aquí
              </button>
              <button type="button" className="btn btn-texto ancho" style={{ color: "var(--tinta-600)" }} onClick={() => setAbierto(false)} autoFocus>
                Cancelar
              </button>
            </form>
          }
        >
          <p style={{ margin: 0 }}>
            Deja de aparecer en la agenda y en tu página{conCuenta ? " y pierde el acceso a la app" : ""}. Sus trabajos y su historial se conservan.
          </p>
          {citas > 0 && (
            <p className="aviso aviso-error" style={{ margin: 0 }}>
              Tiene {citas} {citas === 1 ? "cita pendiente" : "citas pendientes"}. Muévelas a otro barbero o avísale a tus clientes.
            </p>
          )}
        </Ventana>
      )}
    </>
  );
}

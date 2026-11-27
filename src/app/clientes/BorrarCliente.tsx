"use client";

import { useState } from "react";
import { Ventana } from "@/components/Ventana";
import { borrarCliente } from "./acciones";

export function BorrarCliente({ id, nombre }: { id: string; nombre: string }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-texto" style={{ color: "var(--peligro-500)", alignSelf: "center" }} onClick={() => setAbierta(true)}>
        Borrar cliente
      </button>
      {abierta && (
        <Ventana
          titulo={`¿Borrar a ${nombre.split(" ")[0]}?`}
          onCerrar={() => setAbierta(false)}
          acciones={
            <>
              <button type="button" className="btn btn-sec" onClick={() => setAbierta(false)} autoFocus>
                No borrar
              </button>
              <form action={borrarCliente}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="btn btn-peligro">
                  Borrar
                </button>
              </form>
            </>
          }
        >
          <p>Se borran su nombre, teléfono y notas. Sus citas pasadas se quedan en tu agenda sin nombre. No se puede deshacer.</p>
        </Ventana>
      )}
    </>
  );
}

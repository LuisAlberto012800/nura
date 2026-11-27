"use client";

import { useState } from "react";
import { Ventana } from "@/components/Ventana";

export function BorrarTrabajo({ id, accion }: { id: string; accion: (form: FormData) => Promise<void> }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-texto" style={{ color: "var(--peligro-500)", alignSelf: "center" }} onClick={() => setAbierta(true)}>
        Borrar trabajo
      </button>
      {abierta && (
        <Ventana
          titulo="¿Borrar este trabajo?"
          onCerrar={() => setAbierta(false)}
          acciones={
            <>
              <button type="button" className="btn btn-sec" onClick={() => setAbierta(false)} autoFocus>
                No borrar
              </button>
              <form action={accion}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="btn btn-peligro">
                  Borrar
                </button>
              </form>
            </>
          }
        >
          <p>Se borran las fotos y deja de verse en tu página. No se puede deshacer.</p>
        </Ventana>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Ventana } from "@/components/Ventana";
import { salirDeBarberia } from "./acciones";

export function SalirBarberia({ salon }: { salon: string }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-texto ancho" style={{ color: "var(--peligro-500)" }} onClick={() => setAbierta(true)}>
        Ya no trabajo en {salon}
      </button>
      {abierta && (
        <Ventana
          titulo={`¿Salir de ${salon}?`}
          onCerrar={() => setAbierta(false)}
          acciones={
            <>
              <button type="button" className="btn btn-sec" onClick={() => setAbierta(false)} autoFocus>
                No, quedarme
              </button>
              <form action={salirDeBarberia}>
                <button type="submit" className="btn btn-peligro-lleno">
                  Sí, salir
                </button>
              </form>
            </>
          }
        >
          <p>Dejas de ver su agenda y sus clientes. Tus trabajos se quedan en su página. Para volver, mandas otra solicitud.</p>
        </Ventana>
      )}
    </>
  );
}

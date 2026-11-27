"use client";

import type { ReactNode } from "react";

// Ventana emergente sencilla: título, mensaje y uno o dos botones.
export function Ventana({ titulo, children, onCerrar, acciones }: { titulo: string; children: ReactNode; onCerrar: () => void; acciones?: ReactNode }) {
  return (
    <div className="velo" role="presentation" onClick={onCerrar}>
      <div className="ventana" role="alertdialog" aria-modal="true" aria-labelledby="ventana-titulo" onClick={(e) => e.stopPropagation()}>
        <strong id="ventana-titulo">{titulo}</strong>
        {children}
        {acciones ?? (
          <button type="button" className="btn" onClick={onCerrar} autoFocus>
            Entendido
          </button>
        )}
      </div>
    </div>
  );
}

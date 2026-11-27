"use client";

import { useState } from "react";

export function BotonCopiar({ texto, etiqueta = "Copiar enlace", clase = "btn btn-sec" }: { texto: string; etiqueta?: string; clase?: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", texto);
    }
  };
  return (
    <button type="button" className={clase} onClick={copiar}>
      {copiado ? "Copiado" : etiqueta}
    </button>
  );
}

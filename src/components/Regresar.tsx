"use client";

import { useRouter } from "next/navigation";
import { Icono } from "./Iconos";

// Regresa a la pantalla anterior; si se abrió directo de un enlace, va a `respaldo`.
export function Regresar({ respaldo, clase = "boton-redondo" }: { respaldo: string; clase?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={clase}
      aria-label="Regresar"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(respaldo))}
    >
      <Icono nombre="atras" tamano={20} grosor={2} />
    </button>
  );
}

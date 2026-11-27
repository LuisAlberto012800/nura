import Link from "next/link";
import { Icono } from "./Iconos";

// Encabezado de pantalla secundaria: botón redondo para regresar y título al centro.
export function Encabezado({ titulo, volver, etiqueta = "Regresar" }: { titulo: string; volver: string; etiqueta?: string }) {
  return (
    <div className="encabezado">
      <Link href={volver} className="boton-redondo" aria-label={etiqueta}>
        <Icono nombre="atras" tamano={20} grosor={2} />
      </Link>
      <h1>{titulo}</h1>
      <span aria-hidden="true" />
    </div>
  );
}

// Palomita azul de verificado, junto a un nombre.
export function Verificado({ grande = false }: { grande?: boolean }) {
  const t = grande ? 12 : 9;
  return (
    <span className={`verificado${grande ? " grande" : ""}`} role="img" aria-label="Verificado">
      <svg width={t} height={t} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

import Link from "next/link";
import { Espejo } from "./Logo";
import { Icono } from "./Iconos";

const OPCIONES = [
  {
    rol: "cliente",
    titulo: "Busco quién me atienda",
    texto: "Ve trabajos reales cerca de ti, en cabello como el tuyo, con precio exacto.",
  },
  {
    rol: "profesional",
    titulo: "Soy estilista o barbero",
    texto: "Tu agenda, tus clientes y tu portafolio en un solo lugar.",
  },
] as const;

// Dos tarjetas para elegir el lado de la app. Cada una lleva a `destino(rol)`.
export function EleccionRol({ destino }: { destino: (rol: "cliente" | "profesional") => string }) {
  return (
    <div className="opciones-rol">
      {OPCIONES.map((o) => (
        <Link key={o.rol} href={destino(o.rol)} className="opcion-rol">
          <span className="opcion-icono">
            {o.rol === "cliente" ? <Espejo tamano={30} /> : <Icono nombre="cuenta" tamano={26} />}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong>{o.titulo}</strong>
            <span>{o.texto}</span>
          </span>
          <Icono nombre="siguiente" tamano={18} />
        </Link>
      ))}
    </div>
  );
}

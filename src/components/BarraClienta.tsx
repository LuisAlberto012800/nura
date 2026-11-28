import Link from "next/link";
import { Icono, type NombreIcono } from "./Iconos";
import { ChipSupervisor } from "./ChipSupervisor";

const PESTANAS: { clave: "inicio" | "citas" | "tu"; texto: string; href: string; icono: NombreIcono }[] = [
  { clave: "inicio", texto: "Inicio", href: "/inicio", icono: "descubrir" },
  { clave: "citas", texto: "Citas", href: "/citas", icono: "agenda" },
  { clave: "tu", texto: "Tú", href: "/tu", icono: "usuario" },
];

// Barra inferior de la clienta: tres pestañas.
export function BarraClienta({ activa }: { activa: "inicio" | "citas" | "tu" }) {
  return (
    <>
    <ChipSupervisor vista="usuario" />
    <nav className="barra barra-tres" aria-label="Secciones">
      {PESTANAS.map((p) => (
        <Link key={p.clave} href={p.href} className={activa === p.clave ? "activa" : undefined} aria-current={activa === p.clave ? "page" : undefined}>
          <Icono nombre={p.icono} />
          {p.texto}
        </Link>
      ))}
    </nav>
    </>
  );
}

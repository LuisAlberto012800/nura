import Link from "next/link";
import { Icono, type NombreIcono } from "./Iconos";

type Pestana = "hoy" | "agenda" | "subir" | "clientes" | "cuenta";

const LADO_A: { clave: Pestana; texto: string; href: string; icono: NombreIcono }[] = [
  { clave: "hoy", texto: "Hoy", href: "/hoy", icono: "hoy" },
  { clave: "agenda", texto: "Agenda", href: "/agenda", icono: "agenda" },
];
const LADO_B: typeof LADO_A = [
  { clave: "clientes", texto: "Clientes", href: "/clientes", icono: "clientes" },
  { clave: "cuenta", texto: "Cuenta", href: "/cuenta", icono: "cuenta" },
];

// Barra inferior de la barbería. Al centro, el botón de subir trabajo.
export function BarraBarberia({ activa }: { activa: Pestana }) {
  const enlace = (p: (typeof LADO_A)[number]) => (
    <Link key={p.clave} href={p.href} className={activa === p.clave ? "activa" : undefined} aria-current={activa === p.clave ? "page" : undefined}>
      <Icono nombre={p.icono} />
      {p.texto}
    </Link>
  );
  return (
    <nav className="barra" aria-label="Secciones">
      {LADO_A.map(enlace)}
      <Link href="/subir" aria-label="Subir trabajo" aria-current={activa === "subir" ? "page" : undefined}>
        <span className="central">
          <Icono nombre="camara" tamano={24} />
        </span>
      </Link>
      {LADO_B.map(enlace)}
    </nav>
  );
}

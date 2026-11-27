import Link from "next/link";
import { Icono } from "./Iconos";

// Barra inferior de la barbería. Las pestañas que aún no existen se ven apagadas.
export function BarraBarberia({ activa }: { activa: "hoy" }) {
  return (
    <nav className="barra" aria-label="Secciones">
      <Link href="/hoy" className={activa === "hoy" ? "activa" : undefined} aria-current={activa === "hoy" ? "page" : undefined}>
        <Icono nombre="hoy" />
        Hoy
      </Link>
      <span className="pronto" title="Próximamente">
        <Icono nombre="agenda" />
        Agenda
      </span>
      <span className="pronto" title="Próximamente" aria-label="Subir trabajo, próximamente">
        <span className="central">
          <Icono nombre="camara" tamano={24} />
        </span>
      </span>
      <span className="pronto" title="Próximamente">
        <Icono nombre="clientes" />
        Clientes
      </span>
      <span className="pronto" title="Próximamente">
        <Icono nombre="cuenta" />
        Cuenta
      </span>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { salir } from "@/app/hoy/acciones";
import { Icono } from "./Iconos";

type Fila = { href: string; texto: string; detalle?: string };

const GRUPOS: { titulo: string; filas: Fila[] }[] = [
  {
    titulo: "Agenda",
    filas: [
      { href: "/agenda", texto: "Agenda" },
      { href: "/agenda/nueva", texto: "Nueva cita" },
      { href: "/agenda/bloquear", texto: "Bloquear horario" },
    ],
  },
  {
    titulo: "Negocio",
    filas: [
      { href: "/clientes", texto: "Clientes" },
      { href: "/servicios", texto: "Servicios y precios" },
      { href: "/equipo", texto: "Equipo y horarios" },
      { href: "/cupones", texto: "Cupones" },
      { href: "/trabajos", texto: "Portafolio" },
    ],
  },
  {
    titulo: "Complementos",
    filas: [{ href: "/complementos", texto: "Complementos", detalle: "Insights, bot de WhatsApp, vacantes y chat" }],
  },
  {
    titulo: "Cuenta",
    filas: [
      { href: "/cuenta", texto: "Tu página", detalle: "Publicar, compartir y medalla" },
      { href: "/cuenta/perfil", texto: "Mi perfil" },
      { href: "/cuenta/datos", texto: "Datos de tu barbería" },
    ],
  },
];

// Menú del encargado: todo lo de la barbería en un solo lugar.
export function MenuEncargado({ nombre, slug, activa }: { nombre: string; slug: string; activa: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setAbierto(false), [ruta]);
  useEffect(() => {
    if (!abierto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button, a")?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  return (
    <>
      <button type="button" className={`boton-barra${activa ? " activa" : ""}`} aria-expanded={abierto} aria-haspopup="dialog" onClick={() => setAbierto(true)}>
        <Icono nombre="menu" />
        Menú
      </button>
      {abierto &&
        createPortal(
        <div className="velo velo-menu" role="presentation" onClick={() => setAbierto(false)}>
          <div ref={panel} className="cajon" role="dialog" aria-modal="true" aria-label="Menú" onClick={(e) => e.stopPropagation()}>
            <div className="cajon-cabeza">
              <span style={{ minWidth: 0 }}>
                <strong>{nombre}</strong>
                <Link href={`/b/${slug}`}>Ver mi página</Link>
              </span>
              <button type="button" className="cajon-cerrar" aria-label="Cerrar menú" onClick={() => setAbierto(false)}>
                <Icono nombre="cerrar" tamano={20} />
              </button>
            </div>
            {GRUPOS.map((g) => (
              <nav key={g.titulo} aria-label={g.titulo} className="cajon-grupo">
                {g.titulo !== "Complementos" && <span className="etiqueta">{g.titulo}</span>}
                <ul>
                  {g.filas.map((f) => (
                    <li key={f.href}>
                      <Link href={f.href} aria-current={ruta === f.href ? "page" : undefined} className={g.titulo === "Complementos" ? "cajon-destacado" : undefined}>
                        <span>
                          {f.texto}
                          {f.detalle && <small>{f.detalle}</small>}
                        </span>
                        <Icono nombre="siguiente" tamano={14} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <div className="cajon-pie">
              <a href="/api/respaldo" download>
                <Icono nombre="descargar" tamano={16} />
                Descargar respaldo
              </a>
              <form action={salir}>
                <button type="submit">Cerrar sesión</button>
              </form>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

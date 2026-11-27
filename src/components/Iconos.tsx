// Íconos de trazo, 24 × 24, heredan el color del texto.
const TRAZOS = {
  hoy: "M4 11l8-7 8 7v8.5h-5v-6H9v6H4z",
  agenda: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M9 3v4M15 3v4",
  camara: "M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.5-2h5L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5zM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  clientes: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c.9-3.3 3.3-5 6-5s5.1 1.7 6 5M16 4.5a3.3 3.3 0 0 1 0 6.3M18 15c1.6.6 2.6 2.2 3 4.5",
  cuenta: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6",
  descargar: "M12 4v11M7 10l5 5 5-5M5 20h14",
  check: "M5 12.5l4.2 4.2L19 7",
  reloj: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2",
  candado: "M5 10.5h14v9.5H5zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5",
  atras: "M15 5l-7 7 7 7",
  descubrir: "M4 4h7v9H4zM13 4h7v5h-7zM4 15h7v5H4zM13 11h7v9h-7z",
  buscar: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  usuario: "M12 12.3a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6zM5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2",
  siguiente: "M9 5l7 7-7 7",
  mas: "M12 5v14M5 12h14",
  mensaje: "M4 5.5h16v11H9l-5 4z",
  compartir: "M12 4v11M7.5 8.5L12 4l4.5 4.5M5 13v6h14v-6",
  foto: "M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15.5 9.5a1 1 0 1 0 0-.01",
  basura: "M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, tamano = 22, grosor = 1.9 }: { nombre: NombreIcono; tamano?: number; grosor?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none" }}>
      <path d={TRAZOS[nombre]} fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

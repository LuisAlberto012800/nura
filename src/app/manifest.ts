import type { MetadataRoute } from "next";

// Permite instalar Nura en la pantalla de inicio del celular, sin tiendas de apps.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nura para barberías",
    short_name: "Nura",
    description: "Agenda, clientes y portafolio para barberías y estéticas.",
    start_url: "/hoy",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf7f2",
    theme_color: "#fbf7f2",
    lang: "es-MX",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

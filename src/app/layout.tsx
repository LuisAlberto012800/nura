import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Plus Jakarta Sans viaja con la app (licencia OFL), así no depende de Google Fonts.
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans.ttf",
  variable: "--fuente",
  weight: "400 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nura",
  description: "Agenda, clientes y portafolio para barberías y estéticas.",
  applicationName: "Nura",
  appleWebApp: { capable: true, title: "Nura", statusBarStyle: "default" },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1511" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}

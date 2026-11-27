import Link from "next/link";
import { BotonesProveedor } from "@/components/BotonesProveedor";
import { Icono } from "@/components/Iconos";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata = { title: "Iniciar sesión · Nura" };
export const dynamic = "force-dynamic";

export default async function Entrar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 22 }}>
        <Link href="/" className="volver">
          <Icono nombre="atras" tamano={18} />
          Inicio
        </Link>
        <Logo alto={34} />
        <div>
          <h1 className="titulo">Qué gusto verte de nuevo</h1>
          <p className="subtitulo">Entra con la misma forma que usaste al registrarte.</p>
        </div>
        {sp.aviso === "proveedor" && (
          <p className="aviso aviso-error" role="alert">No pudimos conectar con ese servicio. Intenta de nuevo o entra con tu correo.</p>
        )}
        <BotonesProveedor />
        <FormularioEntrar modo="entrar" />
        <p className="meta" style={{ textAlign: "center" }}>
          ¿No tienes cuenta? <Link href="/registro">Regístrate</Link>
        </p>
      </div>
    </main>
  );
}

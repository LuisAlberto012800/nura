import Link from "next/link";
import { redirect } from "next/navigation";
import { BotonesProveedor } from "@/components/BotonesProveedor";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { FormularioEntrar } from "@/app/entrar/FormularioEntrar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { esRol } from "@/lib/rol";

export const metadata = { title: "Crear cuenta · Nura" };
export const dynamic = "force-dynamic";

export default async function RegistroCuenta({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { rol } = await searchParams;
  if (!esRol(rol)) redirect("/registro");

  const profesional = rol === "profesional";
  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 22 }}>
        <Link href="/registro" className="volver">
          <Icono nombre="atras" tamano={18} />
          Cambiar
        </Link>
        <div>
          <span className="etiqueta">{profesional ? "Estilista o barbero" : "Busco quién me atienda"}</span>
          <h1 className="titulo" style={{ marginTop: 6 }}>
            {profesional ? "Tu trabajo merece llevar tu nombre." : "Mira el trabajo de quien está cerca."}
          </h1>
          <p className="subtitulo">Crea tu cuenta para empezar.</p>
        </div>
        <BotonesProveedor rol={rol} />
        <FormularioEntrar modo="crear" rol={rol} />
        <p className="meta" style={{ textAlign: "center" }}>
          ¿Ya tienes cuenta? <Link href="/entrar">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}

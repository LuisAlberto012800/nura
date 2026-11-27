import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata = { title: "Entrar · Nura" };
export const dynamic = "force-dynamic";

export default function Entrar() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 24, paddingTop: 48 }}>
        <Logo alto={40} />
        <div>
          <h1 className="titulo">Tu trabajo merece llevar tu nombre.</h1>
          <p className="subtitulo">Agenda, clientes y portafolio de tu barbería, en un solo lugar.</p>
        </div>
        <FormularioEntrar />
      </div>
    </main>
  );
}

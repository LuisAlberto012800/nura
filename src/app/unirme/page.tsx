import Link from "next/link";
import { redirect } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { salir } from "../hoy/acciones";
import { FormularioUnirme } from "./FormularioUnirme";

export const metadata = { title: "Únete a tu barbería · Nura" };
export const dynamic = "force-dynamic";

type Solicitud = { id: string; estado: string; creado_en: string; salon: { nombre: string } | null };

// Para el barbero que trabaja en una barbería que ya está en Nura.
export default async function Unirme() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/registro/cuenta?rol=profesional");
  if (await salonDelUsuario(supabase, user.id)) redirect("/hoy");

  const { data } = await supabase.from("solicitudes").select("id, estado, creado_en, salon:salones(nombre)").eq("usuario_id", user.id).order("creado_en", { ascending: false });
  const solicitudes = (data ?? []) as unknown as Solicitud[];
  const pendiente = solicitudes.find((s) => s.estado === "pendiente");
  const nombre = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") as string;

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 20 }}>
        <Logo alto={28} />
        {pendiente ? (
          <>
            <span className="listo-check espera" aria-hidden="true">
              <Icono nombre="reloj" tamano={28} grosor={2.2} />
            </span>
            <div>
              <h1 className="titulo">Esperando a {pendiente.salon?.nombre}</h1>
              <p className="subtitulo">Tu encargado tiene que aceptar tu solicitud. Así confirmamos que trabajas ahí. En cuanto la acepte, entras directo a tu agenda.</p>
            </div>
            <Link className="btn btn-sec" href="/unirme">
              Revisar de nuevo
            </Link>
          </>
        ) : (
          <>
            <div>
              <h1 className="titulo">Únete a tu barbería</h1>
              <p className="subtitulo">Manda una solicitud y tu encargado la confirma. Después verás tu agenda y podrás subir tus trabajos.</p>
            </div>
            {solicitudes[0]?.estado === "rechazada" && (
              <p className="aviso aviso-neutro" style={{ margin: 0 }}>{solicitudes[0].salon?.nombre} no aceptó tu solicitud. Si es un error, habla con tu encargado y vuelve a mandarla.</p>
            )}
            <FormularioUnirme nombre={nombre} />
          </>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <Link href="/empleos" className="meta" style={{ color: "var(--accion-500)", fontWeight: 700, textDecoration: "none" }}>
            Buscar trabajo en otra barbería
          </Link>
          <Link href="/alta" className="meta" style={{ color: "var(--accion-500)", fontWeight: 700, textDecoration: "none" }}>
            Mejor doy de alta mi propia barbería
          </Link>
          <form action={salir}>
            <button type="submit" className="btn btn-texto" style={{ color: "var(--tinta-600)" }}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textoCategoria } from "@/lib/formato";
import { responder } from "./acciones";

export const metadata = { title: "Confirma tu trabajo · Nura", robots: { index: false } };
export const dynamic = "force-dynamic";

type Datos = {
  foto_despues: string | null;
  foto_antes: string | null;
  categoria: string | null;
  servicio: string | null;
  salon: string;
  slug: string;
  estilista: string | null;
  cliente: string | null;
  confirmacion: string;
};

// Página que abre la clienta desde WhatsApp. Sin cuenta: el enlace es su llave.
export default async function Confirmar({ params }: { params: Promise<{ token: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/.test(token)) notFound();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("trabajo_por_token", { p_token: token });
  const t = (data as Datos[] | null)?.[0];
  if (!t) notFound();

  const quien = t.estilista?.split(" ")[0] ?? t.salon;
  const que = (t.servicio ?? textoCategoria(t.categoria) ?? "trabajo").toLowerCase();
  const Boton = ({ respuesta, texto, clase }: { respuesta: string; texto: string; clase: string }) => (
    <form action={responder}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="respuesta" value={respuesta} />
      <button type="submit" className={clase}>
        {texto}
      </button>
    </form>
  );

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 16 }}>
        <Logo alto={26} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {t.foto_despues && <img className="foto-confirmar" src={t.foto_despues} alt="Tu trabajo" />}

        {t.confirmacion === "pendiente" ? (
          <>
            <div>
              <h1 className="titulo" style={{ fontSize: 24 }}>
                {quien} publicó tu {que}. ¿Lo confirmas?
              </h1>
              <p className="subtitulo">Tu confirmación le dice a otras personas que el trabajo es real. Hecho en {t.salon}.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Boton respuesta="con_nombre" texto={t.cliente ? `Confirmar como ${t.cliente}` : "Confirmar con mi nombre"} clase="btn" />
              <Boton respuesta="sin_nombre" texto="Confirmar sin mi nombre" clase="btn btn-sec" />
              <Boton respuesta="rechazado" texto="No soy yo o no quiero que se publique" clase="btn btn-texto ancho" />
            </div>
          </>
        ) : t.confirmacion === "rechazado" ? (
          <div>
            <h1 className="titulo" style={{ fontSize: 24 }}>Listo, no se publica.</h1>
            <p className="subtitulo">{t.salon} ya no la puede mostrar en Nura.</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="titulo" style={{ fontSize: 24 }}>Gracias por confirmar.</h1>
              <p className="subtitulo">Tu {que} ya aparece en la página de {t.salon}.</p>
            </div>
            <Link className="btn" href={`/b/${t.slug}`}>
              Volver a reservar con {quien}
            </Link>
          </>
        )}
        <p className="meta" style={{ margin: 0 }}>Al confirmar aceptas que la foto se muestre en Nura. Puedes pedir que la quiten cuando quieras.</p>
      </div>
    </main>
  );
}

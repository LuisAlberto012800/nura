import { BarraBarberia } from "@/components/BarraBarberia";
import { BotonCopiar } from "@/components/BotonCopiar";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { enlaceWhatsApp, pesos } from "@/lib/formato";
import { botActivo, enlaceBot, PRECIO_BOT } from "@/lib/insights";

export const metadata = { title: "Bot de WhatsApp · Nura" };
export const dynamic = "force-dynamic";

const INCLUYE = [
  "Tus clientes reservan por WhatsApp a cualquier hora, sin llamarte",
  "Solo ofrece horas libres dentro del horario de cada barbero",
  "Muestra tus servicios con su precio exacto",
  "La reserva te llega a Hoy para que la confirmes",
];

export default async function Bot() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoEncargado();
  const activo = await botActivo(supabase, salon.id);
  const enlace = enlaceBot(salon.slug);
  const contacto = process.env.NEXT_PUBLIC_NURA_WHATSAPP;

  return (
    <main className="pantalla">
      <div className="contenido">
        <div>
          <h1 className="titulo">Bot de WhatsApp</h1>
          <p className="subtitulo">{activo ? "Activo. Tus clientes ya pueden reservar por WhatsApp." : "Reservas por WhatsApp, solas, a cualquier hora."}</p>
        </div>

        {activo ? (
          enlace ? (
            <>
              <section className="tarjeta" aria-labelledby="tu-enlace">
                <h2 id="tu-enlace" className="etiqueta">Tu enlace de reservas</h2>
                <p className="enlace-pagina">{enlace.replace(/^https?:\/\//, "").split("?")[0]} · {salon.slug}</p>
                <div className="fila" style={{ gap: 8 }}>
                  <BotonCopiar texto={enlace} etiqueta="Copiar" />
                  <a className="btn btn-sec" href={`https://wa.me/?text=${encodeURIComponent(`Reserva en ${salon.nombre} por WhatsApp: ${enlace}`)}`} target="_blank" rel="noreferrer">
                    Compartir
                  </a>
                </div>
                <a className="btn btn-texto" href={enlace} target="_blank" rel="noreferrer" style={{ alignSelf: "flex-start", paddingLeft: 0 }}>
                  Probarlo yo
                </a>
              </section>
              <section className="tarjeta" style={{ gap: 8 }}>
                <strong>Dónde ponerlo</strong>
                <span className="meta">En la biografía de tu Instagram, como respuesta automática de tu WhatsApp Business y en tus historias. También aparece en tu página de Nura.</span>
              </section>
            </>
          ) : (
            <p className="aviso aviso-neutro">Tu bot está pagado. El equipo de Nura está terminando de conectar el número; en cuanto esté listo, aquí aparece tu enlace.</p>
          )
        ) : (
          <>
            <section className="tarjeta" style={{ gap: 12 }}>
              <ul className="lista-incluye">
                {INCLUYE.map((t) => (
                  <li key={t}>
                    <span className="paso hecho">
                      <Icono nombre="check" tamano={14} grosor={2.4} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="fila-separada" style={{ borderTop: "1px solid var(--borde-100)", paddingTop: 12 }}>
                <span style={{ fontSize: 14, color: "var(--tinta-600)" }}>Al mes</span>
                <span className="precio" style={{ fontSize: 22 }}>{pesos(PRECIO_BOT)}</span>
              </div>
            </section>
            {contacto ? (
              <a className="btn" href={enlaceWhatsApp(contacto, "Hola, quiero activar el bot de WhatsApp para mi barbería.")} target="_blank" rel="noreferrer">
                Quiero activarlo
              </a>
            ) : (
              <p className="aviso aviso-neutro">Para activarlo, pídeselo al equipo de Nura.</p>
            )}
          </>
        )}
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

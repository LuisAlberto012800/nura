import { Icono } from "./Iconos";
import { enlaceWhatsApp, pesos } from "@/lib/formato";

// Pantalla de un complemento que la barbería todavía no tiene: qué incluye,
// cuánto cuesta y cómo pedirlo.
export function Complemento({ nombre, precio, incluye }: { nombre: string; precio: number; incluye: string[] }) {
  const contacto = process.env.NEXT_PUBLIC_NURA_WHATSAPP;
  return (
    <>
      <section className="tarjeta" style={{ gap: 12 }}>
        <ul className="lista-incluye">
          {incluye.map((t) => (
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
          <span className="precio" style={{ fontSize: 22 }}>{pesos(precio)}</span>
        </div>
      </section>
      {contacto ? (
        <a className="btn" href={enlaceWhatsApp(contacto, `Hola, quiero activar ${nombre} para mi barbería.`)} target="_blank" rel="noreferrer">
          Quiero activarlo
        </a>
      ) : (
        <p className="aviso aviso-neutro">Para activarlo, pídeselo al equipo de Nura.</p>
      )}
    </>
  );
}

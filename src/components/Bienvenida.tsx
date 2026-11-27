import Link from "next/link";
import { Logo } from "./Logo";

export type FotoMosaico = { url: string; alt: string };

// Tonos de la escala café para cuando todavía no hay fotos publicadas.
const TONOS = ["#a88566", "#e6d7c6", "#634936", "#cdb49a", "#82634b", "#f3ebe1", "#483427", "#cdb49a", "#a88566"];
const ALTOS = [190, 140, 170, 210, 150, 180, 160, 200, 140];

// Primera pantalla sin sesión: mosaico, logotipo y las dos puertas de entrada.
export function Bienvenida({ fotos }: { fotos: FotoMosaico[] }) {
  const piezas = TONOS.map((tono, i) => ({ tono, alto: ALTOS[i], foto: fotos[i] }));
  const columnas = [0, 1, 2].map((c) => piezas.filter((_, i) => i % 3 === c));

  return (
    <main className="bienvenida">
      <div className="mosaico" aria-hidden="true">
        {columnas.map((col, c) => (
          <div key={c} className="mosaico-col" style={{ marginTop: [-30, -90, -50][c] }}>
            {col.map((p, i) => (
              <div key={i} className="mosaico-pieza" style={{ height: p.alto, background: p.tono }}>
                {p.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.foto.url} alt="" loading="lazy" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="bienvenida-panel">
        <Logo alto={44} color="#fbf7f2" cuenta="#f29466" />
        <h1>Mira el trabajo de quien está cerca.</h1>
        <p>Fotos reales, precio exacto y quién lo hizo, antes de sentarte.</p>
        <div className="bienvenida-botones">
          <Link href="/registro" className="btn">
            Registrarse
          </Link>
          <Link href="/entrar" className="btn btn-oscuro">
            Iniciar sesión
          </Link>
        </div>
        <p className="bienvenida-legal">
          Al continuar aceptas los términos de uso y el aviso de privacidad de Nura.
        </p>
      </div>
    </main>
  );
}

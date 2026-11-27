import Link from "next/link";

// Aviso de que falta algo antes de seguir, con el botón para resolverlo.
export function SinDatos({ texto, href, boton }: { texto: string; href: string; boton: string }) {
  return (
    <>
      <p className="aviso aviso-neutro">{texto}</p>
      <Link className="btn" href={href}>
        {boton}
      </Link>
    </>
  );
}

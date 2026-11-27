import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraClienta } from "@/components/BarraClienta";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { guardarCabello, salir } from "./acciones";

export const metadata = { title: "Tú · Nura" };
export const dynamic = "force-dynamic";

const CABELLOS = [
  { valor: "lacio", texto: "Lacio", nota: "Cae recto" },
  { valor: "ondulado", texto: "Ondulado", nota: "Forma una S suelta" },
  { valor: "rizado", texto: "Rizado", nota: "Espiral definida" },
  { valor: "afro", texto: "Afro", nota: "Rizo cerrado" },
];

export default async function Tu() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const cabello = user.user_metadata?.cabello as string | undefined;
  const nombre = (user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Tú") as string;

  return (
    <main className="pantalla">
      <div className="contenido">
        <div className="fila" style={{ gap: 14 }}>
          <span className="avatar">{nombre.charAt(0).toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <h1 className="titulo" style={{ fontSize: 22 }}>
              {nombre.includes("@") ? "Tu cuenta" : nombre.split(" ")[0]}
            </h1>
            <p className="meta" style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              Guadalajara
            </p>
          </div>
        </div>

        <section className="tarjeta" aria-labelledby="mi-cabello">
          <h2 id="mi-cabello" className="etiqueta">Mi cabello</h2>
          <p className="meta" style={{ margin: 0 }}>Tu inicio muestra primero trabajos en cabello como el tuyo.</p>
          <div className="opciones-cabello">
            {CABELLOS.map((c) => (
              <form key={c.valor} action={guardarCabello}>
                <input type="hidden" name="cabello" value={c.valor} />
                <button type="submit" className={`opcion-cabello${cabello === c.valor ? " activo" : ""}`} aria-pressed={cabello === c.valor}>
                  <strong>{c.texto}</strong>
                  <span>{c.nota}</span>
                </button>
              </form>
            ))}
          </div>
        </section>

        <ul className="filas tarjeta" style={{ padding: "0 16px", gap: 0 }}>
          <li>
            <Link href="/alta" className="fila-precio" style={{ color: "var(--accion-500)" }}>
              <p>Soy estilista: abrir cuenta profesional</p>
              <Icono nombre="siguiente" tamano={16} />
            </Link>
          </li>
          <li>
            <Link href="/unirme" className="fila-precio">
              <p>
                Trabajo en una barbería
                <small>Únete a su equipo en Nura</small>
              </p>
              <Icono nombre="siguiente" tamano={16} />
            </Link>
          </li>
        </ul>

        <form action={salir}>
          <button type="submit" className="btn btn-texto" style={{ color: "var(--tinta-600)" }}>
            Cerrar sesión
          </button>
        </form>
      </div>
      <BarraClienta activa="tu" />
    </main>
  );
}

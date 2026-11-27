import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { duracionTexto, pesos } from "@/lib/formato";
import { cambiarVisible } from "./acciones";
import { FormularioServicio } from "./FormularioServicio";

export const metadata = { title: "Servicios y precios · Nura" };
export const dynamic = "force-dynamic";

type Servicio = { id: string; nombre: string; duracion_min: number; precio: number; activo: boolean };

export default async function Servicios() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoEncargado();

  const { data } = await supabase
    .from("servicios")
    .select("id, nombre, duracion_min, precio, activo")
    .eq("salon_id", salon.id)
    .order("orden")
    .order("creado_en");
  const servicios = (data ?? []) as Servicio[];

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/cuenta" className="volver">
          <Icono nombre="atras" tamano={18} />
          Cuenta
        </Link>
        <div>
          <h1 className="titulo">Servicios y precios</h1>
          <p className="subtitulo">Lo que ven tus clientas en tu página, con su precio y duración.</p>
        </div>

        <p className="aviso aviso-neutro" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icono nombre="candado" tamano={18} />
          <span>En Nura no existe &quot;desde $X&quot;. El precio que pongas es el que ve la clienta.</span>
        </p>

        {servicios.length > 0 ? (
          <ul className="lista-servicios">
            {servicios.map((s) => (
              <li key={s.id} className={s.activo ? undefined : "oculto"}>
                <Link href={`/servicios/${s.id}`} className="servicio-info">
                  <strong>{s.nombre}</strong>
                  <span className="meta">
                    {duracionTexto(s.duracion_min)}
                    {s.activo ? "" : " · oculto en tu página"}
                  </span>
                </Link>
                <span className="precio">{pesos(s.precio)}</span>
                <form action={cambiarVisible}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="activo" value={String(s.activo)} />
                  <button
                    type="submit"
                    className={`interruptor${s.activo ? " encendido" : ""}`}
                    role="switch"
                    aria-checked={s.activo}
                    aria-label={`${s.activo ? "Ocultar" : "Mostrar"} ${s.nombre} en tu página`}
                  />
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="aviso aviso-neutro">Todavía no tienes servicios. Agrega el primero abajo: con uno basta para empezar.</p>
        )}

        <section className="tarjeta" aria-labelledby="nuevo">
          <h2 id="nuevo" className="etiqueta">Agregar servicio</h2>
          <FormularioServicio />
        </section>
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

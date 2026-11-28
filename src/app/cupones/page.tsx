import { BarraBarberia } from "@/components/BarraBarberia";
import { Encabezado } from "@/components/Encabezado";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { pesos } from "@/lib/formato";
import { precioConCupon, textoDescuento, venceTexto, type Cupon } from "@/lib/cupones";
import { hoyLocal } from "@/lib/tiempo";
import { borrarCupon, cambiarCupon } from "./acciones";
import { FormularioCupon } from "./FormularioCupon";

export const metadata = { title: "Cupones · Nura" };
export const dynamic = "force-dynamic";

export default async function Cupones() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoEncargado();
  const [{ data: dCupones }, { data: dServicios }] = await Promise.all([
    supabase.from("cupones").select("id, codigo, servicio_id, tipo, valor, vence, usos_max, usos, publico, activo").eq("salon_id", salon.id).order("creado_en", { ascending: false }),
    supabase.from("servicios").select("id, nombre, precio").eq("salon_id", salon.id).eq("activo", true).order("orden").order("creado_en"),
  ]);
  const cupones = (dCupones ?? []) as Cupon[];
  const servicios = (dServicios ?? []) as { id: string; nombre: string; precio: number }[];
  const hoy = hoyLocal();

  return (
    <main className="pantalla">
      <div className="contenido">
        <Encabezado titulo="Cupones" volver="/hoy" />
        <p className="subtitulo" style={{ margin: 0 }}>Descuentos para un servicio o para todos. El precio con descuento se muestra exacto.</p>

        {cupones.length > 0 && (
          <ul className="lista-cupones">
            {cupones.map((c) => {
              const servicio = servicios.find((s) => s.id === c.servicio_id);
              const vencido = !!c.vence && c.vence < hoy;
              const agotado = c.usos_max != null && c.usos >= c.usos_max;
              const vigente = c.activo && !vencido && !agotado;
              return (
                <li key={c.id} className={`cupon${vigente ? "" : " apagado"}`}>
                  <div className="cupon-cuerpo">
                    <strong className="cupon-codigo">{c.codigo}</strong>
                    <span>
                      {textoDescuento(c)} · {servicio ? servicio.nombre : "todos los servicios"}
                    </span>
                    {servicio && (
                      <span className="meta">
                        {pesos(servicio.precio)} → {pesos(precioConCupon(servicio.precio, c))}
                      </span>
                    )}
                    <span className="meta">
                      {[
                        vencido ? "Venció" : c.vence ? venceTexto(c.vence) : null,
                        c.usos_max ? `${c.usos} de ${c.usos_max} usos` : `${c.usos} ${c.usos === 1 ? "uso" : "usos"}`,
                        agotado ? "agotado" : null,
                        c.publico ? "en tu página" : "solo con código",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <div className="cupon-acciones">
                    <form action={cambiarCupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="activo" value={String(c.activo)} />
                      <button type="submit" className={`interruptor${c.activo ? " encendido" : ""}`} role="switch" aria-checked={c.activo} aria-label={c.activo ? `Pausar ${c.codigo}` : `Activar ${c.codigo}`} />
                    </form>
                    {c.usos === 0 && (
                      <form action={borrarCupon}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="btn-texto" style={{ border: 0, background: "none", color: "var(--peligro-500)", font: "inherit", fontSize: 13, cursor: "pointer", minHeight: 44 }}>
                          Borrar
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <section className="tarjeta" aria-labelledby="nuevo-cupon">
          <h2 id="nuevo-cupon" className="etiqueta">Nuevo cupón</h2>
          {servicios.length > 0 ? <FormularioCupon servicios={servicios} /> : <p className="meta" style={{ margin: 0 }}>Primero agrega tus servicios con su precio.</p>}
        </section>
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

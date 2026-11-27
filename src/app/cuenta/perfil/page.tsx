import Link from "next/link";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { DIAS, horaCorta } from "@/lib/horarios";
import { FormularioPerfil } from "./FormularioPerfil";
import { SalirBarberia } from "./SalirBarberia";
import { FotoSubible } from "@/components/FotoSubible";
import { guardarMiFoto } from "./acciones";

export const metadata = { title: "Mi perfil · Nura" };
export const dynamic = "force-dynamic";

export default async function MiPerfil() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, user, salon } = await contextoBarberia();
  const { data: yo } = await supabase
    .from("estilistas")
    .select("id, nombre, especialidades, anios_oficio, foto_url, horarios(dia, inicio, fin)")
    .eq("salon_id", salon.id)
    .eq("usuario_id", user.id)
    .maybeSingle();
  const horarios = ((yo?.horarios ?? []) as { dia: number; inicio: string; fin: string }[]);

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/cuenta" className="volver">
          <Icono nombre="atras" tamano={18} />
          Cuenta
        </Link>
        <h1 className="titulo">Mi perfil</h1>
        {yo ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <FotoSubible salonId={salon.id} carpeta="perfil" forma="circulo" actual={yo.foto_url} inicial={yo.nombre.charAt(0).toUpperCase()} guardar={guardarMiFoto} />
              <span className="meta">Sale en la página de {salon.nombre} y junto a tus trabajos.</span>
            </div>
            <FormularioPerfil nombre={yo.nombre} especialidades={yo.especialidades ?? []} anios={yo.anios_oficio} />
            <section className="tarjeta" aria-labelledby="mi-horario">
              <h2 id="mi-horario" className="etiqueta">Mi horario</h2>
              <ul className="lista-pendientes">
                {DIAS.map((d) => {
                  const h = horarios.find((x) => x.dia === d.valor);
                  return (
                    <li key={d.valor} style={{ justifyContent: "space-between" }}>
                      <span>{d.texto}</span>
                      <span className="meta">{h ? `${horaCorta(h.inicio)} a ${horaCorta(h.fin)}` : "Descansa"}</span>
                    </li>
                  );
                })}
              </ul>
              <span className="meta">Tu horario lo pone tu encargado. Si necesitas un cambio, pídeselo.</span>
            </section>
          </>
        ) : (
          <p className="aviso aviso-neutro">Tu encargado todavía no liga tu cuenta a un perfil del equipo.</p>
        )}
        {salon.rol === "estilista" && <SalirBarberia salon={salon.nombre} />}
      </div>
    </main>
  );
}

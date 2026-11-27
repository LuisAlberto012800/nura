import Link from "next/link";
import { Medalla } from "./Medalla";
import { Verificado } from "./Encabezado";
import { pesos, textoCabello, textoCategoria } from "@/lib/formato";

export type DatosTarjeta = {
  id: string;
  titulo: string | null;
  foto_despues: string;
  foto_antes: string | null;
  tipo_cabello: string;
  categoria: string;
  colonia: string;
  servicio: { nombre: string; precio: number } | null;
  estilista: { nombre: string } | null;
  salonNombre?: string;
  nivel: number;
};

// Tarjeta de un trabajo en el mosaico: foto, quién, qué, cabello, colonia y precio exacto.
export function TarjetaTrabajo({ t, alto, conSalon = true }: { t: DatosTarjeta; alto?: number; conSalon?: boolean }) {
  const quien = [t.estilista?.nombre.split(" ").slice(0, 2).join(" "), conSalon ? t.salonNombre : null].filter(Boolean).join(" · ");
  return (
    <Link href={`/t/${t.id}`} className="tarjeta-trabajo">
      <div className="foto" style={alto ? { height: alto } : { aspectRatio: "4 / 5" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.foto_despues} alt={`${t.servicio?.nombre ?? textoCategoria(t.categoria)} en cabello ${textoCabello(t.tipo_cabello)?.toLowerCase()}`} loading="lazy" />
        {t.foto_antes && <span className="sello">Antes / Después</span>}
      </div>
      <div className="cuerpo">
        {quien && (
          <span className="autor">
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{quien}</span>
            {t.nivel > 0 && <Verificado />}
          </span>
        )}
        <strong>{t.titulo ?? t.servicio?.nombre ?? textoCategoria(t.categoria)}</strong>
        <span className="meta">
          {textoCabello(t.tipo_cabello)} · {t.colonia}
        </span>
        {(t.servicio || t.nivel > 0) && (
          <span className="pie">
            {t.servicio ? <span className="precio">{pesos(t.servicio.precio)}</span> : <span />}
            <Medalla nivel={t.nivel} compacta />
          </span>
        )}
      </div>
    </Link>
  );
}

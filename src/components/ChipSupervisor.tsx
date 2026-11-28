import Link from "next/link";
import { sesionActual } from "@/lib/sesion";
import { esSupervisor } from "@/lib/supervisor";

const TEXTO = { encargado: "Encargado", barbero: "Barbero", usuario: "Usuario" } as const;

// Etiqueta pequeña que solo ve el supervisor: dice en qué vista está y lleva al panel.
export async function ChipSupervisor({ vista }: { vista: keyof typeof TEXTO }) {
  const { user } = await sesionActual();
  if (!user || !esSupervisor(user.email)) return null;
  return (
    <Link href="/supervisar" className="chip-supervisor">
      Viendo como {TEXTO[vista]} · cambiar
    </Link>
  );
}

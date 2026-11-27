import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";

export const dynamic = "force-dynamic";

const TABLAS = ["estilistas", "servicios", "horarios", "bloqueos", "clientes", "citas", "trabajos"] as const;

// Descarga todo lo de la barbería en un archivo JSON. El plan gratis de Supabase
// no hace respaldos automáticos, así que este archivo es el respaldo.
// Las reglas de la base de datos garantizan que solo salga lo del salón propio.
export async function GET() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entra a tu cuenta para descargar el respaldo." }, { status: 401 });

  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) return NextResponse.json({ error: "Todavía no tienes una barbería." }, { status: 404 });

  const datos: Record<string, unknown[]> = {};
  for (const tabla of TABLAS) {
    const { data, error } = await supabase.from(tabla).select("*").eq("salon_id", salon.id);
    if (error) return NextResponse.json({ error: `No pudimos leer ${tabla}. Intenta de nuevo.` }, { status: 500 });
    datos[tabla] = data ?? [];
  }

  const fecha = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  const respaldo = {
    app: "Nura",
    version: 1,
    generado: new Date().toISOString(),
    salon,
    ...datos,
  };

  return new NextResponse(JSON.stringify(respaldo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="nura-respaldo-${salon.slug}-${fecha}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

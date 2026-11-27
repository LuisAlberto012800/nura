import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { atender, type Entrante } from "@/lib/whatsapp/bot";

export const dynamic = "force-dynamic";

// Meta llama aquí una vez para comprobar que la dirección es nuestra.
export function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("No", { status: 403 });
}

type Mensaje = {
  from: string;
  type: string;
  text?: { body: string };
  interactive?: { list_reply?: { id: string }; button_reply?: { id: string } };
};

// Mensajes que llegan al número de Nura. Solo se aceptan los firmados por Meta.
export async function POST(request: NextRequest) {
  const secreto = process.env.WHATSAPP_APP_SECRET;
  const crudo = await request.text();
  const firma = request.headers.get("x-hub-signature-256") ?? "";
  if (!secreto || !firmaValida(crudo, firma, secreto)) return new NextResponse("No", { status: 403 });

  let cuerpo: { entry?: { changes?: { value?: { messages?: Mensaje[]; contacts?: { wa_id: string; profile?: { name?: string } }[] } }[] }[] };
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const pendientes: Promise<unknown>[] = [];
  for (const entrada of cuerpo.entry ?? []) {
    for (const cambio of entrada.changes ?? []) {
      const valor = cambio.value;
      for (const m of valor?.messages ?? []) {
        const contacto = valor?.contacts?.find((c) => c.wa_id === m.from);
        const entrante: Entrante = {
          de: m.from,
          nombre: contacto?.profile?.name ?? null,
          texto: m.type === "text" ? m.text?.body : undefined,
          opcion: m.interactive?.list_reply?.id ?? m.interactive?.button_reply?.id,
        };
        pendientes.push(atender(entrante));
      }
    }
  }
  await Promise.all(pendientes);
  return NextResponse.json({ ok: true });
}

function firmaValida(cuerpo: string, firma: string, secreto: string) {
  const esperada = `sha256=${createHmac("sha256", secreto).update(cuerpo).digest("hex")}`;
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

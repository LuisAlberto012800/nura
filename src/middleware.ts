import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

const RUTAS_PRIVADAS = ["/hoy", "/alta", "/servicios", "/equipo", "/agenda", "/api/respaldo", "/elegir", "/inicio", "/citas", "/tu", "/clientes", "/subir", "/trabajos", "/cuenta", "/nueva-contrasena", "/negocio", "/bot", "/vacantes", "/empleos", "/mensajes", "/chat", "/chats", "/cupones", "/complementos", "/supervisar"];

// Mantiene viva la sesión y manda a "Entrar" a quien no tiene cuenta.
export async function middleware(request: NextRequest) {
  if (!supabaseConfigurado) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims revisa la sesión en el servidor de la app, sin ir a Supabase en
  // cada pantalla (solo cuando hay que renovarla).
  const { data, error } = await supabase.auth.getClaims();
  let user = data?.claims?.sub ?? null;
  // Si no se pudo revisar así (y sí hay sesión guardada), se pregunta a Supabase.
  if (!user && error && request.cookies.getAll().some((c) => c.name.includes("-auth-token"))) {
    user = (await supabase.auth.getUser()).data.user?.id ?? null;
  }

  const privada = RUTAS_PRIVADAS.some((r) => request.nextUrl.pathname.startsWith(r));
  if (!user && privada) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Las páginas públicas (barbería, trabajo, confirmar) no necesitan sesión.
  matcher: ["/((?!_next/static|_next/image|icons|icon.svg|manifest.webmanifest|favicon.ico|b/|t/|confirmar/|api/whatsapp).*)"],
};

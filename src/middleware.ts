import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

const RUTAS_PRIVADAS = ["/hoy", "/alta", "/servicios", "/api/respaldo"];

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const privada = RUTAS_PRIVADAS.some((r) => request.nextUrl.pathname.startsWith(r));
  if (!user && privada) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|icon.svg|manifest.webmanifest|favicon.ico).*)"],
};

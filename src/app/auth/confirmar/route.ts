import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COOKIE_ROL, esRol } from "@/lib/rol";

// Aquí regresa la persona después de confirmar su correo o de entrar con
// Google o Facebook. Si eligió un rol al registrarse, se guarda en su cuenta.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/entrar`);

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/entrar`);

  const almacen = await cookies();
  const rolElegido = almacen.get(COOKIE_ROL)?.value;
  if (!esRol(data.user.user_metadata?.rol) && esRol(rolElegido)) {
    await supabase.auth.updateUser({ data: { rol: rolElegido } });
  }
  almacen.delete(COOKIE_ROL);

  return NextResponse.redirect(`${origin}/`);
}

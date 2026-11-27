# Paso 4 · Poner Nura en línea

Guía para conectar Supabase y Vercel la primera vez. Toma unos 30 minutos y todo es gratis.

**Regla de oro:** las llaves y contraseñas se pegan solo en Supabase y Vercel. Nunca en GitHub, nunca en un chat.

## 1. Crear el proyecto en Supabase

1. Entra a supabase.com y abre tu organización **Nura**.
2. Toca **New project**.
3. **Name:** `nura`.
4. **Database password:** toca **Generate a password** y guárdala en un lugar seguro, como el gestor de contraseñas de tu celular. La app no la necesita, pero Supabase no te la vuelve a mostrar.
5. **Region:** elige la región de Estados Unidos más cercana que te ofrezca, por ejemplo **West US**.
6. Plan **Free**. Toca **Create new project** y espera un par de minutos.

## 2. Crear la base de datos

1. En el repositorio de GitHub abre `supabase/migrations/0001_inicio.sql`, toca **Raw** y copia todo el texto.
2. En Supabase entra a **SQL Editor** y toca **New query**.
3. Pega el texto y toca **Run**.
4. Debe decir **Success. No rows returned**. Si sale un error, copia el mensaje (no las llaves) y compártelo.

Este archivo se corre una sola vez.

## 3. Copiar las dos llaves

En Supabase entra a **Project Settings** y luego a **API** (puede llamarse **Data API** o **API Keys**). Necesitas dos datos:

| En Supabase | Nombre que lleva en Vercel |
| --- | --- |
| Project URL, algo como `https://abcd1234.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| La llave **anon public**. Si en su lugar ves **Publishable key** (empieza con `sb_publishable_`), usa esa | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

**Nunca uses la llave `service_role` ni la `secret`.** Esas saltan todas las reglas de seguridad.

## 4. Publicar en Vercel

1. En vercel.com toca **Add New** y luego **Project**.
2. Busca el repositorio **nura** y toca **Import**. Si no aparece, toca la opción para ajustar los permisos de GitHub y dale acceso solo a `nura`.
3. Vercel detecta solo que es **Next.js**. No cambies nada de la compilación.
4. Abre **Environment Variables** y agrega las dos llaves del paso 3, con los nombres exactos de la tabla.
5. Toca **Deploy** y espera uno o dos minutos.
6. Copia la dirección que te da Vercel, algo como `https://nura-xxxx.vercel.app`.

## 5. Decirle a Supabase cuál es tu dirección

Para que funcione el correo de confirmación de cuenta:

1. En Supabase entra a **Authentication** y luego a **URL Configuration**.
2. **Site URL:** pega tu dirección de Vercel.
3. En **Redirect URLs** agrega tu dirección seguida de `/auth/confirmar`, por ejemplo `https://nura-xxxx.vercel.app/auth/confirmar`.
4. Guarda.

## 6. Probar

1. Abre tu dirección de Vercel en el celular.
2. Crea una cuenta con tu correo y confírmala con el enlace que te llega.
3. Da de alta una barbería de prueba.
4. Instálala en la pantalla de inicio:
   - **iPhone (Safari):** botón Compartir y luego **Agregar a pantalla de inicio**.
   - **Android (Chrome):** menú de tres puntos y luego **Instalar app** o **Agregar a pantalla principal**.
5. Abre Nura desde el ícono y toca **Descargar respaldo** para confirmar que funciona.

## Si algo falla

| Lo que ves | Qué hacer |
| --- | --- |
| "Falta conectar la base de datos" | Revisa que las dos variables en Vercel tengan el nombre exacto y vuelve a publicar: **Deployments**, los tres puntos del último y **Redeploy** |
| El correo de confirmación no llega | Revisa spam. El correo que trae Supabase de fábrica manda pocos correos por hora; para tus pruebas puedes apagar la confirmación en **Authentication**, **Sign In / Providers**, **Email**, **Confirm email**. Vuelve a encenderla antes de dar de alta barberías reales |
| El enlace del correo te manda a otra dirección | Revisa el paso 5 |
| Error al correr el SQL | Asegúrate de que el proyecto sea nuevo y de haber copiado el archivo completo |

## Cada semana

Los lunes, toca **Descargar respaldo** en la app y guarda el archivo en tu computadora o en tu nube. El plan gratis de Supabase no hace respaldos automáticos.

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

Son dos datos que le dicen a la app **dónde** está tu base de datos y **con qué llave** puede entrar. Los copias de Supabase y los pegas en Vercel.

| Dato | Qué es | Cómo se ve |
| --- | --- | --- |
| Project URL | La dirección de tu base de datos | `https://abcd1234.supabase.co` |
| Llave pública | La llave de la puerta principal. Es pública a propósito: lo que protege los datos son las reglas de la base de datos | Empieza con `sb_publishable_` o, si se llama **anon public**, con `eyJ` |

**La forma más fácil de encontrarlos:** en tu proyecto de Supabase, toca el botón **Connect** de arriba, elige **App Frameworks** y luego **Next.js**. Ahí aparecen los dos datos juntos.

**Si no ves ese botón:** entra a **Project Settings** (el engrane abajo a la izquierda). La dirección está en **Data API** y la llave en **API Keys**.

**Nunca copies la llave `secret` ni la `service_role`.** Esas saltan todas las reglas de seguridad.

En Vercel, al importar el proyecto, abre **Environment Variables** y agrega dos renglones. En **Key** va el nombre y en **Value** el dato:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Tu Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu llave pública |

Si Supabase te muestra la llave con otro nombre, como `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, también funciona: la app acepta los dos.

## 4. Publicar en Vercel

1. En vercel.com toca **Add New** y luego **Project**.
2. Busca el repositorio **nura** y toca **Import**. Si no aparece, toca la opción para ajustar los permisos de GitHub y dale acceso solo a `nura`.
3. Vercel detecta solo que es **Next.js**. No cambies nada de la compilación.
4. Abre **Environment Variables** y agrega los dos renglones del paso 3.
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

## Opcional · Entrar con Google o Facebook

La app ya trae los botones; aparecen solo cuando los enciendes. Las dos cuentas de desarrollador son gratis. El teléfono queda para después porque cada mensaje SMS cuesta.

### Google

1. Entra a [console.cloud.google.com](https://console.cloud.google.com) con tu cuenta personal y crea un proyecto llamado `Nura`.
2. Ve a **APIs y servicios**, **Pantalla de consentimiento de OAuth**. Elige **Externo**, nombre de la app `Nura`, tu correo de soporte, y guarda.
3. Ve a **Credenciales**, **Crear credenciales**, **ID de cliente de OAuth**, tipo **Aplicación web**.
4. En Supabase abre **Authentication**, **Sign In / Providers**, **Google**. Ahí aparece una dirección llamada **Callback URL** que termina en `/auth/v1/callback`. Cópiala.
5. Regresa a Google y pégala en **URIs de redireccionamiento autorizados**. Crea la credencial.
6. Google te muestra dos datos: **ID de cliente** y **Secreto del cliente**. Pégalos directo en la pantalla de Google en Supabase (nunca en el chat) y enciende el interruptor.

### Facebook

1. Entra a [developers.facebook.com](https://developers.facebook.com), **Mis apps**, **Crear app**, caso de uso **Autenticar y solicitar datos a los usuarios con el inicio de sesión con Facebook**.
2. En **Inicio de sesión con Facebook**, **Configuración**, pega la misma **Callback URL** de Supabase (la de Facebook, en **Sign In / Providers**, **Facebook**) en **URI de redireccionamiento de OAuth válidos**.
3. En **Configuración de la app**, **Básica**, copia el **Identificador de la app** y la **Clave secreta**, y pégalos en la pantalla de Facebook en Supabase. Enciende el interruptor.
4. Mientras la app de Facebook esté en modo desarrollo, solo tú y quien agregues como probador pueden entrar. Para abrirla a todos, Facebook pide una dirección de aviso de privacidad.

### Encender los botones en la app

En Vercel, **Settings**, **Environment Variables**, agrega:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_LOGIN_PROVIDERS` | `google,facebook` (o solo `google`) |

Luego **Deployments**, los tres puntos del último y **Redeploy**. Si enciendes un botón en la app antes de terminar su pantalla en Supabase, al tocarlo verás un aviso y nada se rompe.

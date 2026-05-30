<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Guardería SaaS — Reglas del proyecto

## Stack técnico
- **Framework:** Next.js 15 (App Router)
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Facturación:** API VeriFactu de InvoCash
- **Despliegue:** Vercel

## Reglas de seguridad
- Todos los endpoints de `/api/` deben verificar autenticación con `supabase.auth.getUser()` antes de operar.
- Nunca hardcodear credenciales. Usar siempre variables de entorno.
- El `userId` siempre se extrae del usuario autenticado, nunca del body de la petición.

## VeriFactu
- Toda la lógica de InvoCash está centralizada en `lib/invocash.ts`. No duplicar en otros archivos.
- Las guarderías están exentas de IVA — Art. 20 Ley IVA. `CalificacionOperacion` siempre `'E1'`, `TipoImpositivo` siempre `0`.
- Variable de entorno del NIF emisor: `VERIFACTU_EMISOR_NIF`.

## Base de datos
- Usar `SUPABASE_SERVICE_ROLE_KEY` solo en rutas de servidor (`/api/`), nunca en cliente.
- Usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` para operaciones con sesión de usuario.
- El número de serie de facturas se genera con la función RPC `siguiente_numero_factura` para evitar condiciones de carrera.

## Variables de entorno necesarias
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERIFACTU_USER`
- `VERIFACTU_PASSWORD`
- `VERIFACTU_EMISOR_NIF`
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { crearEmisorInvocash } from '@/lib/invocash'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    // Comprobar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, nif, direccion, cp, email, telefono } = body

    console.log('[API/guarderias] Body recibido:', { nombre, nif, direccion, cp, email, telefono })

    const invocash = await crearEmisorInvocash({
      nif: nif.trim(),
      nombre,
      cp,
    })

    console.log('[InvoCash] Resultado:', invocash)

    if (!invocash.success) {
      console.error('[InvoCash] Error al crear emisor:', invocash.error)
    }

    const { error } = await supabase.from('guarderias').insert({
      nombre,
      nif: nif.trim(),
      direccion,
      cp,
      email,
      telefono,
      otorgamiento_validado: 'pendiente',
      plan: 'pequena',
      activa: false,
      owner_id: user.id,
      verifactu_emisor_id: invocash.emisor_id ?? null,
    })

    if (error) {
      console.error('[Supabase] Error insert:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      invocash_ok: invocash.success,
      invocash_emisor_id: invocash.emisor_id ?? null,
    }, { status: 200 })

  } catch (err) {
    console.error('[API/guarderias] Error interno:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
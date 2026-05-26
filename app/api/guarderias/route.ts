import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { crearEmisorInvocash } from '@/lib/invocash';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, nif, direccion, cp, email, telefono, userId } = body;

    console.log('[API/guarderias] Body recibido:', { nombre, nif, direccion, cp, email, telefono, userId });

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    console.log('[InvoCash] Intentando crear emisor con:', { nif, nombre, cp });

    const invocash = await crearEmisorInvocash({
      nif: nif.trim(),
      nombre,
      cp,
    });

    console.log('[InvoCash] Resultado:', invocash);

    if (!invocash.success) {
      console.error('[InvoCash] Error al crear emisor:', invocash.error);
    }

    const { error } = await supabaseAdmin.from('guarderias').insert({
      nombre,
      nif: nif.trim(),
      direccion,
      cp,
      email,
      telefono,
      otorgamiento_validado: 'pendiente',
      plan: 'pequena',
      activa: false,
      owner_id: userId,
      verifactu_emisor_id: invocash.emisor_id ?? null,
    });

    if (error) {
      console.error('[Supabase] Error insert:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      invocash_ok: invocash.success,
      invocash_emisor_id: invocash.emisor_id ?? null,    
    }, { status: 200 });

  } catch (err) {
    console.error('[API/guarderias] Error interno:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    return new NextResponse('No autorizado', { status: 401 })
  }

  // Leer los datos enviados por el formulario
  const formData = await request.formData()
  const tutorId = formData.get('tutor_id') as string

  // Actualizar el tutor en la ficha del alumno
  const { error } = await supabase
    .from('alumnos')
    .update({ tutor_id: tutorId || null })
    .eq('id', resolvedParams.id)

  if (error) {
    return new NextResponse(`Error al asignar tutor: ${error.message}`, { status: 500 })
  }

  // Redirigir de vuelta a la ficha del alumno para ver los cambios reflejados
  return NextResponse.redirect(
    new URL(`/dashboard/alumnos/${resolvedParams.id}`, request.url),
    { status: 303 }
  )
}
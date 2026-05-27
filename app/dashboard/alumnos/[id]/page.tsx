import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Definimos la interfaz correcta para los componentes de Next.js con params asíncronos
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FichaAlumnoPage({ params }: PageProps) {
  // En las versiones actuales de Next.js, params DEBE ser esperado con await
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Consultamos al alumno. Si da error por tutor_id, lo gestionaremos en el siguiente paso
  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id, nombre, apellidos, fecha_nacimiento, activo, notas, tutor_id')
    .eq('id', resolvedParams.id)
    .single()

  if (!alumno) redirect('/dashboard/alumnos')

  // Traemos los tutores reales utilizando las columnas fiscales correctas que descubrimos en el SQL Editor
  const { data: tutores } = await supabase
    .from('tutores_facturacion')
    .select('id, nombre_razon, nif')
    .order('nombre_razon', { ascending: true })

  const tutorActual = tutores?.find(t => t.id === alumno.tutor_id)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/alumnos" className="text-sm text-indigo-600 hover:underline">
          ← Volver a alumnos
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          {alumno.apellidos}, {alumno.nombre}
        </h2>
        <span className={`text-xs px-2 py-1 rounded-full font-medium mt-2 inline-block ${
          alumno.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {alumno.activo ? 'Activo' : 'Baja'}
        </span>
      </div>

      <div className="space-y-6">
        {/* Datos básicos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Datos del alumno</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha de nacimiento</span>
              <span className="text-gray-800">{alumno.fecha_nacimiento ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Notas internas</span>
              <span className="text-gray-800">{alumno.notas ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Tutor de facturación */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Tutor de facturación</h3>
          {tutorActual ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre</span>
                <span className="text-gray-800">{tutorActual.nombre_razon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">NIF</span>
                <span className="text-gray-800">{tutorActual.nif}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sin tutor asignado</p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <AsignarTutorForm
              alumnoId={alumno.id}
              tutorActualId={alumno.tutor_id}
              tutores={tutores ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function AsignarTutorForm({
  alumnoId,
  tutorActualId,
  tutores,
}: {
  alumnoId: string
  tutorActualId: string | null
  tutores: { id: string; nombre_razon: string; nif: string }[]
}) {
  return (
    <form action={`/api/alumnos/${alumnoId}/tutor`} method="POST">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cambiar tutor asignado
      </label>
      <div className="flex gap-3">
        <select
          name="tutor_id"
          defaultValue={tutorActualId ?? ''}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Sin tutor</option>
          {tutores.map(t => (
            <option key={t.id} value={t.id}>
              {t.nombre_razon} — {t.nif}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          Guardar
        </button>
      </div>
    </form>
  )
}
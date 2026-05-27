import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AlumnosPage() {
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

  const { data: alumnos } = await supabase
    .from('alumnos')
    .select('id, nombre, apellidos, fecha_nacimiento, activo')
    .order('apellidos', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Alumnos</h2>
          <p className="text-gray-500 mt-1">Gestiona los alumnos de tu guardería</p>
        </div>
        <Link
          href="/dashboard/alumnos/nuevo"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nuevo alumno
        </Link>
      </div>

      {alumnos && alumnos.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nombre</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fecha nacimiento</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alumnos.map((alumno) => (                <tr key={alumno.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {alumno.apellidos}, {alumno.nombre}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {alumno.fecha_nacimiento ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      alumno.activo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {alumno.activo ? 'Activo' : 'Baja'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/alumnos/${alumno.id}`}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Ver                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">No hay alumnos todavía</p>
          <p className="text-gray-400 text-sm mt-1">Pulsa "+ Nuevo alumno" para añadir el primero</p>
        </div>
      )}
    </div>
  )
}
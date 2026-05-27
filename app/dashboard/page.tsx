import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
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

  const { data: guarderia } = await supabase
    .from('guarderias')
    .select('nombre, plan, activa')
    .single()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Bienvenido{guarderia?.nombre ? `, ${guarderia.nombre}` : ''}
        </h2>
        <p className="text-gray-500 mt-1">Panel de control de tu guardería</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Plan activo</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1 capitalize">
            {guarderia?.plan ?? '—'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Estado</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {guarderia?.activa ? 'Activa' : 'Inactiva'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Alumnos</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">—</p>
        </div>
      </div>
    </div>
  )
}
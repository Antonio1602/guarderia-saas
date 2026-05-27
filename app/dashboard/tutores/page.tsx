import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TutoresPage() {
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

  const { data: tutores } = await supabase
    .from('tutores_facturacion')
    .select('id, nombre_razon, nif, email_facturacion')
    .order('nombre_razon', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tutores de facturación</h2>
          <p className="text-gray-500 mt-1">Personas a quien se emite la factura mensual</p>
        </div>
        <Link
          href="/dashboard/tutores/nuevo"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nuevo tutor
        </Link>
      </div>

      {tutores && tutores.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nombre / Razón Social</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">NIF</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tutores.map((tutor) => (
                <tr key={tutor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {tutor.nombre_razon}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{tutor.nif}</td>
                  <td className="px-6 py-4 text-gray-500">{tutor.email_facturacion ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/tutores/${tutor.id}`}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">No hay tutores todavía</p>
          <p className="text-gray-400 text-sm mt-1">Pulsa "+ Nuevo tutor" para añadir el primero</p>
        </div>
      )}
    </div>
  )
}
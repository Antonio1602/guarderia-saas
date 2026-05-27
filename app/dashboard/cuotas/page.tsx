import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface CuotaConAlumno {
  id: string
  concepto: string
  importe_base: number
  activo: boolean
  alumnos: {
    nombre: string
    apellidos: string
  } | null
}

export default async function CuotasPage() {
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

  const { data } = await supabase
    .from('cuotas')
    .select(`
      id,
      concepto,
      importe_base,
      activo,
      alumnos (
        nombre,
        apellidos
      )
    `)
    .order('created_at', { ascending: false })

  const cuotas = data as unknown as CuotaConAlumno[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cuotas mensuales</h2>
          <p className="text-gray-500 mt-1">Tarifa mensual asignada a cada alumno</p>
        </div>
        <Link
          href="/dashboard/cuotas/nueva"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nueva cuota
        </Link>
      </div>

      {cuotas && cuotas.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Alumno</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Concepto</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Importe base</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cuotas.map((cuota) => (
                <tr key={cuota.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {cuota.alumnos
                      ? `${cuota.alumnos.apellidos}, ${cuota.alumnos.nombre}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{cuota.concepto}</td>
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {Number(cuota.importe_base).toFixed(2)} €
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      cuota.activo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cuota.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">No hay cuotas todavía</p>
          <p className="text-gray-400 text-sm mt-1">Pulsa "+ Nueva cuota" para añadir la primera</p>
        </div>
      )}
    </div>
  )
}
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function FacturasPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: facturas } = await supabase
    .from('facturas')
    .select('*, alumnos(nombre, apellidos), tutores_facturacion(nombre_razon)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas Emitidas</h1>
          <p className="text-sm text-slate-500">Registros certificados por la AEAT bajo VeriFactu.</p>
        </div>
        <Link href="/dashboard/facturas/nueva" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm">
          + Nueva Factura
        </Link>
      </div>

      {!facturas || facturas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-4">No hay facturas registradas todavía.</p>
          <Link href="/dashboard/facturas/nueva" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Generar primera factura
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nº Serie</th>
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3">Tutor</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3 text-right">Importe</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {facturas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{f.numero_serie}</td>
                    <td className="px-4 py-3">{f.alumnos ? `${f.alumnos.apellidos}, ${f.alumnos.nombre}` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{f.tutores_facturacion?.nombre_razon || '—'}</td>
                    <td className="px-4 py-3">{f.periodo_mes}/{f.periodo_anio}</td>
                    <td className="px-4 py-3 text-right font-semibold">{Number(f.importe_total).toFixed(2)} €</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.estado === 'aceptado' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.url_qr ? (
                        <a href={f.url_qr} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-semibold">Ver QR</a>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
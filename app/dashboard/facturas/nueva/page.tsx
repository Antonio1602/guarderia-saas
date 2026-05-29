'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [alumnoId, setAlumnoId] = useState('')
  const [periodoMes, setPeriodoMes] = useState(new Date().getMonth() + 1)
  const [periodoAnio, setPeriodoAnio] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    const cargarAlumnos = async () => {
      const { data } = await supabase
        .from('alumnos')
        .select('id, nombre, apellidos')
        .eq('activo', true)
        .order('apellidos', { ascending: true })
      if (data) setAlumnos(data)
    }
    cargarAlumnos()
  }, [])

async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('DEBUG:', { alumnoId, periodoMes, periodoAnio }) // <-- AÑADE ESTA LÍNEA AQUÍ
    if (!alumnoId) {
      setError('Por favor, selecciona un alumno válido.')
      return
    }
    setLoading(true)
    setError('')
    setExito(false)

    try {
      const res = await fetch('/api/facturas/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno_id: alumnoId,
          periodo_mes: Number(periodoMes),
          periodo_anio: Number(periodoAnio),
        }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        setError(data.error || 'Error desconocido al procesar la factura')
        return
      }
      setExito(true)
      setTimeout(() => router.push('/dashboard/facturas'), 2500)
    } catch {
      setLoading(false)
      setError('Error de red o de comunicación con el servidor.')
    }
  }

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Generar Factura Legal VeriFactu</h1>

        {exito && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg mb-6">
            ✅ Factura generada y certificada por la AEAT correctamente. Redirigiendo...
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg mb-6">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Alumno de la Guardería</label>
            <select
              value={alumnoId}
              onChange={e => setAlumnoId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un alumno activo...</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.apellidos}, {a.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Período (Mes)</label>
              <select
                value={periodoMes}
                onChange={e => setPeriodoMes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {meses.map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Año Fiscal</label>
              <input
                type="number"
                value={periodoAnio}
                onChange={e => setPeriodoAnio(Number(e.target.value))}
                min={2026}
                max={2035}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || exito}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? 'Certificando en AEAT con InvoCash...' : 'Emitir Factura Oficial'}
          </button>
        </form>
      </div>
    </div>
  )
}
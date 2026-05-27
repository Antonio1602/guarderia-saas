'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface Alumno {
  id: string
  nombre: string
  apellidos: string
}

export default function NuevaCuotaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [form, setForm] = useState({
    alumno_id: '',
    concepto: 'Cuota mensual guardería',
    importe_base: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.alumno_id) {
      setError('Selecciona un alumno')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('cuotas')
      .insert({
        alumno_id: form.alumno_id,
        concepto: form.concepto.trim(),
        importe_base: parseFloat(form.importe_base),
        activo: true,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/cuotas')
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Nueva cuota</h2>
        <p className="text-gray-500 mt-1">Asigna una tarifa mensual a un alumno</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alumno *</label>
          <select
            name="alumno_id"
            value={form.alumno_id}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecciona un alumno</option>
            {alumnos.map(a => (
              <option key={a.id} value={a.id}>
                {a.apellidos}, {a.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
          <input
            name="concepto"
            value={form.concepto}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Importe base (€) *</label>
          <input
            name="importe_base"
            type="number"
            step="0.01"
            min="0"
            value={form.importe_base}
            onChange={handleChange}
            required
            placeholder="250.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">❌ {error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cuota'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/cuotas')}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar          </button>
        </div>
      </form>
    </div>
  )
}
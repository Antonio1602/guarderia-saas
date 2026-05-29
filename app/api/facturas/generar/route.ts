import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VERIFACTU_BASE = 'https://app.verifactuapi.es/api'
const NIF_EMISOR_PRUEBAS = 'A39200019'

async function getToken(): Promise<string> {
  const res = await fetch(`${VERIFACTU_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.VERIFACTU_USER,
      password: process.env.VERIFACTU_PASSWORD,
    }),
  })
  const data = await res.json()
  if (!data.token) throw new Error('No se pudo obtener token de VeriFactu')
  return data.token
}

async function generarNumeroSerie(periodo_anio: number): Promise<string> {
  const { data, error } = await supabase
    .rpc('siguiente_numero_factura', { anio: periodo_anio })

  if (error || !data) throw new Error('Error generando número de serie correlativo')
  return data as string
}

export async function POST(req: NextRequest) {
  try {
    const { alumno_id, periodo_mes, periodo_anio } = await req.json()

    if (!alumno_id || !periodo_mes || !periodo_anio) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    // 1. Obtener alumno y tutor
    const { data: alumno, error: alumnoError } = await supabase
      .from('alumnos')
      .select('*, tutores_facturacion(*)')
      .eq('id', alumno_id)
      .single()

    if (alumnoError || !alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    const tutor = alumno.tutores_facturacion
    if (!tutor) {
      return NextResponse.json({ error: 'El alumno no tiene tutor asignado' }, { status: 400 })
    }

    // 2. Obtener cuotas activas del alumno
    const { data: cuotas, error: cuotasError } = await supabase
      .from('cuotas')
      .select('*')
      .eq('alumno_id', alumno_id)
      .eq('activo', true)

    if (cuotasError || !cuotas || cuotas.length === 0) {
      return NextResponse.json({ error: 'No hay cuotas activas para este alumno' }, { status: 400 })
    }

    // 3. Calcular importes (guarderías exentas de IVA — Art. 20 Ley IVA)
    const importe_base = cuotas.reduce((sum: number, c: any) => sum + Number(c.importe_base), 0)
    const importe_total = importe_base

    // 4. Comprobar si ya existe factura EMITIDA para este periodo
    const { data: facturaExistente } = await supabase
      .from('facturas')
      .select('id')
      .eq('alumno_id', alumno_id)
      .eq('periodo_mes', periodo_mes)
      .eq('periodo_anio', periodo_anio)
      .eq('estado', 'emitida')
      .maybeSingle()

    if (facturaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una factura emitida para este alumno en ese periodo' },
        { status: 409 }
      )
    }

    // 5. Generar número de serie atómico (sin condición de carrera)
    const numeroSerie = await generarNumeroSerie(periodo_anio)
    const fechaHoy = new Date().toISOString().split('T')[0]
    const concepto = cuotas.map((c: any) => c.concepto).join(' + ')

    // 6. Obtener token y enviar a VeriFactu
    const token = await getToken()

    const payload = {
      IDEmisorFactura: NIF_EMISOR_PRUEBAS,
      NumSerieFactura: numeroSerie,
      FechaExpedicionFactura: fechaHoy,
      TipoFactura: 'F1',
      DescripcionOperacion: `Servicio de guardería ${periodo_mes}/${periodo_anio} - ${alumno.nombre} ${alumno.apellidos}`,
      EmitidaPorTercODesti: null,
      Destinatarios: [
        {
          NombreRazon: tutor.nombre_razon,
          NIF: tutor.es_extranjero ? undefined : tutor.nif,
        },
      ],
      Desglose: [
        {
          Impuesto: 1,
          ClaveRegimen: 1,
          CalificacionOperacion: 'E1',
          TipoImpositivo: 0,
          BaseImponibleOImporteNoSujeto: importe_base,
          BaseImponibleACoste: importe_base,
          CuotaRepercutida: 0,
        },
      ],
      CuotaTotal: 0,
      ImporteTotal: importe_total,
      tag: `guarderia-saas-${periodo_anio}-${periodo_mes}`,
    }

    const verifactuRes = await fetch(`${VERIFACTU_BASE}/alta-registro-facturacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const verifactuData = await verifactuRes.json()

    // 7. Si VeriFactu rechaza, devolvemos error SIN guardar en Supabase
    if (!verifactuRes.ok || !verifactuData.success) {
      return NextResponse.json(
        { error: 'VeriFactu rechazó la factura', detalles: verifactuData },
        { status: 422 }
      )
    }

    const item = verifactuData.data?.items?.[0]

    // 8. Guardar factura aprobada en Supabase
    const { data: factura, error: facturaError } = await supabase
      .from('facturas')
      .insert({
        alumno_id,
        tutor_id: tutor.id,
        periodo_mes,
        periodo_anio,
        importe_base,
        importe_total,
        cuota_iva: 0,
        estado: 'emitida',
        numero_serie: numeroSerie,
        fecha_emision: fechaHoy,
        concepto,
        id_invocash: item?.id ?? null,
        url_qr: item?.url_qr ?? null,
        qr_image: item?.qr_image ?? null,
        estado_aeat: item?.estado_aeat ?? null,
      })
      .select()
      .single()

    if (facturaError) {
      console.error('Error insertando en Supabase:', facturaError)
      return NextResponse.json(
        { error: 'Factura enviada a AEAT pero error guardando localmente', detalles: facturaError },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, factura })

  } catch (err: any) {
    console.error('Error crítico:', err)
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 })
  }
}
const VERIFACTU_BASE = 'https://app.verifactuapi.es'

async function getToken(): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`${VERIFACTU_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.VERIFACTU_USER,
        password: process.env.VERIFACTU_PASSWORD,
      }),
      signal: controller.signal,
    })

    const data = await res.json()

    if (!data.success || !data.token) {
      throw new Error(`InvoCash login fallido: ${data.message}`)
    }

    return data.token

  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('InvoCash timeout: el servidor no respondió en 8 segundos')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export async function crearEmisorInvocash(guarderia: {
  nif: string
  nombre: string
  cp: string
}): Promise<{ success: boolean; emisor_id?: number; error?: string }> {
  try {
    const token = await getToken()

    const res = await fetch(`${VERIFACTU_BASE}/api/emisor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nif: guarderia.nif,
        nombre: guarderia.nombre,
        cp: guarderia.cp,
      }),
    })

    const data = await res.json()

    if (res.status === 409) {
      return { success: true, error: 'emisor_ya_existe' }
    }

    if (!data.success) {
      return { success: false, error: data.message }
    }

    const emisor_id = data.data?.items?.[0]?.id
    return { success: true, emisor_id }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function registrarFacturaInvocash(factura: {
  IDEmisorFactura: string
  NumSerieFactura: string
  FechaExpedicionFactura: string
  DescripcionOperacion: string
  Destinatarios: { NombreRazon: string; NIF: string }[]
  baseImponible: number
  cuotaIVA: number
  importeTotal: number
  tipoIVA: number
  refExterna?: string
}): Promise<{ success: boolean; id?: number; url_qr?: string; qr_image?: string; error?: string }> {
  try {
    const token = await getToken()

    const body = {
      IDEmisorFactura: factura.IDEmisorFactura,
      NumSerieFactura: factura.NumSerieFactura,
      FechaExpedicionFactura: factura.FechaExpedicionFactura,
      RefExterna: factura.refExterna ?? null,
      TipoFactura: 'F1',
      DescripcionOperacion: factura.DescripcionOperacion,
      EmitidaPorTercODesti: null,
      Destinatarios: factura.Destinatarios,
      Desglose: [
        {
          Impuesto: 1,
          ClaveRegimen: 1,
          CalificacionOperacion: 'E1',
          TipoImpositivo: factura.tipoIVA,
          BaseImponibleOImporteNoSujeto: factura.baseImponible,
          BaseImponibleACoste: factura.baseImponible,
          CuotaRepercutida: factura.cuotaIVA,
        },
      ],
      CuotaTotal: factura.cuotaIVA,
      ImporteTotal: factura.importeTotal,
      tag: 'guarderia-saas',
    }

    const res = await fetch(`${VERIFACTU_BASE}/api/alta-registro-facturacion`, {
      method: 'POST',
      headers
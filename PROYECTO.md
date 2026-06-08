# PROYECTO: GuarderiaSaaS

**Última actualización:** 08/06/2026  
**Repositorio:** Antonio1602/guarderia-saas  
**Stack:** Next.js 16.2.6 + TypeScript + Tailwind + Supabase + Vercel + InvoCash/VeriFactuAPI

---

## VARIABLES DE ENTORNO (solo nombres)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- VERIFACTU_USER
- VERIFACTU_PASSWORD
- VERIFACTU_EMISOR_NIF

---

## ESTADO DE FASES

| Fase | Estado |
|------|--------|
| Fase 1 — Cuentas y servicios | ✅ VALIDADA |
| Fase 2 — Base de datos + RLS | ✅ VALIDADA |
| Fase 3 — Entorno de desarrollo | ✅ VALIDADA |
| Fase 4 — Onboarding | ✅ VALIDADA |
| Fase 5 — Alumnos, tutores y cuotas | ✅ VALIDADA |
| Fase 6 — Facturación VeriFactu | ✅ VALIDADA |
| Fase 7 — Gestión facturas + PDF legal | ⬜ PENDIENTE |
| Fase 8 — Modelo 233 | ⬜ PENDIENTE |
| Fase 9 — Exportación y legal | ⬜ PENDIENTE |
| Fase 10 — Soporte interno | ⬜ PENDIENTE |

---

## ESTADO VALIDADO EN AUDITORÍA (08/06/2026)
- ✅ Factura generada correctamente end-to-end
- ✅ Envío a InvoCash correcto
- ✅ Recepción de QR correcta y almacenada
- ✅ Guardado en Supabase correcto
- ✅ Restricción UNIQUE(alumno_id, periodo_mes, periodo_anio) funcionando
- ✅ Estado 'aceptado' funcionando correctamente
- ✅ Badge verde en listado de facturas corregido
- ✅ RLS funcionando para usuario único validado
- ✅ Protección de rutas funcionando

---

## FUNCIONALIDADES POR ESTADO

### VALIDADAS (probadas end-to-end)
- Registro y login de guarderías
- Dashboard con navegación
- Alta, edición y listado de alumnos
- Alta y listado de tutores fiscales
- Alta y listado de cuotas por alumno
- Generación de facturas legales VeriFactu
- Envío automático a AEAT via InvoCash
- Almacenamiento de QR legal
- Listado de facturas con estado y QR
- Numeración correlativa atómica (secuencia PostgreSQL)
- Protección anti-duplicados por UNIQUE

### IMPLEMENTADAS PERO NO VALIDADAS
- Cola de reintentos (tabla cola_envio — sin lógica activa)
- Log de facturas (tabla factura_log — estructura creada, sin uso activo)
- RLS multi-tenant (validado con 1 guardería, no probado con múltiples)

### PENDIENTES
- PDF de factura con QR visible y texto legal AEAT
- Envío de factura por email al tutor
- Modelo 233
- Remesas SEPA Norma 19
- Pasarela de cobro
- Contrato RGPD Art. 28 en onboarding
- Facturación masiva por periodo
- Extras dinámicos (comedor, permanencia, excursiones)
- Co-facturación / Split Billing (padre 50% / madre 50%)
- Portal del emisor
- Descuentos por hermanos

---

## PENDIENTES DE VERIFICACIÓN
- ⚠️ Numeración de facturas es global — debe ser por guardería para multi-tenant
- ⚠️ estado_aeat siempre queda null — falta sincronización posterior con AEAT
- ⚠️ NIF emisor fijo en variable de entorno — en producción debe leerse de tabla guarderias
- ⚠️ Facturas rectificativas no implementadas
- ⚠️ Cola de reintentos sin lógica activa
- ⚠️ Pruebas multi-guardería no realizadas
- ⚠️ Validación previa con /api/alta-registro-facturacion/validar no implementada
- ⚠️ Producción real con AEAT no probada

---

## DEUDA TÉCNICA

| Prioridad | Descripción |
|-----------|-------------|
| 🔴 Alta | Numeración global → migrar a contadores_serie por guarderia_id |
| 🔴 Alta | NIF emisor fijo → leer dinámicamente de guarderias.nif |
| 🔴 Alta | estado_aeat null → implementar sincronización AEAT |
| 🟡 Media | Validar alumno pertenece a guardería autenticada en endpoint SERVICE_ROLE |
| 🟡 Media | Usar endpoint de validación InvoCash antes de enviar |
| 🟡 Media | Políticas RLS duplicadas en alumnos, cola_envio, factura_log |
| 🟡 Media | siguiente_numero_serie y contadores_serie sin uso activo |
| 🟢 Baja | cola_envio sin lógica de reintentos |

---

## DECISIONES TÉCNICAS

| Decisión | Motivo |
|----------|--------|
| InvoCash como intermediario VeriFactu | Gestiona firma, encadenamiento y hash |
| Estado 'aceptado' en facturas | Check constraint de BD solo permite valores predefinidos |
| @supabase/ssr sobre auth-helpers-nextjs | auth-helpers desaparecido/deprecado |
| Server Components para listados | Hereda sesión correctamente |
| Client Component para formulario nueva factura | Necesita estado reactivo |
| createBrowserClient en formulario | Hereda cookies de sesión para RLS |

---

## PROBLEMAS RESUELTOS

| Problema | Solución |
|----------|----------|
| CalificacionOperacion rechazado | Valor correcto es entero 1, no string 'E1' (confirmado por InvoCash) |
| Módulo auth-helpers-nextjs no encontrado | Reemplazado por @supabase/ssr |
| Badge de estado en rojo | Comparaba con 'emitida', BD usa 'aceptado' |
| RLS bloqueaba listado de alumnos | createBrowserClient hereda sesión correctamente |
| guarderia_id NOT NULL en insert | Añadir guarderia_id al insert de prueba |
| Numeración con condición de carrera | Secuencia PostgreSQL nextval() — pendiente multi-tenant |

---

## API INVOCASH VERIFACTU
- **URL base:** https://app.verifactuapi.es/api
- **Autenticación:** POST /api/login → Bearer token
- **Alta factura:** POST /api/alta-registro-facturacion
- **Validar factura:** POST /api/alta-registro-facturacion/validar
- **Anular factura:** POST /api/anulacion-registro-facturacion
- **Consultar factura:** GET /api/alta-registro-facturacion/{id}
- **Consultar envíos:** GET /api/envios-aeat
- **NIF pruebas:** A39200019 (EMPRESA TEST)
- **NIF desarrollo:** A58818501 (modo Test — otorgamiento pendiente validar)
- **Soporte:** support@invocash.es

---

## NOTAS LEGALES
- Guarderías exentas de IVA — Art. 20 Ley IVA
- VeriFactu obligatorio desde 28/07/2025 — Real Decreto 1007/2023
- RGPD Art. 28 — Contrato Encargado de Tratamiento pendiente
- Datos de menores protegidos por RLS
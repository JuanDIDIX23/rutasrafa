export const LOCALE = 'es-CO'

export const MONEDAS: Record<string, string> = {
  COP: 'Peso colombiano',
  USD: 'Dólar estadounidense',
  MXN: 'Peso mexicano',
  GTQ: 'Quetzal guatemalteco',
  HNL: 'Lempira hondureño',
  SVC: 'Colón salvadoreño',
  PEN: 'Sol peruano',
  EUR: 'Euro',
  CAD: 'Dólar canadiense',
}

/** Tasas aproximadas (unidades por 1 USD). Se usan solo si no hay internet para traer las del día. */
export const TASAS_APROX: Record<string, number> = {
  USD: 1,
  MXN: 18.5,
  GTQ: 7.7,
  HNL: 26.2,
  SVC: 8.75,
  COP: 3950,
  PEN: 3.6,
  EUR: 0.88,
  CAD: 1.38,
}

const formatos = new Map<string, Intl.NumberFormat>()

export function decimales(moneda: string) {
  return ['COP', 'CLP', 'JPY', 'KRW', 'PYG'].includes(moneda) ? 0 : 2
}

export function formatear(n: number, moneda: string) {
  let f = formatos.get(moneda)
  if (!f) {
    try {
      f = new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: moneda,
        minimumFractionDigits: decimales(moneda),
        maximumFractionDigits: decimales(moneda),
      })
    } catch {
      f = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    formatos.set(moneda, f)
  }
  return f.format(n)
}

/** Versión corta para tablas estrechas: $ 1,38 M · $ 327 mil (solo monedas sin centavos). */
export function formatearCorto(n: number, moneda: string) {
  const a = Math.abs(n)
  if (decimales(moneda) !== 0 || a < 10000) return formatear(n, moneda)
  const simbolo = formatear(0, moneda).replace(/[\d\s.,]/g, '')
  if (a >= 1e6) return `${n < 0 ? '−' : ''}${simbolo} ${(a / 1e6).toLocaleString(LOCALE, { maximumFractionDigits: 2 })} M`
  return `${n < 0 ? '−' : ''}${simbolo} ${Math.round(a / 1000).toLocaleString(LOCALE)} mil`
}

export function convertir(n: number, de: string, a: string, tasas: Record<string, number>) {
  if (de === a) return n
  const t1 = tasas[de]
  const t2 = tasas[a]
  if (!t1 || !t2) return n
  return (n / t1) * t2
}

export const redondear = (n: number) => Math.round(n * 100) / 100

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function dayKey(d: Date | string) {
  const x = typeof d === 'string' ? new Date(d) : d
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export const hoyKey = () => dayKey(new Date())

export function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
}

export function fechaLarga(d: Date) {
  return d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })
}

/** Fecha (YYYY-MM-DD) de hace n días. */
export function haceDias(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dayKey(d)
}

export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function normalizar(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Convierte lo que se escribe en un campo numérico ("12.5", "12,50") en número. */
export function numero(s: string) {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Valor de dinero escrito por el usuario. En pesos (sin centavos) ignora puntos y comas: "12.600" = 12600. */
export function monto(s: string, moneda: string) {
  if (decimales(moneda) === 0) return Number(s.replace(/[^\d]/g, '')) || 0
  return numero(s)
}

/** Atributos para un campo de dinero según la moneda. */
export function campoMoneda(moneda: string) {
  const sinCentavos = decimales(moneda) === 0
  return { type: 'text', inputMode: sinCentavos ? 'numeric' : 'decimal', placeholder: sinCentavos ? '0' : '0.00' } as const
}

/** Botones de valor rápido para abonos. */
export function montosRapidos(moneda: string) {
  return decimales(moneda) === 0 ? [5000, 10000, 20000, 50000] : [5, 10, 20]
}

export const ROLES = { admin: 'Acceso completo', vendedor: 'Solo su ruta' } as const

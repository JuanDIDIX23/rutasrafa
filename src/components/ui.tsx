import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cop } from '../utils'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-stone-200/80 bg-white ${className}`}>{children}</div>
}

type Variante = 'primario' | 'suave' | 'fantasma' | 'ambar'

export function Boton({ variante = 'primario', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  const estilos: Record<Variante, string> = {
    primario: 'bg-brand-800 text-white hover:bg-brand-900 disabled:bg-stone-300',
    suave: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
    fantasma: 'bg-transparent text-stone-700 hover:bg-stone-100',
    ambar: 'bg-amber-500 text-stone-900 hover:bg-amber-400 disabled:bg-stone-300',
  }
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold transition active:scale-[.98] disabled:cursor-not-allowed ${estilos[variante]} ${className}`}
    />
  )
}

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-stone-600">{etiqueta}</span>
      {children}
    </label>
  )
}

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-[15px] outline-none placeholder:text-stone-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${props.className ?? ''}`}
    />
  )
}

export function Segmentado<T extends string>({
  valor,
  onCambio,
  opciones,
}: {
  valor: T
  onCambio: (v: T) => void
  opciones: { valor: T; etiqueta: string }[]
}) {
  return (
    <div className="flex rounded-xl bg-stone-200/70 p-1">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onCambio(o.valor)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            valor === o.valor ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  )
}

export function Chips<T extends string>({
  valor,
  onCambio,
  opciones,
}: {
  valor: T
  onCambio: (v: T) => void
  opciones: { valor: T; etiqueta: string }[]
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onCambio(o.valor)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            valor === o.valor ? 'border-brand-800 bg-brand-800 text-white' : 'border-stone-300 bg-white text-stone-600'
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  )
}

export function Hoja({
  abierta,
  onCerrar,
  titulo,
  subtitulo,
  children,
  pie,
}: {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  subtitulo?: string
  children: ReactNode
  pie?: ReactNode
}) {
  useEffect(() => {
    if (!abierta) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', esc)
    }
  }, [abierta, onCerrar])

  if (!abierta) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="animar-aparecer absolute inset-0 bg-stone-900/40" onClick={onCerrar} />
      <div className="animar-subir relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-crema shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-sm text-stone-500">{subtitulo}</p>}
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="-mr-2 -mt-1 rounded-full p-2 text-stone-500 hover:bg-stone-200">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {pie && <div className="border-t border-stone-200 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:rounded-b-3xl">{pie}</div>}
      </div>
    </div>
  )
}

export function Dato({ etiqueta, valor, tono = 'normal', detalle }: { etiqueta: string; valor: number; tono?: 'normal' | 'verde' | 'ambar' | 'rojo'; detalle?: string }) {
  const colores = { normal: 'text-stone-900', verde: 'text-brand-700', ambar: 'text-amber-600', rojo: 'text-rose-600' }
  return (
    <Card className="p-4">
      <p className="text-[13px] font-medium text-stone-500">{etiqueta}</p>
      <p className={`mt-1 text-xl font-bold tracking-tight ${colores[tono]}`}>{cop(valor)}</p>
      {detalle && <p className="mt-0.5 text-xs text-stone-400">{detalle}</p>}
    </Card>
  )
}

export function Vacio({ texto }: { texto: string }) {
  return <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">{texto}</p>
}

export function Titulo({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center justify-between">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">{children}</h3>
      {accion}
    </div>
  )
}

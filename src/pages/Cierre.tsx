import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { Boton, Card, Titulo, Vacio } from '../components/ui'
import { cop, dayKey, fechaLarga, hora } from '../utils'

export default function Cierre({ rutaId }: { rutaId: string }) {
  const { datos, cerrarRuta } = useStore()
  const ruta = datos.rutas.find((r) => r.id === rutaId)!
  const [desfase, setDesfase] = useState(0)

  const fecha = new Date()
  fecha.setDate(fecha.getDate() - desfase)
  const dia = dayKey(fecha)

  const r = useMemo(() => {
    const enDia = <T extends { fecha: string; rutaId: string | null }>(l: T[]) => l.filter((x) => x.rutaId === rutaId && dayKey(x.fecha) === dia)
    const ventas = enDia(datos.ventas)
    const abonos = enDia(datos.abonos)
    const gastos = enDia(datos.gastos)
    const contado = ventas.filter((v) => v.tipo === 'contado').reduce((s, v) => s + v.total, 0)
    const fiado = ventas.filter((v) => v.tipo === 'fiado').reduce((s, v) => s + v.total, 0)
    const recibido = abonos.reduce((s, a) => s + a.monto, 0)
    const gastado = gastos.reduce((s, g) => s + g.monto, 0)
    const visitados = new Set([...ventas, ...abonos].map((x) => x.clienteId)).size
    const porProducto = new Map<string, number>()
    ventas.forEach((v) => v.items.forEach((i) => porProducto.set(i.productoId, (porProducto.get(i.productoId) ?? 0) + i.cantidad)))
    const productos = [...porProducto.entries()]
      .map(([id, cant]) => ({ nombre: datos.productos.find((p) => p.id === id)?.nombre ?? '—', cant }))
      .sort((a, b) => b.cant - a.cant)
    const cierre = datos.cierres.find((c) => c.rutaId === rutaId && c.dia === dia)
    return { contado, fiado, recibido, gastado, efectivo: contado + recibido - gastado, visitados, productos, cierre, hayMovimiento: ventas.length + abonos.length + gastos.length > 0 }
  }, [datos, rutaId, dia])

  const totalClientes = datos.clientes.filter((c) => c.rutaId === rutaId).length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setDesfase((d) => d + 1)} aria-label="Día anterior" className="rounded-full p-2 hover:bg-stone-200">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold first-letter:uppercase">{desfase === 0 ? 'Hoy' : fechaLarga(fecha)}</p>
          <p className="text-xs text-stone-500">{ruta.nombre} · {r.visitados} de {totalClientes} clientes atendidos</p>
        </div>
        <button onClick={() => setDesfase((d) => Math.max(0, d - 1))} disabled={desfase === 0} aria-label="Día siguiente" className="rounded-full p-2 hover:bg-stone-200 disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-brand-800 px-5 py-5 text-white">
          <p className="text-sm text-brand-100">Efectivo a entregar</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight">{cop(r.efectivo)}</p>
          <p className="mt-1 text-xs text-brand-200">Contado + abonos − gastos</p>
        </div>
        <dl className="divide-y divide-stone-100 text-[15px]">
          {[
            ['Ventas de contado', r.contado, ''],
            ['Abonos recibidos', r.recibido, ''],
            ['Gastos de la ruta', r.gastado, 'text-rose-600'],
            ['Quedó fiado', r.fiado, 'text-amber-600'],
          ].map(([etq, val, cls]) => (
            <div key={etq as string} className="flex justify-between px-5 py-3">
              <dt className="text-stone-600">{etq}</dt>
              <dd className={`font-semibold ${cls}`}>{etq === 'Gastos de la ruta' && (val as number) > 0 ? '− ' : ''}{cop(val as number)}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Titulo>Productos vendidos</Titulo>
      {r.productos.length === 0 ? (
        <Vacio texto="No hay ventas registradas este día." />
      ) : (
        <Card>
          <ul className="divide-y divide-stone-100">
            {r.productos.map((p) => (
              <li key={p.nombre} className="flex justify-between px-5 py-2.5 text-[15px]">
                <span>{p.nombre}</span>
                <span className="font-semibold tabular-nums">× {p.cant}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6">
        {r.cierre ? (
          <div className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
            <CheckCircle2 size={18} /> Ruta cerrada a las {hora(r.cierre.fecha)}
          </div>
        ) : desfase === 0 ? (
          <Boton className="w-full" disabled={!r.hayMovimiento} onClick={() => cerrarRuta(rutaId, r.efectivo)}>
            Cerrar ruta de hoy
          </Boton>
        ) : (
          <p className="text-center text-sm text-stone-500">Ese día no se cerró la ruta.</p>
        )}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronRight, Info } from 'lucide-react'
import { useStore } from '../store'
import DetalleHoja, { desdePeriodo, type Periodo, type TipoDetalle } from '../components/DetalleHoja'
import { Card, Dato, Segmentado, Titulo } from '../components/ui'
import { dayKey } from '../utils'

export default function Inicio({ irA }: { irA: (pestana: string, rutaId?: string) => void }) {
  const { datos, saldo, dinero } = useStore()
  const [periodo, setPeriodo] = useState<Periodo>('30')
  const [detalle, setDetalle] = useState<TipoDetalle | null>(null)
  const [ayuda, setAyuda] = useState(false)

  const r = useMemo(() => {
    const desde = desdePeriodo(periodo)
    const en = <T extends { fecha: string }>(l: T[]) => l.filter((x) => dayKey(x.fecha) >= desde)
    const ventas = en(datos.ventas)
    const abonos = en(datos.abonos)
    const gastos = en(datos.gastos)
    const suma = (l: { total?: number; monto?: number }[]) => l.reduce((s, x) => s + (x.total ?? x.monto ?? 0), 0)
    const contado = suma(ventas.filter((v) => v.tipo === 'contado'))
    const fiado = suma(ventas.filter((v) => v.tipo === 'fiado'))
    const recibido = suma(abonos)

    const porRuta = datos.rutas.map((ruta) => {
      const v = ventas.filter((x) => x.rutaId === ruta.id)
      return {
        ruta,
        vendido: suma(v),
        recaudado: suma(v.filter((x) => x.tipo === 'contado')) + suma(abonos.filter((a) => a.rutaId === ruta.id)),
        cartera: datos.clientes.filter((c) => c.rutaId === ruta.id).reduce((s, c) => s + saldo(c.id), 0),
      }
    })

    const unidades = new Map<string, number>()
    const ingresos = new Map<string, number>()
    ventas.forEach((v) =>
      v.items.forEach((i) => {
        unidades.set(i.nombre, (unidades.get(i.nombre) ?? 0) + i.cantidad)
        ingresos.set(i.nombre, (ingresos.get(i.nombre) ?? 0) + i.cantidad * i.precio)
      }),
    )
    const top = [...ingresos.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nombre, valor]) => ({ nombre, valor, und: unidades.get(nombre) ?? 0 }))

    return { vendido: contado + fiado, contado, recaudado: contado + recibido, recibido, fiado, gastos: suma(gastos), porRuta, top, nVentas: ventas.length, nGastos: gastos.length }
  }, [datos, periodo, saldo])

  const cartera = datos.clientes.reduce((s, c) => s + saldo(c.id), 0)
  const deudores = datos.clientes.filter((c) => saldo(c.id) > 0).length
  const bajos = datos.productos.filter((p) => p.stock <= p.minimo).sort((a, b) => a.stock - b.stock)
  const maxTop = Math.max(1, ...r.top.map((t) => t.valor))
  const neto = r.recaudado - r.gastos

  return (
    <div>
      <Segmentado
        valor={periodo}
        onCambio={setPeriodo}
        opciones={[
          { valor: 'hoy', etiqueta: 'Hoy' },
          { valor: '7', etiqueta: '7 días' },
          { valor: '30', etiqueta: '30 días' },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Dato etiqueta="Vendido" valor={r.vendido} detalle={`${r.nVentas} ventas`} onClick={() => setDetalle('vendido')} />
        <Dato etiqueta="Recaudado" valor={r.recaudado} tono="verde" detalle="Contado + abonos" onClick={() => setDetalle('recaudado')} />
        <Dato etiqueta="Fiado nuevo" valor={r.fiado} tono="ambar" detalle="Vendido sin pagar" onClick={() => setDetalle('fiado')} />
        <Dato etiqueta="Gastos" valor={r.gastos} tono="rojo" detalle={`${r.nGastos} registros`} onClick={() => setDetalle('gastos')} />
      </div>

      <Card className="mt-3 grid grid-cols-2 divide-x divide-stone-100">
        <div className="p-4">
          <p className="text-[13px] font-medium text-stone-500">Recaudado − gastos</p>
          <p className={`mt-1 text-xl font-bold ${neto < 0 ? 'text-rose-600' : 'text-stone-900'}`}>{dinero(neto)}</p>
          <p className="text-xs text-stone-400">Dinero que quedó</p>
        </div>
        <button onClick={() => irA('cartera')} className="p-4 text-left">
          <p className="flex items-center justify-between text-[13px] font-medium text-stone-500">Cartera pendiente <ChevronRight size={15} className="text-stone-300" /></p>
          <p className="mt-1 text-xl font-bold text-amber-600">{dinero(cartera)}</p>
          <p className="text-xs text-stone-400">{deudores} clientes deben hoy</p>
        </button>
      </Card>

      <Titulo
        accion={
          <button onClick={() => setAyuda((a) => !a)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            <Info size={15} /> {ayuda ? 'Ocultar' : 'Cómo leerla'}
          </button>
        }
      >
        Por ruta
      </Titulo>
      {ayuda && (
        <div className="mb-3 space-y-1.5 rounded-2xl bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
          <p><b>Vendido:</b> todo lo que se vendió en la ruta en el periodo, de contado y fiado.</p>
          <p><b>Recaudado:</b> el dinero que de verdad entró: ventas de contado más abonos de deudas.</p>
          <p><b>Cartera:</b> lo que deben hoy los clientes de esa ruta, sin importar cuándo fiaron.</p>
          <p>Toque una ruta para ver sus clientes.</p>
        </div>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500">
              <th className="px-4 py-3 font-medium">Ruta</th>
              <th className="px-2 py-3 text-right font-medium">Vendido</th>
              <th className="px-2 py-3 text-right font-medium">Recaudado</th>
              <th className="px-4 py-3 text-right font-medium">Cartera</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {r.porRuta.map((x) => (
              <tr key={x.ruta.id} onClick={() => irA('ruta', x.ruta.id)} className="cursor-pointer hover:bg-stone-50">
                <td className="max-w-24 truncate px-4 py-3 font-semibold">{x.ruta.nombre.replace(/^Ruta /, '')}</td>
                <td className="px-2 py-3 text-right tabular-nums">{dinero(x.vendido)}</td>
                <td className="px-2 py-3 text-right tabular-nums text-brand-700">{dinero(x.recaudado)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-700">{dinero(x.cartera)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Titulo>Productos que más venden</Titulo>
      <Card className="space-y-3 p-4">
        {r.top.length === 0 && <p className="py-4 text-center text-sm text-stone-500">Sin ventas en este periodo.</p>}
        {r.top.map((t) => (
          <div key={t.nombre}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="truncate">{t.nombre} <span className="text-stone-400">· {t.und} und.</span></span>
              <span className="shrink-0 font-semibold tabular-nums">{dinero(t.valor)}</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${(t.valor / maxTop) * 100}%` }} />
            </div>
          </div>
        ))}
      </Card>

      {bajos.length > 0 && (
        <>
          <Titulo accion={<button onClick={() => irA('inventario')} className="text-sm font-semibold text-brand-700">Ver inventario</button>}>Por agotarse</Titulo>
          <Card>
            <ul className="divide-y divide-stone-100">
              {bajos.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3 text-[15px]">
                  <span className="inline-flex items-center gap-2"><AlertTriangle size={15} className="text-amber-500" />{p.nombre}</span>
                  <span className="font-semibold text-amber-700">{p.stock} und.</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <DetalleHoja tipo={detalle} periodo={periodo} onCerrar={() => setDetalle(null)} />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useStore } from '../store'
import { Card, Dato, Segmentado, Titulo } from '../components/ui'
import { cop, dayKey, haceDias, hoyKey } from '../utils'

type Periodo = 'hoy' | '7' | '30'

export default function Inicio({ irA }: { irA: (pestana: string) => void }) {
  const { datos, saldo } = useStore()
  const [periodo, setPeriodo] = useState<Periodo>('30')

  const r = useMemo(() => {
    const desde = periodo === 'hoy' ? hoyKey() : haceDias(Number(periodo) - 1)
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
        gastos: suma(gastos.filter((g) => g.rutaId === ruta.id)),
        cartera: datos.clientes.filter((c) => c.rutaId === ruta.id).reduce((s, c) => s + saldo(c.id), 0),
      }
    })

    const unidades = new Map<string, number>()
    const ingresos = new Map<string, number>()
    ventas.forEach((v) =>
      v.items.forEach((i) => {
        unidades.set(i.productoId, (unidades.get(i.productoId) ?? 0) + i.cantidad)
        ingresos.set(i.productoId, (ingresos.get(i.productoId) ?? 0) + i.cantidad * i.precio)
      }),
    )
    const top = [...ingresos.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, valor]) => ({ nombre: datos.productos.find((p) => p.id === id)?.nombre ?? '—', valor, und: unidades.get(id) ?? 0 }))

    return { vendido: contado + fiado, recaudado: contado + recibido, fiado, gastos: suma(gastos), porRuta, top }
  }, [datos, periodo, saldo])

  const cartera = datos.clientes.reduce((s, c) => s + saldo(c.id), 0)
  const deudores = datos.clientes.filter((c) => saldo(c.id) > 0).length
  const bajos = datos.productos.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock)
  const maxTop = Math.max(1, ...r.top.map((t) => t.valor))
  const utilidad = r.recaudado - r.gastos

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
        <Dato etiqueta="Vendido" valor={r.vendido} />
        <Dato etiqueta="Recaudado" valor={r.recaudado} tono="verde" detalle="Contado + abonos" />
        <Dato etiqueta="Fiado nuevo" valor={r.fiado} tono="ambar" />
        <Dato etiqueta="Gastos" valor={r.gastos} tono="rojo" />
      </div>

      <Card className="mt-3 flex items-center justify-between p-4">
        <div>
          <p className="text-[13px] font-medium text-stone-500">Recaudado menos gastos</p>
          <p className={`mt-1 text-xl font-bold ${utilidad < 0 ? 'text-rose-600' : 'text-stone-900'}`}>{cop(utilidad)}</p>
        </div>
        <button onClick={() => irA('cartera')} className="text-right">
          <p className="text-[13px] font-medium text-stone-500">Cartera pendiente</p>
          <p className="mt-1 text-xl font-bold text-amber-600">{cop(cartera)}</p>
          <p className="text-xs text-stone-400">{deudores} clientes</p>
        </button>
      </Card>

      <Titulo>Por ruta</Titulo>
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
              <tr key={x.ruta.id}>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{x.ruta.nombre.replace('Ruta ', '')}</td>
                <td className="px-2 py-3 text-right tabular-nums">{cop(x.vendido)}</td>
                <td className="px-2 py-3 text-right tabular-nums text-brand-700">{cop(x.recaudado)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-700">{cop(x.cartera)}</td>
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
              <span className="shrink-0 font-semibold tabular-nums">{cop(t.valor)}</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${(t.valor / maxTop) * 100}%` }} />
            </div>
          </div>
        ))}
      </Card>

      {bajos.length > 0 && (
        <>
          <Titulo accion={<button onClick={() => irA('inventario')} className="text-sm font-semibold text-brand-700">Ver inventario</button>}>
            Por agotarse
          </Titulo>
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
    </div>
  )
}

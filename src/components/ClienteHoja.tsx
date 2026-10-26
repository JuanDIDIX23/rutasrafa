import { useMemo, useState } from 'react'
import { MapPin, Minus, Phone, Plus, Search } from 'lucide-react'
import { useStore } from '../store'
import type { TipoVenta } from '../types'
import { cop, fechaCorta, hora, normalizar } from '../utils'
import { Boton, Entrada, Hoja, Segmentado, Vacio } from './ui'

type Pestana = 'venta' | 'abono' | 'historial'

export default function ClienteHoja({ clienteId, onCerrar, inicial = 'venta' }: { clienteId: string | null; onCerrar: () => void; inicial?: Pestana }) {
  if (!clienteId) return null
  return <Contenido key={clienteId} clienteId={clienteId} onCerrar={onCerrar} inicial={inicial} />
}

function Contenido({ clienteId, onCerrar, inicial }: { clienteId: string; onCerrar: () => void; inicial: Pestana }) {
  const { datos, saldo, registrarVenta, registrarAbono } = useStore()
  const cliente = datos.clientes.find((c) => c.id === clienteId)!
  const deuda = saldo(clienteId)

  const [pestana, setPestana] = useState<Pestana>(inicial)
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState<Record<string, number>>({})
  const [tipo, setTipo] = useState<TipoVenta>('contado')
  const [abono, setAbono] = useState('')

  const productos = useMemo(() => {
    const q = normalizar(busqueda)
    return datos.productos.filter((p) => !q || normalizar(p.nombre).includes(q) || normalizar(p.categoria).includes(q))
  }, [datos.productos, busqueda])

  const items = Object.entries(carrito)
    .filter(([, c]) => c > 0)
    .map(([productoId, cantidad]) => ({ productoId, cantidad, precio: datos.productos.find((p) => p.id === productoId)!.precio }))
  const total = items.reduce((s, it) => s + it.cantidad * it.precio, 0)
  const unidades = items.reduce((s, it) => s + it.cantidad, 0)

  const cambiar = (id: string, delta: number, max: number) =>
    setCarrito((c) => ({ ...c, [id]: Math.min(max, Math.max(0, (c[id] ?? 0) + delta)) }))

  const historial = useMemo(() => {
    const v = datos.ventas.filter((x) => x.clienteId === clienteId).map((x) => ({ id: x.id, fecha: x.fecha, tipo: x.tipo as string, monto: x.total, detalle: `${x.items.reduce((s, i) => s + i.cantidad, 0)} productos` }))
    const a = datos.abonos.filter((x) => x.clienteId === clienteId).map((x) => ({ id: x.id, fecha: x.fecha, tipo: 'abono', monto: x.monto, detalle: 'Pago a la cuenta' }))
    return [...v, ...a].sort((x, y) => y.fecha.localeCompare(x.fecha)).slice(0, 25)
  }, [datos.ventas, datos.abonos, clienteId])

  const montoAbono = Number(abono) || 0

  const guardarVenta = () => {
    registrarVenta(clienteId, items, tipo)
    onCerrar()
  }
  const guardarAbono = () => {
    registrarAbono(clienteId, montoAbono)
    onCerrar()
  }

  const pie =
    pestana === 'venta' ? (
      <div className="space-y-3">
        <Segmentado
          valor={tipo}
          onCambio={setTipo}
          opciones={[
            { valor: 'contado', etiqueta: 'De contado' },
            { valor: 'fiado', etiqueta: 'Fiado' },
          ]}
        />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-stone-500">{unidades} {unidades === 1 ? 'unidad' : 'unidades'}</p>
            <p className="text-xl font-bold">{cop(total)}</p>
          </div>
          <Boton onClick={guardarVenta} disabled={total === 0} variante={tipo === 'fiado' ? 'ambar' : 'primario'} className="min-w-40">
            {tipo === 'fiado' ? 'Registrar fiado' : 'Registrar venta'}
          </Boton>
        </div>
      </div>
    ) : pestana === 'abono' ? (
      <Boton onClick={guardarAbono} disabled={montoAbono <= 0 || montoAbono > deuda} className="w-full">
        Registrar abono de {cop(montoAbono)}
      </Boton>
    ) : undefined

  return (
    <Hoja abierta onCerrar={onCerrar} titulo={cliente.nombre} pie={pie}>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
        <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{cliente.direccion}</span>
        <a href={`tel:${cliente.telefono.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 text-brand-700"><Phone size={14} />{cliente.telefono}</a>
      </div>

      <div className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-3 ${deuda > 0 ? 'bg-amber-50 text-amber-900' : 'bg-brand-50 text-brand-800'}`}>
        <span className="text-sm font-medium">{deuda > 0 ? 'Debe' : 'Está al día'}</span>
        <span className="text-lg font-bold">{cop(deuda)}</span>
      </div>

      <Segmentado
        valor={pestana}
        onCambio={setPestana}
        opciones={[
          { valor: 'venta', etiqueta: 'Venta' },
          { valor: 'abono', etiqueta: 'Abono' },
          { valor: 'historial', etiqueta: 'Historial' },
        ]}
      />

      {pestana === 'venta' && (
        <div className="mt-4">
          <div className="relative mb-3">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <Entrada value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto" className="pl-10" />
          </div>
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
            {productos.map((p) => {
              const cant = carrito[p.id] ?? 0
              return (
                <li key={p.id} className={`flex items-center gap-3 px-4 py-3 ${cant > 0 ? 'bg-brand-50/60' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{p.nombre}</p>
                    <p className="text-xs text-stone-500">
                      {cop(p.precio)} · {p.stock === 0 ? <span className="text-rose-600">Agotado</span> : `quedan ${p.stock}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {cant > 0 && (
                      <>
                        <button onClick={() => cambiar(p.id, -1, p.stock)} aria-label="Quitar uno" className="grid size-9 place-items-center rounded-full bg-stone-100 text-stone-700">
                          <Minus size={16} />
                        </button>
                        <span className="w-7 text-center font-bold">{cant}</span>
                      </>
                    )}
                    <button
                      onClick={() => cambiar(p.id, 1, p.stock)}
                      disabled={cant >= p.stock}
                      aria-label="Agregar uno"
                      className="grid size-9 place-items-center rounded-full bg-brand-800 text-white disabled:bg-stone-200 disabled:text-stone-400"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {pestana === 'abono' && (
        <div className="mt-4 space-y-3">
          {deuda === 0 ? (
            <Vacio texto="Este cliente no tiene saldo pendiente." />
          ) : (
            <>
              <Entrada type="number" inputMode="numeric" value={abono} onChange={(e) => setAbono(e.target.value)} placeholder="Valor recibido" autoFocus />
              <div className="flex flex-wrap gap-2">
                {[5000, 10000, 20000].filter((v) => v < deuda).map((v) => (
                  <button key={v} onClick={() => setAbono(String(v))} className="rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-sm font-medium">
                    {cop(v)}
                  </button>
                ))}
                <button onClick={() => setAbono(String(deuda))} className="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-800">
                  Paga todo · {cop(deuda)}
                </button>
              </div>
              {montoAbono > deuda && <p className="text-sm text-rose-600">El abono no puede ser mayor que la deuda.</p>}
              {montoAbono > 0 && montoAbono <= deuda && (
                <p className="text-sm text-stone-500">Después del abono quedará debiendo {cop(deuda - montoAbono)}.</p>
              )}
            </>
          )}
        </div>
      )}

      {pestana === 'historial' && (
        <div className="mt-4">
          {historial.length === 0 ? (
            <Vacio texto="Todavía no hay movimientos." />
          ) : (
            <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
              {historial.map((h) => (
                <li key={h.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-[15px] font-medium capitalize">{h.tipo === 'abono' ? 'Abono' : `Venta ${h.tipo === 'fiado' ? 'fiada' : 'de contado'}`}</p>
                    <p className="text-xs text-stone-500">{fechaCorta(h.fecha)} · {hora(h.fecha)} · {h.detalle}</p>
                  </div>
                  <span className={`font-semibold ${h.tipo === 'abono' ? 'text-brand-700' : h.tipo === 'fiado' ? 'text-amber-600' : ''}`}>
                    {h.tipo === 'abono' ? '−' : ''}{cop(h.monto)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Hoja>
  )
}

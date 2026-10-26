import { useMemo, useState } from 'react'
import { MapPin, Minus, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { TipoVenta } from '../types'
import { fechaCorta, hora, normalizar, numero, redondear } from '../utils'
import { Boton, Campo, Confirmar, Entrada, Hoja, Segmentado, Selector, Vacio } from './ui'

type Pestana = 'venta' | 'abono' | 'historial' | 'editar'

export default function ClienteHoja({ clienteId, onCerrar, inicial = 'venta' }: { clienteId: string | null; onCerrar: () => void; inicial?: Pestana }) {
  if (!clienteId) return null
  return <Contenido key={clienteId} clienteId={clienteId} onCerrar={onCerrar} inicial={inicial} />
}

function Contenido({ clienteId, onCerrar, inicial }: { clienteId: string; onCerrar: () => void; inicial: Pestana }) {
  const { datos, usuario, saldo, dinero, dineroBase, registrarVenta, registrarAbono, anularVenta, eliminarAbono, guardarCliente, eliminarCliente } = useStore()
  const cliente = datos.clientes.find((c) => c.id === clienteId)
  const esAdmin = usuario?.rol === 'admin'
  const deuda = saldo(clienteId)
  const base = datos.ajustes.monedaBase
  const convierte = base !== datos.ajustes.monedaVista

  const [pestana, setPestana] = useState<Pestana>(inicial)
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState<Record<string, number>>({})
  const [tipo, setTipo] = useState<TipoVenta>('contado')
  const [abono, setAbono] = useState('')
  const [form, setForm] = useState(() => ({ nombre: cliente?.nombre ?? '', direccion: cliente?.direccion ?? '', telefono: cliente?.telefono ?? '', rutaId: cliente?.rutaId ?? '' }))
  const [borrar, setBorrar] = useState<null | { tipo: 'venta' | 'abono' | 'cliente'; id: string }>(null)

  const productos = useMemo(() => {
    const q = normalizar(busqueda)
    const cat = (id: string) => datos.categorias.find((c) => c.id === id)?.nombre ?? ''
    return datos.productos.filter((p) => !q || normalizar(p.nombre).includes(q) || normalizar(cat(p.categoriaId)).includes(q))
  }, [datos.productos, datos.categorias, busqueda])

  const historial = useMemo(() => {
    const v = datos.ventas
      .filter((x) => x.clienteId === clienteId)
      .map((x) => ({ id: x.id, clase: 'venta' as const, fecha: x.fecha, tipo: x.tipo as string, monto: x.total, detalle: x.items.map((i) => `${i.cantidad} ${i.nombre}`).join(', ') }))
    const a = datos.abonos.filter((x) => x.clienteId === clienteId).map((x) => ({ id: x.id, clase: 'abono' as const, fecha: x.fecha, tipo: 'abono', monto: x.monto, detalle: 'Pago a la cuenta' }))
    return [...v, ...a].sort((x, y) => y.fecha.localeCompare(x.fecha)).slice(0, 30)
  }, [datos.ventas, datos.abonos, clienteId])

  if (!cliente) return null

  const items = Object.entries(carrito)
    .filter(([, c]) => c > 0)
    .map(([productoId, cantidad]) => {
      const p = datos.productos.find((x) => x.id === productoId)!
      return { productoId, nombre: p.nombre, cantidad, precio: p.precio }
    })
  const total = redondear(items.reduce((s, it) => s + it.cantidad * it.precio, 0))
  const unidades = items.reduce((s, it) => s + it.cantidad, 0)
  const cambiar = (id: string, delta: number, max: number) => setCarrito((c) => ({ ...c, [id]: Math.min(max, Math.max(0, (c[id] ?? 0) + delta)) }))
  const montoAbono = numero(abono)

  const pie =
    pestana === 'venta' ? (
      <div className="space-y-3">
        <Segmentado valor={tipo} onCambio={setTipo} opciones={[{ valor: 'contado', etiqueta: 'De contado' }, { valor: 'fiado', etiqueta: 'Fiado' }]} />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-stone-500">{unidades} {unidades === 1 ? 'unidad' : 'unidades'}</p>
            <p className="text-xl font-bold">{dineroBase(total)}</p>
            {convierte && total > 0 && <p className="text-xs text-stone-400">≈ {dinero(total)}</p>}
          </div>
          <Boton
            onClick={() => {
              registrarVenta(clienteId, items, tipo)
              onCerrar()
            }}
            disabled={total === 0}
            variante={tipo === 'fiado' ? 'ambar' : 'primario'}
            className="min-w-40"
          >
            {tipo === 'fiado' ? 'Registrar fiado' : 'Registrar venta'}
          </Boton>
        </div>
      </div>
    ) : pestana === 'abono' && deuda > 0 ? (
      <Boton
        onClick={() => {
          registrarAbono(clienteId, montoAbono)
          onCerrar()
        }}
        disabled={montoAbono <= 0 || montoAbono > deuda + 0.001}
        className="w-full"
      >
        Registrar abono de {dineroBase(montoAbono)}
      </Boton>
    ) : pestana === 'editar' ? (
      <div className="flex gap-3">
        {esAdmin && (
          <Boton variante="peligro" onClick={() => setBorrar({ tipo: 'cliente', id: clienteId })} aria-label="Eliminar cliente">
            <Trash2 size={18} />
          </Boton>
        )}
        <Boton
          className="flex-1"
          disabled={!form.nombre.trim()}
          onClick={() => {
            guardarCliente({ id: clienteId, nombre: form.nombre.trim(), direccion: form.direccion.trim(), telefono: form.telefono.trim(), rutaId: form.rutaId })
            setPestana('venta')
          }}
        >
          Guardar cambios
        </Boton>
      </div>
    ) : undefined

  return (
    <Hoja abierta onCerrar={onCerrar} titulo={cliente.nombre} pie={pie}>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
        <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{cliente.direccion || 'Sin dirección'}</span>
        {cliente.telefono && (
          <a href={`tel:${cliente.telefono.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 text-brand-700"><Phone size={14} />{cliente.telefono}</a>
        )}
      </div>

      <div className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-3 ${deuda > 0 ? 'bg-amber-50 text-amber-900' : 'bg-brand-50 text-brand-800'}`}>
        <span className="text-sm font-medium">{deuda > 0 ? 'Debe' : 'Está al día'}</span>
        <span className="text-lg font-bold">{dinero(deuda)}</span>
      </div>

      <Segmentado
        valor={pestana}
        onCambio={setPestana}
        opciones={[
          { valor: 'venta', etiqueta: 'Venta' },
          { valor: 'abono', etiqueta: 'Abono' },
          { valor: 'historial', etiqueta: 'Historial' },
          { valor: 'editar', etiqueta: 'Datos' },
        ]}
      />

      {pestana === 'venta' && (
        <div className="mt-4">
          <div className="relative mb-3">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <Entrada value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto" className="pl-10" />
          </div>
          {productos.length === 0 && <Vacio texto="No hay productos con ese nombre." />}
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
            {productos.map((p) => {
              const cant = carrito[p.id] ?? 0
              return (
                <li key={p.id} className={`flex items-center gap-3 px-4 py-3 ${cant > 0 ? 'bg-brand-50/60' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{p.nombre}</p>
                    <p className="text-xs text-stone-500">
                      {dineroBase(p.precio)} · {p.stock === 0 ? <span className="text-rose-600">Agotado</span> : `quedan ${p.stock}`}
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
              <Campo etiqueta={`Valor recibido (${base})`}>
                <Entrada type="number" inputMode="decimal" step="0.01" value={abono} onChange={(e) => setAbono(e.target.value)} placeholder="0.00" autoFocus />
              </Campo>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 20].filter((v) => v < deuda).map((v) => (
                  <button key={v} onClick={() => setAbono(String(v))} className="rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-sm font-medium">
                    {dineroBase(v)}
                  </button>
                ))}
                <button onClick={() => setAbono(String(deuda))} className="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-800">
                  Paga todo · {dineroBase(deuda)}
                </button>
              </div>
              {montoAbono > deuda + 0.001 && <p className="text-sm text-rose-600">El abono no puede ser mayor que la deuda.</p>}
              {montoAbono > 0 && montoAbono <= deuda + 0.001 && <p className="text-sm text-stone-500">Después del abono quedará debiendo {dineroBase(Math.max(0, deuda - montoAbono))}.</p>}
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
                <li key={h.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{h.clase === 'abono' ? 'Abono' : `Venta ${h.tipo === 'fiado' ? 'fiada' : 'de contado'}`}</p>
                    <p className="text-xs text-stone-500">{fechaCorta(h.fecha)} · {hora(h.fecha)}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-stone-400">{h.detalle}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`font-semibold ${h.clase === 'abono' ? 'text-brand-700' : h.tipo === 'fiado' ? 'text-amber-600' : ''}`}>
                      {h.clase === 'abono' ? '−' : ''}{dinero(h.monto)}
                    </span>
                    {esAdmin && (
                      <button onClick={() => setBorrar({ tipo: h.clase, id: h.id })} className="text-xs font-semibold text-rose-600">
                        {h.clase === 'venta' ? 'Anular' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pestana === 'editar' && (
        <div className="mt-4 space-y-4">
          <Campo etiqueta="Nombre o negocio"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Campo>
          <Campo etiqueta="Dirección"><Entrada value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></Campo>
          <Campo etiqueta="Teléfono"><Entrada type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Campo>
          {esAdmin && (
            <Campo etiqueta="Ruta">
              <Selector value={form.rutaId} onChange={(e) => setForm({ ...form, rutaId: e.target.value })}>
                {datos.rutas.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </Selector>
            </Campo>
          )}
        </div>
      )}

      <Confirmar
        abierta={!!borrar}
        onCerrar={() => setBorrar(null)}
        titulo={borrar?.tipo === 'venta' ? '¿Anular esta venta?' : borrar?.tipo === 'abono' ? '¿Eliminar este abono?' : '¿Eliminar este cliente?'}
        texto={
          borrar?.tipo === 'venta'
            ? 'Los productos vuelven al inventario y, si era fiada, se descuenta de la deuda del cliente.'
            : borrar?.tipo === 'abono'
              ? 'El valor del abono vuelve a sumarse a la deuda del cliente.'
              : deuda > 0
                ? `Este cliente todavía debe ${dinero(deuda)}. Su historial de ventas se conserva en los reportes.`
                : 'Se quita de la ruta. Su historial de ventas se conserva en los reportes.'
        }
        accion={borrar?.tipo === 'venta' ? 'Anular venta' : 'Eliminar'}
        onConfirmar={() => {
          if (!borrar) return
          if (borrar.tipo === 'venta') anularVenta(borrar.id)
          else if (borrar.tipo === 'abono') eliminarAbono(borrar.id)
          else {
            eliminarCliente(borrar.id)
            onCerrar()
          }
        }}
      />
    </Hoja>
  )
}

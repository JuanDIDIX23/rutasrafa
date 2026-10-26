import { useMemo, useState } from 'react'
import { AlertTriangle, Plus, Search, Tags, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { Producto } from '../types'
import { ListaCategorias } from '../components/Catalogos'
import { Boton, Campo, Card, Chips, Confirmar, Entrada, Hoja, Selector, Vacio } from '../components/ui'
import { campoMoneda, monto, normalizar, numero } from '../utils'

const UNIDADES = ['unidad', 'paquete', 'bolsa', 'caja', 'lata', 'botella', 'frasco', 'docena', 'libra', 'kilo', 'litro', 'canasta']

export default function Inventario() {
  const { datos, dinero, usuario } = useStore()
  const esAdmin = usuario?.rol === 'admin'
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [editar, setEditar] = useState<Producto | 'nuevo' | null>(null)
  const [verCategorias, setVerCategorias] = useState(false)

  const nombreCat = (id: string) => datos.categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría'
  const bajos = datos.productos.filter((p) => p.stock <= p.minimo).length
  const valorInventario = datos.productos.reduce((s, p) => s + p.stock * p.precio, 0)

  const lista = useMemo(
    () =>
      datos.productos
        .filter((p) => filtro === 'todas' || (filtro === 'bajos' ? p.stock <= p.minimo : p.categoriaId === filtro))
        .filter((p) => !busqueda || normalizar(p.nombre).includes(normalizar(busqueda)))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [datos.productos, filtro, busqueda],
  )

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[13px] font-medium text-stone-500">Productos</p>
          <p className="mt-1 text-xl font-bold">{datos.productos.length}</p>
          <p className="text-xs text-stone-400">Valor a precio de venta {dinero(valorInventario)}</p>
        </Card>
        <button onClick={() => setFiltro('bajos')} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-800"><AlertTriangle size={14} />Por agotarse</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{bajos}</p>
          <p className="text-xs text-amber-700/70">En o bajo su mínimo</p>
        </button>
      </div>

      <div className="relative mt-4">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <Entrada value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto" className="pl-10" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Chips
            valor={filtro}
            onCambio={setFiltro}
            opciones={[{ valor: 'todas', etiqueta: 'Todos' }, { valor: 'bajos', etiqueta: 'Por agotarse' }, ...datos.categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre }))]}
          />
        </div>
      </div>

      {esAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Boton onClick={() => setEditar('nuevo')}>
            <Plus size={18} /> Producto
          </Boton>
          <Boton variante="suave" onClick={() => setVerCategorias(true)}>
            <Tags size={18} /> Categorías
          </Boton>
        </div>
      )}

      <div className="mt-3">
        {lista.length === 0 ? (
          <Vacio texto="No hay productos en esta selección." />
        ) : (
          <Card>
            <ul className="divide-y divide-stone-100">
              {lista.map((p) => (
                <li key={p.id}>
                  <button onClick={() => esAdmin && setEditar(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{p.nombre}</span>
                      <span className="block text-xs text-stone-500">{nombreCat(p.categoriaId)} · {dinero(p.precio)} / {p.unidad}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${p.stock <= p.minimo ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'}`}>
                      {p.stock}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <ProductoHoja producto={editar} onCerrar={() => setEditar(null)} onCategorias={() => setVerCategorias(true)} />

      <Hoja abierta={verCategorias} onCerrar={() => setVerCategorias(false)} titulo="Categorías de productos" subtitulo="Cree, renombre o elimine categorías">
        <ListaCategorias tipo="producto" />
      </Hoja>
    </div>
  )
}

function ProductoHoja({ producto, onCerrar, onCategorias }: { producto: Producto | 'nuevo' | null; onCerrar: () => void; onCategorias: () => void }) {
  if (!producto) return null
  return <ProductoForm key={producto === 'nuevo' ? 'nuevo' : producto.id} producto={producto === 'nuevo' ? null : producto} onCerrar={onCerrar} onCategorias={onCategorias} />
}

function ProductoForm({ producto, onCerrar, onCategorias }: { producto: Producto | null; onCerrar: () => void; onCategorias: () => void }) {
  const { datos, guardarProducto, eliminarProducto, dineroBase } = useStore()
  const base = datos.ajustes.monedaBase
  const [f, setF] = useState({
    nombre: producto?.nombre ?? '',
    categoriaId: producto?.categoriaId ?? datos.categorias[0]?.id ?? '',
    unidad: producto?.unidad ?? 'unidad',
    precio: producto ? String(producto.precio) : '',
    costo: producto?.costo ? String(producto.costo) : '',
    stock: producto ? String(producto.stock) : '',
    minimo: producto ? String(producto.minimo) : '10',
  })
  const [borrar, setBorrar] = useState(false)
  const precio = monto(f.precio, base)
  const costo = monto(f.costo, base)
  const margen = precio > 0 && costo > 0 ? Math.round(((precio - costo) / precio) * 100) : null
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const unidades = UNIDADES.includes(f.unidad) ? UNIDADES : [...UNIDADES, f.unidad]

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      titulo={producto ? 'Editar producto' : 'Nuevo producto'}
      pie={
        <div className="flex gap-3">
          {producto && (
            <Boton variante="peligro" aria-label="Eliminar producto" onClick={() => setBorrar(true)}>
              <Trash2 size={18} />
            </Boton>
          )}
          <Boton
            className="flex-1"
            disabled={!f.nombre.trim() || precio <= 0 || !f.categoriaId}
            onClick={() => {
              guardarProducto({
                id: producto?.id,
                nombre: f.nombre.trim(),
                categoriaId: f.categoriaId,
                unidad: f.unidad,
                precio,
                costo,
                stock: Math.max(0, Math.round(numero(f.stock))),
                minimo: Math.max(0, Math.round(numero(f.minimo))),
              })
              onCerrar()
            }}
          >
            {producto ? 'Guardar cambios' : 'Crear producto'}
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo etiqueta="Nombre"><Entrada value={f.nombre} onChange={set('nombre')} placeholder="Ej.: Arroz 500 g" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Categoría">
            <Selector value={f.categoriaId} onChange={set('categoriaId')}>
              {datos.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Selector>
          </Campo>
          <Campo etiqueta="Se vende por">
            <Selector value={f.unidad} onChange={set('unidad')}>
              {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
            </Selector>
          </Campo>
        </div>
        <button type="button" onClick={onCategorias} className="-mt-2 text-sm font-semibold text-brand-700">Crear o editar categorías</button>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta={`Precio de venta (${base})`}>
            <Entrada {...campoMoneda(base)} value={f.precio} onChange={set('precio')} />
          </Campo>
          <Campo etiqueta={`Costo (${base}, opcional)`}>
            <Entrada {...campoMoneda(base)} value={f.costo} onChange={set('costo')} />
          </Campo>
        </div>
        {margen !== null && (
          <p className="-mt-2 text-sm text-stone-500">
            Ganancia por {f.unidad}: {dineroBase(precio - costo)} ({margen} %)
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Existencias">
            <Entrada type="number" inputMode="numeric" value={f.stock} onChange={set('stock')} placeholder="0" />
          </Campo>
          <Campo etiqueta="Avisar cuando queden">
            <Entrada type="number" inputMode="numeric" value={f.minimo} onChange={set('minimo')} />
          </Campo>
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-stone-600">Llegó mercancía</p>
          <div className="flex flex-wrap gap-2">
            {[1, 6, 12, 24, 48].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setF({ ...f, stock: String(Math.round(numero(f.stock)) + n) })}
                className="rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-sm font-semibold"
              >
                +{n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Confirmar
        abierta={borrar}
        onCerrar={() => setBorrar(false)}
        titulo={`¿Eliminar ${producto?.nombre}?`}
        texto="Deja de aparecer en el inventario y en las ventas nuevas. Las ventas pasadas se conservan en los reportes."
        onConfirmar={() => {
          if (producto) eliminarProducto(producto.id)
          onCerrar()
        }}
      />
    </Hoja>
  )
}

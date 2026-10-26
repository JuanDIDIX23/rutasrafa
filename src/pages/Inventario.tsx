import { useMemo, useState } from 'react'
import { AlertTriangle, Plus, Search } from 'lucide-react'
import { useStore } from '../store'
import type { Producto } from '../types'
import { Boton, Campo, Card, Chips, Entrada, Hoja } from '../components/ui'
import { cop, normalizar } from '../utils'

const MINIMO = 10

export default function Inventario() {
  const { datos, entradaInventario, guardarProducto, agregarProducto } = useStore()
  const [categoria, setCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [sel, setSel] = useState<Producto | null>(null)
  const [entrada, setEntrada] = useState('')
  const [precio, setPrecio] = useState('')
  const [nuevo, setNuevo] = useState(false)
  const [form, setForm] = useState({ nombre: '', categoria: '', precio: '', stock: '' })

  const categorias = useMemo(() => [...new Set(datos.productos.map((p) => p.categoria))], [datos.productos])
  const bajos = datos.productos.filter((p) => p.stock <= MINIMO).length
  const valorInventario = datos.productos.reduce((s, p) => s + p.stock * p.precio, 0)

  const lista = datos.productos
    .filter((p) => categoria === 'todas' || (categoria === 'bajos' ? p.stock <= MINIMO : p.categoria === categoria))
    .filter((p) => !busqueda || normalizar(p.nombre).includes(normalizar(busqueda)))

  const abrir = (p: Producto) => {
    setSel(p)
    setEntrada('')
    setPrecio(String(p.precio))
  }

  const guardar = () => {
    if (!sel) return
    const cant = Number(entrada) || 0
    const nuevoPrecio = Number(precio) || sel.precio
    if (nuevoPrecio !== sel.precio) guardarProducto({ ...sel, precio: nuevoPrecio, stock: sel.stock })
    if (cant > 0) entradaInventario(sel.id, cant)
    setSel(null)
  }

  const crear = () => {
    agregarProducto({ nombre: form.nombre.trim(), categoria: form.categoria.trim() || 'Otros', precio: Number(form.precio) || 0, stock: Number(form.stock) || 0 })
    setForm({ nombre: '', categoria: '', precio: '', stock: '' })
    setNuevo(false)
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[13px] font-medium text-stone-500">Productos</p>
          <p className="mt-1 text-xl font-bold">{datos.productos.length}</p>
          <p className="text-xs text-stone-400">Valor en bodega {cop(valorInventario)}</p>
        </Card>
        <button onClick={() => setCategoria('bajos')} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-800"><AlertTriangle size={14} />Por agotarse</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{bajos}</p>
          <p className="text-xs text-amber-700/70">{MINIMO} unidades o menos</p>
        </button>
      </div>

      <div className="relative mt-4">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <Entrada value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto" className="pl-10" />
      </div>

      <div className="mt-3">
        <Chips
          valor={categoria}
          onCambio={setCategoria}
          opciones={[{ valor: 'todas', etiqueta: 'Todos' }, { valor: 'bajos', etiqueta: 'Por agotarse' }, ...categorias.map((c) => ({ valor: c, etiqueta: c }))]}
        />
      </div>

      <Card className="mt-3">
        <ul className="divide-y divide-stone-100">
          {lista.map((p) => (
            <li key={p.id}>
              <button onClick={() => abrir(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{p.nombre}</span>
                  <span className="block text-xs text-stone-500">{p.categoria} · {cop(p.precio)}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${p.stock <= MINIMO ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'}`}>
                  {p.stock} und.
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Boton variante="suave" className="mt-4 w-full" onClick={() => setNuevo(true)}>
        <Plus size={18} /> Agregar producto
      </Boton>

      <Hoja
        abierta={!!sel}
        onCerrar={() => setSel(null)}
        titulo={sel?.nombre ?? ''}
        subtitulo={sel ? `Existencias actuales: ${sel.stock} unidades` : ''}
        pie={<Boton className="w-full" onClick={guardar}>Guardar cambios</Boton>}
      >
        <div className="space-y-4">
          <Campo etiqueta="Entrada de mercancía (unidades que llegan)">
            <Entrada type="number" inputMode="numeric" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="0" autoFocus />
          </Campo>
          {sel && Number(entrada) > 0 && <p className="-mt-2 text-sm text-stone-500">Quedarán {sel.stock + Number(entrada)} unidades.</p>}
          <Campo etiqueta="Precio de venta (COP)">
            <Entrada type="number" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </Campo>
        </div>
      </Hoja>

      <Hoja
        abierta={nuevo}
        onCerrar={() => setNuevo(false)}
        titulo="Nuevo producto"
        pie={<Boton className="w-full" disabled={!form.nombre.trim() || !Number(form.precio)} onClick={crear}>Crear producto</Boton>}
      >
        <div className="space-y-4">
          <Campo etiqueta="Nombre"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus /></Campo>
          <Campo etiqueta="Categoría">
            <Entrada list="categorias" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            <datalist id="categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Precio (COP)"><Entrada type="number" inputMode="numeric" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} /></Campo>
            <Campo etiqueta="Existencias"><Entrada type="number" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Campo>
          </div>
        </div>
      </Hoja>
    </div>
  )
}

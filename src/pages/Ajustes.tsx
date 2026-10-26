import { useState, type ReactNode } from 'react'
import { ChevronRight, Plus, RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import type { Ruta, Usuario } from '../types'
import { ListaCategorias, RutaHoja, VendedorHoja } from '../components/Catalogos'
import { AjustesMoneda } from '../components/Monedas'
import { Boton, Card, Confirmar, Entrada, Hoja, Titulo } from '../components/ui'
import { DIAS, iniciales } from '../utils'

function Fila({ titulo, sub, onClick, izquierda }: { titulo: string; sub?: string; onClick: () => void; izquierda?: ReactNode }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50">
        {izquierda}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{titulo}</span>
          {sub && <span className="block truncate text-xs text-stone-500">{sub}</span>}
        </span>
        <ChevronRight size={18} className="shrink-0 text-stone-300" />
      </button>
    </li>
  )
}

export default function Ajustes() {
  const { datos, ajustar, reiniciar } = useStore()
  const [ruta, setRuta] = useState<Ruta | 'nueva' | null>(null)
  const [vendedor, setVendedor] = useState<Usuario | 'nuevo' | null>(null)
  const [categorias, setCategorias] = useState<'producto' | 'gasto' | null>(null)
  const [reset, setReset] = useState(false)
  const vendedores = datos.usuarios.filter((u) => u.rol === 'vendedor')
  const nombreRuta = (id?: string) => datos.rutas.find((r) => r.id === id)?.nombre

  return (
    <div>
      <Titulo>Negocio</Titulo>
      <Card className="p-4">
        <label className="mb-1.5 block text-[13px] font-medium text-stone-600" htmlFor="negocio">Nombre del negocio</label>
        <Entrada id="negocio" defaultValue={datos.ajustes.negocio} onBlur={(e) => e.target.value.trim() && ajustar({ negocio: e.target.value.trim() })} />
      </Card>

      <Titulo>Moneda</Titulo>
      <Card className="p-4">
        <AjustesMoneda />
      </Card>

      <Titulo accion={<button onClick={() => setRuta('nueva')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700"><Plus size={16} />Nueva</button>}>
        Rutas · {datos.rutas.length}
      </Titulo>
      <Card>
        <ul className="divide-y divide-stone-100">
          {datos.rutas.map((r) => (
            <Fila
              key={r.id}
              titulo={r.nombre}
              sub={`${DIAS[r.dia]} · ${datos.clientes.filter((c) => c.rutaId === r.id).length} clientes · ${vendedores.find((v) => v.rutaId === r.id)?.nombre ?? 'sin vendedor'}`}
              onClick={() => setRuta(r)}
            />
          ))}
          {datos.rutas.length === 0 && <li className="px-4 py-4 text-sm text-stone-500">No hay rutas creadas.</li>}
        </ul>
      </Card>

      <Titulo accion={<button onClick={() => setVendedor('nuevo')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700"><Plus size={16} />Nuevo</button>}>
        Vendedores · {vendedores.length}
      </Titulo>
      <Card>
        <ul className="divide-y divide-stone-100">
          {vendedores.map((v) => (
            <Fila
              key={v.id}
              titulo={v.nombre}
              sub={nombreRuta(v.rutaId) ?? 'Sin ruta asignada'}
              onClick={() => setVendedor(v)}
              izquierda={<span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">{iniciales(v.nombre)}</span>}
            />
          ))}
          {vendedores.length === 0 && <li className="px-4 py-4 text-sm text-stone-500">No hay vendedores.</li>}
        </ul>
      </Card>

      <Titulo>Categorías</Titulo>
      <Card>
        <ul className="divide-y divide-stone-100">
          <Fila titulo="Categorías de productos" sub={datos.categorias.map((c) => c.nombre).join(', ')} onClick={() => setCategorias('producto')} />
          <Fila titulo="Categorías de gastos" sub={datos.categoriasGasto.map((c) => c.nombre).join(', ')} onClick={() => setCategorias('gasto')} />
        </ul>
      </Card>

      <Titulo>Prototipo</Titulo>
      <Boton variante="fantasma" className="w-full justify-start bg-white ring-1 ring-stone-200/80" onClick={() => setReset(true)}>
        <RotateCcw size={18} /> Restablecer datos de ejemplo
      </Boton>
      <p className="mt-3 text-center text-xs text-stone-400">Prototipo de demostración · los datos se guardan solo en este navegador</p>

      <RutaHoja ruta={ruta === 'nueva' ? null : ruta} abierta={!!ruta} onCerrar={() => setRuta(null)} />
      <VendedorHoja vendedor={vendedor === 'nuevo' ? null : vendedor} abierta={!!vendedor} onCerrar={() => setVendedor(null)} />
      <Hoja
        abierta={!!categorias}
        onCerrar={() => setCategorias(null)}
        titulo={categorias === 'gasto' ? 'Categorías de gastos' : 'Categorías de productos'}
        subtitulo="Cree, renombre o elimine categorías"
      >
        {categorias && <ListaCategorias tipo={categorias} />}
      </Hoja>
      <Confirmar
        abierta={reset}
        onCerrar={() => setReset(false)}
        titulo="¿Restablecer los datos?"
        texto="Se borran los cambios hechos en este navegador y vuelven los datos de ejemplo."
        accion="Restablecer"
        onConfirmar={reiniciar}
      />
    </div>
  )
}

import { useState, type ReactNode } from 'react'
import { ChevronRight, Plus, RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import type { Ruta, Usuario } from '../types'
import { ListaCategorias, RutaHoja, UsuarioHoja } from '../components/Catalogos'
import { AjustesMoneda } from '../components/Monedas'
import { Boton, Card, Confirmar, Entrada, Hoja, Titulo } from '../components/ui'
import { DIAS, iniciales, ROLES } from '../utils'

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
  const [persona, setPersona] = useState<Usuario | 'nuevo' | null>(null)
  const [categorias, setCategorias] = useState<'producto' | 'gasto' | null>(null)
  const [reset, setReset] = useState(false)
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
              sub={`${DIAS[r.dia]} · ${datos.clientes.filter((c) => c.rutaId === r.id).length} clientes${r.zona ? ` · ${r.zona}` : ''}`}
              onClick={() => setRuta(r)}
            />
          ))}
          {datos.rutas.length === 0 && <li className="px-4 py-4 text-sm text-stone-500">No hay rutas creadas.</li>}
        </ul>
      </Card>

      <Titulo accion={<button onClick={() => setPersona('nuevo')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700"><Plus size={16} />Nuevo</button>}>
        Usuarios · {datos.usuarios.length}
      </Titulo>
      <Card>
        <ul className="divide-y divide-stone-100">
          {datos.usuarios.map((u) => (
            <Fila
              key={u.id}
              titulo={u.nombre}
              sub={u.rol === 'admin' ? ROLES.admin : `${ROLES.vendedor} · ${nombreRuta(u.rutaId) ?? 'sin ruta'}`}
              onClick={() => setPersona(u)}
              izquierda={<span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">{iniciales(u.nombre)}</span>}
            />
          ))}
        </ul>
      </Card>
      <p className="mt-2 text-xs text-stone-500">Si más adelante contratan a alguien, créelo con acceso “{ROLES.vendedor}”.</p>

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
      <UsuarioHoja usuario={persona === 'nuevo' ? null : persona} abierta={!!persona} onCerrar={() => setPersona(null)} />
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

import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useStore, type TipoCategoria } from '../store'
import type { Ruta, Usuario } from '../types'
import { DIAS, ROLES } from '../utils'
import { Boton, Campo, Confirmar, Entrada, Hoja, Segmentado, Selector } from './ui'

/** Lista de categorías con crear, renombrar y eliminar. Se usa en Inventario, Gastos y Ajustes. */
export function ListaCategorias({ tipo }: { tipo: TipoCategoria }) {
  const { datos, guardarCategoria, eliminarCategoria } = useStore()
  const lista = tipo === 'producto' ? datos.categorias : datos.categoriasGasto
  const cuenta = (id: string) =>
    tipo === 'producto' ? datos.productos.filter((p) => p.categoriaId === id).length : datos.gastos.filter((g) => g.categoriaId === id).length

  const [nueva, setNueva] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [borrar, setBorrar] = useState<string | null>(null)
  const [moverA, setMoverA] = useState('')

  const existe = (n: string, menos?: string) => lista.some((c) => c.id !== menos && c.nombre.trim().toLowerCase() === n.trim().toLowerCase())
  const aBorrar = lista.find((c) => c.id === borrar)
  const n = borrar ? cuenta(borrar) : 0
  const destinos = lista.filter((c) => c.id !== borrar)

  return (
    <div>
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
        {lista.map((c) =>
          editando === c.id ? (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2">
              <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus className="!py-2" />
              <button
                aria-label="Guardar nombre"
                disabled={!nombre.trim() || existe(nombre, c.id)}
                onClick={() => {
                  guardarCategoria(tipo, { id: c.id, nombre: nombre.trim() })
                  setEditando(null)
                }}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-800 text-white disabled:bg-stone-200"
              >
                <Check size={18} />
              </button>
              <button aria-label="Cancelar" onClick={() => setEditando(null)} className="grid size-10 shrink-0 place-items-center rounded-full bg-stone-100">
                <X size={18} />
              </button>
            </li>
          ) : (
            <li key={c.id} className="flex items-center gap-2 px-4 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{c.nombre}</span>
                <span className="block text-xs text-stone-500">
                  {cuenta(c.id)} {tipo === 'producto' ? 'productos' : 'gastos'}
                </span>
              </span>
              <button
                aria-label={`Renombrar ${c.nombre}`}
                onClick={() => {
                  setEditando(c.id)
                  setNombre(c.nombre)
                }}
                className="grid size-9 place-items-center rounded-full text-stone-500 hover:bg-stone-100"
              >
                <Pencil size={16} />
              </button>
              <button
                aria-label={`Eliminar ${c.nombre}`}
                disabled={lista.length === 1}
                onClick={() => {
                  setBorrar(c.id)
                  setMoverA(lista.find((x) => x.id !== c.id)?.id ?? '')
                }}
                className="grid size-9 place-items-center rounded-full text-rose-500 hover:bg-rose-50 disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ),
        )}
      </ul>

      <div className="mt-3 flex gap-2">
        <Entrada value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nueva categoría" />
        <Boton
          variante="suave"
          disabled={!nueva.trim() || existe(nueva)}
          onClick={() => {
            guardarCategoria(tipo, { nombre: nueva.trim() })
            setNueva('')
          }}
          className="shrink-0"
        >
          <Plus size={18} /> Crear
        </Boton>
      </div>
      {nueva.trim() && existe(nueva) && <p className="mt-2 text-sm text-rose-600">Ya existe una categoría con ese nombre.</p>}

      <Confirmar
        abierta={!!borrar}
        onCerrar={() => setBorrar(null)}
        titulo={`¿Eliminar "${aBorrar?.nombre ?? ''}"?`}
        texto={n > 0 ? `Hay ${n} ${tipo === 'producto' ? 'productos' : 'gastos'} en esta categoría. Elija a dónde pasarlos:` : 'La categoría está vacía y se puede eliminar sin problema.'}
        onConfirmar={() => borrar && eliminarCategoria(tipo, borrar, moverA)}
      >
        {n > 0 && (
          <Selector value={moverA} onChange={(e) => setMoverA(e.target.value)}>
            {destinos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Selector>
        )}
      </Confirmar>
    </div>
  )
}

/** Crear o editar una ruta: nombre, día de visita, zona y, si hay ayudantes, quién la hace. */
export function RutaHoja({ ruta, abierta, onCerrar }: { ruta: Ruta | null; abierta: boolean; onCerrar: () => void }) {
  if (!abierta) return null
  return <RutaForm key={ruta?.id ?? 'nueva'} ruta={ruta} onCerrar={onCerrar} />
}

function RutaForm({ ruta, onCerrar }: { ruta: Ruta | null; onCerrar: () => void }) {
  const { datos, guardarRuta, eliminarRuta } = useStore()
  const vendedores = datos.usuarios.filter((u) => u.rol === 'vendedor')
  const [form, setForm] = useState({
    nombre: ruta?.nombre ?? '',
    dia: ruta?.dia ?? 1,
    zona: ruta?.zona ?? '',
    vendedorId: vendedores.find((v) => v.rutaId === ruta?.id)?.id ?? '',
  })
  const [borrar, setBorrar] = useState(false)
  const otras = datos.rutas.filter((r) => r.id !== ruta?.id)
  const [moverA, setMoverA] = useState(otras[0]?.id ?? '')
  const clientes = ruta ? datos.clientes.filter((c) => c.rutaId === ruta.id).length : 0

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      titulo={ruta ? 'Editar ruta' : 'Nueva ruta'}
      subtitulo={ruta ? `${clientes} clientes en esta ruta` : 'Después podrá agregarle clientes'}
      pie={
        <div className="flex gap-3">
          {ruta && (
            <Boton variante="peligro" aria-label="Eliminar ruta" disabled={otras.length === 0} onClick={() => setBorrar(true)}>
              <Trash2 size={18} />
            </Boton>
          )}
          <Boton
            className="flex-1"
            disabled={!form.nombre.trim()}
            onClick={() => {
              guardarRuta({ id: ruta?.id, nombre: form.nombre.trim(), dia: form.dia, zona: form.zona.trim() }, form.vendedorId || null)
              onCerrar()
            }}
          >
            {ruta ? 'Guardar cambios' : 'Crear ruta'}
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo etiqueta="Nombre"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej.: Ruta Kennedy" /></Campo>
        <Campo etiqueta="Día de visita (se repite cada semana)">
          <div className="grid grid-cols-7 gap-1.5">
            {DIAS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, dia: i })}
                className={`rounded-xl py-2.5 text-sm font-semibold ${form.dia === i ? 'bg-brand-800 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}
              >
                {d.slice(0, 2)}
              </button>
            ))}
          </div>
        </Campo>
        <Campo etiqueta="Zona o barrios"><Entrada value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} placeholder="Ej.: Kennedy · Timiza" /></Campo>
        {vendedores.length > 0 && (
        <Campo etiqueta="Ayudante que la hace (opcional)">
          <Selector value={form.vendedorId} onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}>
            <option value="">Nadie en particular</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
                {v.rutaId && v.rutaId !== ruta?.id ? ` (ahora en ${datos.rutas.find((r) => r.id === v.rutaId)?.nombre ?? 'otra ruta'})` : ''}
              </option>
            ))}
          </Selector>
        </Campo>
        )}
        {ruta && otras.length === 0 && <p className="text-sm text-stone-500">Es la única ruta, por eso no se puede eliminar.</p>}
      </div>

      <Confirmar
        abierta={borrar}
        onCerrar={() => setBorrar(false)}
        titulo={`¿Eliminar ${ruta?.nombre}?`}
        texto={clientes > 0 ? `Los ${clientes} clientes de esta ruta pasarán a:` : 'La ruta no tiene clientes.'}
        onConfirmar={() => {
          if (ruta) eliminarRuta(ruta.id, moverA)
          onCerrar()
        }}
      >
        {clientes > 0 && (
          <Selector value={moverA} onChange={(e) => setMoverA(e.target.value)}>
            {otras.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Selector>
        )}
      </Confirmar>
    </Hoja>
  )
}

/** Crear o editar una persona que usa la app. */
export function UsuarioHoja({ usuario, abierta, onCerrar }: { usuario: Usuario | null; abierta: boolean; onCerrar: () => void }) {
  if (!abierta) return null
  return <UsuarioForm key={usuario?.id ?? 'nuevo'} usuario={usuario} onCerrar={onCerrar} />
}

function UsuarioForm({ usuario, onCerrar }: { usuario: Usuario | null; onCerrar: () => void }) {
  const { datos, usuario: actual, guardarUsuario, eliminarUsuario } = useStore()
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [rol, setRol] = useState<Usuario['rol']>(usuario?.rol ?? 'admin')
  const [rutaId, setRutaId] = useState(usuario?.rutaId ?? datos.rutas[0]?.id ?? '')
  const [borrar, setBorrar] = useState(false)
  const admins = datos.usuarios.filter((u) => u.rol === 'admin').length
  const esUltimoAdmin = usuario?.rol === 'admin' && admins === 1
  const noSePuedeBorrar = usuario?.id === actual?.id || esUltimoAdmin

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      titulo={usuario ? 'Editar usuario' : 'Nuevo usuario'}
      pie={
        <div className="flex gap-3">
          {usuario && (
            <Boton variante="peligro" aria-label="Eliminar usuario" disabled={noSePuedeBorrar} onClick={() => setBorrar(true)}>
              <Trash2 size={18} />
            </Boton>
          )}
          <Boton
            className="flex-1"
            disabled={!nombre.trim() || (rol === 'vendedor' && !rutaId) || (esUltimoAdmin && rol !== 'admin')}
            onClick={() => {
              guardarUsuario({ id: usuario?.id, nombre: nombre.trim(), rol, rutaId: rol === 'vendedor' ? rutaId : undefined })
              onCerrar()
            }}
          >
            {usuario ? 'Guardar cambios' : 'Crear usuario'}
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo etiqueta="Nombre"><Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus /></Campo>
        <Campo etiqueta="Acceso">
          <Segmentado
            valor={rol}
            onCambio={setRol}
            opciones={[
              { valor: 'admin', etiqueta: ROLES.admin },
              { valor: 'vendedor', etiqueta: ROLES.vendedor },
            ]}
          />
        </Campo>
        <p className="-mt-2 text-sm text-stone-500">
          {rol === 'admin'
            ? 'Ve y maneja todo: rutas, cartera, inventario, gastos y ajustes.'
            : 'Para un ayudante: solo ve su ruta, su cartera, sus gastos y el cierre.'}
        </p>
        {rol === 'vendedor' && (
          <Campo etiqueta="Ruta">
            <Selector value={rutaId} onChange={(e) => setRutaId(e.target.value)}>
              {datos.rutas.map((r) => <option key={r.id} value={r.id}>{r.nombre} · {DIAS[r.dia]}</option>)}
            </Selector>
          </Campo>
        )}
        {esUltimoAdmin && <p className="text-sm text-stone-500">Debe quedar al menos una persona con acceso completo.</p>}
        {usuario?.id === actual?.id && <p className="text-sm text-stone-500">No puede eliminar el usuario con el que está dentro.</p>}
      </div>
      <Confirmar
        abierta={borrar}
        onCerrar={() => setBorrar(false)}
        titulo={`¿Eliminar a ${usuario?.nombre}?`}
        texto="Ya no podrá ingresar a la app. Lo que registró se conserva en los reportes."
        onConfirmar={() => {
          if (usuario) eliminarUsuario(usuario.id)
          onCerrar()
        }}
      />
    </Hoja>
  )
}

import { useMemo, useState } from 'react'
import { Check, ClipboardList, Pencil, Plus, Search, UserPlus } from 'lucide-react'
import { useStore } from '../store'
import ClienteHoja from '../components/ClienteHoja'
import { RutaHoja } from '../components/Catalogos'
import Cierre from './Cierre'
import { Boton, Campo, Card, Chips, Entrada, Hoja, Titulo, Vacio } from '../components/ui'
import { DIAS, dayKey, hoyKey, normalizar } from '../utils'

export default function Ruta({ rutaInicial }: { rutaInicial?: string }) {
  const { datos, usuario, saldo, dinero, guardarCliente } = useStore()
  const esAdmin = usuario!.rol === 'admin'
  const rutaDeHoy = datos.rutas.find((r) => r.dia === new Date().getDay())?.id
  const [elegida, setElegida] = useState(rutaInicial ?? (esAdmin ? rutaDeHoy ?? datos.rutas[0]?.id : usuario!.rutaId) ?? '')
  const [busqueda, setBusqueda] = useState('')
  const [clienteSel, setClienteSel] = useState<string | null>(null)
  const [verCierre, setVerCierre] = useState(false)
  const [nuevo, setNuevo] = useState(false)
  const [editarRuta, setEditarRuta] = useState<'nueva' | 'actual' | null>(null)
  const [form, setForm] = useState({ nombre: '', direccion: '', telefono: '' })

  // Si la ruta elegida se eliminó, se toma la primera disponible.
  const ruta = datos.rutas.find((r) => r.id === elegida) ?? (esAdmin ? datos.rutas[0] : undefined)
  const rutaId = ruta?.id ?? ''
  const vendedor = datos.usuarios.find((u) => u.rol === 'vendedor' && u.rutaId === rutaId)
  const hoy = hoyKey()

  const { atendidos, vendidoHoy } = useMemo(() => {
    const ventas = datos.ventas.filter((v) => v.rutaId === rutaId && dayKey(v.fecha) === hoy)
    const abonos = datos.abonos.filter((a) => a.rutaId === rutaId && dayKey(a.fecha) === hoy)
    return {
      atendidos: new Set([...ventas, ...abonos].map((x) => x.clienteId)),
      vendidoHoy: ventas.reduce((s, v) => s + v.total, 0),
    }
  }, [datos.ventas, datos.abonos, rutaId, hoy])

  if (!ruta) {
    return (
      <div className="space-y-4">
        <Vacio texto={esAdmin ? 'Todavía no hay rutas. Cree la primera para empezar a organizar a los clientes.' : 'Todavía no tiene una ruta asignada. Pídale a Rafael que le asigne una.'} />
        {esAdmin && (
          <Boton className="w-full" onClick={() => setEditarRuta('nueva')}>
            <Plus size={18} /> Crear ruta
          </Boton>
        )}
        <RutaHoja ruta={null} abierta={editarRuta === 'nueva'} onCerrar={() => setEditarRuta(null)} />
      </div>
    )
  }

  const clientes = datos.clientes
    .filter((c) => c.rutaId === rutaId)
    .filter((c) => !busqueda || normalizar(c.nombre + ' ' + c.direccion).includes(normalizar(busqueda)))
  const total = datos.clientes.filter((c) => c.rutaId === rutaId).length
  const pendientes = clientes.filter((c) => !atendidos.has(c.id))
  const listos = clientes.filter((c) => atendidos.has(c.id))
  const avance = (atendidos.size / Math.max(1, total)) * 100

  const guardar = () => {
    guardarCliente({ nombre: form.nombre.trim(), direccion: form.direccion.trim(), telefono: form.telefono.trim(), rutaId })
    setForm({ nombre: '', direccion: '', telefono: '' })
    setNuevo(false)
  }

  const Fila = ({ id, nombre, direccion, hecho }: { id: string; nombre: string; direccion: string; hecho: boolean }) => {
    const deuda = saldo(id)
    return (
      <li>
        <button onClick={() => setClienteSel(id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50">
          <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${hecho ? 'bg-brand-800 text-white' : 'bg-stone-100 text-stone-500'}`}>
            {hecho ? <Check size={16} /> : nombre[0]}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-[15px] font-semibold ${hecho ? 'text-stone-500' : ''}`}>{nombre}</span>
            <span className="block truncate text-xs text-stone-500">{direccion}</span>
          </span>
          {deuda > 0 && <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Debe {dinero(deuda)}</span>}
        </button>
      </li>
    )
  }

  return (
    <div>
      {esAdmin && (
        <div className="mb-4 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Chips valor={rutaId} onCambio={setElegida} opciones={datos.rutas.map((r) => ({ valor: r.id, etiqueta: `${r.nombre} · ${DIAS[r.dia]}` }))} />
          </div>
          <button onClick={() => setEditarRuta('nueva')} aria-label="Nueva ruta" className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-800 text-white">
            <Plus size={18} />
          </button>
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Visita cada {DIAS[ruta.dia].toLowerCase()}</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-bold">
              {ruta.nombre}
              {esAdmin && (
                <button onClick={() => setEditarRuta('actual')} aria-label="Editar ruta" className="grid size-7 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                  <Pencil size={15} />
                </button>
              )}
            </h2>
            {ruta.zona && <p className="text-sm text-stone-500">{ruta.zona}</p>}
            {esAdmin && vendedor && <p className="text-sm text-stone-500">La hace: {vendedor.nombre}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="whitespace-nowrap text-xs text-stone-500">Vendido hoy</p>
            <p className="text-lg font-bold">{dinero(vendidoHoy)}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-stone-500">
            <span>{atendidos.size} de {total} clientes atendidos hoy</span>
            <span>{Math.round(avance)} %</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${avance}%` }} />
          </div>
        </div>
        {esAdmin && (
          <Boton variante="suave" className="mt-4 w-full" onClick={() => setVerCierre(true)}>
            <ClipboardList size={18} /> Ver cierre del día
          </Boton>
        )}
      </Card>

      <div className="relative mt-4">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <Entrada value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente o dirección" className="pl-10" />
      </div>

      <Titulo accion={<button onClick={() => setNuevo(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"><UserPlus size={16} />Nuevo cliente</button>}>
        Por visitar · {pendientes.length}
      </Titulo>
      {pendientes.length > 0 ? (
        <Card><ul className="divide-y divide-stone-100">{pendientes.map((c) => <Fila key={c.id} id={c.id} nombre={c.nombre} direccion={c.direccion} hecho={false} />)}</ul></Card>
      ) : total === 0 ? (
        <Vacio texto="Esta ruta todavía no tiene clientes." />
      ) : (
        <p className="rounded-2xl bg-brand-50 px-4 py-4 text-center text-sm font-medium text-brand-800">Todos los clientes de la lista ya fueron atendidos.</p>
      )}

      {listos.length > 0 && (
        <>
          <Titulo>Atendidos hoy · {listos.length}</Titulo>
          <Card><ul className="divide-y divide-stone-100">{listos.map((c) => <Fila key={c.id} id={c.id} nombre={c.nombre} direccion={c.direccion} hecho />)}</ul></Card>
        </>
      )}

      <ClienteHoja clienteId={clienteSel} onCerrar={() => setClienteSel(null)} />

      <Hoja abierta={verCierre} onCerrar={() => setVerCierre(false)} titulo="Cierre de ruta">
        <Cierre rutaId={rutaId} />
      </Hoja>

      <RutaHoja ruta={editarRuta === 'actual' ? ruta : null} abierta={!!editarRuta} onCerrar={() => setEditarRuta(null)} />

      <Hoja
        abierta={nuevo}
        onCerrar={() => setNuevo(false)}
        titulo="Nuevo cliente"
        subtitulo={`Se agregará a ${ruta.nombre}`}
        pie={<Boton className="w-full" disabled={!form.nombre.trim()} onClick={guardar}>Guardar cliente</Boton>}
      >
        <div className="space-y-4">
          <Campo etiqueta="Nombre o negocio"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus /></Campo>
          <Campo etiqueta="Dirección"><Entrada value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></Campo>
          <Campo etiqueta="Teléfono"><Entrada type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Campo>
        </div>
      </Hoja>
    </div>
  )
}

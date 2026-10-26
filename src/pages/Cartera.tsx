import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useStore } from '../store'
import ClienteHoja from '../components/ClienteHoja'
import { Card, Chips, Entrada, Titulo, Vacio } from '../components/ui'
import { cop, fechaCorta, normalizar } from '../utils'

export default function Cartera() {
  const { datos, usuario, saldo } = useStore()
  const esAdmin = usuario!.rol === 'admin'
  const [rutaId, setRutaId] = useState<string>(esAdmin ? 'todas' : usuario!.rutaId!)
  const [busqueda, setBusqueda] = useState('')
  const [clienteSel, setClienteSel] = useState<string | null>(null)

  const deudores = useMemo(() => {
    const ultimoAbono = new Map<string, string>()
    datos.abonos.forEach((a) => {
      const prev = ultimoAbono.get(a.clienteId)
      if (!prev || a.fecha > prev) ultimoAbono.set(a.clienteId, a.fecha)
    })
    return datos.clientes
      .filter((c) => rutaId === 'todas' || c.rutaId === rutaId)
      .map((c) => ({ ...c, deuda: saldo(c.id), ultimo: ultimoAbono.get(c.id) }))
      .filter((c) => c.deuda > 0)
      .sort((a, b) => b.deuda - a.deuda)
  }, [datos.clientes, datos.abonos, rutaId, saldo])

  const visibles = deudores.filter((c) => !busqueda || normalizar(c.nombre).includes(normalizar(busqueda)))
  const total = deudores.reduce((s, c) => s + c.deuda, 0)
  const nombreRuta = (id: string) => datos.rutas.find((r) => r.id === id)?.nombre ?? ''

  return (
    <div>
      {esAdmin && (
        <div className="mb-4">
          <Chips valor={rutaId} onCambio={setRutaId} opciones={[{ valor: 'todas', etiqueta: 'Todas las rutas' }, ...datos.rutas.map((r) => ({ valor: r.id, etiqueta: r.nombre }))]} />
        </div>
      )}

      <Card className="p-5">
        <p className="text-sm font-medium text-stone-500">Total por cobrar</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-amber-600">{cop(total)}</p>
        <p className="mt-1 text-sm text-stone-500">{deudores.length} clientes con saldo pendiente</p>
      </Card>

      <div className="relative mt-4">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <Entrada value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente" className="pl-10" />
      </div>

      <Titulo>Clientes que deben</Titulo>
      {visibles.length === 0 ? (
        <Vacio texto="No hay clientes con deuda en esta selección." />
      ) : (
        <Card>
          <ul className="divide-y divide-stone-100">
            {visibles.map((c) => (
              <li key={c.id}>
                <button onClick={() => setClienteSel(c.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{c.nombre}</span>
                    <span className="block truncate text-xs text-stone-500">
                      {esAdmin && rutaId === 'todas' ? `${nombreRuta(c.rutaId)} · ` : ''}
                      {c.ultimo ? `Último abono ${fechaCorta(c.ultimo)}` : 'Sin abonos registrados'}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-amber-700">{cop(c.deuda)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ClienteHoja clienteId={clienteSel} onCerrar={() => setClienteSel(null)} inicial="abono" />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Boton, Campo, Card, Chips, Entrada, Titulo, Vacio } from '../components/ui'
import { cop, dayKey, fechaCorta, haceDias } from '../utils'

const CATEGORIAS = ['Gasolina', 'Alimentación', 'Mercancía', 'Pago vendedor', 'Mantenimiento', 'Otro']

export default function Gastos() {
  const { datos, usuario, registrarGasto } = useStore()
  const esAdmin = usuario!.rol === 'admin'
  const [categoria, setCategoria] = useState('Gasolina')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [rutaId, setRutaId] = useState<string>(esAdmin ? 'general' : usuario!.rutaId!)

  const desde = haceDias(29)
  const lista = useMemo(
    () =>
      datos.gastos
        .filter((g) => (esAdmin ? true : g.rutaId === usuario!.rutaId))
        .filter((g) => dayKey(g.fecha) >= desde)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [datos.gastos, esAdmin, usuario, desde],
  )
  const total = lista.reduce((s, g) => s + g.monto, 0)
  const porCategoria = CATEGORIAS.map((c) => ({ c, v: lista.filter((g) => g.categoria === c).reduce((s, g) => s + g.monto, 0) }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
  const nombreRuta = (id: string | null) => (id ? datos.rutas.find((r) => r.id === id)?.nombre : 'General')

  const guardar = () => {
    registrarGasto({ categoria, descripcion: descripcion.trim() || categoria, monto: Number(monto), rutaId: rutaId === 'general' ? null : rutaId })
    setMonto('')
    setDescripcion('')
  }

  return (
    <div>
      <Card className="p-5">
        <h2 className="text-lg font-bold">Registrar gasto</h2>
        <div className="mt-4 space-y-4">
          <Chips valor={categoria} onCambio={setCategoria} opciones={CATEGORIAS.map((c) => ({ valor: c, etiqueta: c }))} />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Valor (COP)">
              <Entrada type="number" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
            </Campo>
            {esAdmin ? (
              <Campo etiqueta="Ruta">
                <select value={rutaId} onChange={(e) => setRutaId(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-[15px] outline-none focus:border-brand-600">
                  <option value="general">General</option>
                  {datos.rutas.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </Campo>
            ) : (
              <Campo etiqueta="Ruta"><div className="rounded-xl bg-stone-100 px-3.5 py-3 text-[15px] text-stone-600">{nombreRuta(rutaId)}</div></Campo>
            )}
          </div>
          <Campo etiqueta="Detalle (opcional)">
            <Entrada value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej.: tanqueo, almuerzo, repuesto" />
          </Campo>
          <Boton className="w-full" disabled={!(Number(monto) > 0)} onClick={guardar}>Guardar gasto</Boton>
        </div>
      </Card>

      <Titulo>Últimos 30 días · {cop(total)}</Titulo>
      {porCategoria.length > 0 && (
        <Card className="mb-3 space-y-2.5 p-4">
          {porCategoria.map(({ c, v }) => (
            <div key={c}>
              <div className="mb-1 flex justify-between text-sm"><span className="text-stone-600">{c}</span><span className="font-semibold">{cop(v)}</span></div>
              <div className="h-1.5 rounded-full bg-stone-100"><div className="h-full rounded-full bg-rose-400" style={{ width: `${(v / total) * 100}%` }} /></div>
            </div>
          ))}
        </Card>
      )}
      {lista.length === 0 ? (
        <Vacio texto="No hay gastos registrados." />
      ) : (
        <Card>
          <ul className="divide-y divide-stone-100">
            {lista.slice(0, 30).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{g.descripcion}</p>
                  <p className="text-xs text-stone-500">{fechaCorta(g.fecha)} · {g.categoria}{esAdmin ? ` · ${nombreRuta(g.rutaId)}` : ''}</p>
                </div>
                <span className="shrink-0 font-semibold text-rose-600">{cop(g.monto)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

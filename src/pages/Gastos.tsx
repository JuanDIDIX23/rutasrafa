import { useMemo, useState } from 'react'
import { Tags, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { Gasto } from '../types'
import { ListaCategorias } from '../components/Catalogos'
import { Boton, Campo, Card, Chips, Confirmar, Entrada, Hoja, Selector, Titulo, Vacio } from '../components/ui'
import { dayKey, fechaCorta, haceDias, numero } from '../utils'

export default function Gastos() {
  const { datos, usuario, dinero } = useStore()
  const esAdmin = usuario!.rol === 'admin'
  const [editar, setEditar] = useState<Gasto | null>(null)
  const [verCategorias, setVerCategorias] = useState(false)

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
  const porCategoria = datos.categoriasGasto
    .map((c) => ({ c: c.nombre, v: lista.filter((g) => g.categoriaId === c.id).reduce((s, g) => s + g.monto, 0) }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
  const nombreRuta = (id: string | null) => (id ? datos.rutas.find((r) => r.id === id)?.nombre ?? 'Ruta eliminada' : 'General')
  const nombreCat = (id: string) => datos.categoriasGasto.find((c) => c.id === id)?.nombre ?? 'Otro'

  return (
    <div>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Registrar gasto</h2>
          {esAdmin && (
            <button onClick={() => setVerCategorias(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              <Tags size={16} /> Categorías
            </button>
          )}
        </div>
        <FormGasto key={datos.categoriasGasto.length} />
      </Card>

      <Titulo>Últimos 30 días · {dinero(total)}</Titulo>
      {porCategoria.length > 0 && (
        <Card className="mb-3 space-y-2.5 p-4">
          {porCategoria.map(({ c, v }) => (
            <div key={c}>
              <div className="mb-1 flex justify-between text-sm"><span className="text-stone-600">{c}</span><span className="font-semibold">{dinero(v)}</span></div>
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
            {lista.slice(0, 40).map((g) => (
              <li key={g.id}>
                <button onClick={() => setEditar(g)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium">{g.descripcion}</span>
                    <span className="block text-xs text-stone-500">{fechaCorta(g.fecha)} · {nombreCat(g.categoriaId)}{esAdmin ? ` · ${nombreRuta(g.rutaId)}` : ''}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-rose-600">{dinero(g.monto)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <p className="mt-3 text-center text-xs text-stone-400">Toque un gasto para corregirlo o eliminarlo.</p>

      {editar && (
        <Hoja abierta onCerrar={() => setEditar(null)} titulo="Editar gasto" subtitulo={fechaCorta(editar.fecha)}>
          <FormGasto gasto={editar} onListo={() => setEditar(null)} />
        </Hoja>
      )}

      <Hoja abierta={verCategorias} onCerrar={() => setVerCategorias(false)} titulo="Categorías de gastos" subtitulo="Cree, renombre o elimine categorías">
        <ListaCategorias tipo="gasto" />
      </Hoja>
    </div>
  )
}

function FormGasto({ gasto, onListo }: { gasto?: Gasto; onListo?: () => void }) {
  const { datos, usuario, guardarGasto, eliminarGasto } = useStore()
  const esAdmin = usuario!.rol === 'admin'
  const base = datos.ajustes.monedaBase
  const [categoriaId, setCategoriaId] = useState(gasto?.categoriaId ?? datos.categoriasGasto[0]?.id ?? '')
  const [monto, setMonto] = useState(gasto ? String(gasto.monto) : '')
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? '')
  const [rutaId, setRutaId] = useState<string>(gasto ? gasto.rutaId ?? 'general' : esAdmin ? 'general' : usuario!.rutaId ?? 'general')
  const [borrar, setBorrar] = useState(false)
  const nombreCat = datos.categoriasGasto.find((c) => c.id === categoriaId)?.nombre ?? 'Gasto'

  const guardar = () => {
    guardarGasto({ id: gasto?.id, categoriaId, descripcion: descripcion.trim() || nombreCat, monto: numero(monto), rutaId: rutaId === 'general' ? null : rutaId })
    if (!gasto) {
      setMonto('')
      setDescripcion('')
    }
    onListo?.()
  }

  return (
    <div className="mt-4 space-y-4">
      <Chips valor={categoriaId} onCambio={setCategoriaId} opciones={datos.categoriasGasto.map((c) => ({ valor: c.id, etiqueta: c.nombre }))} />
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta={`Valor (${base})`}>
          <Entrada type="number" inputMode="decimal" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
        </Campo>
        {esAdmin ? (
          <Campo etiqueta="Ruta">
            <Selector value={rutaId} onChange={(e) => setRutaId(e.target.value)}>
              <option value="general">General</option>
              {datos.rutas.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </Selector>
          </Campo>
        ) : (
          <Campo etiqueta="Ruta">
            <div className="rounded-xl bg-stone-100 px-3.5 py-3 text-[15px] text-stone-600">{datos.rutas.find((r) => r.id === rutaId)?.nombre ?? 'General'}</div>
          </Campo>
        )}
      </div>
      <Campo etiqueta="Detalle (opcional)">
        <Entrada value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej.: gasolina, almuerzo, repuesto" />
      </Campo>
      <div className="flex gap-3">
        {gasto && (
          <Boton variante="peligro" aria-label="Eliminar gasto" onClick={() => setBorrar(true)}>
            <Trash2 size={18} />
          </Boton>
        )}
        <Boton className="flex-1" disabled={!(numero(monto) > 0) || !categoriaId} onClick={guardar}>
          {gasto ? 'Guardar cambios' : 'Guardar gasto'}
        </Boton>
      </div>
      {gasto && (
        <Confirmar
          abierta={borrar}
          onCerrar={() => setBorrar(false)}
          titulo="¿Eliminar este gasto?"
          texto="Se quita de los reportes y del cierre de ruta."
          onConfirmar={() => {
            eliminarGasto(gasto.id)
            onListo?.()
          }}
        />
      )}
    </div>
  )
}

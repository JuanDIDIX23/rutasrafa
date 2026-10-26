import { useState } from 'react'
import { ArrowDownUp, RefreshCw, X } from 'lucide-react'
import { useStore } from '../store'
import { convertir, formatear, MONEDAS, numero } from '../utils'
import { Boton, Campo, Entrada, Hoja, Selector } from './ui'

export const nombreMoneda = (c: string) => MONEDAS[c] ?? c

/** Convertidor rápido entre las monedas disponibles. */
export function Convertidor() {
  const { datos } = useStore()
  const { monedas, tasas, monedaBase } = datos.ajustes
  const [monto, setMonto] = useState(monedaBase === 'COP' ? '100000' : '100')
  const [de, setDe] = useState(monedaBase)
  const [a, setA] = useState(monedas.find((m) => m !== monedaBase) ?? monedaBase)
  const resultado = convertir(numero(monto), de, a, tasas)

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200/80">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Entrada type="number" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} aria-label="Valor a convertir" />
        <Selector value={de} onChange={(e) => setDe(e.target.value)} className="!w-24" aria-label="Moneda de origen">
          {monedas.map((m) => <option key={m} value={m}>{m}</option>)}
        </Selector>
      </div>
      <div className="my-2 flex justify-center">
        <button
          onClick={() => {
            setDe(a)
            setA(de)
          }}
          aria-label="Invertir monedas"
          className="grid size-9 place-items-center rounded-full bg-stone-100 text-stone-600"
        >
          <ArrowDownUp size={16} />
        </button>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="flex items-center rounded-xl bg-brand-50 px-3.5 py-3 text-lg font-bold text-brand-800">{formatear(resultado, a)}</div>
        <Selector value={a} onChange={(e) => setA(e.target.value)} className="!w-24" aria-label="Moneda de destino">
          {monedas.map((m) => <option key={m} value={m}>{m}</option>)}
        </Selector>
      </div>
      {de !== a && (
        <p className="mt-2 text-center text-xs text-stone-500">
          1 {de} = {convertir(1, de, a, tasas).toLocaleString('es-CO', { maximumFractionDigits: 4 })} {a}
        </p>
      )}
    </div>
  )
}

/** Sección de Ajustes para administrar monedas y tasas. */
export function AjustesMoneda() {
  const { datos, ajustar, actualizarTasas } = useStore()
  const { monedas, monedaBase, monedaVista, tasas, tasasFuente, tasasFecha } = datos.ajustes
  const [cargando, setCargando] = useState(false)
  const [nueva, setNueva] = useState('')
  const [cambioBase, setCambioBase] = useState<string | null>(null)

  const codigo = nueva.trim().toUpperCase()
  const valida = /^[A-Z]{3}$/.test(codigo) && !monedas.includes(codigo)
  const sugerencias = Object.keys({ ...MONEDAS, ...tasas }).filter((c) => !monedas.includes(c)).sort()

  const setTasa = (m: string, v: string) => {
    const n = numero(v)
    if (n > 0) ajustar({ tasas: { ...tasas, [m]: n }, tasasFuente: 'manual' })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Moneda del negocio">
          <Selector value={monedaBase} onChange={(e) => setCambioBase(e.target.value)}>
            {monedas.map((m) => <option key={m} value={m}>{m}</option>)}
          </Selector>
        </Campo>
        <Campo etiqueta="Mostrar valores en">
          <Selector value={monedaVista} onChange={(e) => ajustar({ monedaVista: e.target.value })}>
            {monedas.map((m) => <option key={m} value={m}>{m}</option>)}
          </Selector>
        </Campo>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-medium text-stone-600">Tasas de cambio (por 1 USD)</p>
          <button
            disabled={cargando}
            onClick={async () => {
              setCargando(true)
              await actualizarTasas()
              setCargando(false)
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 disabled:opacity-50"
          >
            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} /> Actualizar en línea
          </button>
        </div>
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80">
          {monedas.map((m) => (
            <li key={m} className="flex items-center gap-3 px-4 py-2">
              <span className="w-12 font-bold">{m}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-stone-500">{nombreMoneda(m)}</span>
              {m === 'USD' ? (
                <span className="w-28 text-right text-sm text-stone-400">1</span>
              ) : (
                <input
                  key={`${m}-${tasas[m]}`}
                  type="number"
                  inputMode="decimal"
                  defaultValue={tasas[m] ?? ''}
                  onBlur={(e) => setTasa(m, e.target.value)}
                  aria-label={`Tasa de ${m}`}
                  className="w-28 rounded-lg border border-stone-200 px-2.5 py-1.5 text-right text-sm outline-none focus:border-brand-600"
                />
              )}
              <button
                aria-label={`Quitar ${m}`}
                disabled={m === monedaBase || m === 'USD'}
                onClick={() => ajustar({ monedas: monedas.filter((x) => x !== m), monedaVista: monedaVista === m ? monedaBase : monedaVista })}
                className="grid size-8 place-items-center rounded-full text-stone-400 hover:bg-stone-100 disabled:invisible"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-stone-500">
          Tasas {tasasFuente}
          {tasasFecha ? ` · actualizadas ${new Date(tasasFecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}. Puede escribir una tasa a mano si prefiere usar la de su casa de cambio.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-stone-600">Agregar moneda</p>
        <div className="flex gap-2">
          <Entrada list="codigos-moneda" value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Código, ej.: EUR" maxLength={3} className="uppercase" />
          <datalist id="codigos-moneda">{sugerencias.map((c) => <option key={c} value={c}>{nombreMoneda(c)}</option>)}</datalist>
          <Boton
            variante="suave"
            className="shrink-0"
            disabled={!valida}
            onClick={() => {
              ajustar({ monedas: [...monedas, codigo], tasas: tasas[codigo] ? tasas : { ...tasas, [codigo]: 1 } })
              setNueva('')
            }}
          >
            Agregar
          </Boton>
        </div>
        {valida && !tasas[codigo] && <p className="mt-2 text-sm text-stone-500">No hay tasa para {codigo}. Actualice en línea o escríbala a mano después de agregarla.</p>}
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-stone-600">Convertidor</p>
        <Convertidor key={monedas.join()} />
      </div>

      <Hoja
        abierta={!!cambioBase}
        onCerrar={() => setCambioBase(null)}
        titulo={`¿Registrar en ${cambioBase}?`}
        pie={
          <div className="flex gap-3">
            <Boton variante="fantasma" className="flex-1 bg-stone-100" onClick={() => setCambioBase(null)}>Cancelar</Boton>
            <Boton
              className="flex-1"
              onClick={() => {
                if (cambioBase) ajustar({ monedaBase: cambioBase, monedaVista: cambioBase })
                setCambioBase(null)
              }}
            >
              Cambiar
            </Boton>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-stone-600">
          Los precios, abonos y gastos ya guardados no se convierten: un precio de 2.800 pasará a leerse como 2.800 {cambioBase}. Úselo solo si el negocio va a registrar todo en esa moneda. Para solo ver los valores en otra moneda, use “Mostrar valores en”.
        </p>
      </Hoja>
    </div>
  )
}

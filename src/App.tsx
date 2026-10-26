import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, BarChart3, Boxes, ClipboardCheck, CloudOff, HandCoins, LogOut, Map as MapIcon, RefreshCw, Settings, Wallet, Wifi } from 'lucide-react'
import { useStore } from './store'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Ruta from './pages/Ruta'
import Cartera from './pages/Cartera'
import Inventario from './pages/Inventario'
import Gastos from './pages/Gastos'
import Cierre from './pages/Cierre'
import Ajustes from './pages/Ajustes'
import { Boton, Hoja, Vacio } from './components/ui'
import { fechaLarga, iniciales } from './utils'

interface Pestana {
  id: string
  etiqueta: string
  icono: ReactNode
  titulo: string
}

const ADMIN: Pestana[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: <BarChart3 size={22} />, titulo: 'Resumen del negocio' },
  { id: 'ruta', etiqueta: 'Rutas', icono: <MapIcon size={22} />, titulo: 'Rutas' },
  { id: 'cartera', etiqueta: 'Cartera', icono: <HandCoins size={22} />, titulo: 'Cartera' },
  { id: 'inventario', etiqueta: 'Inventario', icono: <Boxes size={22} />, titulo: 'Inventario' },
  { id: 'gastos', etiqueta: 'Gastos', icono: <Wallet size={22} />, titulo: 'Gastos' },
]

const VENDEDOR: Pestana[] = [
  { id: 'ruta', etiqueta: 'Mi ruta', icono: <MapIcon size={22} />, titulo: 'Ruta de hoy' },
  { id: 'cartera', etiqueta: 'Cartera', icono: <HandCoins size={22} />, titulo: 'Cartera de mi ruta' },
  { id: 'gastos', etiqueta: 'Gastos', icono: <Wallet size={22} />, titulo: 'Gastos' },
  { id: 'cierre', etiqueta: 'Cierre', icono: <ClipboardCheck size={22} />, titulo: 'Cierre de ruta' },
]

export default function App() {
  const { usuario, datos, enLinea, actualizarTasas } = useStore()
  const pedido = useRef(false)

  // Trae las tasas del día una vez al abrir, si hay internet y las guardadas tienen más de 12 horas.
  useEffect(() => {
    const { tasasFecha } = datos.ajustes
    const viejas = !tasasFecha || Date.now() - new Date(tasasFecha).getTime() > 12 * 3600 * 1000
    if (enLinea && viejas && !pedido.current) {
      pedido.current = true
      actualizarTasas(true)
    }
  }, [enLinea, datos.ajustes, actualizarTasas])

  if (!usuario) return <><Login /><Aviso /></>
  return <Principal key={usuario.id} />
}

function Principal() {
  const { usuario, datos, enLinea, pendientes, sincronizando, simularSinSenal, setSimularSinSenal, salir } = useStore()
  const esAdmin = usuario!.rol === 'admin'
  const pestanas = esAdmin ? ADMIN : VENDEDOR
  const [actual, setActual] = useState(pestanas[0].id)
  const [rutaInicial, setRutaInicial] = useState<string | undefined>()
  const [vista, setVista] = useState(0) // fuerza a la pestaña Rutas a tomar la ruta pedida
  const [menu, setMenu] = useState(false)
  const enAjustes = actual === 'ajustes'
  const pestana = pestanas.find((p) => p.id === actual)
  const titulo = enAjustes ? 'Ajustes' : pestana?.titulo ?? ''
  const ruta = datos.rutas.find((r) => r.id === usuario!.rutaId)

  const irA = (id: string, rutaId?: string) => {
    setActual(id)
    setRutaInicial(rutaId)
    if (rutaId) setVista((v) => v + 1)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-crema/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-2">
          {enAjustes && (
            <button onClick={() => irA('inicio')} aria-label="Volver" className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-stone-200">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-stone-500 first-letter:uppercase">{enAjustes ? datos.ajustes.negocio : fechaLarga(new Date())}</p>
            <h1 className="truncate text-xl font-bold tracking-tight">{titulo}</h1>
          </div>
          <span
            title={enLinea ? 'En línea' : 'Sin señal'}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${enLinea ? 'bg-brand-50 text-brand-800' : 'bg-amber-100 text-amber-800'}`}
          >
            {sincronizando ? <RefreshCw size={13} className="animate-spin" /> : enLinea ? <Wifi size={13} /> : <CloudOff size={13} />}
            {!enLinea && pendientes > 0 && pendientes}
          </span>
          <button onClick={() => setMenu(true)} aria-label="Menú" className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-brand-800 ring-1 ring-stone-200">
            {iniciales(usuario!.nombre)}
          </button>
        </div>
        {!enLinea && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Sin señal. Puede seguir registrando ventas, abonos y gastos{pendientes > 0 ? ` (${pendientes} pendientes)` : ''}; se enviarán solos cuando vuelva la conexión.
          </p>
        )}
      </header>

      <main className="px-4 pt-4">
        {actual === 'inicio' && <Inicio irA={irA} />}
        {actual === 'ruta' && <Ruta key={vista} rutaInicial={rutaInicial} />}
        {actual === 'cartera' && <Cartera />}
        {actual === 'inventario' && <Inventario />}
        {actual === 'gastos' && <Gastos />}
        {actual === 'cierre' && (ruta ? <Cierre rutaId={ruta.id} /> : <Vacio texto="Todavía no tiene una ruta asignada." />)}
        {enAjustes && <Ajustes />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto flex max-w-2xl">
          {pestanas.map((p) => (
            <li key={p.id} className="flex-1">
              <button
                onClick={() => irA(p.id)}
                className={`flex w-full flex-col items-center gap-1 pb-2.5 pt-2.5 text-[11px] font-semibold transition ${actual === p.id ? 'text-brand-800' : 'text-stone-400'}`}
              >
                <span className={`rounded-full px-4 py-1 ${actual === p.id ? 'bg-brand-50' : ''}`}>{p.icono}</span>
                {p.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <Hoja abierta={menu} onCerrar={() => setMenu(false)} titulo={usuario!.nombre} subtitulo={esAdmin ? 'Acceso completo' : `Solo su ruta · ${ruta?.nombre ?? 'sin ruta'}`}>
        <div className="space-y-3">
          {esAdmin && (
            <Boton
              variante="fantasma"
              className="w-full justify-start bg-white ring-1 ring-stone-200/80"
              onClick={() => {
                setMenu(false)
                irA('ajustes')
              }}
            >
              <Settings size={18} /> Ajustes: rutas, usuarios, categorías y moneda
            </Boton>
          )}
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200/80">
            <span>
              <span className="block font-semibold">Simular sin señal</span>
              <span className="block text-sm text-stone-500">Para mostrar cómo funciona en zonas sin internet.</span>
            </span>
            <input type="checkbox" checked={simularSinSenal} onChange={(e) => setSimularSinSenal(e.target.checked)} className="size-5 accent-brand-800" />
          </label>
          <Boton variante="fantasma" className="w-full justify-start bg-white ring-1 ring-stone-200/80" onClick={salir}>
            <LogOut size={18} /> Cambiar de usuario
          </Boton>
          <p className="pt-2 text-center text-xs text-stone-400">Prototipo de demostración · los datos se guardan solo en este navegador</p>
        </div>
      </Hoja>

      <Aviso />
    </div>
  )
}

function Aviso() {
  const { aviso } = useStore()
  if (!aviso) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4">
      <div className="animar-bajar rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{aviso}</div>
    </div>
  )
}

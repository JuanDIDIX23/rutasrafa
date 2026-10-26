import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Cliente, Datos, ItemVenta, Producto, TipoVenta, Usuario } from './types'
import { crearDatosDemo } from './seed'
import { hoyKey, uid } from './utils'

const CLAVE_DATOS = 'rutas-demo-datos-v1'
const CLAVE_SESION = 'rutas-demo-sesion-v1'

function leer<T>(clave: string): T | null {
  try {
    const raw = localStorage.getItem(clave)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function guardar(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    /* el navegador no permite guardar: el prototipo sigue en memoria */
  }
}

interface Sesion {
  usuarioId: string | null
  simularSinSenal: boolean
}

interface Store {
  datos: Datos
  usuario: Usuario | null
  enLinea: boolean
  pendientes: number
  sincronizando: boolean
  simularSinSenal: boolean
  aviso: string | null
  saldo: (clienteId: string) => number
  entrar: (usuarioId: string) => void
  salir: () => void
  setSimularSinSenal: (v: boolean) => void
  avisar: (msg: string) => void
  registrarVenta: (clienteId: string, items: ItemVenta[], tipo: TipoVenta) => void
  registrarAbono: (clienteId: string, monto: number) => void
  registrarGasto: (g: { categoria: string; descripcion: string; monto: number; rutaId: string | null }) => void
  entradaInventario: (productoId: string, cantidad: number) => void
  guardarProducto: (p: Producto) => void
  agregarProducto: (p: Omit<Producto, 'id'>) => void
  agregarCliente: (c: Omit<Cliente, 'id' | 'saldoInicial'>) => void
  cerrarRuta: (rutaId: string, efectivo: number) => void
  reiniciar: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<Datos>(() => leer<Datos>(CLAVE_DATOS) ?? crearDatosDemo())
  const [sesion, setSesion] = useState<Sesion>(() => leer<Sesion>(CLAVE_SESION) ?? { usuarioId: null, simularSinSenal: false })
  const [redOk, setRedOk] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [aviso, setAviso] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const timerAviso = useRef<number | undefined>(undefined)

  useEffect(() => guardar(CLAVE_DATOS, datos), [datos])
  useEffect(() => guardar(CLAVE_SESION, sesion), [sesion])

  useEffect(() => {
    const on = () => setRedOk(true)
    const off = () => setRedOk(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const enLinea = redOk && !sesion.simularSinSenal
  const usuario = datos.usuarios.find((u) => u.id === sesion.usuarioId) ?? null

  const pendientes = useMemo(
    () =>
      [datos.ventas, datos.abonos, datos.gastos, datos.cierres].reduce((s, lista) => s + lista.filter((x) => !x.sync).length, 0),
    [datos],
  )

  const avisar = useCallback((msg: string) => {
    setAviso(msg)
    window.clearTimeout(timerAviso.current)
    timerAviso.current = window.setTimeout(() => setAviso(null), 2600)
  }, [])

  // Cuando vuelve la señal, se "suben" los registros pendientes.
  useEffect(() => {
    if (!enLinea || pendientes === 0) return
    setSincronizando(true)
    const t = window.setTimeout(() => {
      setDatos((d) => ({
        ...d,
        ventas: d.ventas.map((x) => ({ ...x, sync: true })),
        abonos: d.abonos.map((x) => ({ ...x, sync: true })),
        gastos: d.gastos.map((x) => ({ ...x, sync: true })),
        cierres: d.cierres.map((x) => ({ ...x, sync: true })),
      }))
      setSincronizando(false)
      avisar('Registros sincronizados')
    }, 1500)
    return () => window.clearTimeout(t)
  }, [enLinea, pendientes, avisar])

  const saldos = useMemo(() => {
    const m = new Map<string, number>()
    datos.clientes.forEach((c) => m.set(c.id, c.saldoInicial))
    datos.ventas.forEach((v) => v.tipo === 'fiado' && m.set(v.clienteId, (m.get(v.clienteId) ?? 0) + v.total))
    datos.abonos.forEach((a) => m.set(a.clienteId, (m.get(a.clienteId) ?? 0) - a.monto))
    return m
  }, [datos.clientes, datos.ventas, datos.abonos])

  const saldo = useCallback((id: string) => Math.max(0, saldos.get(id) ?? 0), [saldos])
  const ahora = () => new Date().toISOString()
  const quien = usuario?.id ?? 'u0'

  const store: Store = {
    datos,
    usuario,
    enLinea,
    pendientes,
    sincronizando,
    simularSinSenal: sesion.simularSinSenal,
    aviso,
    saldo,
    avisar,
    entrar: (usuarioId) => setSesion((s) => ({ ...s, usuarioId })),
    salir: () => setSesion((s) => ({ ...s, usuarioId: null })),
    setSimularSinSenal: (v) => setSesion((s) => ({ ...s, simularSinSenal: v })),

    registrarVenta: (clienteId, items, tipo) => {
      const cliente = datos.clientes.find((c) => c.id === clienteId)!
      const total = items.reduce((s, it) => s + it.cantidad * it.precio, 0)
      setDatos((d) => ({
        ...d,
        ventas: [...d.ventas, { id: uid(), fecha: ahora(), clienteId, rutaId: cliente.rutaId, usuarioId: quien, items, total, tipo, sync: enLinea }],
        productos: d.productos.map((p) => {
          const it = items.find((i) => i.productoId === p.id)
          return it ? { ...p, stock: Math.max(0, p.stock - it.cantidad) } : p
        }),
      }))
      avisar(tipo === 'fiado' ? 'Venta fiada registrada' : 'Venta de contado registrada')
    },

    registrarAbono: (clienteId, monto) => {
      const cliente = datos.clientes.find((c) => c.id === clienteId)!
      setDatos((d) => ({
        ...d,
        abonos: [...d.abonos, { id: uid(), fecha: ahora(), clienteId, rutaId: cliente.rutaId, usuarioId: quien, monto, sync: enLinea }],
      }))
      avisar('Abono registrado')
    },

    registrarGasto: (g) => {
      setDatos((d) => ({ ...d, gastos: [...d.gastos, { id: uid(), fecha: ahora(), usuarioId: quien, sync: enLinea, ...g }] }))
      avisar('Gasto registrado')
    },

    entradaInventario: (productoId, cantidad) => {
      setDatos((d) => ({ ...d, productos: d.productos.map((p) => (p.id === productoId ? { ...p, stock: p.stock + cantidad } : p)) }))
      avisar('Inventario actualizado')
    },

    guardarProducto: (p) => {
      setDatos((d) => ({ ...d, productos: d.productos.map((x) => (x.id === p.id ? p : x)) }))
      avisar('Producto guardado')
    },

    agregarProducto: (p) => {
      setDatos((d) => ({ ...d, productos: [...d.productos, { ...p, id: uid() }] }))
      avisar('Producto creado')
    },

    agregarCliente: (c) => {
      setDatos((d) => ({ ...d, clientes: [...d.clientes, { ...c, id: uid(), saldoInicial: 0 }] }))
      avisar('Cliente agregado a la ruta')
    },

    cerrarRuta: (rutaId, efectivo) => {
      setDatos((d) => ({
        ...d,
        cierres: [...d.cierres, { id: uid(), fecha: ahora(), dia: hoyKey(), rutaId, usuarioId: quien, efectivo, sync: enLinea }],
      }))
      avisar(usuario?.rol === 'vendedor' ? 'Ruta cerrada y enviada a Rafael' : 'Ruta cerrada')
    },

    reiniciar: () => {
      setDatos(crearDatosDemo())
      avisar('Datos de ejemplo restablecidos')
    },
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fuera de StoreProvider')
  return s
}

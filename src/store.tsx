import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Ajustes, Categoria, Cliente, Datos, Gasto, ItemVenta, Producto, Ruta, TipoVenta, Usuario } from './types'
import { crearDatosDemo } from './seed'
import { convertir, formatear, formatearCorto, hoyKey, redondear, uid } from './utils'

const CLAVE_DATOS = 'rutas-demo-datos-v3'
const CLAVE_SESION = 'rutas-demo-sesion-v3'

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

export type TipoCategoria = 'producto' | 'gasto'

interface Store {
  datos: Datos
  usuario: Usuario | null
  enLinea: boolean
  pendientes: number
  sincronizando: boolean
  simularSinSenal: boolean
  aviso: string | null
  /** Valor en la moneda que se está viendo (convierte desde la moneda del negocio). */
  dinero: (n: number) => string
  /** Igual que dinero, abreviado para tablas: $ 1,38 M. */
  dineroCorto: (n: number) => string
  /** Valor en la moneda del negocio, sin convertir. */
  dineroBase: (n: number) => string
  saldo: (clienteId: string) => number
  entrar: (usuarioId: string) => void
  salir: () => void
  setSimularSinSenal: (v: boolean) => void
  avisar: (msg: string) => void
  // Movimientos
  registrarVenta: (clienteId: string, items: ItemVenta[], tipo: TipoVenta) => void
  anularVenta: (id: string) => void
  registrarAbono: (clienteId: string, monto: number) => void
  eliminarAbono: (id: string) => void
  guardarGasto: (g: Omit<Gasto, 'id' | 'fecha' | 'usuarioId' | 'sync'> & { id?: string }) => void
  eliminarGasto: (id: string) => void
  cerrarRuta: (rutaId: string, efectivo: number) => void
  // Catálogos
  guardarProducto: (p: Omit<Producto, 'id'> & { id?: string }) => void
  eliminarProducto: (id: string) => void
  entradaInventario: (productoId: string, cantidad: number) => void
  guardarCategoria: (tipo: TipoCategoria, c: { id?: string; nombre: string }) => string
  eliminarCategoria: (tipo: TipoCategoria, id: string, moverA: string) => void
  guardarCliente: (c: Omit<Cliente, 'id' | 'saldoInicial'> & { id?: string }) => void
  eliminarCliente: (id: string) => void
  guardarRuta: (r: Omit<Ruta, 'id'> & { id?: string }, vendedorId: string | null) => void
  eliminarRuta: (id: string, moverA: string) => void
  guardarUsuario: (u: Omit<Usuario, 'id'> & { id?: string }) => void
  eliminarUsuario: (id: string) => void
  // Ajustes
  ajustar: (cambios: Partial<Ajustes>) => void
  actualizarTasas: (silencioso?: boolean) => Promise<boolean>
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
    () => [datos.ventas, datos.abonos, datos.gastos, datos.cierres].reduce((s, lista) => s + lista.filter((x) => !x.sync).length, 0),
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

  const { monedaBase, monedaVista, tasas } = datos.ajustes
  const dinero = useCallback((n: number) => formatear(convertir(n, monedaBase, monedaVista, tasas), monedaVista), [monedaBase, monedaVista, tasas])
  const dineroCorto = useCallback((n: number) => formatearCorto(convertir(n, monedaBase, monedaVista, tasas), monedaVista), [monedaBase, monedaVista, tasas])
  const dineroBase = useCallback((n: number) => formatear(n, monedaBase), [monedaBase])
  const saldo = useCallback((id: string) => Math.max(0, redondear(saldos.get(id) ?? 0)), [saldos])
  const ahora = () => new Date().toISOString()
  const quien = usuario?.id ?? 'u0'
  const mutar = (fn: (d: Datos) => Datos, msg?: string) => {
    setDatos(fn)
    if (msg) avisar(msg)
  }
  const listaCat = (tipo: TipoCategoria) => (tipo === 'producto' ? 'categorias' : 'categoriasGasto') as 'categorias' | 'categoriasGasto'

  const store: Store = {
    datos,
    usuario,
    enLinea,
    pendientes,
    sincronizando,
    simularSinSenal: sesion.simularSinSenal,
    aviso,
    dinero,
    dineroCorto,
    dineroBase,
    saldo,
    avisar,
    entrar: (usuarioId) => setSesion((s) => ({ ...s, usuarioId })),
    salir: () => setSesion((s) => ({ ...s, usuarioId: null })),
    setSimularSinSenal: (v) => setSesion((s) => ({ ...s, simularSinSenal: v })),

    registrarVenta: (clienteId, items, tipo) => {
      const cliente = datos.clientes.find((c) => c.id === clienteId)!
      const total = redondear(items.reduce((s, it) => s + it.cantidad * it.precio, 0))
      mutar(
        (d) => ({
          ...d,
          ventas: [...d.ventas, { id: uid(), fecha: ahora(), clienteId, rutaId: cliente.rutaId, usuarioId: quien, items, total, tipo, sync: enLinea }],
          productos: d.productos.map((p) => {
            const it = items.find((i) => i.productoId === p.id)
            return it ? { ...p, stock: Math.max(0, p.stock - it.cantidad) } : p
          }),
        }),
        tipo === 'fiado' ? 'Venta fiada registrada' : 'Venta de contado registrada',
      )
    },

    anularVenta: (id) =>
      mutar((d) => {
        const v = d.ventas.find((x) => x.id === id)
        if (!v) return d
        return {
          ...d,
          ventas: d.ventas.filter((x) => x.id !== id),
          productos: d.productos.map((p) => {
            const it = v.items.find((i) => i.productoId === p.id)
            return it ? { ...p, stock: p.stock + it.cantidad } : p
          }),
        }
      }, 'Venta anulada y productos devueltos al inventario'),

    registrarAbono: (clienteId, monto) => {
      const cliente = datos.clientes.find((c) => c.id === clienteId)!
      mutar(
        (d) => ({ ...d, abonos: [...d.abonos, { id: uid(), fecha: ahora(), clienteId, rutaId: cliente.rutaId, usuarioId: quien, monto: redondear(monto), sync: enLinea }] }),
        'Abono registrado',
      )
    },

    eliminarAbono: (id) => mutar((d) => ({ ...d, abonos: d.abonos.filter((a) => a.id !== id) }), 'Abono eliminado'),

    guardarGasto: ({ id, ...g }) =>
      mutar(
        (d) =>
          id
            ? { ...d, gastos: d.gastos.map((x) => (x.id === id ? { ...x, ...g, monto: redondear(g.monto), sync: enLinea } : x)) }
            : { ...d, gastos: [...d.gastos, { id: uid(), fecha: ahora(), usuarioId: quien, sync: enLinea, ...g, monto: redondear(g.monto) }] },
        id ? 'Gasto actualizado' : 'Gasto registrado',
      ),

    eliminarGasto: (id) => mutar((d) => ({ ...d, gastos: d.gastos.filter((g) => g.id !== id) }), 'Gasto eliminado'),

    cerrarRuta: (rutaId, efectivo) =>
      mutar(
        (d) => ({ ...d, cierres: [...d.cierres, { id: uid(), fecha: ahora(), dia: hoyKey(), rutaId, usuarioId: quien, efectivo, sync: enLinea }] }),
        'Ruta cerrada',
      ),

    guardarProducto: ({ id, ...p }) =>
      mutar(
        (d) => (id ? { ...d, productos: d.productos.map((x) => (x.id === id ? { ...x, ...p } : x)) } : { ...d, productos: [...d.productos, { ...p, id: uid() }] }),
        id ? 'Producto guardado' : 'Producto creado',
      ),

    eliminarProducto: (id) => mutar((d) => ({ ...d, productos: d.productos.filter((p) => p.id !== id) }), 'Producto eliminado'),

    entradaInventario: (productoId, cantidad) =>
      mutar((d) => ({ ...d, productos: d.productos.map((p) => (p.id === productoId ? { ...p, stock: p.stock + cantidad } : p)) }), 'Inventario actualizado'),

    guardarCategoria: (tipo, { id, nombre }) => {
      const clave = listaCat(tipo)
      const nuevoId = id ?? uid()
      mutar(
        (d) => ({
          ...d,
          [clave]: id ? d[clave].map((c: Categoria) => (c.id === id ? { ...c, nombre } : c)) : [...d[clave], { id: nuevoId, nombre }],
        }),
        id ? 'Categoría renombrada' : 'Categoría creada',
      )
      return nuevoId
    },

    eliminarCategoria: (tipo, id, moverA) => {
      const clave = listaCat(tipo)
      mutar(
        (d) => ({
          ...d,
          [clave]: d[clave].filter((c: Categoria) => c.id !== id),
          productos: tipo === 'producto' ? d.productos.map((p) => (p.categoriaId === id ? { ...p, categoriaId: moverA } : p)) : d.productos,
          gastos: tipo === 'gasto' ? d.gastos.map((g) => (g.categoriaId === id ? { ...g, categoriaId: moverA } : g)) : d.gastos,
        }),
        'Categoría eliminada',
      )
    },

    guardarCliente: ({ id, ...c }) =>
      mutar(
        (d) =>
          id
            ? { ...d, clientes: d.clientes.map((x) => (x.id === id ? { ...x, ...c } : x)) }
            : { ...d, clientes: [...d.clientes, { ...c, id: uid(), saldoInicial: 0 }] },
        id ? 'Cliente actualizado' : 'Cliente agregado a la ruta',
      ),

    eliminarCliente: (id) => mutar((d) => ({ ...d, clientes: d.clientes.filter((c) => c.id !== id) }), 'Cliente eliminado'),

    guardarRuta: ({ id, ...r }, vendedorId) => {
      const rutaId = id ?? uid()
      mutar(
        (d) => ({
          ...d,
          rutas: id ? d.rutas.map((x) => (x.id === id ? { ...x, ...r } : x)) : [...d.rutas, { ...r, id: rutaId }],
          usuarios: d.usuarios.map((u) => {
            if (u.rol !== 'vendedor') return u
            if (u.id === vendedorId) return { ...u, rutaId }
            if (u.rutaId === rutaId) return { ...u, rutaId: undefined }
            return u
          }),
        }),
        id ? 'Ruta actualizada' : 'Ruta creada',
      )
    },

    eliminarRuta: (id, moverA) =>
      mutar(
        (d) => ({
          ...d,
          rutas: d.rutas.filter((r) => r.id !== id),
          clientes: d.clientes.map((c) => (c.rutaId === id ? { ...c, rutaId: moverA } : c)),
          usuarios: d.usuarios.map((u) => (u.rutaId === id ? { ...u, rutaId: undefined } : u)),
        }),
        'Ruta eliminada',
      ),

    guardarUsuario: ({ id, ...u }) =>
      mutar(
        (d) =>
          id
            ? { ...d, usuarios: d.usuarios.map((x) => (x.id === id ? { ...x, ...u } : x)) }
            : { ...d, usuarios: [...d.usuarios, { ...u, id: uid() }] },
        id ? 'Usuario actualizado' : 'Usuario creado',
      ),

    eliminarUsuario: (id) => mutar((d) => ({ ...d, usuarios: d.usuarios.filter((u) => u.id !== id) }), 'Usuario eliminado'),

    ajustar: (cambios) => setDatos((d) => ({ ...d, ajustes: { ...d.ajustes, ...cambios } })),

    actualizarTasas: async (silencioso = false) => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const json = await res.json()
        if (json?.result !== 'success' || !json.rates) throw new Error('sin tasas')
        setDatos((d) => ({ ...d, ajustes: { ...d.ajustes, tasas: { ...d.ajustes.tasas, ...json.rates }, tasasFecha: new Date().toISOString(), tasasFuente: 'en línea' } }))
        if (!silencioso) avisar('Tasas de cambio actualizadas')
        return true
      } catch {
        if (!silencioso) avisar('No se pudieron traer las tasas. Puede escribirlas a mano.')
        return false
      }
    },

    reiniciar: () => mutar(() => crearDatosDemo(), 'Datos de ejemplo restablecidos'),
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fuera de StoreProvider')
  return s
}

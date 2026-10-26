export type Rol = 'admin' | 'vendedor'
export type TipoVenta = 'contado' | 'fiado'

export interface Usuario {
  id: string
  nombre: string
  rol: Rol
  rutaId?: string
}

export interface Ruta {
  id: string
  nombre: string
  dia: number // 0 = domingo … 6 = sábado
  zona: string
}

export interface Producto {
  id: string
  nombre: string
  categoria: string
  precio: number
  stock: number
}

export interface Cliente {
  id: string
  nombre: string
  direccion: string
  telefono: string
  rutaId: string
  saldoInicial: number // deuda que venía del Excel
}

export interface ItemVenta {
  productoId: string
  cantidad: number
  precio: number
}

export interface Venta {
  id: string
  fecha: string
  clienteId: string
  rutaId: string
  usuarioId: string
  items: ItemVenta[]
  total: number
  tipo: TipoVenta
  sync: boolean
}

export interface Abono {
  id: string
  fecha: string
  clienteId: string
  rutaId: string
  usuarioId: string
  monto: number
  sync: boolean
}

export interface Gasto {
  id: string
  fecha: string
  rutaId: string | null
  usuarioId: string
  categoria: string
  descripcion: string
  monto: number
  sync: boolean
}

export interface Cierre {
  id: string
  fecha: string
  dia: string // YYYY-MM-DD
  rutaId: string
  usuarioId: string
  efectivo: number
  sync: boolean
}

export interface Datos {
  productos: Producto[]
  rutas: Ruta[]
  clientes: Cliente[]
  usuarios: Usuario[]
  ventas: Venta[]
  abonos: Abono[]
  gastos: Gasto[]
  cierres: Cierre[]
}

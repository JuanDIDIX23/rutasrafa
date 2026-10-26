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

export interface Categoria {
  id: string
  nombre: string
}

export interface Producto {
  id: string
  nombre: string
  categoriaId: string
  precio: number
  costo: number // 0 si no se registra
  unidad: string
  stock: number
  minimo: number
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
  nombre: string // copia del nombre al momento de la venta
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
  categoriaId: string
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

export interface Ajustes {
  negocio: string
  monedaBase: string // moneda en la que se registran precios y pagos
  monedaVista: string // moneda en la que se muestran los valores
  monedas: string[] // monedas disponibles en el selector
  tasas: Record<string, number> // unidades por 1 USD
  tasasFecha: string | null
  tasasFuente: 'aproximadas' | 'en línea' | 'manual'
}

export interface Datos {
  ajustes: Ajustes
  categorias: Categoria[]
  categoriasGasto: Categoria[]
  productos: Producto[]
  rutas: Ruta[]
  clientes: Cliente[]
  usuarios: Usuario[]
  ventas: Venta[]
  abonos: Abono[]
  gastos: Gasto[]
  cierres: Cierre[]
}

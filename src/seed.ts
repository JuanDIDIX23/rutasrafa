import type { Abono, Categoria, Cierre, Cliente, Datos, Gasto, Producto, Ruta, Usuario, Venta } from './types'
import { dayKey, redondear, TASAS_APROX } from './utils'

const CATEGORIAS = ['Abarrotes', 'Despensa', 'Desayuno', 'Panadería', 'Lácteos y huevos', 'Botanas y dulces', 'Bebidas']

// nombre, categoría (índice), precio USD, unidad
const PRODUCTOS: [string, number, number, string][] = [
  ['Arroz 2 lb', 0, 2.49, 'bolsa'],
  ['Arroz 5 lb', 0, 5.29, 'bolsa'],
  ['Frijol pinto 2 lb', 0, 3.19, 'bolsa'],
  ['Frijol negro 2 lb', 0, 3.29, 'bolsa'],
  ['Lenteja 1 lb', 0, 1.79, 'bolsa'],
  ['Harina de maíz 4.4 lb', 0, 4.49, 'bolsa'],
  ['Tortillas de maíz x30', 0, 2.99, 'paquete'],
  ['Tortillas de harina x10', 0, 3.49, 'paquete'],
  ['Aceite vegetal 48 oz', 1, 5.99, 'botella'],
  ['Azúcar 4 lb', 1, 3.79, 'bolsa'],
  ['Sal 26 oz', 1, 1.29, 'unidad'],
  ['Fideo 7 oz', 1, 0.89, 'paquete'],
  ['Atún en lata 5 oz', 1, 1.69, 'lata'],
  ['Salsa de tomate 8 oz', 1, 0.79, 'lata'],
  ['Chiles jalapeños 12 oz', 1, 1.99, 'lata'],
  ['Consomé de pollo 7.9 oz', 1, 2.49, 'frasco'],
  ['Mayonesa 30 oz', 1, 4.99, 'frasco'],
  ['Café molido 12 oz', 2, 7.49, 'bolsa'],
  ['Chocolate de mesa 19 oz', 2, 5.49, 'caja'],
  ['Avena 18 oz', 2, 3.29, 'caja'],
  ['Leche en polvo 1.6 lb', 2, 9.99, 'bolsa'],
  ['Cereal 12 oz', 2, 4.29, 'caja'],
  ['Té de manzanilla x25', 2, 1.99, 'caja'],
  ['Pan dulce x4', 3, 3.99, 'paquete'],
  ['Bolillos x6', 3, 2.99, 'paquete'],
  ['Galletas María', 3, 1.49, 'paquete'],
  ['Pan de caja', 3, 3.79, 'unidad'],
  ['Huevos x12', 4, 3.99, 'docena'],
  ['Queso fresco 12 oz', 4, 4.99, 'unidad'],
  ['Crema mexicana 15 oz', 4, 3.49, 'unidad'],
  ['Mantequilla 1 lb', 4, 4.79, 'unidad'],
  ['Leche 1 galón', 4, 4.29, 'galón'],
  ['Papitas 8 oz', 5, 3.99, 'bolsa'],
  ['Cacahuates 12 oz', 5, 3.49, 'bolsa'],
  ['Dulce de tamarindo', 5, 1.99, 'paquete'],
  ['Cajeta 13 oz', 5, 4.49, 'frasco'],
  ['Chocolates x6', 5, 4.99, 'paquete'],
  ['Jugo de naranja 64 oz', 6, 4.49, 'botella'],
  ['Refresco 2 L', 6, 2.79, 'botella'],
  ['Agua x24', 6, 5.99, 'paquete'],
]

const NOMBRES = [
  'Doña Lupita Hernández', 'Tienda La Michoacana', 'María Elena Ruiz', 'José Luis Ramírez', 'Rosa Martínez',
  'Mini Market El Sol', 'Carmen Torres', 'Roberto Flores', 'Guadalupe Sánchez', 'Antonio Vargas',
  'Abarrotes Don Chuy', 'Patricia Morales', 'Leticia Domínguez', 'Francisco Jiménez', 'Verónica Castillo',
  'Carnicería La Esperanza', 'Silvia Romero', 'Jorge Mendoza', 'Teresa Gutiérrez', 'Manuel Ortega',
  'Panadería La Espiga', 'Alicia Navarro', 'Martha Delgado', 'Ricardo Aguilar', 'Sandra Rivas',
  'Tienda El Salvadoreño', 'Gloria Cruz', 'Héctor Reyes', 'Yolanda Peña', 'Luis Alberto Soto',
]

const CALLES = [
  ['E 1st St', 'E Cesar Chavez Ave', 'S Soto St', 'Whittier Blvd', 'E 4th St'],
  ['Pacific Blvd', 'Florence Ave', 'Tweedy Blvd', 'State St', 'Gage Ave'],
  ['Van Nuys Blvd', 'Sherman Way', 'Vanowen St', 'Victory Blvd', 'Lankershim Blvd'],
]

function generador(semilla: number) {
  let s = semilla
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function crearDatosDemo(): Datos {
  const r = generador(20261026)
  const entre = (a: number, b: number) => a + Math.floor(r() * (b - a + 1))
  let n = 0
  const id = (p: string) => `${p}${++n}`

  const categorias: Categoria[] = CATEGORIAS.map((nombre, i) => ({ id: `k${i + 1}`, nombre }))
  const categoriasGasto: Categoria[] = ['Gasolina', 'Comida', 'Mercancía', 'Pago a vendedores', 'Mantenimiento', 'Otro'].map((nombre, i) => ({
    id: `kg${i + 1}`,
    nombre,
  }))

  const productos: Producto[] = PRODUCTOS.map(([nombre, cat, precio, unidad], i) => ({
    id: `p${i + 1}`,
    nombre,
    categoriaId: categorias[cat].id,
    precio,
    costo: redondear(precio * 0.68),
    unidad,
    stock: 0,
    minimo: 10,
  }))

  const rutas: Ruta[] = [
    { id: 'r1', nombre: 'Ruta Este', dia: 1, zona: 'Boyle Heights · East LA' },
    { id: 'r2', nombre: 'Ruta Sur', dia: 3, zona: 'Huntington Park · South Gate' },
    { id: 'r3', nombre: 'Ruta Valle', dia: 5, zona: 'Van Nuys · North Hollywood' },
  ]

  const usuarios: Usuario[] = [
    { id: 'u0', nombre: 'Rafael', rol: 'admin' },
    { id: 'u1', nombre: 'Carlos Rojas', rol: 'vendedor', rutaId: 'r1' },
    { id: 'u2', nombre: 'Diana Gómez', rol: 'vendedor', rutaId: 'r2' },
    { id: 'u3', nombre: 'Wilson Pérez', rol: 'vendedor', rutaId: 'r3' },
  ]

  const clientes: Cliente[] = NOMBRES.map((nombre, i) => {
    const ruta = Math.floor(i / 10)
    const calles = CALLES[ruta]
    return {
      id: `c${i + 1}`,
      nombre,
      direccion: `${entre(1, 9)}${entre(100, 999)} ${calles[entre(0, calles.length - 1)]}`,
      telefono: `(${['323', '213', '818'][ruta]}) 555-${String(entre(100, 199)).padStart(4, '0')}`,
      rutaId: rutas[ruta].id,
      saldoInicial: r() < 0.3 ? entre(2, 8) * 5 : 0,
    }
  })

  const ventas: Venta[] = []
  const abonos: Abono[] = []
  const gastos: Gasto[] = []
  const cierres: Cierre[] = []
  const deuda: Record<string, number> = Object.fromEntries(clientes.map((c) => [c.id, c.saldoInicial]))
  const hoy = new Date()

  for (let d = 35; d >= 1; d--) {
    const dia = new Date(hoy)
    dia.setDate(hoy.getDate() - d)

    for (const ruta of rutas.filter((x) => x.dia === dia.getDay())) {
      const vendedor = usuarios.find((u) => u.rutaId === ruta.id)!
      let efectivo = 0
      const delDia = clientes.filter((c) => c.rutaId === ruta.id)

      delDia.forEach((c, idx) => {
        const f = new Date(dia)
        f.setHours(8, idx * 22 + entre(0, 15), 0, 0)

        if (deuda[c.id] > 0 && r() < 0.55) {
          const monto = Math.min(deuda[c.id], Math.max(5, Math.round(deuda[c.id] * (0.4 + r() * 0.6))))
          deuda[c.id] = redondear(deuda[c.id] - monto)
          efectivo += monto
          abonos.push({ id: id('a'), fecha: f.toISOString(), clienteId: c.id, rutaId: ruta.id, usuarioId: vendedor.id, monto, sync: true })
        }

        if (r() < 0.8) {
          const elegidos = new Set<number>()
          const cuantos = entre(3, 8)
          while (elegidos.size < cuantos) elegidos.add(entre(0, productos.length - 1))
          const items = [...elegidos].map((i) => ({ productoId: productos[i].id, nombre: productos[i].nombre, cantidad: entre(1, 6), precio: productos[i].precio }))
          const total = redondear(items.reduce((s, it) => s + it.cantidad * it.precio, 0))
          const tipo = r() < 0.35 ? 'fiado' : 'contado'
          if (tipo === 'fiado') deuda[c.id] = redondear(deuda[c.id] + total)
          else efectivo += total
          f.setMinutes(f.getMinutes() + 5)
          ventas.push({ id: id('v'), fecha: f.toISOString(), clienteId: c.id, rutaId: ruta.id, usuarioId: vendedor.id, items, total, tipo, sync: true })
        }
      })

      const tarde = new Date(dia)
      tarde.setHours(13, 30, 0, 0)
      const gasolina = entre(35, 60)
      const comida = entre(12, 18)
      gastos.push(
        { id: id('g'), fecha: tarde.toISOString(), rutaId: ruta.id, usuarioId: vendedor.id, categoriaId: 'kg1', descripcion: 'Gasolina de la van', monto: gasolina, sync: true },
        { id: id('g'), fecha: tarde.toISOString(), rutaId: ruta.id, usuarioId: vendedor.id, categoriaId: 'kg2', descripcion: 'Almuerzo', monto: comida, sync: true },
      )
      tarde.setHours(16, 10)
      cierres.push({ id: id('z'), fecha: tarde.toISOString(), dia: dayKey(dia), rutaId: ruta.id, usuarioId: vendedor.id, efectivo: redondear(efectivo - gasolina - comida), sync: true })
    }

    if (dia.getDay() === 6) {
      const f = new Date(dia)
      f.setHours(10, 0, 0, 0)
      gastos.push({ id: id('g'), fecha: f.toISOString(), rutaId: null, usuarioId: 'u0', categoriaId: 'kg3', descripcion: 'Compra semanal al mayorista', monto: entre(1100, 1500), sync: true })
    }
  }

  productos.forEach((p) => (p.stock = entre(14, 60)))
  ;[4, 16, 22, 31].forEach((i) => (productos[i].stock = entre(2, 8)))

  return {
    ajustes: {
      negocio: 'Distribuidora Rafael',
      monedaBase: 'USD',
      monedaVista: 'USD',
      monedas: ['USD', 'MXN', 'GTQ', 'COP', 'EUR'],
      tasas: { ...TASAS_APROX },
      tasasFecha: null,
      tasasFuente: 'aproximadas',
    },
    categorias,
    categoriasGasto,
    productos,
    rutas,
    clientes,
    usuarios,
    ventas,
    abonos,
    gastos,
    cierres,
  }
}

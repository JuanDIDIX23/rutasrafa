import type { Abono, Categoria, Cierre, Cliente, Datos, Gasto, Producto, Ruta, Usuario, Venta } from './types'
import { dayKey, TASAS_APROX } from './utils'

const CATEGORIAS = ['Granos', 'Despensa', 'Desayuno', 'Panadería', 'Lácteos y huevos', 'Mecato', 'Bebidas']

// nombre, categoría (índice), precio COP, unidad
const PRODUCTOS: [string, number, number, string][] = [
  ['Arroz 500 g', 0, 2800, 'bolsa'],
  ['Arroz 1 kg', 0, 5200, 'bolsa'],
  ['Fríjol cargamanto 500 g', 0, 6900, 'bolsa'],
  ['Lenteja 500 g', 0, 3900, 'bolsa'],
  ['Garbanzo 500 g', 0, 4500, 'bolsa'],
  ['Arveja seca 500 g', 0, 3200, 'bolsa'],
  ['Aceite 1 L', 1, 9800, 'botella'],
  ['Aceite 500 ml', 1, 5400, 'botella'],
  ['Azúcar 1 kg', 1, 4900, 'bolsa'],
  ['Sal 500 g', 1, 1500, 'bolsa'],
  ['Panela 500 g', 1, 3000, 'unidad'],
  ['Harina de maíz 1 kg', 1, 3900, 'bolsa'],
  ['Espagueti 250 g', 1, 2200, 'paquete'],
  ['Pasta conchitas 250 g', 1, 2200, 'paquete'],
  ['Atún en lata 170 g', 1, 6500, 'lata'],
  ['Sardinas 425 g', 1, 7200, 'lata'],
  ['Salsa de tomate 200 g', 1, 3800, 'frasco'],
  ['Mayonesa 200 g', 1, 4200, 'frasco'],
  ['Café molido 250 g', 2, 9500, 'bolsa'],
  ['Chocolate de mesa 250 g', 2, 6800, 'paquete'],
  ['Avena en hojuelas 500 g', 2, 4300, 'bolsa'],
  ['Leche en polvo 400 g', 2, 15900, 'bolsa'],
  ['Cereal 300 g', 2, 8900, 'caja'],
  ['Aromática caja x20', 2, 2500, 'caja'],
  ['Arepas paquete x5', 3, 4500, 'paquete'],
  ['Galletas de soda', 3, 5700, 'paquete'],
  ['Galletas wafer', 3, 3500, 'paquete'],
  ['Ponqué tajado', 3, 4200, 'unidad'],
  ['Tostadas', 3, 3800, 'paquete'],
  ['Pan tajado', 3, 7400, 'unidad'],
  ['Huevos x12', 4, 13200, 'docena'],
  ['Queso campesino 500 g', 4, 9800, 'unidad'],
  ['Mantequilla 125 g', 4, 3900, 'unidad'],
  ['Kumis 1 L', 4, 5600, 'unidad'],
  ['Papas fritas', 5, 2500, 'paquete'],
  ['Maní salado 120 g', 5, 2800, 'paquete'],
  ['Bocadillo veleño', 5, 3000, 'unidad'],
  ['Arequipe 250 g', 5, 5200, 'frasco'],
  ['Gaseosa 1.5 L', 6, 5500, 'botella'],
  ['Jugo en caja 1 L', 6, 4800, 'caja'],
]

const NOMBRES = [
  'Doña Marleny Castro', 'Tienda La Esquina', 'Gloria Patiño', 'Hernando Ruiz', 'Luz Dary Moreno',
  'Miscelánea El Ahorro', 'Rosalba Cárdenas', 'Jairo Quintero', 'Blanca Nieves Ortiz', 'Fabio Ramírez',
  'Cigarrería El Paisa', 'Martha Lucía Vargas', 'Esperanza Díaz', 'Álvaro Mendoza', 'Nubia Herrera',
  'Tienda Don Pacho', 'Amparo Salazar', 'Orlando Becerra', 'Yolanda Rincón', 'Gustavo Peña',
  'Fruver La Cosecha', 'Carmenza Aguilar', 'Rubiela Torres', 'Jorge Eliécer Cano', 'Dora Inés Pulido',
  'Panadería Mi Pan', 'Stella Montoya', 'Humberto Galvis', 'Mercedes Arango', 'Luis Alberto Ríos',
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
  const mil = (a: number, b: number) => entre(a, b) * 1000

  const categorias: Categoria[] = CATEGORIAS.map((nombre, i) => ({ id: `k${i + 1}`, nombre }))
  const categoriasGasto: Categoria[] = ['Gasolina', 'Almuerzo', 'Mercancía', 'Mantenimiento moto', 'Otro'].map((nombre, i) => ({
    id: `kg${i + 1}`,
    nombre,
  }))

  const productos: Producto[] = PRODUCTOS.map(([nombre, cat, precio, unidad], i) => ({
    id: `p${i + 1}`,
    nombre,
    categoriaId: categorias[cat].id,
    precio,
    costo: Math.round((precio * 0.7) / 50) * 50,
    unidad,
    stock: 0,
    minimo: 10,
  }))

  const rutas: Ruta[] = [
    { id: 'r1', nombre: 'Ruta Kennedy', dia: 1, zona: 'Kennedy · Timiza' },
    { id: 'r2', nombre: 'Ruta Bosa', dia: 3, zona: 'Bosa Centro · La Libertad' },
    { id: 'r3', nombre: 'Ruta Suba', dia: 5, zona: 'Suba Rincón · Tibabuyes' },
  ]

  // Rafael como administrador y, de ejemplo, una persona que le ayuda en la ruta Kennedy.
  const usuarios: Usuario[] = [
    { id: 'u0', nombre: 'Rafael', rol: 'admin' },
    { id: 'u1', nombre: 'Ayudante', rol: 'vendedor', rutaId: 'r1' },
  ]

  const clientes: Cliente[] = NOMBRES.map((nombre, i) => ({
    id: `c${i + 1}`,
    nombre,
    direccion: `Calle ${entre(10, 90)} Sur # ${entre(10, 90)}-${entre(10, 99)}`,
    telefono: `3${entre(0, 2)}${entre(0, 9)} ${entre(100, 999)} ${entre(1000, 9999)}`,
    rutaId: rutas[Math.floor(i / 10)].id,
    saldoInicial: r() < 0.3 ? entre(2, 8) * 5000 : 0,
  }))

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
      const quien = ruta.id === 'r1' && r() < 0.5 ? 'u1' : 'u0'
      let efectivo = 0

      clientes
        .filter((c) => c.rutaId === ruta.id)
        .forEach((c, idx) => {
          const f = new Date(dia)
          f.setHours(8, idx * 22 + entre(0, 15), 0, 0)

          if (deuda[c.id] > 0 && r() < 0.55) {
            const valor = Math.min(deuda[c.id], Math.max(5000, Math.round((deuda[c.id] * (0.4 + r() * 0.6)) / 1000) * 1000))
            deuda[c.id] -= valor
            efectivo += valor
            abonos.push({ id: id('a'), fecha: f.toISOString(), clienteId: c.id, rutaId: ruta.id, usuarioId: quien, monto: valor, sync: true })
          }

          if (r() < 0.8) {
            const elegidos = new Set<number>()
            const cuantos = entre(2, 6)
            while (elegidos.size < cuantos) elegidos.add(entre(0, productos.length - 1))
            const items = [...elegidos].map((i) => ({ productoId: productos[i].id, nombre: productos[i].nombre, cantidad: entre(1, 3), precio: productos[i].precio }))
            const total = items.reduce((s, it) => s + it.cantidad * it.precio, 0)
            const tipo = r() < 0.35 ? 'fiado' : 'contado'
            if (tipo === 'fiado') deuda[c.id] += total
            else efectivo += total
            f.setMinutes(f.getMinutes() + 5)
            ventas.push({ id: id('v'), fecha: f.toISOString(), clienteId: c.id, rutaId: ruta.id, usuarioId: quien, items, total, tipo, sync: true })
          }
        })

      const tarde = new Date(dia)
      tarde.setHours(13, 30, 0, 0)
      const gasolina = mil(15, 25)
      const almuerzo = mil(24, 32)
      gastos.push(
        { id: id('g'), fecha: tarde.toISOString(), rutaId: ruta.id, usuarioId: quien, categoriaId: 'kg1', descripcion: 'Tanqueo de la moto', monto: gasolina, sync: true },
        { id: id('g'), fecha: tarde.toISOString(), rutaId: ruta.id, usuarioId: quien, categoriaId: 'kg2', descripcion: 'Almuerzo', monto: almuerzo, sync: true },
      )
      tarde.setHours(16, 10)
      cierres.push({ id: id('z'), fecha: tarde.toISOString(), dia: dayKey(dia), rutaId: ruta.id, usuarioId: quien, efectivo: efectivo - gasolina - almuerzo, sync: true })
    }

    if (dia.getDay() === 6) {
      const f = new Date(dia)
      f.setHours(10, 0, 0, 0)
      gastos.push({ id: id('g'), fecha: f.toISOString(), rutaId: null, usuarioId: 'u0', categoriaId: 'kg3', descripcion: 'Compra semanal en Corabastos', monto: mil(480, 620), sync: true })
    }
  }

  productos.forEach((p) => (p.stock = entre(14, 60)))
  ;[3, 16, 22, 31].forEach((i) => (productos[i].stock = entre(2, 8)))

  return {
    ajustes: {
      negocio: 'Distribuidora Rafael',
      monedaBase: 'COP',
      monedaVista: 'COP',
      monedas: ['COP', 'USD'],
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

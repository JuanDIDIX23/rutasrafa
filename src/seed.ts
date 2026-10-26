import type { Abono, Cierre, Cliente, Datos, Gasto, Producto, Ruta, Usuario, Venta } from './types'
import { dayKey } from './utils'

const PRODUCTOS: [string, string, number][] = [
  ['Arroz 500 g', 'Granos', 2800],
  ['Arroz 1 kg', 'Granos', 5200],
  ['Fríjol cargamanto 500 g', 'Granos', 6900],
  ['Lenteja 500 g', 'Granos', 3900],
  ['Garbanzo 500 g', 'Granos', 4500],
  ['Arveja seca 500 g', 'Granos', 3200],
  ['Aceite 1 L', 'Despensa', 9800],
  ['Aceite 500 ml', 'Despensa', 5400],
  ['Azúcar 1 kg', 'Despensa', 4900],
  ['Sal 500 g', 'Despensa', 1500],
  ['Panela 500 g', 'Despensa', 3000],
  ['Harina de maíz 1 kg', 'Despensa', 3900],
  ['Espagueti 250 g', 'Despensa', 2200],
  ['Pasta conchitas 250 g', 'Despensa', 2200],
  ['Atún en lata 170 g', 'Despensa', 6500],
  ['Sardinas 425 g', 'Despensa', 7200],
  ['Salsa de tomate 200 g', 'Despensa', 3800],
  ['Mayonesa 200 g', 'Despensa', 4200],
  ['Café molido 250 g', 'Desayuno', 9500],
  ['Chocolate de mesa 250 g', 'Desayuno', 6800],
  ['Avena en hojuelas 500 g', 'Desayuno', 4300],
  ['Leche en polvo 400 g', 'Desayuno', 15900],
  ['Cereal 300 g', 'Desayuno', 8900],
  ['Aromática caja x20', 'Desayuno', 2500],
  ['Arepas paquete x5', 'Panadería', 4500],
  ['Galletas de soda', 'Panadería', 5700],
  ['Galletas wafer', 'Panadería', 3500],
  ['Ponqué tajado', 'Panadería', 4200],
  ['Tostadas', 'Panadería', 3800],
  ['Pan tajado', 'Panadería', 7400],
  ['Huevos x12', 'Lácteos y huevos', 13200],
  ['Queso campesino 500 g', 'Lácteos y huevos', 9800],
  ['Mantequilla 125 g', 'Lácteos y huevos', 3900],
  ['Kumis 1 L', 'Lácteos y huevos', 5600],
  ['Papas fritas', 'Mecato', 2500],
  ['Maní salado 120 g', 'Mecato', 2800],
  ['Bocadillo veleño', 'Mecato', 3000],
  ['Arequipe 250 g', 'Mecato', 5200],
  ['Gelatina', 'Mecato', 1800],
  ['Chocolatinas x6', 'Mecato', 6000],
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

  const productos: Producto[] = PRODUCTOS.map(([nombre, categoria, precio], i) => ({
    id: `p${i + 1}`,
    nombre,
    categoria,
    precio,
    stock: 0,
  }))

  const rutas: Ruta[] = [
    { id: 'r1', nombre: 'Ruta Norte', dia: 1, zona: 'La Esperanza · Villa Nueva' },
    { id: 'r2', nombre: 'Ruta Centro', dia: 3, zona: 'San Martín · El Prado' },
    { id: 'r3', nombre: 'Ruta Sur', dia: 5, zona: 'Las Brisas · El Recreo' },
  ]

  const usuarios: Usuario[] = [
    { id: 'u0', nombre: 'Rafael', rol: 'admin' },
    { id: 'u1', nombre: 'Carlos Rojas', rol: 'vendedor', rutaId: 'r1' },
    { id: 'u2', nombre: 'Diana Gómez', rol: 'vendedor', rutaId: 'r2' },
    { id: 'u3', nombre: 'Wilson Pérez', rol: 'vendedor', rutaId: 'r3' },
  ]

  const clientes: Cliente[] = NOMBRES.map((nombre, i) => ({
    id: `c${i + 1}`,
    nombre,
    direccion: `Calle ${entre(10, 90)} # ${entre(10, 60)}-${entre(10, 99)}`,
    telefono: `3${entre(0, 2)}${entre(0, 9)} ${entre(100, 999)} ${entre(1000, 9999)}`,
    rutaId: rutas[Math.floor(i / 10)].id,
    saldoInicial: r() < 0.3 ? entre(1, 6) * 5000 : 0,
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
      const vendedor = usuarios.find((u) => u.rutaId === ruta.id)!
      let efectivo = 0
      const delDia = clientes.filter((c) => c.rutaId === ruta.id)

      delDia.forEach((c, idx) => {
        const f = new Date(dia)
        f.setHours(8, idx * 22 + entre(0, 15), 0, 0)

        if (deuda[c.id] > 0 && r() < 0.55) {
          const monto = Math.min(deuda[c.id], Math.max(2000, Math.round((deuda[c.id] * (0.4 + r() * 0.6)) / 1000) * 1000))
          deuda[c.id] -= monto
          efectivo += monto
          abonos.push({ id: id('a'), fecha: f.toISOString(), clienteId: c.id, rutaId: ruta.id, usuarioId: vendedor.id, monto, sync: true })
        }

        if (r() < 0.8) {
          const elegidos = new Set<number>()
          const cuantos = entre(1, 4)
          while (elegidos.size < cuantos) elegidos.add(entre(0, productos.length - 1))
          const items = [...elegidos].map((i) => ({ productoId: productos[i].id, cantidad: entre(1, 3), precio: productos[i].precio }))
          const total = items.reduce((s, it) => s + it.cantidad * it.precio, 0)
          const tipo = r() < 0.35 ? 'fiado' : 'contado'
          if (tipo === 'fiado') deuda[c.id] += total
          else efectivo += total
          f.setMinutes(f.getMinutes() + 5)
          ventas.push({ id: id('v'), fecha: f.toISOString(), clienteId: c.id, rutaId: ruta.id, usuarioId: vendedor.id, items, total, tipo, sync: true })
        }
      })

      const tarde = new Date(dia)
      tarde.setHours(13, 30, 0, 0)
      const gasolina = entre(25, 40) * 1000
      const almuerzo = entre(12, 18) * 1000
      gastos.push(
        { id: id('g'), fecha: tarde.toISOString(), rutaId: ruta.id, usuarioId: vendedor.id, categoria: 'Gasolina', descripcion: 'Tanqueo de la moto', monto: gasolina, sync: true },
        { id: id('g'), fecha: tarde.toISOString(), rutaId: ruta.id, usuarioId: vendedor.id, categoria: 'Alimentación', descripcion: 'Almuerzo', monto: almuerzo, sync: true },
      )
      tarde.setHours(16, 10)
      cierres.push({ id: id('z'), fecha: tarde.toISOString(), dia: dayKey(dia), rutaId: ruta.id, usuarioId: vendedor.id, efectivo: efectivo - gasolina - almuerzo, sync: true })
    }

    if (dia.getDay() === 6) {
      const f = new Date(dia)
      f.setHours(10, 0, 0, 0)
      gastos.push({ id: id('g'), fecha: f.toISOString(), rutaId: null, usuarioId: 'u0', categoria: 'Mercancía', descripcion: 'Compra semanal a proveedor', monto: entre(170, 240) * 1000, sync: true })
    }
  }

  productos.forEach((p) => (p.stock = entre(14, 60)))
  ;[3, 16, 22, 31].forEach((i) => (productos[i].stock = entre(2, 8)))

  return { productos, rutas, clientes, usuarios, ventas, abonos, gastos, cierres }
}

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { Card, Confirmar, Hoja, Titulo, Vacio } from './ui'
import { dayKey, fechaCorta, haceDias, hora, hoyKey } from '../utils'

export type Periodo = 'hoy' | '7' | '30'
export type TipoDetalle = 'vendido' | 'recaudado' | 'fiado' | 'gastos'

export const desdePeriodo = (p: Periodo) => (p === 'hoy' ? hoyKey() : haceDias(Number(p) - 1))
export const nombrePeriodo = (p: Periodo) => (p === 'hoy' ? 'Hoy' : `Últimos ${p} días`)

const TITULOS: Record<TipoDetalle, string> = {
  vendido: 'Vendido',
  recaudado: 'Recaudado',
  fiado: 'Fiado',
  gastos: 'Gastos',
}

const LIMITE = 60

/** Resumen que se abre al tocar un cuadro del inicio. */
export default function DetalleHoja({ tipo, periodo, onCerrar }: { tipo: TipoDetalle | null; periodo: Periodo; onCerrar: () => void }) {
  if (!tipo) return null
  return (
    <Hoja abierta onCerrar={onCerrar} titulo={TITULOS[tipo]} subtitulo={nombrePeriodo(periodo)}>
      <Contenido tipo={tipo} periodo={periodo} />
    </Hoja>
  )
}

interface Mov {
  id: string
  fecha: string
  titulo: string
  sub: string
  monto: number
  tono: string
  items?: { nombre: string; cantidad: number; precio: number }[]
  ventaId?: string
}

function Contenido({ tipo, periodo }: { tipo: TipoDetalle; periodo: Periodo }) {
  const { datos, dinero, usuario, anularVenta } = useStore()
  const esAdmin = usuario?.rol === 'admin'
  const [abierto, setAbierto] = useState<string | null>(null)
  const [anular, setAnular] = useState<string | null>(null)

  const d = useMemo(() => {
    const desde = desdePeriodo(periodo)
    const en = <T extends { fecha: string }>(l: T[]) => l.filter((x) => dayKey(x.fecha) >= desde)
    const ventas = en(datos.ventas)
    const abonos = en(datos.abonos)
    const gastos = en(datos.gastos)
    const cliente = (id: string) => datos.clientes.find((c) => c.id === id)?.nombre ?? 'Cliente eliminado'
    const ruta = (id: string | null) => (id ? datos.rutas.find((r) => r.id === id)?.nombre ?? 'Ruta eliminada' : 'General')
    const catGasto = (id: string) => datos.categoriasGasto.find((c) => c.id === id)?.nombre ?? 'Otro'
    const suma = (l: number[]) => l.reduce((s, x) => s + x, 0)

    const porRuta = (lista: { rutaId: string | null; valor: number }[]) => {
      const m = new Map<string, number>()
      lista.forEach((x) => m.set(ruta(x.rutaId), (m.get(ruta(x.rutaId)) ?? 0) + x.valor))
      return [...m.entries()].map(([nombre, valor]) => ({ nombre, valor })).sort((a, b) => b.valor - a.valor)
    }

    const deVenta = (v: (typeof ventas)[number]): Mov => ({
      id: v.id,
      ventaId: v.id,
      fecha: v.fecha,
      titulo: cliente(v.clienteId),
      sub: `${ruta(v.rutaId)} · ${v.tipo === 'fiado' ? 'Fiado' : 'Contado'}`,
      monto: v.total,
      tono: v.tipo === 'fiado' ? 'text-amber-600' : 'text-stone-900',
      items: v.items,
    })
    const deAbono = (a: (typeof abonos)[number]): Mov => ({ id: a.id, fecha: a.fecha, titulo: cliente(a.clienteId), sub: `${ruta(a.rutaId)} · Abono`, monto: a.monto, tono: 'text-brand-700' })
    const ordenar = (l: Mov[]) => l.sort((a, b) => b.fecha.localeCompare(a.fecha))

    if (tipo === 'vendido') {
      const contado = suma(ventas.filter((v) => v.tipo === 'contado').map((v) => v.total))
      const fiado = suma(ventas.filter((v) => v.tipo === 'fiado').map((v) => v.total))
      return {
        total: contado + fiado,
        tono: 'text-stone-900',
        partes: [
          { nombre: 'De contado', valor: contado, color: 'bg-brand-600' },
          { nombre: 'Fiado', valor: fiado, color: 'bg-amber-400' },
        ],
        grupoTitulo: 'Por ruta',
        grupo: porRuta(ventas.map((v) => ({ rutaId: v.rutaId, valor: v.total }))),
        lista: ordenar(ventas.map(deVenta)),
        listaTitulo: 'Ventas',
        nota: `${ventas.length} ventas · promedio ${dinero(ventas.length ? (contado + fiado) / ventas.length : 0)} por venta`,
      }
    }

    if (tipo === 'recaudado') {
      const contadas = ventas.filter((v) => v.tipo === 'contado')
      const contado = suma(contadas.map((v) => v.total))
      const recibido = suma(abonos.map((a) => a.monto))
      return {
        total: contado + recibido,
        tono: 'text-brand-700',
        partes: [
          { nombre: 'Ventas de contado', valor: contado, color: 'bg-brand-600' },
          { nombre: 'Abonos de deudas', valor: recibido, color: 'bg-sky-500' },
        ],
        grupoTitulo: 'Por ruta',
        grupo: porRuta([...contadas.map((v) => ({ rutaId: v.rutaId, valor: v.total })), ...abonos.map((a) => ({ rutaId: a.rutaId, valor: a.monto }))]),
        lista: ordenar([...contadas.map(deVenta), ...abonos.map(deAbono)]),
        listaTitulo: 'Entradas de dinero',
        nota: 'Es el efectivo que entró en las rutas.',
      }
    }

    if (tipo === 'fiado') {
      const fiadas = ventas.filter((v) => v.tipo === 'fiado')
      const fiado = suma(fiadas.map((v) => v.total))
      const recibido = suma(abonos.map((a) => a.monto))
      const porCliente = new Map<string, number>()
      fiadas.forEach((v) => porCliente.set(cliente(v.clienteId), (porCliente.get(cliente(v.clienteId)) ?? 0) + v.total))
      const cambio = fiado - recibido
      return {
        total: fiado,
        tono: 'text-amber-600',
        partes: [
          { nombre: 'Se fió', valor: fiado, color: 'bg-amber-400' },
          { nombre: 'Se cobró en abonos', valor: recibido, color: 'bg-brand-600' },
        ],
        grupoTitulo: 'Clientes que más fiaron',
        grupo: [...porCliente.entries()].map(([nombre, valor]) => ({ nombre, valor })).sort((a, b) => b.valor - a.valor).slice(0, 8),
        lista: ordenar(fiadas.map(deVenta)),
        listaTitulo: 'Ventas fiadas',
        nota: cambio > 0 ? `La cartera creció ${dinero(cambio)} en este periodo.` : `La cartera bajó ${dinero(-cambio)} en este periodo.`,
      }
    }

    const total = suma(gastos.map((g) => g.monto))
    const porCat = new Map<string, number>()
    gastos.forEach((g) => porCat.set(catGasto(g.categoriaId), (porCat.get(catGasto(g.categoriaId)) ?? 0) + g.monto))
    return {
      total,
      tono: 'text-rose-600',
      partes: [...porCat.entries()].sort((a, b) => b[1] - a[1]).map(([nombre, valor], i) => ({ nombre, valor, color: ['bg-rose-500', 'bg-rose-400', 'bg-orange-400', 'bg-amber-400', 'bg-stone-400', 'bg-stone-300'][Math.min(i, 5)] })),
      grupoTitulo: 'Por ruta',
      grupo: porRuta(gastos.map((g) => ({ rutaId: g.rutaId, valor: g.monto }))),
      lista: ordenar(gastos.map((g) => ({ id: g.id, fecha: g.fecha, titulo: g.descripcion, sub: `${catGasto(g.categoriaId)} · ${ruta(g.rutaId)}`, monto: g.monto, tono: 'text-rose-600' }))),
      listaTitulo: 'Gastos registrados',
      nota: `${gastos.length} gastos registrados`,
    }
  }, [datos, periodo, tipo, dinero])

  const maxGrupo = Math.max(1, ...d.grupo.map((g) => g.valor))
  const totalPartes = Math.max(1, d.partes.reduce((s, p) => s + p.valor, 0))

  return (
    <div>
      <Card className="p-5">
        <p className={`text-3xl font-extrabold tracking-tight ${d.tono}`}>{dinero(d.total)}</p>
        <p className="mt-1 text-sm text-stone-500">{d.nota}</p>
        {d.partes.length > 0 && (
          <>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-stone-100">
              {d.partes.map((p) => (
                <div key={p.nombre} className={p.color} style={{ width: `${(p.valor / totalPartes) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {d.partes.map((p) => (
                <li key={p.nombre} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-stone-600"><span className={`size-2.5 rounded-full ${p.color}`} />{p.nombre}</span>
                  <span className="font-semibold tabular-nums">{dinero(p.valor)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {d.grupo.length > 0 && (
        <>
          <Titulo>{d.grupoTitulo}</Titulo>
          <Card className="space-y-3 p-4">
            {d.grupo.map((g) => (
              <div key={g.nombre}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate">{g.nombre}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{dinero(g.valor)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-stone-700" style={{ width: `${(g.valor / maxGrupo) * 100}%` }} />
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      <Titulo>{d.listaTitulo} · {d.lista.length}</Titulo>
      {d.lista.length === 0 ? (
        <Vacio texto="No hay movimientos en este periodo." />
      ) : (
        <Card>
          <ul className="divide-y divide-stone-100">
            {d.lista.slice(0, LIMITE).map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => m.items && setAbierto(abierto === m.id ? null : m.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left ${m.items ? 'hover:bg-stone-50' : 'cursor-default'}`}
                >
                  <span className="w-12 shrink-0 text-xs leading-tight text-stone-400">
                    {fechaCorta(m.fecha)}
                    <br />
                    {hora(m.fecha)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{m.titulo}</span>
                    <span className="block truncate text-xs text-stone-500">{m.sub}</span>
                  </span>
                  <span className={`shrink-0 font-semibold tabular-nums ${m.tono}`}>{dinero(m.monto)}</span>
                  {m.items && <ChevronDown size={16} className={`shrink-0 text-stone-300 transition ${abierto === m.id ? 'rotate-180' : ''}`} />}
                </button>
                {abierto === m.id && m.items && (
                  <div className="border-t border-stone-100 bg-stone-50/70 px-4 py-3">
                    <ul className="space-y-1 text-sm">
                      {m.items.map((i, k) => (
                        <li key={k} className="flex justify-between gap-3">
                          <span className="text-stone-600">{i.cantidad} × {i.nombre}</span>
                          <span className="tabular-nums">{dinero(i.cantidad * i.precio)}</span>
                        </li>
                      ))}
                    </ul>
                    {esAdmin && m.ventaId && (
                      <button onClick={() => setAnular(m.ventaId!)} className="mt-3 text-sm font-semibold text-rose-600">
                        Anular venta
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {d.lista.length > LIMITE && <p className="mt-2 text-center text-xs text-stone-400">Se muestran los {LIMITE} más recientes de {d.lista.length}.</p>}

      <Confirmar
        abierta={!!anular}
        onCerrar={() => setAnular(null)}
        titulo="¿Anular esta venta?"
        texto="Los productos vuelven al inventario y, si era fiada, se descuenta de la deuda del cliente."
        accion="Anular venta"
        onConfirmar={() => anular && anularVenta(anular)}
      />
    </div>
  )
}

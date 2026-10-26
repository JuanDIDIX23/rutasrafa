import { ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { DIAS, iniciales } from '../utils'

export default function Login() {
  const { datos, entrar } = useStore()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-14">
      <img src="/icon.svg" alt="" className="size-14 rounded-2xl" />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Control de rutas</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-600">
        Ventas, fiados, inventario y gastos del negocio en un solo lugar, desde el celular de cada vendedor.
      </p>

      <p className="mb-3 mt-10 text-[13px] font-semibold uppercase tracking-wide text-stone-500">¿Quién va a ingresar?</p>
      <ul className="space-y-2.5">
        {datos.usuarios.map((u) => {
          const ruta = datos.rutas.find((r) => r.id === u.rutaId)
          return (
            <li key={u.id}>
              <button
                onClick={() => entrar(u.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 text-left transition hover:border-brand-200 active:scale-[.99]"
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold ${u.rol === 'admin' ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-800'}`}>
                  {iniciales(u.nombre)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{u.nombre}</span>
                  <span className="block text-sm text-stone-500">
                    {u.rol === 'admin' ? 'Administrador · todas las rutas' : `Vendedor · ${ruta?.nombre} (${DIAS[ruta?.dia ?? 0].toLowerCase()})`}
                  </span>
                </span>
                <ChevronRight size={18} className="text-stone-400" />
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-auto pt-10 text-center text-xs text-stone-400">Prototipo de demostración · los datos son de ejemplo</p>
    </div>
  )
}

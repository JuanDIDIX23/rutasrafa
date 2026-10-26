# Control de rutas — prototipo

Prototipo del sistema de ventas, fiados, inventario y gastos para el negocio de Rafael (venta de alimentos puerta a puerta por rutas). Hecho con React, TypeScript, Vite y Tailwind CSS.

Los datos son de ejemplo y se guardan solo en el navegador (localStorage). En la versión final se reemplazan por Supabase.

## Usuarios de demostración

- **Rafael** (administrador): resumen del negocio, todas las rutas, cartera, inventario y gastos.
- **Carlos, Diana y Wilson** (vendedores): su ruta del día, registro de ventas de contado o fiadas, abonos, gastos y cierre de ruta.

Desde el menú del usuario se puede activar **Simular sin señal** para mostrar que los registros quedan pendientes y se sincronizan solos al volver la conexión.

## Correr en local

```bash
npm install
npm run dev
```

## Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En vercel.com, elige **Add New → Project** e importa el repositorio.
3. Vercel detecta Vite solo (comando `npm run build`, carpeta `dist`). Presiona **Deploy**.

También se puede publicar desde la terminal con `npx vercel --prod`.

# Control de rutas — prototipo

Prototipo del sistema de ventas, fiados, inventario y gastos para el negocio de Rafael en Los Ángeles (venta de alimentos puerta a puerta por rutas). Hecho con React, TypeScript, Vite y Tailwind CSS.

Los datos son de ejemplo y se guardan solo en el navegador (localStorage). En la versión final se reemplazan por Supabase.

## Usuarios de demostración

- **Rafael** (administrador): resumen del negocio, todas las rutas, cartera, inventario, gastos y Ajustes.
- **Carlos, Diana y Wilson** (vendedores): su ruta del día, ventas de contado o fiadas, abonos, gastos y cierre de ruta.

## Qué incluye

- Moneda del negocio en USD, con opción de ver todo en MXN, GTQ, COP, EUR u otra moneda. Las tasas se traen en línea (open.er-api.com) y también se pueden escribir a mano. Incluye un convertidor.
- Cuadros del inicio (Vendido, Recaudado, Fiado, Gastos) con su resumen y el detalle de cada movimiento.
- Productos, categorías de productos, categorías de gastos, rutas, vendedores, clientes y gastos se pueden crear, editar y eliminar. Ventas y abonos se pueden anular.
- Modo **Simular sin señal** (menú del usuario) para mostrar el registro sin internet y la sincronización.

## Correr en local

```bash
npm install
npm run dev
```

## Publicar en Vercel

Vercel detecta Vite solo (comando `npm run build`, carpeta `dist`). Con el repositorio conectado, cada `git push` publica una versión nueva.

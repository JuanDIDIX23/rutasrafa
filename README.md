# Control de rutas — prototipo

Prototipo del sistema de ventas, fiados, inventario y gastos para el negocio de Rafael en Colombia: venta de alimentos puerta a puerta por rutas que se repiten cada semana. Hecho con React, TypeScript, Vite y Tailwind CSS.

Los datos son de ejemplo (Bogotá, pesos colombianos) y se guardan solo en el navegador (localStorage). En la versión final se reemplazan por Supabase.

## Usuarios de demostración

- **Rafael**: acceso completo a todo.
- **Ayudante** (ejemplo): una persona que le colabora, con acceso solo a su ruta. En Ajustes → Usuarios se cambia el nombre, el acceso o se agregan más personas.

## Qué incluye

- Rutas con su día de visita, lista de clientes del día, venta de contado o fiada, abonos y cierre de ruta.
- Inicio con Vendido, Recaudado, Fiado y Gastos; cada cuadro abre su resumen y el detalle de movimientos.
- Productos, categorías de productos y de gastos, rutas, usuarios, clientes y gastos se pueden crear, editar y eliminar. Ventas y abonos se pueden anular.
- Moneda del negocio en pesos (COP). En Ajustes hay conversión a dólares u otra moneda, con tasas en línea o escritas a mano.
- Modo **Simular sin señal** (menú del usuario) para mostrar el registro sin internet y la sincronización.

## Correr en local

```bash
npm install
npm run dev
```

## Publicar en Vercel

Vercel detecta Vite solo (comando `npm run build`, carpeta `dist`). Con el repositorio conectado, cada `git push` publica una versión nueva.

# SVG de Figma

Aquí van los íconos exportados directamente del archivo de Figma (`Cameia · Mockups
MVP`), a medida que reemplazan a los temporales de Lucide en `registry.tsx`.

Migrar un ícono es cambiar una línea en `registry.tsx`: la importación de Lucide de
ese ícono se reemplaza por el componente generado a partir de su SVG en esta carpeta.
`Icon.tsx` y cualquier consumidor de `<Icon name="..." />` no se tocan.

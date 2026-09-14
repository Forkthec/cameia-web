# 0005 · Un solo tema visual en el MVP

- **Estado:** Aceptada
- **Fecha:** 06-sep-2026
- **Decide:** Frontend, sobre el diseño entregado
- **Ticket:** CM-100

## Contexto

El archivo de Figma `Cameia · Mockups MVP` define una sola colección de tokens semánticos. No existe
una paleta oscura dibujada ni aprobada, y no hay historia de usuario que pida un conmutador de tema.

## Decisión

El producto mínimo se entrega con un único tema claro. No hay selector de tema, y la hoja de estilos
no reacciona a `prefers-color-scheme`.

## Alternativas descartadas

**Implementar modo oscuro ahora.** Exige que diseño produzca y apruebe una segunda paleta completa,
y que cada componente se revise en ambos temas. No hay historia, no hay paleta y no hay tiempo en el
sprint.

**Dejarlo «preparado» con clases condicionales `dark:` en los componentes.** Introduce un segundo
juego de estilos con valores que nadie aprobó y que nadie puede verificar contra Figma. Preparar algo
que no se puede comprobar produce un tema oscuro roto en vez de ningún tema oscuro.

## Consecuencias

- **La regla dura 1 existe por esta decisión.** Prohibir todo color literal en los componentes es lo
  que hace que añadir un tema oscuro más adelante sea reapuntar tokens en `styles/semantic.css` y no
  rehacer la interfaz. Si esa regla se relaja, esta decisión deja de ser reversible a bajo coste.
- `styles/semantic.css` no define un bloque de tema oscuro. Si algún día se define, se define ahí y
  en ningún componente.
- El coste de revertir es producir la paleta y reapuntar los tokens semánticos. Los componentes no se
  tocan. Esa es exactamente la propiedad que se está comprando con la regla 1.

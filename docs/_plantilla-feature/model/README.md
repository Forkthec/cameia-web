# model/

Tipos de dominio, enums de catálogo y máquinas de estado de la feature: lo que la interfaz
necesita saber del negocio, sin depender de cómo viaja por HTTP (`docs/ARCHITECTURE.md` §3).

Ejemplo planeado (`docs/ARCHITECTURE.md` §3, línea 167; HE-04, Sprint 1): `catalogs.ts`
(códigos, NO etiquetas) y `setup.types.ts` en `interview-setup` — no existe todavía en disco.
Verificado contra `interview-setup` con `find` el 11-sep-2026.

Es la **primera** pieza que se llena, paso 1 del orden de construcción de `CLAUDE.md` §8: sale
del glosario y el backlog, antes de que exista ningún contrato de red.

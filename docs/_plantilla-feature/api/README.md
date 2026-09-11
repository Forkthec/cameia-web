# api/

`<x>.api.ts` (funciones de red, una por endpoint), `<x>.dto.ts` (contrato crudo del backend, tal
cual llega) y `<x>.mapper.ts` (DTO → modelo de UI) — `docs/ARCHITECTURE.md` §3.

Ejemplo planeado (`docs/ARCHITECTURE.md` §3, línea 166; HE-04, Sprint 1): `setup.api.ts` ·
`setup.dto.ts` · `setup.mapper.ts` en `interview-setup` — no existe todavía en disco. Verificado
contra `interview-setup` con `find` el 11-sep-2026.

Se llena **al final, en el paso 5** del orden de construcción de `CLAUDE.md` §8 — y a propósito,
no al principio: el contrato del backend es lo más volátil del proyecto, así que se escribe
cuando por fin existe (OpenAPI o su equivalente confirmado), nunca antes. Hasta entonces, `pages/`
trabaja contra `mocks/handlers/`.

**El mapper es el cortafuegos** (ADR-0003; `CLAUDE.md` §8): todo lo que el backend pueda
cambiar —nombre de un campo, forma de una colección, código de un enumerado— se detiene en
`*.mapper.ts` y no llega a `model/` ni a los componentes. Es lo que permite haber construido ya
`organisms/` y `pages/` en los pasos 3 y 4 sin haber esperado a este paso.

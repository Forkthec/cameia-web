# api/

`<x>.api.ts` (funciones de red, una por endpoint), `<x>.dto.ts` (contrato crudo del backend, tal
cual llega) y `<x>.mapper.ts` (DTO → modelo de UI) — `docs/ARCHITECTURE.md` §3, «Anatomía
canónica de una feature».

Ejemplos reales: `auth/api/register.api.ts` · `register.dto.ts` · `register.mapper.ts` y
`professional-profile/api/profile.api.ts` · `profile.dto.ts` · `profile.mapper.ts`.

Se llena **al final, en el paso 5** del orden de construcción de `CLAUDE.md` §8 — y a propósito,
no al principio: el contrato del backend es lo más volátil del proyecto, así que se escribe
cuando por fin existe, nunca antes. Hasta entonces, `pages/` trabaja contra `mocks/handlers/`.

**Mientras no haya un OpenAPI versionado en el repo, los DTO llevan en la primera línea
`// PROVISIONAL — pendiente de OpenAPI`** (`CLAUDE.md` §8), como hicieron `register.dto.ts` y
`profile.dto.ts`. La marca no dice que los nombres sean inventados —los de `profile.dto.ts` se
confirmaron contra el código del backend—, sino que no hay un contrato versionado contra el que
comprobarlos automáticamente.

**El mapper es el cortafuegos** (ADR-0003; `CLAUDE.md` §8): todo lo que el backend pueda
cambiar —nombre de un campo, forma de una colección, código de un enumerado— se detiene en
`*.mapper.ts` y no llega a `model/` ni a los componentes. Es lo que permite haber construido ya
`organisms/` y `pages/` en los pasos 3 y 4 sin haber esperado a este paso.

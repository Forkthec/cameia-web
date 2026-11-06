# schemas/

Esquemas zod de los formularios de la feature: la validación del lado del cliente, con su
mensaje y su llave de i18n (`docs/ARCHITECTURE.md` §3, «Anatomía canónica de una feature»;
`SPEC.md` §3).

Ejemplos reales: `auth/schemas/register.schema.ts`, `login.schema.ts` y `email.schema.ts`;
`professional-profile/schemas/generalInfo.schema.ts`, `education.schema.ts`, `skill.schema.ts` y
`workExperience.schema.ts`.

Se llena en el paso 2 del orden de construcción de `CLAUDE.md` §8, justo después de `model/` y
sobre los tipos que ya declaró.

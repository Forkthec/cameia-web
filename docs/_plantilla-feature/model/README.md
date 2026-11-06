# model/

Tipos de dominio, enums de catálogo y máquinas de estado de la feature: lo que la interfaz
necesita saber del negocio, sin depender de cómo viaja por HTTP (`docs/ARCHITECTURE.md` §3,
«Anatomía canónica de una feature»).

Ejemplos reales en `professional-profile/model/`: `profile.types.ts` (tipos de dominio y códigos
de los enumerados), `profile.constants.ts`, y lógica pura del dominio como
`missingRequirements.ts`, `profileCompleteness.ts` y `yearMonth.ts`. En `auth/model/` viven
`pronouns.ts`, `commonPasswords.ts` y `authErrorMessage.ts`.

Es la **primera** pieza que se llena, paso 1 del orden de construcción de `CLAUDE.md` §8: sale
del glosario y el backlog, antes de que exista ningún contrato de red. Los catálogos guardan
códigos, no etiquetas (`CLAUDE.md` §7).

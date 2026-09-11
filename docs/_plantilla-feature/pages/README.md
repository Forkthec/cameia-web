# pages/

Una página por PRT (`docs/ARCHITECTURE.md` §3): compone los `organisms/` de la feature dentro
de su `layout` correspondiente y queda referenciada desde `routes.tsx`.

Ejemplo real: `NewInterviewWizardPage.tsx`, `StartingSessionPage.tsx` en `interview-setup`.

Se llenan en el paso 4 del orden de construcción de `CLAUDE.md` §8, todavía **contra datos
simulados** de `mocks/handlers/`: el contrato real llega después, en `api/`.

# hooks/

Hooks de la feature (`docs/ARCHITECTURE.md` §3, «Anatomía canónica de una feature»). No es una
sola pieza: `CLAUDE.md` §8 separa dos familias que se llenan en momentos distintos.

- **Hooks de interfaz y de lógica de pantalla** — estado de envío y de error de un formulario,
  apertura de un panel, orquestación de una acción de la página. Ejemplos reales:
  `auth/hooks/useLogin.ts`, `useRegister.ts` y `useLogout.ts` (estado de envío, error y
  navegación posterior, sin pasar por TanStack Query). Se escriben en el **paso 3**, junto con
  los `organisms/` que los necesitan.
- **Hooks de datos** — los que envuelven `useQuery`/`useMutation`. Ejemplos reales:
  `professional-profile/hooks/useProfileQuery.ts` (lectura) y `useAddSkill.ts`,
  `useUpdateProfileGeneralInfo.ts`, `useFinalizeProfile.ts` (mutaciones). Se escriben al
  **final, en el paso 5**, junto con `api/`, porque dependen del contrato real.

Un hook sube a `src/hooks/` solo cuando lo usa un **segundo** consumidor fuera de su feature
(`CLAUDE.md` §4, reglas de crecimiento).

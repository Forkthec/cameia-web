# organisms/

Componentes con dominio: los que sí saben qué es un perfil o una entrevista, a diferencia de
`design-system/` (`docs/ARCHITECTURE.md` §1 y §3). Se arman combinando átomos y moléculas del
design system.

Ejemplos reales: `auth/organisms/RegisterForm/`, `LoginForm/` y `PhoneField/`;
`professional-profile/organisms/GeneralInfoForm/`, `EducationSection/` y `ProfileActionsBar/`.
Cada organismo vive en su propia carpeta (`<Nombre>/<Nombre>.tsx`, con su prueba al lado) y
**puede tener su propio barril `index.ts`** que exporta el componente (`CLAUDE.md` §14.6).

Se llenan en el paso 3 del orden de construcción de `CLAUDE.md` §8, contra datos simulados,
junto con los **hooks de interfaz** que necesiten (ver `hooks/README.md`).

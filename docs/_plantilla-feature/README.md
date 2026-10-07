# _plantilla-feature/

Esqueleto de la anatomía canónica de una feature (`docs/ARCHITECTURE.md` §3, «Anatomía canónica de
una feature»). Esta carpeta **se copia completa** a `src/features/<nombre>/` cuando entra al sprint
la primera historia de una feature nueva.

Al copiarla, **solo se instancian las subcarpetas que esa historia en curso necesita**, nunca
todas por anticipado. `api/`, `model/`, `schemas/`, `hooks/`, `organisms/`, `pages/` y `store/`
existen aquí, con contenido real, porque este es el catálogo de referencia; una feature concreta
casi nunca las tiene todas desde el primer commit. Para ver cómo se ve una feature ya construida,
mira `src/features/auth` y `src/features/professional-profile`: cada README de subcarpeta cita
ejemplos reales de ahí. (`home`, `interview-setup` e `interview-session` siguen en esqueleto, solo
con `pages/`, `routes.tsx` e `index.ts`.)

**Una carpeta vacía en `src/features/` es deuda** (`docs/ARCHITECTURE.md` §5, «Qué se crea y qué
no», regla de crecimiento 1): no se crea `organisms/` porque «ya va a hacer falta», se crea cuando
la historia en curso escribe el primer archivo real dentro.

Cada subcarpeta lleva su propio `README.md` explicando qué vive ahí, ejemplos reales de nombre de
archivo y en qué paso del orden de construcción de `CLAUDE.md` §8 se llena (`model` → `schemas`
→ `organisms` → `pages` contra datos simulados → `api` al final). `routes.tsx` e `index.ts`
quedan como archivos de ejemplo mínimos en la raíz, con el comentario de su propósito en vez de
código funcional.

`SPEC.md`, en esta misma carpeta, es la otra mitad de la plantilla: la especificación que se
llena junto con el código y se cita desde `CLAUDE.md` §16. Su campo `backlog` y la fecha `revisado`
son valores de ejemplo: el backlog cambia constantemente, así que al copiar la plantilla hay que
verificar cuál es la versión vigente y contrastar contra ella.

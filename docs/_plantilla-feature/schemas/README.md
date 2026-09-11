# schemas/

Esquemas zod de los formularios de la feature: la validación del lado del cliente, con su
mensaje y su llave de i18n (`docs/ARCHITECTURE.md` §3, `SPEC.md` §3).

Ejemplo planeado (`docs/ARCHITECTURE.md` §3, línea 168; HE-04, Sprint 1): `setup.schema.ts` en
`interview-setup` (idioma BCP-47, modalidad, forma de respuesta) — no existe todavía en disco.
Verificado contra `interview-setup` con `find` el 11-sep-2026.

Se llena en el paso 2 del orden de construcción de `CLAUDE.md` §8, justo después de `model/` y
sobre los tipos que ya declaró.

# store/

Estado efímero de la feature, **solo si hace falta**: coordinación entre pasos de un asistente
que no persiste como dato de servidor (regla dura 6 de `CLAUDE.md`; nunca una respuesta HTTP).

Ejemplo planeado (`docs/ARCHITECTURE.md` §3, línea 174; HE-04, Sprint 1): `interviewSetup.store.ts`
en `interview-setup` — no persiste hasta el `POST` de HU-4.4, y no existe todavía en disco.
Verificado contra `interview-setup` con `find` el 11-sep-2026.

Se crea junto con `organisms/`/`pages/` (pasos 3-4 de `CLAUDE.md` §8), cuando el asistente
necesita compartir estado entre pasos que ni `model/` ni un formulario cubren. La mayoría de las
features nunca la necesitan.

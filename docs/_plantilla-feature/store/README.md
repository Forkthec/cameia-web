# store/

Estado efímero de la feature, **solo si hace falta**: coordinación entre pasos de un asistente
que no persiste como dato de servidor (regla dura 6 de `CLAUDE.md`; nunca una respuesta HTTP).

**Hoy ninguna feature tiene `store/`.** Los stores que existen son globales y viven en
`src/stores/` (`auth.store.ts`, `uiPreferences.store.ts`, `unsavedChanges.store.ts`), porque los
leen varias partes de la app. Esta carpeta quedará para cuando una feature —por ejemplo, el
asistente de configuración de entrevista— necesite compartir estado entre pasos que ni `model/`
ni un formulario cubren.

Se crea junto con `organisms/`/`pages/` (pasos 3-4 de `CLAUDE.md` §8), nunca por anticipado. La
mayoría de las features nunca la necesitan.

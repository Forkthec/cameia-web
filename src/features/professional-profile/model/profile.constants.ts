/**
 * Límites de caracteres del formulario de Información General (HU-2.3,
 * CM-53). Constante única citada desde el schema de validación y desde
 * `CharacterCounter` — nunca repetida como número suelto en otro archivo
 * (CLAUDE.md §7, ninguna constante de negocio se hardcodea sin origen).
 *
 * `NAME_MAX_LENGTH` viene de CA-2.3.5 (backlog vigente `13092026_01`,
 * idéntico al 6-sep y al 12-sep para esta regla). El memo del PO del
 * 11-sep pide 255, pero esa cifra nunca llegó al backlog ni tiene fuente
 * documentable (bloqueo C-01, `SPEC.md` §8) — manda el backlog
 * (CLAUDE.md §16), así que se mantiene 120 hasta que se resuelva C-01.
 *
 * `SUMMARY_MAX_LENGTH` viene de `docs/GLOSSARY.md` §2, respaldado también
 * por HU-2.5 (backlog 12-sep) y por el memo del PO del 11-sep (línea 155):
 * a diferencia de `name`, este cambio sí llegó al backlog vigente.
 */
export const NAME_MAX_LENGTH = 120;
export const SUMMARY_MAX_LENGTH = 2000;
